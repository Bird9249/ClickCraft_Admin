import type { listApps } from "./repo/apps/list";
import type { getReleaseById } from "./repo/releases/get-by-id";
import type { listReleases } from "./repo/releases/list";

export type AppsListResult = Awaited<ReturnType<typeof listApps>>;
export type ReleasesListResult = Awaited<ReturnType<typeof listReleases>>;
export type ReleaseByIdResult = Awaited<ReturnType<typeof getReleaseById>>;
