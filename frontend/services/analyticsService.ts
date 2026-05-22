import api from "./api";
import type { DashboardMetrics, ApiResponse } from "@/types";

export const analyticsService = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const { data } = await api.get<ApiResponse<DashboardMetrics>>("/analytics/dashboard/");
    return data.data;
  },
};
