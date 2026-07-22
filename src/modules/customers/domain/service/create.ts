import type { DbTransaction } from "@/shared/types";
import type { CreateCustomerDTO } from "../contracts";
import { createCustomer } from "../repo/create";

export async function createCustomerService(
  client: DbTransaction,
  params: { input: CreateCustomerDTO; actorId?: string | null },
) {
  const created = await createCustomer(
    { ...params.input, createdBy: params.actorId ?? null },
    client,
  );
  return { created };
}
