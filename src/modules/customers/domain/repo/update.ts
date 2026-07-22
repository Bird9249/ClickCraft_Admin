import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateCustomerDTO } from "../contracts";

export async function updateCustomer(
  id: string,
  input: UpdateCustomerDTO,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(schema.customer)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.customer.id, id))
    .returning();
  return updated ?? null;
}
