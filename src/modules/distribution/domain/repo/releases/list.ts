import { eq, sql } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";

const columns = {
  id: schema.distributionRelease.id,
  appId: schema.distributionRelease.appId,
  platform: schema.distributionRelease.platform,
  version: schema.distributionRelease.version,
  buildNumber: schema.distributionRelease.buildNumber,
  fileName: schema.distributionRelease.fileName,
  fileSize: schema.distributionRelease.fileSize,
  status: schema.distributionRelease.status,
  publishedAt: schema.distributionRelease.publishedAt,
  createdAt: schema.distributionRelease.createdAt,
  updatedAt: schema.distributionRelease.updatedAt,
} as const;

export async function listReleases(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.distributionRelease)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const base = client
    .select({
      id: schema.distributionRelease.id,
      appId: schema.distributionRelease.appId,
      appName: schema.distributionApp.name,
      appSlug: schema.distributionApp.slug,
      platform: schema.distributionRelease.platform,
      version: schema.distributionRelease.version,
      buildNumber: schema.distributionRelease.buildNumber,
      fileKey: schema.distributionRelease.fileKey,
      fileName: schema.distributionRelease.fileName,
      fileSize: schema.distributionRelease.fileSize,
      contentType: schema.distributionRelease.contentType,
      changelog: schema.distributionRelease.changelog,
      status: schema.distributionRelease.status,
      publishedAt: schema.distributionRelease.publishedAt,
      createdByUserId: schema.distributionRelease.createdByUserId,
      createdAt: schema.distributionRelease.createdAt,
      updatedAt: schema.distributionRelease.updatedAt,
    })
    .from(schema.distributionRelease)
    .innerJoin(
      schema.distributionApp,
      eq(schema.distributionRelease.appId, schema.distributionApp.id),
    )
    .where(whereExpr);

  const ordered =
    orderBy && orderBy.length > 0 ? base.orderBy(...orderBy) : base;
  const rows = await ordered.limit(query.limit).offset(query.offset);

  return {
    data: rows,
    meta: { total, limit: query.limit, offset: query.offset },
  };
}
