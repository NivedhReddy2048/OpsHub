import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import type { DashboardMetrics } from "@/types";

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsService.getDashboardMetrics,
  });
}
