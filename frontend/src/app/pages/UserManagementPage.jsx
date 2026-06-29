import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  UserPlus,
  Edit2,
  Ban,
  Search,
  KeyRound,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Upload,
  FileSpreadsheet,
  Download as DownloadIcon,
} from "lucide-react";
import { httpClient } from "@/services/httpClient";

const EMPTY_ADD_FORM = {
  username: "",
  fullName: "",
  email: "",
  password: "123456",
  role: "STAFF",
  status: "ACTIVE",

  studentCode: "",
  facultyId: "",
  className: "",
  courseYear: "",
  phone: "",
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "STAFF", label: "Nhân viên đào tạo" },
  { value: "LECTURER", label: "Giảng viên" },
  { value: "FACILITY", label: "Nhân viên CSVC" },
  { value: "STUDENT", label: "Sinh viên" },
];

const ROLE_BADGE = {
  ADMIN: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  STAFF: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  LECTURER: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  FACILITY: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  STUDENT: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

const STATUS_BADGE = {
  ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100",
  LOCKED: "bg-red-100 text-red-800 hover:bg-red-100",
};

const STATUS_LABEL = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
};

const getResponseData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const getResponsePayload = (response) => {
  return response?.data?.data || response?.data || {};
};

const isTrue = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

const getRoleLabel = (role) =>
  ROLE_OPTIONS.find((item) => item.value === role)?.label || role || "---";

const formatDateTime = (value) => {
  if (!value) return "Chưa có";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getCurrentUserId = () => {
  try {
    const storedUser = localStorage.getItem("csms_user");
    if (!storedUser) return null;

    const parsed = JSON.parse(storedUser);
    return parsed?.id ? String(parsed.id) : null;
  } catch {
    return null;
  }
};

const normalizeUser = (user) => {
  const isActive = isTrue(user.is_active ?? user.isActive);

  return {
    id: user.id,
    username: user.username || "",
    email: user.email || "",
    fullName: user.full_name || user.fullName || user.name || "",
    role: String(user.role || "").toUpperCase(),
    isActive,
    status: isActive ? "ACTIVE" : "LOCKED",
    lastLoginAt: user.last_login_at || user.lastLoginAt || "",
    createdAt: user.created_at || user.createdAt || "",
    updatedAt: user.updated_at || user.updatedAt || "",
    isDeleted: isTrue(user.is_deleted ?? user.isDeleted),
  };
};

const UserManagementPage = () => {
  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_ADD_FORM);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("123456");
  const [resetError, setResetError] = useState("");

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await httpClient.get("/api/users");
      setUsers(getResponseData(response).map(normalizeUser));
    } catch (error) {
      console.error("Không tải được danh sách tài khoản:", error);
      setErrorMessage(
        "Không tải được danh sách tài khoản. Vui lòng kiểm tra backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFaculties = async () => {
    try {
      const response = await httpClient.get("/api/faculties");
      setFaculties(getResponseData(response));
    } catch (error) {
      console.error("Không tải được danh sách khoa:", error);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadFaculties();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !keyword ||
        [
          user.username,
          user.fullName,
          user.email,
          user.role,
          getRoleLabel(user.role),
        ].some((value) => String(value || "").toLowerCase().includes(keyword));

      const matchRole = roleFilter === "all" || user.role === roleFilter;
      const matchStatus = statusFilter === "all" || user.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.status === "ACTIVE").length;
    const locked = users.filter((user) => user.status === "LOCKED").length;
    const admins = users.filter((user) => user.role === "ADMIN").length;

    return {
      total,
      active,
      locked,
      admins,
    };
  }, [users]);

  const openAddDialog = () => {
    setNewUser(EMPTY_ADD_FORM);
    setErrorMessage("");
    setSuccessMessage("");
    setIsAddOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUser({ ...user });
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditOpen(true);
  };

  const openResetDialog = (user) => {
    setResetUser(user);
    setResetPassword("123456");
    setResetError("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const openDeleteDialog = (user) => {
    setDeleteUser(user);
    setDeleteError("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const openImportDialog = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError("");
    setErrorMessage("");
    setSuccessMessage("");
    setIsImportOpen(true);
  };

  const handleDownloadStudentTemplate = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await httpClient.get(
        "/api/admin/users/import-students/template",
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "student_import_template.xlsx";
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Không tải được file mẫu import sinh viên:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không tải được file mẫu import sinh viên. Vui lòng kiểm tra backend.",
      );
    }
  };

  const handleImportStudents = async () => {
    if (!importFile) {
      setImportError("Vui lòng chọn file Excel cần import.");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportResult(null);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const response = await httpClient.post(
        "/api/admin/users/import-students",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const payload = getResponsePayload(response);
      setImportResult(payload);

      setSuccessMessage(
        `Import sinh viên hoàn tất: ${payload.successCount || 0} thành công, ${
          payload.failedCount || 0
        } lỗi.`,
      );

      await loadUsers();
    } catch (error) {
      console.error("Không import được sinh viên:", error);
      setImportError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không import được sinh viên. Vui lòng kiểm tra file Excel.",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const updateNewUser = (field, value) => {
    setNewUser((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateAddForm = () => {
    if (!newUser.username.trim()) {
      return "Tên đăng nhập không được để trống.";
    }

    if (!newUser.fullName.trim()) {
      return "Họ và tên không được để trống.";
    }

    if (!newUser.email.trim()) {
      return "Email không được để trống.";
    }

    if (!newUser.email.includes("@")) {
      return "Email không hợp lệ.";
    }

    if (!newUser.password.trim()) {
      return "Mật khẩu không được để trống.";
    }

    if (newUser.password.trim().length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!newUser.role) {
      return "Vui lòng chọn vai trò.";
    }

    if (newUser.role === "STUDENT") {
      if (!newUser.studentCode.trim()) {
        return "Mã sinh viên không được để trống.";
      }

      if (!newUser.facultyId) {
        return "Vui lòng chọn khoa của sinh viên.";
      }

      if (!newUser.className.trim()) {
        return "Lớp của sinh viên không được để trống. Sinh viên bắt buộc phải thuộc một lớp.";
      }
    }

    return "";
  };

  const validateEditForm = () => {
    if (!editingUser?.fullName?.trim()) {
      return "Họ và tên không được để trống.";
    }

    if (!editingUser?.email?.trim()) {
      return "Email không được để trống.";
    }

    if (!editingUser?.role) {
      return "Vui lòng chọn vai trò.";
    }

    return "";
  };

  const handleAdd = async () => {
    const validationError = validateAddForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (newUser.role === "STUDENT") {
        await httpClient.post("/api/admin/users/student-account", {
          username: newUser.username.trim(),
          email: newUser.email.trim(),
          password: newUser.password.trim(),
          full_name: newUser.fullName.trim(),
          is_active: newUser.status === "ACTIVE" ? 1 : 0,

          student_code: newUser.studentCode.trim(),
          faculty_id: Number(newUser.facultyId),
          class_name: newUser.className.trim(),
          course_year: newUser.courseYear ? Number(newUser.courseYear) : null,
          phone: newUser.phone.trim(),
        });
      } else {
        await httpClient.post("/api/users", {
          username: newUser.username.trim(),
          email: newUser.email.trim(),
          password_hash: newUser.password.trim(),
          full_name: newUser.fullName.trim(),
          role: newUser.role,
          is_active: newUser.status === "ACTIVE" ? 1 : 0,
          is_deleted: 0,
        });
      }

      setIsAddOpen(false);
      setNewUser(EMPTY_ADD_FORM);
      setSuccessMessage(
        newUser.role === "STUDENT"
          ? "Tạo tài khoản sinh viên và hồ sơ sinh viên thành công."
          : "Tạo tài khoản thành công.",
      );
      await loadUsers();
    } catch (error) {
      console.error("Không tạo được tài khoản:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không tạo được tài khoản. Username, email hoặc mã sinh viên có thể đã tồn tại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    const validationError = validateEditForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await httpClient.put(`/api/users/${editingUser.id}`, {
        email: editingUser.email.trim(),
        full_name: editingUser.fullName.trim(),
        role: editingUser.role,
        is_active: editingUser.status === "ACTIVE" ? 1 : 0,
      });

      setIsEditOpen(false);
      setEditingUser(null);
      setSuccessMessage("Cập nhật tài khoản thành công.");
      await loadUsers();
    } catch (error) {
      console.error("Không cập nhật được tài khoản:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không cập nhật được tài khoản. Vui lòng kiểm tra dữ liệu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (user) => {
    if (String(user.id) === String(currentUserId)) {
      setErrorMessage("Không thể khóa/mở khóa chính tài khoản đang đăng nhập.");
      setSuccessMessage("");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const nextIsActive = user.status === "ACTIVE" ? 0 : 1;

      await httpClient.put(`/api/users/${user.id}`, {
        is_active: nextIsActive,
      });

      setSuccessMessage(
        nextIsActive === 1
          ? `Đã mở khóa tài khoản ${user.username}.`
          : `Đã khóa tài khoản ${user.username}.`,
      );

      await loadUsers();
    } catch (error) {
      console.error("Không đổi được trạng thái tài khoản:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không đổi được trạng thái tài khoản. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser?.id) return;

    const nextPassword = resetPassword.trim();

    if (!nextPassword || nextPassword.length < 6) {
      setResetError("Mật khẩu đặt lại phải có ít nhất 6 ký tự.");
      return;
    }

    setSaving(true);
    setResetError("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await httpClient.put(`/api/users/${resetUser.id}`, {
        password_hash: nextPassword,
      });

      const username = resetUser.username;

      setResetUser(null);
      setResetPassword("123456");

      setSuccessMessage(
        `Đã đặt lại mật khẩu cho ${username}. Mật khẩu mới: ${nextPassword}`,
      );

      await loadUsers();
    } catch (error) {
      console.error("Không đặt lại được mật khẩu:", error);
      setResetError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không đặt lại được mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser?.id) return;

    if (String(deleteUser.id) === String(currentUserId)) {
      setDeleteError("Không thể xóa chính tài khoản đang đăng nhập.");
      return;
    }

    setSaving(true);
    setDeleteError("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await httpClient.delete(`/api/users/${deleteUser.id}`);

      const username = deleteUser.username;

      setDeleteUser(null);
      setSuccessMessage(`Đã xóa tài khoản ${username}.`);
      await loadUsers();
    } catch (error) {
      console.error("Không xóa được tài khoản:", error);
      setDeleteError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không xóa được tài khoản. Tài khoản có thể đang được liên kết dữ liệu nghiệp vụ.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý tài khoản
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo tài khoản, gán vai trò, khóa/mở khóa và đặt lại mật khẩu
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDownloadStudentTemplate}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Tải mẫu Excel
          </Button>

          <Button variant="outline" onClick={openImportDialog}>
            <Upload className="w-4 h-4 mr-2" />
            Import sinh viên
          </Button>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={openAddDialog}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Tổng tài khoản" value={stats.total} icon={Users} tone="blue" />
        <StatCard title="Đang hoạt động" value={stats.active} icon={UserCheck} tone="green" />
        <StatCard title="Đã khóa" value={stats.locked} icon={UserX} tone="red" />
        <StatCard title="Admin" value={stats.admins} icon={ShieldCheck} tone="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo tên đăng nhập, họ tên, email, vai trò..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Lọc vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="LOCKED">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/60">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700">
                  Tên đăng nhập
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Họ và tên
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Email
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Vai trò
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Trạng thái
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Lần đăng nhập cuối
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách tài khoản...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isCurrentUser = String(user.id) === String(currentUserId);

                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50/40">
                      <TableCell className="text-xs font-semibold text-gray-900 font-mono">
                        {user.username}
                        {isCurrentUser && (
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            Bạn
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-gray-700">
                        {user.fullName}
                      </TableCell>

                      <TableCell className="text-xs text-gray-500">
                        {user.email}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${
                            ROLE_BADGE[user.role] ?? "bg-gray-100 text-gray-700"
                          } border-0 text-[11px]`}
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${
                            STATUS_BADGE[user.status] ?? "bg-gray-100 text-gray-600"
                          } border-0 text-[11px]`}
                        >
                          {STATUS_LABEL[user.status] ?? user.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-gray-500">
                        {formatDateTime(user.lastLoginAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-500 hover:text-blue-600"
                            title="Chỉnh sửa tài khoản"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Đặt lại mật khẩu"
                            onClick={() => openResetDialog(user)}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={saving || isCurrentUser}
                            className={`h-8 px-2 ${
                              user.status === "ACTIVE"
                                ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                            title={
                              isCurrentUser
                                ? "Không thể khóa tài khoản đang đăng nhập"
                                : user.status === "ACTIVE"
                                  ? "Khóa tài khoản"
                                  : "Mở khóa tài khoản"
                            }
                            onClick={() => handleToggleLock(user)}
                          >
                            {user.status === "ACTIVE" ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={saving || isCurrentUser}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              isCurrentUser
                                ? "Không thể xóa tài khoản đang đăng nhập"
                                : "Xóa tài khoản"
                            }
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-28 text-center text-sm text-gray-400 italic"
                  >
                    Không tìm thấy tài khoản nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          Hiển thị {filteredUsers.length} / {users.length} tài khoản
        </div>
      </div>

      <Dialog
        open={isImportOpen}
        onOpenChange={(value) => {
          setIsImportOpen(value);

          if (!value) {
            setImportFile(null);
            setImportError("");
            setImportResult(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import sinh viên bằng Excel</DialogTitle>
            <DialogDescription>
              File Excel sẽ tạo đồng thời tài khoản role STUDENT trong bảng users
              và hồ sơ sinh viên trong bảng students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <div className="font-semibold mb-1">Cột bắt buộc:</div>
              <div className="text-xs">
                username, email, full_name, student_code, faculty_id, class_name
              </div>
              <div className="mt-2 text-xs">
                Cột <strong>class_name</strong> bắt buộc. Sinh viên không được thiếu lớp.
                Cột <strong>password</strong> nếu để trống sẽ mặc định là{" "}
                <strong>123456</strong>. Cột <strong>is_active</strong> nếu để trống
                sẽ mặc định là <strong>1</strong>.
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadStudentTemplate}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Tải file mẫu Excel
            </Button>

            <div className="space-y-1.5">
              <Label>Chọn file Excel</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] || null);
                  setImportError("");
                  setImportResult(null);
                }}
              />
              {importFile && (
                <p className="text-xs text-gray-500">
                  Đã chọn: <strong>{importFile.name}</strong>
                </p>
              )}
            </div>

            {importError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Tổng dòng</p>
                    <p className="text-xl font-bold text-gray-900">
                      {importResult.totalRows || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Thành công</p>
                    <p className="text-xl font-bold text-green-700">
                      {importResult.successCount || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Lỗi</p>
                    <p className="text-xl font-bold text-red-700">
                      {importResult.failedCount || 0}
                    </p>
                  </div>
                </div>

                {Array.isArray(importResult.errors) &&
                  importResult.errors.length > 0 && (
                    <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-red-100 bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-red-50 text-red-700">
                          <tr>
                            <th className="px-3 py-2 text-left">Dòng</th>
                            <th className="px-3 py-2 text-left">Username</th>
                            <th className="px-3 py-2 text-left">Lỗi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((error, index) => (
                            <tr key={index} className="border-t border-red-50">
                              <td className="px-3 py-2">{error.row}</td>
                              <td className="px-3 py-2">{error.username}</td>
                              <td className="px-3 py-2">{error.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(false)}
              disabled={importLoading}
            >
              Đóng
            </Button>

            <Button
              onClick={handleImportStudents}
              disabled={importLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {importLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import sinh viên
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddOpen}
        onOpenChange={(value) => {
          setIsAddOpen(value);
          setErrorMessage("");
          setSuccessMessage("");
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản mới</DialogTitle>
            <DialogDescription>
              Tạo thông tin đăng nhập và gán vai trò cho người dùng.
              Nếu là sinh viên, hệ thống sẽ tạo cả tài khoản đăng nhập và hồ sơ sinh viên.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập</Label>
                <Input
                  placeholder="vd: staff02"
                  value={newUser.username}
                  onChange={(event) => updateNewUser("username", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input
                  placeholder="Nguyễn Thị A"
                  value={newUser.fullName}
                  onChange={(event) => updateNewUser("fullName", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="user@ucas.local"
                value={newUser.email}
                onChange={(event) => updateNewUser("email", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mật khẩu ban đầu</Label>
              <Input
                type="text"
                value={newUser.password}
                onChange={(event) => updateNewUser("password", event.target.value)}
              />
              <p className="text-xs text-gray-500">
                Mặc định là 123456. Người dùng có thể đổi sau khi đăng nhập.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vai trò</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser((previous) => ({
                      ...previous,
                      role: value,
                      studentCode: value === "STUDENT" ? previous.studentCode : "",
                      facultyId: value === "STUDENT" ? previous.facultyId : "",
                      className: value === "STUDENT" ? previous.className : "",
                      courseYear: value === "STUDENT" ? previous.courseYear : "",
                      phone: value === "STUDENT" ? previous.phone : "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Trạng thái tài khoản</Label>
                <Select
                  value={newUser.status}
                  onValueChange={(value) => updateNewUser("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="LOCKED">Đã khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newUser.role === "STUDENT" && (
              <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Thông tin sinh viên bắt buộc
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Sinh viên phải có email, mã sinh viên, khoa và lớp.
                    Sinh viên đã tốt nghiệp vẫn phải giữ thông tin lớp;
                    trạng thái tốt nghiệp/khóa tài khoản được quản lý riêng bằng trạng thái tài khoản.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Mã sinh viên</Label>
                    <Input
                      placeholder="vd: SV24001"
                      value={newUser.studentCode}
                      onChange={(event) => updateNewUser("studentCode", event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Khoa</Label>
                    <Select
                      value={String(newUser.facultyId || "")}
                      onValueChange={(value) => updateNewUser("facultyId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={String(faculty.id)}>
                            {faculty.name} {faculty.code ? `(${faculty.code})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Lớp</Label>
                  <Input
                    placeholder="vd: D23CQCN01-B"
                    value={newUser.className}
                    onChange={(event) => updateNewUser("className", event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Khóa</Label>
                    <Input
                      type="number"
                      placeholder="vd: 2024"
                      value={newUser.courseYear}
                      onChange={(event) => updateNewUser("courseYear", event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Số điện thoại</Label>
                    <Input
                      placeholder="vd: 0900000001"
                      value={newUser.phone}
                      onChange={(event) => updateNewUser("phone", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {newUser.role === "FACILITY" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                <span>
                  Sau khi tạo tài khoản role FACILITY, hồ sơ nghiệp vụ và phân công
                  tòa nhà được quản lý ở trang <strong>Nhân viên CSVC</strong>.
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              onClick={handleAdd}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tài khoản{" "}
              <strong>{editingUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label>Tên đăng nhập</Label>
                <Input value={editingUser.username} disabled />
              </div>

              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input
                  value={editingUser.fullName}
                  onChange={(event) =>
                    setEditingUser((previous) => ({
                      ...previous,
                      fullName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(event) =>
                    setEditingUser((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vai trò</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser((previous) => ({
                        ...previous,
                        role: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select
                    value={editingUser.status}
                    onValueChange={(value) =>
                      setEditingUser((previous) => ({
                        ...previous,
                        status: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="LOCKED">Đã khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingUser.role === "FACILITY" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    Cấu hình tòa nhà phụ trách tại trang{" "}
                    <strong>Nhân viên CSVC</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              onClick={handleEdit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetUser)}
        onOpenChange={(value) => {
          if (!value) {
            setResetUser(null);
            setResetError("");
            setResetPassword("123456");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt lại mật khẩu cho tài khoản{" "}
              <strong>{resetUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {resetError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {resetError}
              </div>
            )}

            <Label>Mật khẩu mới</Label>
            <Input
              type="text"
              value={resetPassword}
              onChange={(event) => {
                setResetPassword(event.target.value);
                setResetError("");
              }}
            />
            <p className="text-xs text-gray-500">
              Mật khẩu mới sẽ được lưu trực tiếp vào database theo chế độ dev hiện tại.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetUser(null);
                setResetError("");
                setResetPassword("123456");
              }}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              onClick={handleResetPassword}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteUser)}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteUser(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa tài khoản</DialogTitle>
            <DialogDescription>
              Tài khoản sẽ được xóa mềm bằng trường is_deleted. Hồ sơ nghiệp vụ liên quan có thể cần xử lý riêng.
            </DialogDescription>
          </DialogHeader>

          {deleteUser && (
            <div className="space-y-3 py-3">
              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {deleteError}
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <p className="font-semibold text-gray-900">
                  {deleteUser.username} - {deleteUser.fullName}
                </p>
                <p className="mt-1 text-gray-500">
                  {deleteUser.email} · {getRoleLabel(deleteUser.role)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteUser(null);
                setDeleteError("");
              }}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              onClick={handleDeleteUser}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? "Đang xóa..." : "Xóa tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, tone }) => {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${toneClasses[tone] || toneClasses.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export { UserManagementPage };
export default UserManagementPage;