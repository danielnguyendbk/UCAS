import { useEffect, useMemo, useState } from "react";
import ExcelImportActions from "@/features/admin/components/ExcelImportActions";
import {
  Search,
  Plus,
  Mail,
  Phone,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { httpClient } from "@/services/httpClient";

const EMPTY_FORM = {
  id: null,
  user_id: "",
  department_id: "",
  staff_code: "",
  full_name: "",
  email: "",
  phone: "",
};

const getResponseData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const normalizeText = (value) => String(value || "").trim();

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

const normalizeLecturer = (lecturer) => ({
  id: lecturer.id,
  user_id: lecturer.user_id ?? lecturer.userId ?? "",
  department_id: lecturer.department_id ?? lecturer.departmentId ?? "",
  staff_code: lecturer.staff_code ?? lecturer.staffCode ?? "",
  full_name: lecturer.full_name ?? lecturer.fullName ?? lecturer.name ?? "",
  email: lecturer.email ?? "",
  phone: lecturer.phone ?? "",
  department_name:
    lecturer.department_name ?? lecturer.departmentName ?? lecturer.department ?? "",
  username: lecturer.username ?? "",
  role: lecturer.role ?? "LECTURER",
  active_courses:
    lecturer.active_courses ??
    lecturer.activeCourses ??
    lecturer.courses ??
    0,
  is_deleted: lecturer.is_deleted ?? lecturer.isDeleted ?? 0,
});

const normalizeDepartment = (department) => ({
  id: department.id,
  name: department.name ?? department.department_name ?? "",
  code: department.code ?? department.department_code ?? "",
});

const normalizeUser = (user) => ({
  id: user.id,
  username: user.username ?? "",
  email: user.email ?? "",
  full_name: user.full_name ?? user.fullName ?? user.name ?? "",
  role: normalizeRole(user.role),
  is_active: user.is_active ?? user.isActive ?? true,
  is_deleted: user.is_deleted ?? user.isDeleted ?? false,
});

export const LecturersPage = () => {
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courseCountByLecturer, setCourseCountByLecturer] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [lecturerForm, setLecturerForm] = useState(EMPTY_FORM);

  const [viewLecturer, setViewLecturer] = useState(null);
  const [deleteLecturer, setDeleteLecturer] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [lecturersResponse, departmentsResponse, usersResponse] =
        await Promise.all([
          httpClient.get("/api/lecturers"),
          httpClient.get("/api/departments"),
          httpClient.get("/api/users"),
        ]);

      const nextLecturers = getResponseData(lecturersResponse).map(normalizeLecturer);
      const nextDepartments = getResponseData(departmentsResponse).map(normalizeDepartment);
      const nextUsers = getResponseData(usersResponse).map(normalizeUser);

      setLecturers(nextLecturers);
      setDepartments(nextDepartments);
      setUsers(nextUsers);

      await loadCourseCounts(nextLecturers);
    } catch (error) {
      console.error("Không tải được dữ liệu giảng viên:", error);
      setErrorMessage("Không tải được dữ liệu giảng viên. Vui lòng kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  };

  const loadCourseCounts = async (currentLecturers) => {
    try {
      const response = await httpClient.get("/api/class-sections");
      const sections = getResponseData(response);

      const counts = {};

      sections.forEach((section) => {
        const lecturerId = section.lecturer_id ?? section.lecturerId;

        if (!lecturerId) return;

        const status = String(section.status || "").toUpperCase();

        if (status && status !== "ACTIVE") return;

        counts[lecturerId] = (counts[lecturerId] || 0) + 1;
      });

      setCourseCountByLecturer(counts);
    } catch {
      const fallbackCounts = {};
      currentLecturers.forEach((lecturer) => {
        fallbackCounts[lecturer.id] = Number(lecturer.active_courses || 0);
      });
      setCourseCountByLecturer(fallbackCounts);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const lecturerUserOptions = useMemo(
    () =>
      users.filter(
        (user) =>
          normalizeRole(user.role) === "LECTURER" &&
          !Boolean(user.is_deleted),
      ),
    [users],
  );

  const filteredLecturers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return lecturers;

    return lecturers.filter((lecturer) => {
      const values = [
        lecturer.staff_code,
        lecturer.full_name,
        lecturer.email,
        lecturer.phone,
        lecturer.department_name,
        lecturer.username,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(keyword),
      );
    });
  }, [lecturers, searchTerm]);

  const openCreateDialog = () => {
    setFormMode("create");
    setLecturerForm({
      ...EMPTY_FORM,
      department_id: departments[0]?.id ? String(departments[0].id) : "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditDialog = (lecturer) => {
    setFormMode("edit");
    setLecturerForm({
      id: lecturer.id,
      user_id: lecturer.user_id ? String(lecturer.user_id) : "",
      department_id: lecturer.department_id ? String(lecturer.department_id) : "",
      staff_code: lecturer.staff_code || "",
      full_name: lecturer.full_name || "",
      email: lecturer.email || "",
      phone: lecturer.phone || "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleChangeForm = (field, value) => {
    setLecturerForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSelectUser = (userId) => {
    const selectedUser = users.find((user) => String(user.id) === String(userId));

    setLecturerForm((previous) => ({
      ...previous,
      user_id: userId,
      full_name: selectedUser?.full_name || previous.full_name,
      email: selectedUser?.email || previous.email,
    }));
  };

  const validateForm = () => {
    if (!lecturerForm.user_id) {
      return "Vui lòng chọn tài khoản người dùng cho giảng viên.";
    }

    if (!lecturerForm.department_id) {
      return "Vui lòng chọn bộ môn/khoa.";
    }

    if (!lecturerForm.staff_code.trim()) {
      return "Mã giảng viên không được để trống.";
    }

    if (!lecturerForm.full_name.trim()) {
      return "Họ tên giảng viên không được để trống.";
    }

    if (!lecturerForm.email.trim()) {
      return "Email không được để trống.";
    }

    return "";
  };

  const buildPayload = () => ({
    user_id: Number(lecturerForm.user_id),
    department_id: Number(lecturerForm.department_id),
    staff_code: lecturerForm.staff_code.trim().toUpperCase(),
    full_name: lecturerForm.full_name.trim(),
    email: lecturerForm.email.trim(),
    phone: lecturerForm.phone.trim() || null,
    is_deleted: 0,
  });

  const syncUserProfile = async () => {
    if (!lecturerForm.user_id) return;

    try {
      await httpClient.put(`/api/users/${lecturerForm.user_id}`, {
        full_name: lecturerForm.full_name.trim(),
        email: lecturerForm.email.trim(),
        role: "LECTURER",
        is_active: 1,
        is_deleted: 0,
      });
    } catch (error) {
      console.warn("Không đồng bộ được users khi lưu giảng viên:", error);
    }
  };

  const handleSaveLecturer = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = buildPayload();

      if (formMode === "edit" && lecturerForm.id) {
        await httpClient.put(`/api/lecturers/${lecturerForm.id}`, payload);
      } else {
        await httpClient.post("/api/lecturers", payload);
      }

      await syncUserProfile();

      setIsFormOpen(false);
      setLecturerForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error("Không lưu được giảng viên:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không lưu được giảng viên. Vui lòng kiểm tra dữ liệu nhập.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLecturer = async () => {
    if (!deleteLecturer?.id) return;

    setSaving(true);
    setErrorMessage("");

    try {
      await httpClient.delete(`/api/lecturers/${deleteLecturer.id}`);
      setDeleteLecturer(null);
      await loadData();
    } catch (error) {
      console.error("Không xóa được giảng viên:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không xóa được giảng viên. Giảng viên có thể đang được dùng trong lớp học phần.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Giảng viên</h1>
          <p className="text-gray-600 mt-1">
            Quản lý hồ sơ giảng viên và nhân sự giảng dạy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExcelImportActions type="lecturer" onImported={loadData} />

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm giảng viên
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Tìm theo tên, mã giảng viên, email, bộ môn..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-10 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách giảng viên...
        </div>
      ) : filteredLecturers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Không tìm thấy giảng viên nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLecturers.map((lecturer) => (
            <Card key={lecturer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {lecturer.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {lecturer.department_name || "Chưa có bộ môn"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Mã GV: {lecturer.staff_code || "Chưa có"}
                    </p>
                  </div>

                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Đang hoạt động
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{lecturer.email || "Chưa có email"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{lecturer.phone || "Chưa có số điện thoại"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserRound className="w-4 h-4 flex-shrink-0" />
                    <span>{lecturer.username || "Chưa liên kết tài khoản"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Lớp học phần phụ trách</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {courseCountByLecturer[lecturer.id] || 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewLecturer(lecturer)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(lecturer)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteLecturer(lecturer)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Cập nhật giảng viên" : "Thêm giảng viên"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin giảng viên theo dữ liệu đào tạo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="staff-code">Mã giảng viên</Label>
                <Input
                  id="staff-code"
                  placeholder="VD: GV005"
                  value={lecturerForm.staff_code}
                  onChange={(event) =>
                    handleChangeForm("staff_code", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-id">Tài khoản liên kết</Label>
                <select
                  id="user-id"
                  value={lecturerForm.user_id}
                  onChange={(event) => handleSelectUser(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Chọn tài khoản</option>
                  {lecturerUserOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} - {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Bộ môn/Khoa</Label>
              <select
                id="department"
                value={lecturerForm.department_id}
                onChange={(event) =>
                  handleChangeForm("department_id", event.target.value)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn bộ môn/khoa</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                    {department.code ? ` (${department.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lecturer-name">Họ và tên</Label>
              <Input
                id="lecturer-name"
                placeholder="VD: Nguyễn Văn A"
                value={lecturerForm.full_name}
                onChange={(event) =>
                  handleChangeForm("full_name", event.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lecturer-email">Email</Label>
                <Input
                  id="lecturer-email"
                  type="email"
                  placeholder="example@ucas.local"
                  value={lecturerForm.email}
                  onChange={(event) =>
                    handleChangeForm("email", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lecturer-phone">Số điện thoại</Label>
                <Input
                  id="lecturer-phone"
                  placeholder="0900000000"
                  value={lecturerForm.phone}
                  onChange={(event) =>
                    handleChangeForm("phone", event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveLecturer}
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : formMode === "edit"
                  ? "Lưu thay đổi"
                  : "Tạo giảng viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewLecturer)} onOpenChange={() => setViewLecturer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết giảng viên</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết giảng viên trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          {viewLecturer && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Mã GV:</span>
                <span className="col-span-2">{viewLecturer.staff_code}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Họ tên:</span>
                <span className="col-span-2">{viewLecturer.full_name}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Bộ môn:</span>
                <span className="col-span-2">
                  {viewLecturer.department_name || "Chưa có"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Email:</span>
                <span className="col-span-2">{viewLecturer.email || "Chưa có"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Điện thoại:</span>
                <span className="col-span-2">{viewLecturer.phone || "Chưa có"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Tài khoản:</span>
                <span className="col-span-2">{viewLecturer.username || "Chưa có"}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLecturer(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteLecturer)} onOpenChange={() => setDeleteLecturer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa giảng viên</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa giảng viên này không? Thao tác này sẽ xóa mềm bằng trường is_deleted.
            </DialogDescription>
          </DialogHeader>

          {deleteLecturer && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">
                {deleteLecturer.staff_code} - {deleteLecturer.full_name}
              </p>
              <p className="mt-1 text-gray-500">
                Bộ môn: {deleteLecturer.department_name || "Chưa có"}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteLecturer(null)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteLecturer}
              disabled={saving}
            >
              {saving ? "Đang xóa..." : "Xóa giảng viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};