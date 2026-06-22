import { httpClient } from "@/services/httpClient";

export const getTimetableVersions = async ({ semesterId, search, page, size }) => {
  const response = await httpClient.get("/api/admin/timetable-versions", {
    params: { semesterId, search, page, size }
  });
  return response.data?.data;
};

export const getTimetableDiff = async ({ semesterId, versionA, versionB }) => {
  const response = await httpClient.get("/api/admin/timetable-versions/diff", {
    params: { semesterId, versionA, versionB }
  });
  return response.data?.data;
};

export const rollbackTimetableVersion = async ({ semesterId, versionNo }) => {
  const response = await httpClient.post("/api/admin/timetable-versions/rollback", {
    semesterId,
    versionNo
  });
  return response.data?.data;
};
