import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { httpClient } from "@/services/httpClient";

const EMPTY_FORM = {
  id: "",
  userId: "",
  username: "",
  fullName: "",
  email: "",
  password: "",
  studentCode: "",
  facultyId: "",
  className: "",
  courseYear: "",
  phone: "",
  isActive: true,
};

const pickValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
};

const getResponsePayload = (response) => response?.data?.data ?? response?.data ?? response;

const getResponseList = (response) => {
  const payload = getResponsePayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

const normalizeFaculty = (item) => ({
  id: pickValue(item.id, item.facultyId, item.faculty_id),
  name: pickValue(item.name, item.facultyName, item.faculty_name),
  code: pickValue(item.code, item.facultyCode, item.faculty_code),
});

const normalizeUser = (item) => ({
  id: pickValue(item.id, item.userId, item.user_id),
  username: pickValue(item.username, item.userName, item.user_name),
  fullName: pickValue(item.fullName, item.full_name, item.name),
  email: pickValue(item.email),
  role: normalizeRole(pickValue(item.role, item.backendRole)),
  isActive: item.isActive ?? item.is_active ?? item.active ?? true,
});

const normalizeStudent = (item, usersById = new Map()) => {
  const userId = pickValue(item.userId, item.user_id);
  const user = usersById.get(String(userId)) || {};

  return {
    id: pickValue(item.id, item.studentId, item.student_id),
    userId,
    username: pickValue(item.username, item.userName, item.user_name, user.username),
    fullName: pickValue(
      item.fullName,
      item.full_name,
      item.userFullName,
      item.user_full_name,
      item.name,
      user.fullName,
    ),
    email: pickValue(item.email, item.userEmail, item.user_email, user.email),
    studentCode: pickValue(item.studentCode, item.student_code, item.code),
    facultyId: pickValue(item.facultyId, item.faculty_id),
    facultyName: pickValue(item.facultyName, item.faculty_name, item.faculty),
    className: pickValue(item.className, item.class_name),
    courseYear: pickValue(item.courseYear, item.course_year),
    phone: pickValue(item.phone, item.phoneNumber, item.phone_number),
    isActive: item.isActive ?? item.is_active ?? user.isActive ?? true,
    raw: item,
  };
};

const buildStudentPayload = (form) => ({
  username: form.username?.trim() || form.studentCode?.trim(),
  email: form.email?.trim(),
  password: form.password,
  fullName: form.fullName?.trim(),
  full_name: form.fullName?.trim(),
  role: "STUDENT",
  studentCode: form.studentCode?.trim(),
  student_code: form.studentCode?.trim(),
  facultyId: form.facultyId ? Number(form.facultyId) : null,
  faculty_id: form.facultyId ? Number(form.facultyId) : null,
  className: form.className?.trim(),
  class_name: form.className?.trim(),
  courseYear: form.courseYear ? Number(form.courseYear) : null,
  course_year: form.courseYear ? Number(form.courseYear) : null,
  phone: form.phone?.trim() || null,
  isActive: Boolean(form.isActive),
  is_active: Boolean(form.isActive),
});

const buildStudentUpdatePayload = (form) => ({
  user_id: form.userId ? Number(form.userId) : null,
  userId: form.userId ? Number(form.userId) : null,
  studentCode: form.studentCode?.trim(),
  student_code: form.studentCode?.trim(),
  facultyId: form.facultyId ? Number(form.facultyId) : null,
  faculty_id: form.facultyId ? Number(form.facultyId) : null,
  className: form.className?.trim(),
  class_name: form.className?.trim(),
  courseYear: form.courseYear ? Number(form.courseYear) : null,
  course_year: form.courseYear ? Number(form.courseYear) : null,
  phone: form.phone?.trim() || null,
});

const buildUserUpdatePayload = (form) => ({
  username: form.username?.trim() || form.studentCode?.trim(),
  email: form.email?.trim(),
  fullName: form.fullName?.trim(),
  full_name: form.fullName?.trim(),
  role: "STUDENT",
  isActive: Boolean(form.isActive),
  is_active: Boolean(form.isActive),
});

const getStatusLabel = (isActive) => (isActive ? "Đang hoạt động" : "Đã khóa");

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");

    try {
      const [studentsResponse, facultiesResponse, usersResponse] = await Promise.allSettled([
        httpClient.get("/api/students"),
        httpClient.get("/api/faculties"),
        httpClient.get("/api/users"),
      ]);

      if (studentsResponse.status !== "fulfilled") {
        throw studentsResponse.reason;
      }

      const userItems =
        usersResponse.status === "fulfilled" ? getResponseList(usersResponse.value) : [];
      const studentUsers = userItems
        .map(normalizeUser)
        .filter((user) => normalizeRole(user.role) === "STUDENT");

      const usersById = new Map(
        studentUsers
          .filter((user) => user.id !== "")
          .map((user) => [String(user.id), user]),
      );

      const nextStudents = getResponseList(studentsResponse.value)
        .map((item) => normalizeStudent(item, usersById))
        .filter((student) => student.id !== "")
        .sort((a, b) => String(a.studentCode).localeCompare(String(b.studentCode), "vi"));

      setStudents(nextStudents);

      if (facultiesResponse.status === "fulfilled") {
        const nextFaculties = getResponseList(facultiesResponse.value)
          .map(normalizeFaculty)
          .filter((faculty) => faculty.id !== "");

        setFaculties(nextFaculties);
      }
    } catch (fetchError) {
      console.error("Không tải được danh sách sinh viên:", fetchError);
      setError(getErrorMessage(fetchError, "Không tải được danh sách sinh viên."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStudents();
  }, []);

  const facultyNameById = useMemo(() => {
    const map = new Map();

    faculties.forEach((faculty) => {
      map.set(String(faculty.id), faculty.name || faculty.code || `Khoa #${faculty.id}`);
    });

    return map;
  }, [faculties]);

  const classOptions = useMemo(() => {
    const uniqueClasses = new Set();

    students.forEach((student) => {
      if (student.className) uniqueClasses.add(student.className);
    });

    return Array.from(uniqueClasses).sort((a, b) => a.localeCompare(b, "vi"));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const haystack = [
        student.studentCode,
        student.fullName,
        student.username,
        student.email,
        student.className,
        student.phone,
        student.facultyName,
        facultyNameById.get(String(student.facultyId)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !keyword || haystack.includes(keyword);
      const matchesFaculty =
        facultyFilter === "all" || String(student.facultyId) === String(facultyFilter);
      const matchesClass = classFilter === "all" || student.className === classFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && student.isActive) ||
        (statusFilter === "locked" && !student.isActive);

      return matchesKeyword && matchesFaculty && matchesClass && matchesStatus;
    });
  }, [students, searchTerm, facultyFilter, classFilter, statusFilter, facultyNameById]);

  const stats = useMemo(() => {
    const activeCount = students.filter((student) => student.isActive).length;
    const lockedCount = students.length - activeCount;

    return {
      total: students.length,
      active: activeCount,
      locked: lockedCount,
      classes: classOptions.length,
    };
  }, [students, classOptions.length]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setFormMode("create");
    setForm(EMPTY_FORM);
    setFormError("");
    setSuccessMessage("");
    setIsFormOpen(true);
  };

  const openEditForm = (student) => {
    setFormMode("edit");
    setForm({
      ...EMPTY_FORM,
      id: student.id,
      userId: student.userId,
      username: student.username,
      fullName: student.fullName,
      email: student.email,
      password: "",
      studentCode: student.studentCode,
      facultyId: student.facultyId,
      className: student.className,
      courseYear: student.courseYear,
      phone: student.phone,
      isActive: Boolean(student.isActive),
    });
    setFormError("");
    setSuccessMessage("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setIsFormOpen(false);
    setFormError("");
    setForm(EMPTY_FORM);
  };

  const validateForm = () => {
    if (!form.studentCode.trim()) return "Mã sinh viên không được để trống.";
    if (!form.fullName.trim()) return "Họ tên sinh viên không được để trống.";
    if (!form.email.trim()) return "Email không được để trống.";
    if (!form.facultyId) return "Vui lòng chọn khoa.";
    if (!form.className.trim()) return "Lớp sinh viên không được để trống.";

    if (formMode === "create" && (!form.password || form.password.length < 6)) {
      return "Mật khẩu ban đầu phải có ít nhất 6 ký tự.";
    }

    return "";
  };

  const handleSubmitForm = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");
    setSuccessMessage("");

    try {
      if (formMode === "create") {
        await httpClient.post("/api/admin/users/student-account", buildStudentPayload(form));
        setSuccessMessage("Thêm sinh viên thành công.");
      } else {
        await httpClient.put(`/api/students/${form.id}`, buildStudentUpdatePayload(form));

        if (form.userId) {
          try {
            await httpClient.put(`/api/users/${form.userId}`, buildUserUpdatePayload(form));
          } catch (userUpdateError) {
            const status = userUpdateError?.response?.status;

            if (![404, 405].includes(status)) {
              throw userUpdateError;
            }
          }
        }

        setSuccessMessage("Cập nhật sinh viên thành công.");
      }

      setIsFormOpen(false);
      setForm(EMPTY_FORM);
      await fetchStudents();
    } catch (saveError) {
      console.error("Không lưu được sinh viên:", saveError);
      setFormError(getErrorMessage(saveError, "Không lưu được thông tin sinh viên."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await httpClient.delete(`/api/students/${deleteTarget.id}`);
      setSuccessMessage("Đã xóa sinh viên khỏi danh sách.");
      setDeleteTarget(null);
      await fetchStudents();
    } catch (deleteError) {
      console.error("Không xóa được sinh viên:", deleteError);
      setError(getErrorMessage(deleteError, "Không xóa được sinh viên."));
    } finally {
      setSaving(false);
    }
  };

  const openImportDialog = () => {
    setImportFile(null);
    setImportError("");
    setImportResult(null);
    setIsImportOpen(true);
  };

  const handleDownloadTemplate = async () => {
    setImportError("");

    try {
      const response = await httpClient.get("/api/admin/users/import-students/template", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "student_import_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error("Không tải được file mẫu:", downloadError);
      setImportError(getErrorMessage(downloadError, "Không tải được file mẫu Excel."));
    }
  };

  const handleImportStudents = async (event) => {
    event.preventDefault();

    if (!importFile) {
      setImportError("Vui lòng chọn file Excel trước khi import.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    setImportLoading(true);
    setImportError("");
    setImportResult(null);
    setSuccessMessage("");

    try {
      const response = await httpClient.post("/api/admin/users/import-students", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const payload = getResponsePayload(response);
      setImportResult(payload);
      setSuccessMessage("Import sinh viên hoàn tất.");
      await fetchStudents();
    } catch (importRequestError) {
      console.error("Không import được sinh viên:", importRequestError);
      setImportError(
        getErrorMessage(importRequestError, "Không import được file sinh viên."),
      );
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Quản lý sinh viên
              </h1>
              <p className="text-sm text-gray-500">
                Quản lý hồ sơ sinh viên, tài khoản đăng nhập và import danh sách bằng Excel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchStudents}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4" />
            Tải mẫu Excel
          </button>

          <button
            type="button"
            onClick={openImportDialog}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Thêm sinh viên
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Tổng sinh viên
          </p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Đang hoạt động
          </p>
          <p className="mt-2 text-3xl font-extrabold text-green-600">{stats.active}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Đã khóa
          </p>
          <p className="mt-2 text-3xl font-extrabold text-red-500">{stats.locked}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Lớp sinh viên
          </p>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">{stats.classes}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo mã SV, họ tên, email, lớp..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={facultyFilter}
              onChange={(event) => setFacultyFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả khoa</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name || faculty.code || `Khoa #${faculty.id}`}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả lớp</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>
              Hiển thị <strong>{filteredStudents.length}</strong> / {students.length} sinh viên
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                  Sinh viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                  Liên hệ
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                  Khoa / Lớp
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách sinh viên...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    Không có sinh viên phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const facultyName =
                    student.facultyName ||
                    facultyNameById.get(String(student.facultyId)) ||
                    "Chưa xác định khoa";

                  return (
                    <tr key={student.id} className="hover:bg-blue-50/30">
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                            {(student.fullName || student.studentCode || "S").charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {student.fullName || "Chưa có họ tên"}
                            </p>
                            <p className="text-xs font-semibold text-blue-600">
                              {student.studentCode || "Chưa có mã SV"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Username: {student.username || "Chưa có"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-600">
                        <p>{student.email || "Chưa có email"}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {student.phone || "Chưa có SĐT"}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-600">
                        <p className="font-semibold text-gray-800">{facultyName}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Lớp: {student.className || "Chưa có"}
                        </p>
                        {student.courseYear && (
                          <p className="mt-1 text-xs text-gray-400">
                            Khóa: {student.courseYear}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            student.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {getStatusLabel(student.isActive)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(student)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {formMode === "create" ? "Thêm sinh viên" : "Cập nhật sinh viên"}
                </h2>
                <p className="text-sm text-gray-500">
                  {formMode === "create"
                    ? "Tạo tài khoản đăng nhập kèm hồ sơ sinh viên."
                    : "Cập nhật thông tin hồ sơ sinh viên."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 px-6 py-5">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Mã sinh viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.studentCode}
                    onChange={(event) => updateForm("studentCode", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="VD: SV001"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Tên đăng nhập
                  </label>
                  <input
                    value={form.username}
                    onChange={(event) => updateForm("username", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Để trống sẽ dùng mã sinh viên"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(event) => updateForm("fullName", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhập họ tên sinh viên"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="student@example.com"
                  />
                </div>

                {formMode === "create" && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Mật khẩu ban đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) => updateForm("password", event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Khoa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.facultyId}
                    onChange={(event) => updateForm("facultyId", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Chọn khoa</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name || faculty.code || `Khoa #${faculty.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Lớp sinh viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.className}
                    onChange={(event) => updateForm("className", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="VD: DCT1234"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Khóa học
                  </label>
                  <input
                    type="number"
                    value={form.courseYear}
                    onChange={(event) => updateForm("courseYear", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="VD: 2024"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Số điện thoại
                  </label>
                  <input
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                  <input
                    id="student-active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => updateForm("isActive", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="student-active" className="text-sm font-semibold text-gray-700">
                    Tài khoản đang hoạt động
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formMode === "create" ? "Thêm sinh viên" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Import sinh viên bằng Excel
                </h2>
                <p className="text-sm text-gray-500">
                  Tải file mẫu, nhập dữ liệu sinh viên rồi upload lại vào hệ thống.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleImportStudents} className="space-y-4 px-6 py-5">
              {importError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {importError}
                </div>
              )}

              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-1 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">File Excel mẫu</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Dùng file mẫu để tránh sai tên cột khi import.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Tải mẫu Excel
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Chọn file Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {importResult && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  <p className="font-bold">Kết quả import</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <p>Tổng dòng: {importResult.totalRows ?? importResult.total ?? 0}</p>
                    <p>Thành công: {importResult.successCount ?? importResult.success ?? 0}</p>
                    <p>Lỗi: {importResult.failedCount ?? importResult.failed ?? 0}</p>
                  </div>

                  {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-white p-3 text-red-600">
                      {importResult.errors.map((item, index) => (
                        <p key={`${item}-${index}`}>- {String(item)}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  disabled={importLoading}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  Đóng
                </button>

                <button
                  type="submit"
                  disabled={importLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {importLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import sinh viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Xóa sinh viên</h2>
              <p className="mt-1 text-sm text-gray-500">
                Bạn có chắc muốn xóa sinh viên này khỏi danh sách?
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-bold text-gray-900">
                  {deleteTarget.fullName || "Chưa có họ tên"}
                </p>
                <p className="text-sm text-gray-500">
                  {deleteTarget.studentCode} - {deleteTarget.className}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Xóa sinh viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
