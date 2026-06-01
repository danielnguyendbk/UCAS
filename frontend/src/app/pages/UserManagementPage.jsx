import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  UserPlus, Edit2, Ban, Search, KeyRound, Info, CheckCircle2, AlertTriangle
} from "lucide-react";

/* ─── Mock seed data ──────────────────────────────────────────────────────── */
const initialUsers = [
  { id: 1, username: "admin01",   fullName: "Nguyễn Văn Admin",  email: "admin01@ucas.edu.vn",   role: "ADMIN",    status: "ACTIVE"   },
  { id: 2, username: "staff01",   fullName: "Trần Thị Giáo Vụ",  email: "staff01@ucas.edu.vn",   role: "STAFF",    status: "ACTIVE"   },
  { id: 3, username: "fac01",     fullName: "Phạm Văn Nhân Viên", email: "fac01@ucas.edu.vn",     role: "FACILITY", status: "ACTIVE"   },
  { id: 4, username: "lecturer01",fullName: "Lê Thị Giảng Viên",  email: "lv01@ucas.edu.vn",      role: "LECTURER", status: "ACTIVE"   },
  { id: 5, username: "stu2401",   fullName: "Hoàng Văn Sinh Viên", email: "stu24@ucas.edu.vn",    role: "STUDENT",  status: "INACTIVE" },
];

const ROLE_OPTIONS = [
  { value: "ADMIN",    label: "Quản trị viên (Admin)" },
  { value: "STAFF",    label: "Giáo vụ (Staff)" },
  { value: "LECTURER", label: "Giảng viên (Lecturer)" },
  { value: "FACILITY", label: "Nhân viên CSVC (Facility)" },
  { value: "STUDENT",  label: "Sinh viên (Student)" },
];

const ROLE_BADGE = {
  ADMIN:    "bg-purple-100 text-purple-800",
  STAFF:    "bg-blue-100   text-blue-800",
  LECTURER: "bg-indigo-100 text-indigo-800",
  FACILITY: "bg-orange-100 text-orange-800",
  STUDENT:  "bg-emerald-100 text-emerald-800",
};

const STATUS_BADGE = {
  ACTIVE:   "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100  text-gray-600",
  LOCKED:   "bg-red-100   text-red-800",
};

const STATUS_LABEL = { ACTIVE: "Hoạt động", INACTIVE: "Chưa kích hoạt", LOCKED: "Đã khóa" };

/* ─── Component ───────────────────────────────────────────────────────────── */
const UserManagementPage = () => {
  const [users, setUsers]           = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  /* dialogs */
  const [isAddOpen,  setIsAddOpen]  = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", endpoint: "" });

  /* new-user form */
  const [newUser, setNewUser] = useState({ username: "", fullName: "", email: "", role: "STAFF", status: "ACTIVE" });
  const [formError, setFormError] = useState("");

  /* ── helpers ── */
  const triggerApiAlert = (title, endpoint) => {
    setAlertContent({ title, endpoint });
    setIsAlertOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchQ = u.username.toLowerCase().includes(q) ||
                   u.fullName.toLowerCase().includes(q)  ||
                   u.email.toLowerCase().includes(q);
    const matchR = roleFilter === "all" || u.role === roleFilter;
    return matchQ && matchR;
  });

  /* ── Add account (mock only) ── */
  const handleAdd = () => {
    if (!newUser.username.trim()) { setFormError("Tên đăng nhập là bắt buộc."); return; }
    if (!newUser.email.trim())    { setFormError("Email là bắt buộc."); return; }
    setIsAddOpen(false);
    triggerApiAlert("Tạo tài khoản mới", "POST /api/admin/users");
    setNewUser({ username: "", fullName: "", email: "", role: "STAFF", status: "ACTIVE" });
    setFormError("");
  };

  /* ── Edit (mock only) ── */
  const openEdit = (user) => { setEditingUser({ ...user }); setIsEditOpen(true); };
  const handleEdit = () => {
    setIsEditOpen(false);
    triggerApiAlert("Cập nhật tài khoản", `PUT /api/admin/users/${editingUser?.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo tài khoản, gán vai trò, khóa/mở khóa và đặt lại mật khẩu
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(v) => { setIsAddOpen(v); setFormError(""); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" /> Thêm tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
              <DialogDescription>Tạo thông tin đăng nhập và gán vai trò cho người dùng.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              {formError && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded border border-red-200">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-username">Tên đăng nhập</Label>
                  <Input id="add-username" placeholder="vd: staff02" value={newUser.username}
                    onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-fullname">Họ và tên</Label>
                  <Input id="add-fullname" placeholder="Nguyễn Thị A" value={newUser.fullName}
                    onChange={e => setNewUser(p => ({ ...p, fullName: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" type="email" placeholder="user@ucas.edu.vn" value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vai trò</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select value={newUser.status} onValueChange={v => setNewUser(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Chưa kích hoạt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newUser.role === "FACILITY" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    Sau khi tạo tài khoản, cấu hình tòa nhà phụ trách tại trang{" "}
                    <strong>Nhân viên CSVC</strong> (Cơ sở vật chất).
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
                Tạo tài khoản
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Demo Mode Banner ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-sm text-blue-800 leading-relaxed">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Chế độ giả lập (Demo Mode):</span>{" "}
          Backend chưa cung cấp <code className="font-mono text-xs bg-blue-100 px-1 rounded">/api/admin/users</code>.
          Tất cả thao tác (tạo, sửa, khóa, đặt lại mật khẩu) chưa được lưu vào cơ sở dữ liệu.
        </div>
      </div>

      {/* ── Filters + Search ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo tên đăng nhập, họ tên, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Lọc vai trò" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/60">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700">Tên đăng nhập</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Họ và tên</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Email</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Vai trò</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map(u => (
                <TableRow key={u.id} className="hover:bg-gray-50/40">
                  <TableCell className="text-xs font-semibold text-gray-900 font-mono">{u.username}</TableCell>
                  <TableCell className="text-xs text-gray-700">{u.fullName}</TableCell>
                  <TableCell className="text-xs text-gray-500">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={`${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-700"} border-0 text-[11px]`}>
                      {ROLE_OPTIONS.find(r => r.value === u.role)?.label ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-600"} border-0 text-[11px]`}>
                      {STATUS_LABEL[u.status] ?? u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="xs"
                        className="h-7 text-xs text-gray-500 hover:text-blue-600"
                        title="Chỉnh sửa tài khoản"
                        onClick={() => openEdit(u)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="xs"
                        className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Đặt lại mật khẩu"
                        onClick={() => triggerApiAlert(`Đặt lại mật khẩu cho ${u.username}`, `POST /api/admin/users/${u.id}/reset-password`)}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="xs"
                        className={`h-7 text-xs ${u.status === "LOCKED" ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-red-500 hover:text-red-700 hover:bg-red-50"}`}
                        title={u.status === "LOCKED" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        onClick={() => triggerApiAlert(
                          u.status === "LOCKED" ? `Mở khóa tài khoản ${u.username}` : `Khóa tài khoản ${u.username}`,
                          `PATCH /api/admin/users/${u.id}/status`
                        )}
                      >
                        {u.status === "LOCKED"
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <Ban className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-sm text-gray-400 italic">
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

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tài khoản <strong>{editingUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input value={editingUser.fullName}
                  onChange={e => setEditingUser(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={editingUser.email}
                  onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vai trò</Label>
                  <Select value={editingUser.role} onValueChange={v => setEditingUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select value={editingUser.status} onValueChange={v => setEditingUser(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Chưa kích hoạt</SelectItem>
                      <SelectItem value="LOCKED">Đã khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editingUser.role === "FACILITY" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    Cấu hình tòa nhà phụ trách tại trang <strong>Nhân viên CSVC</strong>.
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── API Missing Alert ── */}
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Chức năng đang phát triển
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              Hành động <strong className="text-gray-900">"{alertContent.title}"</strong> chưa được lưu vì backend thiếu API:
              <div className="mt-3 p-3 bg-gray-50 font-mono text-xs rounded border border-gray-200 text-gray-700 break-all select-all">
                {alertContent.endpoint}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Cần bổ sung REST controller tương ứng ở phía backend Spring Boot.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsAlertOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { UserManagementPage };
export default UserManagementPage;
