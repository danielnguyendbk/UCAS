const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

function getAccessToken() {
  return (
    localStorage.getItem("csms_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => null);
    return body?.message || JSON.stringify(body) || `HTTP ${response.status}`;
  }

  return (await response.text().catch(() => "")) || `HTTP ${response.status}`;
}

async function authorizedFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

async function downloadTemplate(path, filename) {
  const response = await authorizedFetch(path);
  const blob = await response.blob();

  downloadBlob(blob, filename);
}

async function importExcel(path, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authorizedFetch(path, {
    method: "POST",
    body: formData,
  });

  return response.json();
}

export async function downloadLecturerImportTemplate() {
  return downloadTemplate(
    "/api/lecturers/import-template",
    "lecturers_import_template.xlsx"
  );
}

export async function importLecturersExcel(file) {
  return importExcel("/api/lecturers/import", file);
}

export async function downloadFacilityStaffImportTemplate() {
  return downloadTemplate(
    "/api/facility-staff/import-template",
    "facility_staff_import_template.xlsx"
  );
}

export async function importFacilityStaffExcel(file) {
  return importExcel("/api/facility-staff/import", file);
}

export async function downloadClassroomImportTemplate() {
  return downloadTemplate(
    "/api/classrooms/import-template",
    "classrooms_import_template.xlsx"
  );
}

export async function importClassroomsExcel(file) {
  return importExcel("/api/classrooms/import", file);
}

export async function downloadCourseImportTemplate() {
  return downloadTemplate(
    "/api/courses/import-template",
    "courses_import_template.xlsx"
  );
}

export async function importCoursesExcel(file) {
  return importExcel("/api/courses/import", file);
}