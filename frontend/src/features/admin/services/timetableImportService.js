import { httpClient } from "@/services/httpClient";

export const getImportSemesters = async () => {
  const response = await httpClient.get("/api/semesters");
  return response.data?.data ?? [];
};

export const previewTimetableImport = async ({ file, semesterId }) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post("/api/admin/timetable-import/preview", formData, {
    params: semesterId ? { semesterId } : undefined,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return response.data?.data;
};

export const applyTimetableImport = async ({ file, semesterId }) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post("/api/admin/timetable-import/apply", formData, {
    params: semesterId ? { semesterId } : undefined,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return response.data?.data;
};

export const downloadTimetableImportTemplate = async () => {
  const response = await httpClient.get("/api/admin/timetable-import/template", {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ucas-timetable-import-template.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
