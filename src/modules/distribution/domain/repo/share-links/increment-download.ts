import { eq, sql } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function incrementShareLinkDownload(
  id: string,
  client: DbTransaction,
) {
  const [row] = await client
    .update(schema.distributionShareLink)
    .set({
      downloadCount: sql`${schema.distributionShareLink.downloadCount} + 1`,
      lastDownloadedAt: new Date(),
    })
    .where(eq(schema.distributionShareLink.id, id))
    .returning({
      id: schema.distributionShareLink.id,
      downloadCount: schema.distributionShareLink.downloadCount,
      lastDownloadedAt: schema.distributionShareLink.lastDownloadedAt,
    });
  return row ?? null;
}
