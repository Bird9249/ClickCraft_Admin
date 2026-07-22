import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from "@/modules/customers/domain/contracts";
import type {
  CustomerByIdResult,
  CustomersListResult,
} from "@/modules/customers/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

export const customersApi = {
  async list(query: OffsetPageQueryDTO): Promise<CustomersListResult> {
    const url = new URL(`${config.apiUrl}/customers`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
    if (query.filters)
      url.searchParams.set("filters", JSON.stringify(query.filters));
    return fetcher.get<CustomersListResult>(url.toString());
  },

  async get(id: string): Promise<CustomerByIdResult> {
    return fetcher.get<CustomerByIdResult>(`${config.apiUrl}/customers/${id}`);
  },

  async create(input: CreateCustomerDTO) {
    return fetcher.post(`${config.apiUrl}/customers`, input);
  },

  async update(id: string, input: UpdateCustomerDTO) {
    return fetcher.put(`${config.apiUrl}/customers/${id}`, input);
  },

  async remove(id: string) {
    return fetcher.delete(`${config.apiUrl}/customers/${id}`);
  },
};
