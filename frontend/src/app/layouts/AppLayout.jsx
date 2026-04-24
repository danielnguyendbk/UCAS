import { useEffect, useState, useMemo } from "react";
import { Bell, ChevronDown, ChevronRight, Menu, School, LogOut, User, Key, Settings as SettingsIcon, CheckCircle, AlertTriangle } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { NAVIGATION_BY_ROLE, ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/constants/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";

const defaultRootPaths = new Set([
  APP_ROUTES.home,
  APP_ROUTES.staffDashboard,
  APP_ROUTES.lecturerDashboard,
  APP_ROUTES.employeeDashboard,
  APP_ROUTES.studentDashboard
]);

const AppLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Sửa chữa hoàn tất", message: "Yêu cầu REQ001 tại phòng A-201 đã được xử lý xong.", time: "5 phút trước", type: "success", unread: true },
    { id: 2, title: "Yêu cầu mới", message: "Có yêu cầu sửa chữa mới tại phòng B-105.", time: "1 giờ trước", type: "info", unread: false },
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(APP_ROUTES.login);
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const menuItems = NAVIGATION_BY_ROLE[user.role] || [];
  
  const isItemActive = (path) => {
    if (defaultRootPaths.has(path)) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logout();
    navigate(APP_ROUTES.login);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <button
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out lg:transform-none shadow-xl lg:shadow-none
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-base tracking-tight">UCAS</span>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider leading-none mt-0.5">Management</p>
            </div>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
          <Badge className={`${ROLE_BADGE_CLASSES[user.role]} shadow-none border-0 px-3 py-1 text-[11px] font-bold`}>
            {ROLE_LABELS[user.role]}
          </Badge>
          <p className="text-xs text-gray-500 mt-2 font-medium truncate opacity-70">
            {user.department}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <ul className="space-y-1">
            {menuItems.map((item, idx) => {
              if (item.type === "divider") {
                return (
                  <li key={`divider-${idx}`} className="pt-5 pb-2 px-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">{item.label}</p>
                  </li>
                );
              }
              const Icon = item.icon;
              const active = isItemActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                      ${active 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold" 
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"}
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-blue-600"}`} />
                    <span className="text-sm flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badge === 'Gấp' ? 'bg-red-500' : 'bg-orange-500'} text-white`}>
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Profile Mini */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold border border-blue-200">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 font-medium">{user.code}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-gray-900">
                Hệ thống Quản lý CSVC
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <p className="text-[11px] text-gray-500 font-medium">Học kỳ 2 — 2024-2025</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" aria-label="Notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-sm text-gray-900">Thông báo</h3>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline" onClick={() => setNotifications(n => n.map(x => ({...x, unread: false})))}>Đánh dấu đã đọc</button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {notif.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold text-gray-900 ${notif.unread ? 'pr-2 relative' : ''}`}>
                          {notif.title}
                          {notif.unread && <span className="absolute right-0 top-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                        </p>
                        <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{notif.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">Không có thông báo mới</p>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 text-center">
                  <button className="text-xs font-semibold text-gray-500 hover:text-blue-600 py-1 w-full">Xem tất cả thông báo</button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-blue-100">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-gray-900 leading-none">{user.name}</div>
                  <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-tight">{ROLE_LABELS[user.role]}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 shadow-2xl">
                <div className="px-3 py-3 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-gray-900">{user.name}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuItem className="rounded-lg gap-2 py-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Hồ sơ cá nhân</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2 py-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Đổi mật khẩu</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg gap-2 py-2">
                  <SettingsIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg gap-2 py-2 text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-semibold">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-auto bg-gray-50/30 custom-scrollbar relative">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export { AppLayout };
