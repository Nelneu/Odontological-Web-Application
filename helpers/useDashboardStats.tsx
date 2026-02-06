import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../endpoints/dashboard/stats_GET.schema";

export const DASHBOARD_STATS_QUERY_KEY = "dashboardStats";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: [DASHBOARD_STATS_QUERY_KEY],
    queryFn: () => getDashboardStats(),
  });
};