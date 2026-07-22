import type { DashboardSummary } from "@/modules/dashboard/domain/repo/get-summary";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

export type { DashboardSummary };

export const dashboardApi = {
  summary: () =>
    fetcher.get<DashboardSummary>(`${config.apiUrl}/dashboard/summary`),
};
