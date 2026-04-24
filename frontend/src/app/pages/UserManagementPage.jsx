import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { UserPlus, Edit2, Ban, Search, Building2 } from "lucide-react";

const initialUsers = [
  {
    id: 1,
    name: "John Admin",
    email: "admin@university.edu",
    role: "Admin",
    status: "Active"
  },
  {
    id: 2,
    name: "Sarah Staff",
    email: "sarah@university.edu",
    role: "Staff",
    status: "Active"
  },
  {
    id: 3,
    name: "Michael Johnson",
    email: "michael@university.edu",
    role: "Employee",
    status: "Active",
    buildings: ["Tòa A"]
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily@university.edu",
    role: "Employee",
    status: "Active",
    buildings: []
  }
];

const availableBuildings = ["Tòa A", "Tòa B", "Tòa C", "Tòa D", "Tòa E"];

const UserManagementPage = () => {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Staff"
  });

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tempBuildings, setTempBuildings] = useState([]);

  const filteredUsers = users.filter(
    (user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.role) {
      return;
    }
    const user = {
      id: users.length + 1,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      status: "Active",
      buildings: newUser.role === "Employee" ? [] : undefined
    };
    setUsers([user, ...users]);
    setIsAddDialogOpen(false);
    setNewUser({ name: "", email: "", role: "Staff" });
  };

  const openAssignDialog = (user) => {
    setSelectedEmployee(user);
    setTempBuildings(user.buildings || []);
    setIsAssignDialogOpen(true);
  };

  const toggleBuilding = (b) => {
    setTempBuildings(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const saveAssignments = () => {
    if (!selectedEmployee) return;
    const updated = users.map(u => u.id === selectedEmployee.id ? { ...u, buildings: tempBuildings } : u);
    setUsers(updated);
    setIsAssignDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600 mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Thêm người dùng mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người dùng mới</DialogTitle>
              <DialogDescription>Tạo tài khoản mới cho hệ thống</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  placeholder="Nhập họ tên"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Địa chỉ Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@university.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Staff">Giáo vụ (Staff)</SelectItem>
                    <SelectItem value="Lecturer">Giảng viên (Lecturer)</SelectItem>
                    <SelectItem value="Employee">Nhân viên (Employee)</SelectItem>
                    <SelectItem value="Student">Sinh viên (Student)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700">Thêm người dùng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm người dùng theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Phân công</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.role === "Admin" ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
                        user.role === "Staff" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                        user.role === "Lecturer" ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100" :
                        user.role === "Employee" ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                        "bg-green-100 text-green-700 hover:bg-green-100"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={user.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === "Employee" ? (
                      <div className="text-xs text-gray-600">
                        {user.buildings && user.buildings.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.buildings.map(b => (
                              <span key={b} className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{b}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-gray-400">Chưa phân công</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.role === "Employee" && (
                        <Button variant="ghost" size="sm" onClick={() => openAssignDialog(user)} className="text-blue-600 hover:text-blue-700" title="Phân công tòa nhà">
                          <Building2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700"><Ban className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredUsers.length} trên {users.length} người dùng
          </div>
        </div>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Phân công khu vực làm việc</DialogTitle>
            <DialogDescription>Chọn các tòa nhà để giao cho nhân viên: <strong>{selectedEmployee?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Label className="font-semibold text-gray-700">Các tòa nhà khả dụng</Label>
            <div className="flex flex-wrap gap-2">
              {availableBuildings.map(b => {
                const isSelected = tempBuildings.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBuilding(b)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' 
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {b}
                  </button>
                )
              })}
            </div>
            {tempBuildings.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Vui lòng chọn ít nhất 1 tòa nhà.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Hủy</Button>
            <Button onClick={saveAssignments} className="bg-blue-600 hover:bg-blue-700">Lưu phân công</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { UserManagementPage };
