import { APP_ROUTES } from "@/constants/routes";
import { httpClient } from "@/services/httpClient";

const USER_STORAGE_KEY = "csms_user";
const TOKEN_STORAGE_KEY = "csms_access_token";

const BACKEND_ROLE_TO_UI_ROLE = {
  ADMIN: "Admin",
  STAFF: "Staff",
  LECTURER: "Lecturer",
  STUDENT: "Student",
  FACILITY: "Employee",
  EMPLOYEES: "Employee",
  ROLE_ADMIN: "Admin",
  ROLE_STAFF: "Staff",
  ROLE_LECTURER: "Lecturer",
  ROLE_STUDENT: "Student",
  ROLE_FACILITY: "Employee",
  ROLE_EMPLOYEES: "Employee"
};

const ROLE_REDIRECTS = {
  ADMIN: APP_ROUTES.home,
  STAFF: APP_ROUTES.staffDashboard,
  LECTURER: APP_ROUTES.lecturerDashboard,
  STUDENT: APP_ROUTES.studentDashboard,
  FACILITY: APP_ROUTES.employeeDashboard,
  EMPLOYEES: APP_ROUTES.employeeDashboard
};

const REDIRECT_ALIASES = {
  "/admin": APP_ROUTES.home,
  "/staff": APP_ROUTES.staffDashboard,
  "/lecturer": APP_ROUTES.lecturerDashboard,
  "/student": APP_ROUTES.studentDashboard,
  "/facility": APP_ROUTES.employeeDashboard,
  "/employees": APP_ROUTES.employeeDashboard
};

const decodeJwtPayload = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const normalizeBackendRole = (roleValue) => {
  if (!roleValue || typeof roleValue !== "string") return null;
  const upperRole = roleValue.toUpperCase();
  const strippedRole = upperRole.startsWith("ROLE_") ? upperRole.slice(5) : upperRole;
  return strippedRole;
};

const resolveRole = ({ userRole, permissions, token }) => {
  const normalizedUserRole = normalizeBackendRole(userRole);
  if (normalizedUserRole) return normalizedUserRole;

  const permissionRole = Array.isArray(permissions)
    ? permissions.map(normalizeBackendRole).find(Boolean)
    : null;
  if (permissionRole) return permissionRole;

  const jwtPayload = token ? decodeJwtPayload(token) : null;
  const jwtRole = normalizeBackendRole(jwtPayload?.role);
  return jwtRole;
};

const toUiRole = (backendRole) => BACKEND_ROLE_TO_UI_ROLE[backendRole] ?? "Student";

const buildRedirectPath = (backendRole, redirectPath) => {
  if (redirectPath && REDIRECT_ALIASES[redirectPath]) {
    return REDIRECT_ALIASES[redirectPath];
  }
  return ROLE_REDIRECTS[backendRole] ?? APP_ROUTES.home;
};

const persistToken = (token) => {
  if (!token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

const persistUser = (user) => {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const authService = {
  async login({ username, password }) {
    const response = await httpClient.post("/api/auth/login", { username, password });
    const payload = response?.data?.data;
    const token = payload?.accessToken ?? payload?.token ?? payload?.jwt ?? null;

    if (!token) {
      throw new Error("Missing access token in login response");
    }

    const backendRole = resolveRole({
      userRole: payload?.user?.role,
      permissions: payload?.permissions,
      token
    });

    if (!backendRole) {
      throw new Error("Missing user role in login response");
    }

    const user = {
      id: payload?.user?.id ?? null,
      username: payload?.user?.username ?? username,
      email: payload?.user?.email ?? "",
      name: payload?.user?.fullName ?? payload?.user?.username ?? username,
      code: payload?.user?.username ?? username,
      department: payload?.profile?.departmentName ?? "",
      role: toUiRole(backendRole),
      backendRole,
      permissions: payload?.permissions ?? [],
      redirectPath: buildRedirectPath(backendRole, payload?.redirectPath)
    };

    persistToken(token);
    persistUser(user);

    return { user, token };
  },
  persistUser,
  getPersistedUser() {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  clearAuth() {
    persistToken(null);
    persistUser(null);
  }
};

export {
  TOKEN_STORAGE_KEY,
  authService
};
