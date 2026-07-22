import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export async function updateLead(
  id: string,
  patch: Partial<typeof schema.quotationLead.$inferInsert>,
  client: DbTransaction,
) {
  const [row] = await client
    .update(schema.quotationLead)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.quotationLead.id, id))
    .returning();
  return row ?? null;
}
