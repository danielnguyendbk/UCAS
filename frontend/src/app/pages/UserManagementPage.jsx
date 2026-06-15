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
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
  { value: "LECTURER", label: "Lecturer" },
  { value: "FACILITY", label: "Facility" },
  { value: "STUDENT", label: "Student" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Hoat dong" },
  { value: "INACTIVE", label: "Chua kich hoat" },
  { value: "LOCKED", label: "Da khoa" },
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
          setError(err?.response?.data?.message || "Khong the tai danh sach tai khoan.");
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quan ly tai khoan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sach tai khoan duoc doc tu database qua API admin.
          </p>
        </div>
        <Button disabled className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Them tai khoan
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tim theo username, ho ten, email, ma ho so..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Loc vai tro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca vai tro</SelectItem>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-52">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Loc trang thai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca trang thai</SelectItem>
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
          <p className="text-sm font-semibold text-gray-600">Dang tai tai khoan...</p>
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
                  <TableHead>Ten dang nhap</TableHead>
                  <TableHead>Ho ten / ma ho so</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Don vi</TableHead>
                  <TableHead>Vai tro</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-right">Thao tac</TableHead>
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
                        <Button variant="ghost" size="xs" disabled title="Chua co API cap nhat user">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" disabled title="Chua co API dat lai mat khau">
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" disabled title="Chua co API khoa tai khoan">
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-sm text-gray-400">
                      Khong tim thay tai khoan nao.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            Hien thi {filteredUsers.length} / {users.length} tai khoan
          </div>
        </div>
      )}
    </div>
  );
};

export { UserManagementPage };
export default UserManagementPage;
