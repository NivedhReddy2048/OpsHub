import api from "./api";
import type { AuditLog, PaginatedResponse, ApiResponse } from "@/types";

export const auditService = {
  getAuditLogs: async (params?: Record<string, any>): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>("/auditlogs/", { params });
    return data.data;
  },
};
