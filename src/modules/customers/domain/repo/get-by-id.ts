import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { and, eq, isNull } from "drizzle-orm";

export async function getCustomerById(id: string, client: DbTransaction) {
  const [r] = await client
    .select()
    .from(schema.customer)
    .where(and(eq(schema.customer.id, id), isNull(schema.customer.deletedAt)));
  return r ?? null;
}
