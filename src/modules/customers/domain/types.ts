import type { getCustomerById } from "./repo/get-by-id";
import type { listCustomers } from "./repo/list";

export type CustomersListResult = Awaited<ReturnType<typeof listCustomers>>;
export type CustomerByIdResult = Awaited<ReturnType<typeof getCustomerById>>;
