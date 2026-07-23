import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function getReleaseById(id: string, client: DbTransaction) {
  const [row] = await client
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
      checksumSha256: schema.distributionRelease.checksumSha256,
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
    .where(eq(schema.distributionRelease.id, id))
    .limit(1);
  return row ?? null;
}
