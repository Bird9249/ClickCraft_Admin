import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export async function softDeleteCustomer(id: string, client: DbTransaction) {
  const [row] = await client
    .update(schema.customer)
    .set({ deletedAt: new Date() })
    .where(eq(schema.customer.id, id))
    .returning();
  return row ?? null;
}
