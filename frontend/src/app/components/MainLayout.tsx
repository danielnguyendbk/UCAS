import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  School,
  BookOpen,
  Users,
  Calendar,
  Wand2,
  FileText,
  Settings,
  UserCog,
  Bell,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const menuItems = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/" },
  { icon: School, label: "Phòng học", path: "/classrooms" },
  { icon: BookOpen, label: "Học phần", path: "/courses" },
  { icon: Users, label: "Giảng viên", path: "/lecturers" },
  { icon: Calendar, label: "Thời khóa biểu", path: "/timetable" },
  { icon: CalendarDays, label: "Lịch tuần", path: "/weekly-schedule" },
  { icon: Wand2, label: "Xếp phòng tự động", path: "/auto-assignment" },
  { icon: FileText, label: "Báo cáo", path: "/reports" },
  { icon: UserCog, label: "Quản lý người dùng", path: "/user-management", adminOnly: true },
  { icon: Settings, label: "Cài đặt", path: "/settings" },
];

export const MainLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = user?.role === "Admin" ? "Quản trị viên" : "Nhân viên";

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">CSMS</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (item.adminOnly && user?.role !== "Admin") return null;
              
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Đăng nhập với vai trò <span className="font-medium">{roleLabel}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Hệ thống quản lý xếp lịch phòng học
          </h2>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name.charAt(0)}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{roleLabel}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Hồ sơ của tôi</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
