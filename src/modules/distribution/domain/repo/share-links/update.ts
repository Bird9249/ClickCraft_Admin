import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function updateShareLink(
  id: string,
  patch: {
    expiresAt?: Date | null;
    maxDownloads?: number | null;
  },
  client: DbTransaction,
) {
  const [row] = await client
    .update(schema.distributionShareLink)
    .set(patch)
    .where(eq(schema.distributionShareLink.id, id))
    .returning();
  return row ?? null;
}
