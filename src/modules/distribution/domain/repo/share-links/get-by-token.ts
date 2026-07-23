import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function getShareLinkByToken(
  token: string,
  client: DbTransaction,
) {
  const [row] = await client
    .select({
      id: schema.distributionShareLink.id,
      releaseId: schema.distributionShareLink.releaseId,
      token: schema.distributionShareLink.token,
      label: schema.distributionShareLink.label,
      expiresAt: schema.distributionShareLink.expiresAt,
      maxDownloads: schema.distributionShareLink.maxDownloads,
      downloadCount: schema.distributionShareLink.downloadCount,
      lastDownloadedAt: schema.distributionShareLink.lastDownloadedAt,
      revokedAt: schema.distributionShareLink.revokedAt,
      createdAt: schema.distributionShareLink.createdAt,
      appName: schema.distributionApp.name,
      appSlug: schema.distributionApp.slug,
      platform: schema.distributionRelease.platform,
      version: schema.distributionRelease.version,
      buildNumber: schema.distributionRelease.buildNumber,
      fileKey: schema.distributionRelease.fileKey,
      fileName: schema.distributionRelease.fileName,
      fileSize: schema.distributionRelease.fileSize,
      contentType: schema.distributionRelease.contentType,
      checksumSha256: schema.distributionRelease.checksumSha256,
      changelog: schema.distributionRelease.changelog,
      releaseStatus: schema.distributionRelease.status,
    })
    .from(schema.distributionShareLink)
    .innerJoin(
      schema.distributionRelease,
      eq(schema.distributionShareLink.releaseId, schema.distributionRelease.id),
    )
    .innerJoin(
      schema.distributionApp,
      eq(schema.distributionRelease.appId, schema.distributionApp.id),
    )
    .where(eq(schema.distributionShareLink.token, token))
    .limit(1);
  return row ?? null;
}
