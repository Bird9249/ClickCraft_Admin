import type { DbTransaction } from "@/shared/types";
import { softDeleteCustomer } from "../repo/soft-delete";

export async function deleteCustomerService(
  client: DbTransaction,
  params: { id: string },
) {
  const deleted = await softDeleteCustomer(params.id, client);
  return { deleted };
}
