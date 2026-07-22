import type { DbTransaction } from "@/shared/types";
import type { UpdateCustomerDTO } from "../contracts";
import { updateCustomer } from "../repo/update";

export async function updateCustomerService(
  client: DbTransaction,
  params: { id: string; input: UpdateCustomerDTO },
) {
  const updated = await updateCustomer(params.id, params.input, client);
  if (!updated) throw new Error("Customer not found");
  return { updated };
}
