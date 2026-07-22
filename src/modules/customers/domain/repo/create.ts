import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateCustomerDTO } from "../contracts";

export async function createCustomer(
  input: CreateCustomerDTO & { createdBy?: string | null },
  client: DbTransaction,
) {
  const [row] = await client
    .insert(schema.customer)
    .values({
      type: input.type ?? "company",
      name: input.name,
      nameLocal: input.nameLocal ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      address: input.address ?? null,
      taxId: input.taxId ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create customer");
  return row;
}
