import { getPresignedDownloadUrl } from "@/server/utils/presign-download";
import type { DbTransaction } from "@/shared/types";
import type { CreateShareLinkDTO } from "../contracts";
import { getReleaseById } from "../repo/releases/get-by-id";
import { createShareLink } from "../repo/share-links/create";
import { getShareLinkById } from "../repo/share-links/get-by-id";
import { getShareLinkByToken } from "../repo/share-links/get-by-token";
import { incrementShareLinkDownload } from "../repo/share-links/increment-download";
import { listShareLinksByRelease } from "../repo/share-links/list-by-release";
import { revokeShareLink } from "../repo/share-links/revoke";
import {
  evaluateShareAccess,
  generateShareToken,
  type ShareAccessDenial,
} from "./share-access";

export class ShareLinkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShareLinkValidationError";
  }
}

export class ShareLinkAccessError extends Error {
  code: ShareAccessDenial;
  constructor(code: ShareAccessDenial) {
    super(code);
    this.name = "ShareLinkAccessError";
    this.code = code;
  }
}

function expiresAtFromDays(days: number, now = new Date()): Date {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function accessInputFromRow(row: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  releaseStatus: string;
  maxDownloads: number | null;
  downloadCount: number;
}) {
  return {
    revokedAt: row.revokedAt,
    expiresAt: row.expiresAt,
    releaseStatus: row.releaseStatus,
    maxDownloads: row.maxDownloads,
    downloadCount: row.downloadCount,
  };
}

export async function createShareLinkService(
  client: DbTransaction,
  releaseId: string,
  input: CreateShareLinkDTO,
  actorId?: string | null,
) {
  const release = await getReleaseById(releaseId, client);
  if (!release) throw new ShareLinkValidationError("Release not found");
  if (release.status !== "published") {
    throw new ShareLinkValidationError(
      "Share links can only be created for published releases",
    );
  }

  const token = generateShareToken();
  const expiresAt = expiresAtFromDays(input.expiresInDays ?? 7);
  const created = await createShareLink(
    {
      releaseId,
      token,
      label: input.label,
      expiresAt,
      maxDownloads: input.maxDownloads ?? null,
      createdByUserId: actorId,
    },
    client,
  );

  return {
    ...created,
    publicPath: `/d/${created.token}`,
  };
}

export async function listShareLinksService(
  client: DbTransaction,
  releaseId: string,
) {
  const release = await getReleaseById(releaseId, client);
  if (!release) return null;
  const links = await listShareLinksByRelease(releaseId, client);
  return links.map((link) => ({
    ...link,
    publicPath: `/d/${link.token}`,
  }));
}

export async function revokeShareLinkService(
  client: DbTransaction,
  id: string,
) {
  const existing = await getShareLinkById(id, client);
  if (!existing) return null;
  if (existing.revokedAt) return existing;
  return revokeShareLink(id, client);
}

export async function getPublicShareMetaService(
  client: DbTransaction,
  token: string,
) {
  const row = await getShareLinkByToken(token, client);
  if (!row) throw new ShareLinkAccessError("NOT_FOUND");

  const denial = evaluateShareAccess(accessInputFromRow(row));
  if (denial) throw new ShareLinkAccessError(denial);

  return {
    appName: row.appName,
    platform: row.platform,
    version: row.version,
    buildNumber: row.buildNumber,
    fileName: row.fileName,
    fileSize: row.fileSize,
    checksumSha256: row.checksumSha256,
    changelog: row.changelog,
    expiresAt: row.expiresAt,
    label: row.label,
    maxDownloads: row.maxDownloads,
    downloadCount: row.downloadCount,
  };
}

export async function createPublicDownloadRedirectService(
  client: DbTransaction,
  token: string,
) {
  const row = await getShareLinkByToken(token, client);
  if (!row) throw new ShareLinkAccessError("NOT_FOUND");

  const denial = evaluateShareAccess(accessInputFromRow(row));
  if (denial) throw new ShareLinkAccessError(denial);

  const signed = await getPresignedDownloadUrl({
    key: row.fileKey,
    fileName: row.fileName,
    contentType: row.contentType,
    expiresIn: 600,
  });
  if (!signed) {
    throw new ShareLinkValidationError("Download storage is not configured");
  }

  await incrementShareLinkDownload(row.id, client);
  return { downloadUrl: signed.downloadUrl };
}
