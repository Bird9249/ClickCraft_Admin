import type {
  CreateAppDTO,
  CreateReleaseDTO,
  CreateShareLinkDTO,
  UpdateReleaseDTO,
} from "@/modules/distribution/domain/contracts";
import type {
  AppsListResult,
  ReleaseByIdResult,
  ReleasesListResult,
} from "@/modules/distribution/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

export type ShareLinkRow = {
  id: string;
  releaseId: string;
  token: string;
  label: string | null;
  expiresAt: string | Date | null;
  maxDownloads: number | null;
  downloadCount: number;
  lastDownloadedAt: string | Date | null;
  revokedAt: string | Date | null;
  createdByUserId: string | null;
  createdAt: string | Date;
  publicPath: string;
};

export type PublicShareMeta = {
  appName: string;
  platform: string;
  version: string;
  buildNumber: string;
  fileName: string;
  fileSize: number;
  checksumSha256: string | null;
  changelog: string | null;
  expiresAt: string | Date | null;
  label: string | null;
  maxDownloads: number | null;
  downloadCount: number;
};

function buildListUrl(base: string, query: OffsetPageQueryDTO) {
  const url = new URL(`${config.apiUrl}${base}`);
  url.searchParams.set("limit", String(query.limit ?? 20));
  url.searchParams.set("offset", String(query.offset ?? 0));
  if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
  if (query.filters)
    url.searchParams.set("filters", JSON.stringify(query.filters));
  return url.toString();
}

export function shareLinkAbsoluteUrl(publicPath: string) {
  return `${window.location.origin}${publicPath}`;
}

export const distributionApi = {
  listApps: () =>
    fetcher.get<{ data: AppsListResult }>(`${config.apiUrl}/distribution/apps`),
  createApp: (input: CreateAppDTO) =>
    fetcher.post<AppsListResult[number]>(
      `${config.apiUrl}/distribution/apps`,
      input,
    ),
  listReleases: (q: OffsetPageQueryDTO) =>
    fetcher.get<ReleasesListResult>(buildListUrl("/distribution/releases", q)),
  getRelease: (id: string) =>
    fetcher.get<NonNullable<ReleaseByIdResult>>(
      `${config.apiUrl}/distribution/releases/${id}`,
    ),
  createRelease: (input: CreateReleaseDTO) =>
    fetcher.post<NonNullable<ReleaseByIdResult>>(
      `${config.apiUrl}/distribution/releases`,
      input,
    ),
  updateRelease: (id: string, input: UpdateReleaseDTO) =>
    fetcher.patch<NonNullable<ReleaseByIdResult>>(
      `${config.apiUrl}/distribution/releases/${id}`,
      input,
    ),
  publishRelease: (id: string) =>
    fetcher.post<NonNullable<ReleaseByIdResult>>(
      `${config.apiUrl}/distribution/releases/${id}/publish`,
    ),
  archiveRelease: (id: string) =>
    fetcher.post<NonNullable<ReleaseByIdResult>>(
      `${config.apiUrl}/distribution/releases/${id}/archive`,
    ),
  listShareLinks: (releaseId: string) =>
    fetcher.get<{ data: ShareLinkRow[] }>(
      `${config.apiUrl}/distribution/releases/${releaseId}/share-links`,
    ),
  createShareLink: (releaseId: string, input: CreateShareLinkDTO) =>
    fetcher.post<ShareLinkRow>(
      `${config.apiUrl}/distribution/releases/${releaseId}/share-links`,
      input,
    ),
  revokeShareLink: (id: string) =>
    fetcher.post(`${config.apiUrl}/distribution/share-links/${id}/revoke`),
  getPublicMeta: async (token: string) => {
    const res = await fetch(
      `${config.apiUrl}/distribution/public/${encodeURIComponent(token)}`,
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw Object.assign(new Error(body?.error ?? "FAILED"), {
        code: body?.error ?? "FAILED",
        status: res.status,
      });
    }
    return (await res.json()) as PublicShareMeta;
  },
  publicDownloadUrl: (token: string) =>
    `${config.apiUrl}/distribution/public/${encodeURIComponent(token)}/download`,
};
