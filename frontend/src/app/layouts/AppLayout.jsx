import { useEffect, useState, useMemo } from "react";
import { Bell, ChevronDown, ChevronRight, Menu, School, LogOut, User, Key, Settings as SettingsIcon, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { NAVIGATION_BY_ROLE, ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/constants/navigation";
import { APP_ROUTES, ROLE_DEFAULT_PATHS } from "@/constants/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { httpClient } from "@/services/httpClient";

const getActiveSemesterName = (semesters) => {
  const activeSemester = semesters.find(
    (semester) => String(semester.status || "").toUpperCase() === "ACTIVE",
  );
  return (activeSemester || semesters[0])?.name || "";
};

const getResponseList = (response) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalize = (value) => String(value || "").trim().toUpperCase();

const toTimestamp = (value) => {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getTime();
};

const formatRelativeTime = (value) => {
  const timestamp = toTimestamp(value);
  if (!timestamp) return "Vừa cập nhật";

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return "Vừa xong";
  if (diffMs < 3_600_000) return `${Math.max(1, Math.floor(diffMs / 60_000))} phút trước`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} giờ trước`;
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

const STATUS_LABELS = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã hoàn thành",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

const getStatusLabel = (status) => STATUS_LABELS[normalize(status)] || status || "Mới cập nhật";

const getNotificationTone = (status) => {
  const normalized = normalize(status);
  if (["APPROVED", "RESOLVED", "COMPLETED"].includes(normalized)) return "success";
  if (["REJECTED", "CANCELLED"].includes(normalized)) return "danger";
  if (normalized === "IN_PROGRESS") return "info";
  return "warning";
};

const notificationToneClasses = {
  success: "bg-green-100 text-green-600",
  danger: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-600",
  warning: "bg-amber-100 text-amber-600",
};

const NOTIFICATION_SOURCES_BY_ROLE = {
  Staff: [
    {
      id: "staff-borrow",
      title: "Yêu cầu đặt phòng",
      endpoint: "/api/staff/room-borrow-requests",
      path: APP_ROUTES.staffBookingList,
      kind: "borrow",
    },
    {
      id: "staff-change",
      title: "Yêu cầu đổi phòng",
      endpoint: "/api/staff/emergency-room-changes",
      path: APP_ROUTES.staffRoomChangeList,
      kind: "change",
    },
    {
      id: "staff-maintenance",
      title: "Yêu cầu sửa chữa",
      endpoint: "/api/staff/maintenance-requests",
      path: APP_ROUTES.staffMaintenanceList,
      kind: "maintenance",
    },
  ],
  Lecturer: [
    {
      id: "lecturer-borrow",
      title: "Đặt phòng của tôi",
      endpoint: "/api/lecturer/room-borrow-requests",
      path: APP_ROUTES.lecturerBookingHistory,
      kind: "borrow",
    },
    {
      id: "lecturer-change",
      title: "Đổi phòng của tôi",
      endpoint: "/api/lecturer/room-change-requests",
      path: APP_ROUTES.lecturerRoomChangeList,
      kind: "change",
    },
    {
      id: "lecturer-maintenance",
      title: "Sửa chữa của tôi",
      endpoint: "/api/lecturer/maintenance-requests",
      path: APP_ROUTES.lecturerMaintenanceHistory,
      kind: "maintenance",
    },
  ],
  Student: [
    {
      id: "student-borrow",
      title: "Đặt phòng của tôi",
      endpoint: "/api/student/room-borrow-requests",
      path: APP_ROUTES.studentBookingHistory,
      kind: "borrow",
    },
    {
      id: "student-maintenance",
      title: "Sửa chữa của tôi",
      endpoint: "/api/student/maintenance-requests",
      path: APP_ROUTES.studentMaintenanceHistory,
      kind: "maintenance",
    },
  ],
  Employee: [
    {
      id: "employee-maintenance",
      title: "Yêu cầu sửa chữa",
      endpoint: "/api/facility/maintenance-requests",
      path: APP_ROUTES.employeeMaintenanceHistory,
      kind: "maintenance",
    },
  ],
};

const getNotificationRoleKey = (user) => {
  const backendRole = normalize(user?.backendRole);
  if (backendRole === "STAFF") return "Staff";
  if (backendRole === "LECTURER") return "Lecturer";
  if (backendRole === "STUDENT") return "Student";
  if (["FACILITY", "EMPLOYEES"].includes(backendRole)) return "Employee";
  return user?.role;
};

const getNotificationTimestampValue = (item) =>
  item.createdAt ||
  item.updatedAt ||
  item.approvedAt ||
  item.handledAt ||
  item.bookingDate ||
  item.requestedDate;

const joinNonEmpty = (...values) =>
  values.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").join(" - ");

const buildBorrowNotification = (item, source, readNotificationIds) => {
  const id = `${source.id}-${item.id}`;
  const timestampValue = getNotificationTimestampValue(item);
  const roomCode = item.approvedRoomCode || item.preferredRoomCode || item.requestedRoomCode;
  const message = joinNonEmpty(
    item.requesterName || item.requesterUsername,
    item.requestTitle || item.purposeNote || item.clubName || item.sectionCode || item.courseName || "Yêu cầu đặt phòng",
    roomCode ? `Phòng ${roomCode}` : "",
    getStatusLabel(item.status),
  );

  return {
    id,
    title: source.title,
    message,
    time: formatRelativeTime(timestampValue),
    timestamp: toTimestamp(timestampValue) || Number(item.id) || 0,
    type: getNotificationTone(item.status),
    unread: !readNotificationIds.has(id),
    path: source.path,
  };
};

const buildChangeNotification = (item, source, readNotificationIds) => {
  const id = `${source.id}-${item.id}`;
  const timestampValue = getNotificationTimestampValue(item);
  const roomText = item.newRoomCode || item.requestedRoomCode || item.preferredRoomCode || item.oldRoomCode;
  const message = joinNonEmpty(
    item.requesterName || item.lecturerName,
    item.classCode || item.sectionCode || item.courseName || "Yêu cầu đổi phòng",
    roomText ? `Phòng ${roomText}` : "",
    getStatusLabel(item.status),
  );

  return {
    id,
    title: source.title,
    message,
    time: formatRelativeTime(timestampValue),
    timestamp: toTimestamp(timestampValue) || Number(item.id) || 0,
    type: getNotificationTone(item.status),
    unread: !readNotificationIds.has(id),
    path: source.path,
  };
};

const buildMaintenanceNotification = (item, source, readNotificationIds) => {
  const id = `${source.id}-${item.id}`;
  const timestampValue = getNotificationTimestampValue(item);
  const message = joinNonEmpty(
    item.requestCode || `#${item.id}`,
    item.roomCode || item.roomName,
    item.issueTitle || item.description || "Yêu cầu sửa chữa",
    getStatusLabel(item.status),
  );

  return {
    id,
    title: source.title,
    message,
    time: formatRelativeTime(timestampValue),
    timestamp: toTimestamp(timestampValue) || Number(item.id) || 0,
    type: getNotificationTone(item.status),
    unread: !readNotificationIds.has(id),
    path: source.path,
  };
};

const buildNotification = (item, source, readNotificationIds) => {
  if (source.kind === "change") {
    return buildChangeNotification(item, source, readNotificationIds);
  }
  if (source.kind === "maintenance") {
    return buildMaintenanceNotification(item, source, readNotificationIds);
  }
  return buildBorrowNotification(item, source, readNotificationIds);
};

const defaultRootPaths = new Set([
  APP_ROUTES.home,
  APP_ROUTES.adminDashboard,
  APP_ROUTES.staffDashboard,
  APP_ROUTES.lecturerDashboard,
  APP_ROUTES.employeeDashboard,
  APP_ROUTES.facilityDashboard,
  APP_ROUTES.studentDashboard,
]);

const getGroupKey = (group) => group.id ?? `group-${group.label}`;

const getNavItemKey = (item, { role = "unknown", groupLabel = "" } = {}) => {
  if (item.id) return item.id;
  const slug = [role, groupLabel, item.label, item.path]
    .filter(Boolean)
    .join("-")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return slug || `nav-${role}-${groupLabel}-${item.label}`;
};

const ROLE_PATH_GUARDS = {
  ADMIN:     [/^\/$/, /^\/admin(\/|$)/],
  STAFF:     [/^\/$/, /^\/staff(\/|$)/],
  LECTURER:  [/^\/$/, /^\/lecturer(\/|$)/],
  STUDENT:   [/^\/$/, /^\/student(\/|$)/],
  FACILITY:  [/^\/$/, /^\/facility(\/|$)/],
  EMPLOYEES: [/^\/$/, /^\/facility(\/|$)/]
};

const AppLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSemesterName, setActiveSemesterName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState(() => new Set());

  const menuItems = useMemo(
    () => (user ? NAVIGATION_BY_ROLE[user.role] || [] : []),
    [user?.role],
  );

  const useGroupedSidebar = user?.role === "Admin";

  const flatMenuItems = useMemo(() => {
    const flat = [];
    menuItems.forEach((item) => {
      if (useGroupedSidebar && item.type === "group" && item.children) {
        flat.push(...item.children);
      } else if (item.path) {
        flat.push(item);
      }
    });
    return flat;
  }, [menuItems, useGroupedSidebar]);

  const activeMenuPath = useMemo(() => {
    const matches = flatMenuItems
      .filter((item) => item.path)
      .filter((item) => {
        if (defaultRootPaths.has(item.path)) {
          return location.pathname === item.path;
        }
        return (
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`)
        );
      })
      .sort((a, b) => b.path.length - a.path.length);

    return matches[0]?.path ?? null;
  }, [location.pathname, flatMenuItems]);

  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!useGroupedSidebar || !activeMenuPath) return;
    menuItems.forEach((item) => {
      if (item.type === "group" && item.children) {
        const hasActiveChild = item.children.some((child) => child.path === activeMenuPath);
        if (hasActiveChild) {
          const groupKey = getGroupKey(item);
          setExpandedGroups((prev) => {
            if (prev.has(groupKey)) return prev;
            const next = new Set(prev);
            next.add(groupKey);
            return next;
          });
        }
      }
    });
  }, [activeMenuPath, menuItems, useGroupedSidebar]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(APP_ROUTES.login);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let isMounted = true;

    const fetchActiveSemester = async () => {
      try {
        const response = await httpClient.get("/api/categories/semesters");
        const semesters = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        if (isMounted) {
          setActiveSemesterName(getActiveSemesterName(semesters));
        }
      } catch (error) {
        console.error("Không tải được học kỳ active:", error);
        if (isMounted) {
          setActiveSemesterName("Chưa xác định học kỳ active");
        }
      }
    };

    void fetchActiveSemester();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      return undefined;
    }

    const roleKey = getNotificationRoleKey(user);
    const sources = NOTIFICATION_SOURCES_BY_ROLE[roleKey] || [];
    if (sources.length === 0) {
      setNotifications([]);
      return undefined;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError("");

      const results = await Promise.allSettled(
        sources.map(async (source) => {
          const response = await httpClient.get(source.endpoint);
          return getResponseList(response)
            .map((item) => buildNotification(item, source, readNotificationIds))
            .filter((item) => item.id);
        }),
      );

      if (!isMounted) return;

      const nextNotifications = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 8);

      setNotifications(nextNotifications);
      if (results.some((result) => result.status === "rejected")) {
        setNotificationsError("Một vài thông báo chưa tải được.");
      }
      setNotificationsLoading(false);
    };

    void fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.role, user?.backendRole, readNotificationIds]);

  useEffect(() => {
    if (!isAuthenticated || !user?.backendRole) return;

    const allowedMatchers = ROLE_PATH_GUARDS[user.backendRole] ?? [];
    const isAllowed = allowedMatchers.some((matcher) => matcher.test(location.pathname));
    if (!isAllowed) {
      const roleHome =
        ROLE_DEFAULT_PATHS[user.backendRole] ?? APP_ROUTES.home;
      navigate(roleHome, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const isItemActive = (path) => activeMenuPath === path;

  const handleLogout = () => {
    logout();
    navigate(APP_ROUTES.login);
  };

  const handleMarkNotificationsRead = () => {
    setReadNotificationIds((previous) => {
      const next = new Set(previous);
      notifications.forEach((notification) => next.add(notification.id));
      return next;
    });
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, unread: false })),
    );
  };

  const handleOpenNotification = (notification) => {
    setReadNotificationIds((previous) => {
      const next = new Set(previous);
      next.add(notification.id);
      return next;
    });
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    );
    if (notification.path) {
      navigate(notification.path);
    }
  };

  const handleOpenNotificationList = () => {
    const roleKey = getNotificationRoleKey(user);
    const firstPath = NOTIFICATION_SOURCES_BY_ROLE[roleKey]?.[0]?.path;
    if (firstPath) {
      navigate(firstPath);
    }
  };

  const unreadCount = notifications.filter((notification) => notification.unread).length;

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
                  <li
                    key={getNavItemKey(item, { role: user.role, groupLabel: `divider-${idx}` })}
                    className="pt-5 pb-2 px-4"
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">{item.label}</p>
                  </li>
                );
              }

              if (item.type === "group" && item.children && !useGroupedSidebar) {
                return item.children.map((child) => {
                  const active = isItemActive(child.path);
                  const childKey = getNavItemKey(child, {
                    role: user.role,
                    groupLabel: item.label,
                  });
                  return (
                    <li key={childKey}>
                      <Link
                        to={child.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                          ${active
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold"
                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"}
                        `}
                      >
                        <span className="text-sm flex-1">{child.label}</span>
                        {active && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                      </Link>
                    </li>
                  );
                });
              }

              if (useGroupedSidebar && item.type === "group") {
                const Icon = item.icon;
                const groupKey = getGroupKey(item);
                const isExpanded = expandedGroups.has(groupKey);
                const hasActiveChild = item.children?.some((child) => isItemActive(child.path));

                return (
                  <li key={groupKey} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupKey)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-medium
                        ${hasActiveChild
                          ? "bg-blue-50/70 text-blue-700 font-semibold shadow-sm"
                          : "text-gray-600 hover:bg-blue-50/40 hover:text-blue-700"}
                      `}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${hasActiveChild ? "text-blue-600" : "text-gray-400"}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${hasActiveChild ? "text-blue-600" : "text-gray-400"}`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${hasActiveChild ? "text-blue-600" : "text-gray-400"}`} />
                      )}
                    </button>
                    {isExpanded && item.children && (
                      <ul className="mt-1 ml-6 pl-3 border-l border-gray-200 space-y-1">
                        {item.children.map((child) => {
                          const active = isItemActive(child.path);
                          const childKey = getNavItemKey(child, {
                            role: user.role,
                            groupLabel: item.label,
                          });
                          return (
                            <li key={childKey}>
                              <Link
                                to={child.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 relative
                                  ${active
                                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                                    : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"}
                                `}
                              >
                                <span className="truncate">{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Flat sidebar item (all non-admin roles; also fallback if misconfigured)
              const Icon = item.icon;
              const active = isItemActive(item.path);
              const itemKey = getNavItemKey(item, { role: user.role });
              return (
                <li key={itemKey}>
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
                <p className="text-[11px] text-gray-500 font-medium">
                  {activeSemesterName || "Đang tải học kỳ"}
                </p>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900">Thông báo</h3>
                    {notificationsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                  </div>
                  <button
                    className="text-[10px] font-bold text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                    onClick={handleMarkNotificationsRead}
                    disabled={unreadCount === 0}
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
                {notificationsError && (
                  <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-[11px] font-medium text-amber-700">
                    {notificationsError}
                  </div>
                )}
                <div className="max-h-[350px] overflow-y-auto">
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải thông báo...
                    </div>
                  ) : notifications.length > 0 ? notifications.map((notif) => {
                    const toneClassName = notificationToneClasses[notif.type] || notificationToneClasses.info;
                    const NotificationIcon = notif.type === "success" ? CheckCircle : AlertTriangle;

                    return (
                      <button
                        type="button"
                        key={notif.id}
                        onClick={() => handleOpenNotification(notif)}
                        className={`w-full p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 text-left ${notif.unread ? "bg-blue-50/30" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toneClassName}`}>
                          <NotificationIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold text-gray-900 ${notif.unread ? "pr-2 relative" : ""}`}>
                            {notif.title}
                            {notif.unread && <span className="absolute right-0 top-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">{notif.time}</p>
                        </div>
                      </button>
                    );
                  }) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500">Không có thông báo mới</p>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 text-center">
                  <button
                    className="text-xs font-semibold text-gray-500 hover:text-blue-600 py-1 w-full"
                    onClick={handleOpenNotificationList}
                  >
                    Mở danh sách yêu cầu
                  </button>
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
