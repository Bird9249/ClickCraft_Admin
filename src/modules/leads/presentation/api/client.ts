import type { UpdateLeadDTO } from "@/modules/leads/domain/contracts";
import type {
  LeadByIdResult,
  LeadsListResult,
} from "@/modules/leads/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

function buildListUrl(base: string, query: OffsetPageQueryDTO) {
  const url = new URL(`${config.apiUrl}${base}`);
  url.searchParams.set("limit", String(query.limit ?? 20));
  url.searchParams.set("offset", String(query.offset ?? 0));
  if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
  if (query.filters)
    url.searchParams.set("filters", JSON.stringify(query.filters));
  return url.toString();
}

export const leadsApi = {
  list: (q: OffsetPageQueryDTO) =>
    fetcher.get<LeadsListResult>(buildListUrl("/leads", q)),
  get: (id: string) =>
    fetcher.get<NonNullable<LeadByIdResult>>(`${config.apiUrl}/leads/${id}`),
  update: (id: string, input: UpdateLeadDTO) =>
    fetcher.patch(`${config.apiUrl}/leads/${id}`, input),
  markContacted: (id: string) =>
    fetcher.post(`${config.apiUrl}/leads/${id}/contacted`),
  markLost: (id: string) => fetcher.post(`${config.apiUrl}/leads/${id}/lost`),
  convert: (id: string) =>
    fetcher.post<{
      lead: NonNullable<LeadByIdResult>;
      customerId: string;
      quotationId: string;
    }>(`${config.apiUrl}/leads/${id}/convert`),
};
