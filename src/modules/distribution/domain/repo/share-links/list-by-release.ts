import { desc, eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function listShareLinksByRelease(
  releaseId: string,
  client: DbTransaction,
) {
  return client
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
      createdByUserId: schema.distributionShareLink.createdByUserId,
      createdAt: schema.distributionShareLink.createdAt,
    })
    .from(schema.distributionShareLink)
    .where(eq(schema.distributionShareLink.releaseId, releaseId))
    .orderBy(desc(schema.distributionShareLink.createdAt));
}
