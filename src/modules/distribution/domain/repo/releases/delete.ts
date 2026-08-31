import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function deleteRelease(id: string, client: DbTransaction) {
  const [row] = await client
    .delete(schema.distributionRelease)
    .where(eq(schema.distributionRelease.id, id))
    .returning();
  return row ?? null;
}
