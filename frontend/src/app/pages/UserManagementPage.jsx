import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Ban, Edit2, KeyRound, Loader2, Search, UserPlus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { httpClient } from "../../services/httpClient";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "STAFF", label: "Giáo vụ" },
  { value: "LECTURER", label: "Giảng viên" },
  { value: "FACILITY", label: "Nhân viên CSVC" },
  { value: "STUDENT", label: "Sinh viên" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Chưa kích hoạt" },
  { value: "LOCKED", label: "Đã khóa" },
];

const ROLE_BADGE = {
  ADMIN: "bg-purple-100 text-purple-800",
  STAFF: "bg-blue-100 text-blue-800",
  LECTURER: "bg-indigo-100 text-indigo-800",
  FACILITY: "bg-orange-100 text-orange-800",
  STUDENT: "bg-emerald-100 text-emerald-800",
};

const STATUS_BADGE = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-600",
  LOCKED: "bg-red-100 text-red-800",
};

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const getRoleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || role || "-";
const getStatusLabel = (status) => STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "-";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (roleFilter !== "all") params.role = roleFilter;
        if (statusFilter !== "all") params.status = statusFilter;

        const response = await httpClient.get("/api/admin/users", { params });
        if (isMounted) setUsers(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Không thể tải danh sách tài khoản.");
          setUsers([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const text = [
        user.username,
        user.fullName,
        user.email,
        user.role,
        user.status,
        user.profileCode,
        user.departmentName,
      ].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [users, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý tài khoản</h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách tài khoản được đọc từ database qua API admin.
          </p>
        </div>
        <Button disabled className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm tài khoản
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo username, họ tên, email, mã hồ sơ..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Lọc vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-52">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải tài khoản...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/60">
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Họ tên / mã hồ sơ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-mono text-xs font-semibold text-gray-900">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{user.fullName || user.username}</div>
                      <div className="font-mono text-xs text-gray-500">{user.profileCode || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{user.departmentName || "-"}</div>
                      <div className="text-xs text-gray-500">{user.departmentCode || ""}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ROLE_BADGE[user.role] ?? "bg-gray-100 text-gray-700"} border-0 text-[11px]`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_BADGE[user.status] ?? "bg-gray-100 text-gray-600"} border-0 text-[11px]`}>
                        {getStatusLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="xs" disabled title="Chưa có API cập nhật tài khoản">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" disabled title="Chưa có API đặt lại mật khẩu">
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" disabled title="Chưa có API khóa tài khoản">
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-sm text-gray-400">
                      Không tìm thấy tài khoản nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            Hiển thị {filteredUsers.length} / {users.length} tài khoản
          </div>
        </div>
      )}
    </div>
  );
};

export { UserManagementPage };
export default UserManagementPage;
