import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
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
  ClipboardList,
  Building2,
  Search,
  BookMarked,
  PlusSquare,
  ClipboardCheck,
  GraduationCap,
  Eye,
  CalendarCheck,
  Menu,
  ChevronRight,
  Wrench,
  History,
  ArrowLeftRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
const adminMenuItems = [
  { icon: LayoutDashboard, label: "T\u1ED5ng quan", path: "/" },
  { icon: School, label: "Ph\xF2ng h\u1ECDc", path: "/classrooms" },
  { icon: BookOpen, label: "M\xF4n h\u1ECDc", path: "/courses" },
  { icon: Users, label: "Gi\u1EA3ng vi\xEAn", path: "/lecturers" },
  { icon: Calendar, label: "Th\u1EDDi kh\xF3a bi\u1EC3u", path: "/timetable" },
  { icon: CalendarDays, label: "L\u1ECBch tu\u1EA7n", path: "/weekly-schedule" },
  { icon: Wand2, label: "Ph\xE2n c\xF4ng t\u1EF1 \u0111\u1ED9ng", path: "/auto-assignment" },
  { icon: FileText, label: "B\xE1o c\xE1o", path: "/reports" },
  { icon: UserCog, label: "Qu\u1EA3n l\xFD ng\u01B0\u1EDDi d\xF9ng", path: "/user-management" },
  { icon: Settings, label: "C\xE0i \u0111\u1EB7t", path: "/settings" }
];
const staffMenuItems = [
  { icon: LayoutDashboard, label: "T\u1ED5ng quan", path: "/staff" },
  { icon: ClipboardList, label: "L\u1EDBp h\u1ECDc ph\u1EA7n", path: "/staff/sections" },
  { icon: Calendar, label: "Th\u1EDDi kh\xF3a bi\u1EC3u", path: "/staff/schedule" },
  { icon: Building2, label: "Ph\xE2n ph\xF2ng & Xung \u0111\u1ED9t", path: "/staff/allocation" },
  { icon: Search, label: "Tra c\u1EE9u l\u1ECBch", path: "/staff/lookup" },
  { icon: ClipboardCheck, label: "Danh s\xE1ch \u0111\u1EB7t ph\xF2ng", path: "/staff/booking-list" },
  { icon: PlusSquare, label: "\u0110\u1EB7t ph\xF2ng kh\u1EA9n c\u1EA5p", path: "/staff/bookings", badge: "M\u1EDBi" } 
];
const lecturerMenuItems = [
  { icon: CalendarCheck, label: "L\u1ECBch d\u1EA1y c\u1EE7a t\xF4i", path: "/lecturer/schedule" },
  { type: "divider", label: "\u0110\u1EB7t ph\xF2ng" },
  { icon: PlusSquare, label: "Y\xEAu c\u1EA7u \u0111\u1EB7t ph\xF2ng", path: "/lecturer/room-booking" },
  { icon: ClipboardList, label: "DS y\xEAu c\u1EA7u \u0111\u1EB7t ph\xF2ng", path: "/lecturer/room-booking/history" },
  { type: "divider", label: "S\u1EEDa ch\u1EEFa" },
  { icon: Wrench, label: "Y\xEAu c\u1EA7u s\u1EEDa ch\u1EEFa", path: "/lecturer/maintenance-request" },
  { icon: History, label: "L\u1ECBch s\u1EED s\u1EEDa ch\u1EEFa", path: "/lecturer/maintenance-history" },
  { type: "divider", label: "\u0110\u1ED5i ph\xF2ng" },
  { icon: ArrowLeftRight, label: "Xin \u0111\u1ED5i ph\xF2ng", path: "/lecturer/room-change-request" },
  { icon: ClipboardCheck, label: "Tr\u1EA1ng th\xE1i \u0111\u1ED5i ph\xF2ng", path: "/lecturer/room-change-list" }
];
const employeeMenuItems = [
  { icon: Eye, label: "L\u1ECBch s\u1EED d\u1EE5ng ph\xF2ng", path: "/employee" }
];
const studentMenuItems = [
  { icon: GraduationCap, label: "Tra c\u1EE9u th\u1EDDi kh\xF3a bi\u1EC3u", path: "/student" }
];
const menuByRole = {
  Admin: adminMenuItems,
  Staff: staffMenuItems,
  Lecturer: lecturerMenuItems,
  Employee: employeeMenuItems,
  Student: studentMenuItems
};
const roleBadgeColor = {
  Admin: "bg-red-100 text-red-700",
  Staff: "bg-blue-100 text-blue-700",
  Lecturer: "bg-purple-100 text-purple-700",
  Employee: "bg-orange-100 text-orange-700",
  Student: "bg-green-100 text-green-700"
};
const roleLabel = {
  Admin: "Qu\u1EA3n tr\u1ECB vi\xEAn",
  Staff: "Gi\xE1o v\u1EE5",
  Lecturer: "Gi\u1EA3ng vi\xEAn",
  Employee: "Nh\xE2n vi\xEAn",
  Student: "Sinh vi\xEAn"
};
const MainLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const menuItems = user ? menuByRole[user.role] : [];
  const SidebarContent = () => /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm", children: /* @__PURE__ */ jsx(School, { className: "w-5 h-5 text-white" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-900 text-sm", children: "CSMS" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400 leading-none mt-0.5", children: "Scheduling System" })
      ] })
    ] }) }),
    user && /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-gray-100", children: [
      /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadgeColor[user.role]}`, children: roleLabel[user.role] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1.5 truncate", children: user.department })
    ] }),
    /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto py-3 px-3", children: /* @__PURE__ */ jsx("ul", { className: "space-y-0.5", children: menuItems.map((item, idx) => {
      if (item.type === "divider") {
        return /* @__PURE__ */ jsx("li", { className: "pt-3 pb-1 px-3", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-gray-400 uppercase tracking-wider", children: item.label }) }, `divider-${idx}`);
      }
      const isActive = location.pathname === item.path || item.path !== "/" && item.path !== "/staff" && item.path !== "/lecturer" && item.path !== "/lecturer/schedule" && item.path !== "/employee" && item.path !== "/student" && location.pathname.startsWith(item.path);
      const Icon = item.icon;
      return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        Link,
        {
          to: item.path,
          onClick: () => setSidebarOpen(false),
          className: `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`,
          children: [
            isActive && /* @__PURE__ */ jsx("span", { className: "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" }),
            /* @__PURE__ */ jsx(Icon, { className: `w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}` }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium flex-1", children: item.label }),
            item.badge && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white", children: item.badge }),
            isActive && /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 text-blue-300" })
          ]
        }
      ) }, item.path);
    }) }) }),
    user && /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-gray-100 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-white", children: user.name.charAt(0) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-gray-800 truncate", children: user.name }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-400", children: user.code })
      ] })
    ] }) })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "h-screen flex bg-gray-50", children: [
    sidebarOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/40 z-30 lg:hidden",
        onClick: () => setSidebarOpen(false)
      }
    ),
    /* @__PURE__ */ jsx("aside", { className: `
        fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out lg:transform-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `, children: /* @__PURE__ */ jsx(SidebarContent, {}) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden min-w-0", children: [
      /* @__PURE__ */ jsxs("header", { className: "h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSidebarOpen(true),
              className: "lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg",
              children: /* @__PURE__ */ jsx(Menu, { className: "w-5 h-5" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-gray-900 leading-none", children: "H\u1EC7 th\u1ED1ng Qu\u1EA3n l\xFD Ph\xF2ng h\u1ECDc & Th\u1EDDi kh\xF3a bi\u1EC3u" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-0.5 hidden sm:block", children: "H\u1ECDc k\u1EF3 1 \u2014 N\u0103m h\u1ECDc 2024-2025" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("button", { className: "relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg", children: [
            /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { className: "absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" })
          ] }),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsxs(DropdownMenuTrigger, { className: "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors", children: [
              /* @__PURE__ */ jsx("div", { className: "w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-white", children: user?.name.charAt(0) }) }),
              /* @__PURE__ */ jsxs("div", { className: "text-left hidden sm:block", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-gray-900 leading-none", children: user?.name }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 mt-0.5", children: user ? roleLabel[user.role] : "" })
              ] }),
              /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5 text-gray-400" })
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 border-b border-gray-100", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-gray-900", children: user?.name }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-gray-500", children: user?.email })
              ] }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { children: "H\u1ED3 s\u01A1 c\xE1 nh\xE2n" }),
              /* @__PURE__ */ jsx(DropdownMenuItem, { children: "\u0110\u1ED5i m\u1EADt kh\u1EA9u" }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: handleLogout, className: "text-red-600", children: "\u0110\u0103ng xu\u1EA5t" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] });
};
export {
  MainLayout
};
