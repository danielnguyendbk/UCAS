import { httpClient } from "@/services/httpClient";

export const getAuditLogs = async ({ userId, action, tableName, search, startDate, endDate, page, size }) => {
  const response = await httpClient.get("/api/admin/audit-logs", {
    params: { userId, action, tableName, search, startDate, endDate, page, size }
  });
  return response.data?.data;
};
