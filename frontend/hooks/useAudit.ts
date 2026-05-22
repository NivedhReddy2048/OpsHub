import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/auditService";

export function useAuditLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["auditlogs", params],
    queryFn: () => auditService.getAuditLogs(params),
  });
}
