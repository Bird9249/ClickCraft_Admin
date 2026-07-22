import type { getLeadById } from "./repo/get-by-id";
import type { listLeads } from "./repo/list";

export type LeadsListResult = Awaited<ReturnType<typeof listLeads>>;
export type LeadByIdResult = Awaited<ReturnType<typeof getLeadById>>;
