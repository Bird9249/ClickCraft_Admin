import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function revokeShareLink(id: string, client: DbTransaction) {
  const [row] = await client
    .update(schema.distributionShareLink)
    .set({ revokedAt: new Date() })
    .where(eq(schema.distributionShareLink.id, id))
    .returning();
  return row ?? null;
}
