import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./client";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => ["dashboard", "summary"] as const,
};

export function useDashboardSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.summary(),
    enabled,
    staleTime: 30_000,
  });
}
