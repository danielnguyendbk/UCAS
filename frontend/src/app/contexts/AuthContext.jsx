import { jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("csms_user");
    return stored ? JSON.parse(stored) : null;
  });
  const login = async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    let role = "Admin";
    let name = "";
    let department = "";
    let code = "";
    if (email.includes("lecturer") || email.includes("gv")) {
      role = "Lecturer";
      name = "TS. L\xEA V\u0103n Minh";
      department = "Khoa C\xF4ng ngh\u1EC7 Th\xF4ng tin";
      code = "GV001";
    } else if (email.includes("employee") || email.includes("nv")) {
      role = "Employee";
      name = "Ph\u1EA1m Th\u1ECB Lan";
      department = "Ph\xF2ng Qu\u1EA3n tr\u1ECB - Thi\u1EBFt b\u1ECB";
      code = "NV025";
    } else if (email.includes("student") || email.includes("sv")) {
      role = "Student";
      name = "Nguy\u1EC5n V\u0103n H\xF9ng";
      department = "Khoa C\xF4ng ngh\u1EC7 Th\xF4ng tin";
      code = "B21DCCN123";
    } else if (email.includes("staff")) {
      role = "Staff";
      name = "Tr\u1EA7n Th\u1ECB Thanh Hoa";
      department = "Ph\xF2ng \u0110\xE0o t\u1EA1o";
      code = "PGV012";
    } else {
      role = "Admin";
      name = "Nguy\u1EC5n V\u0103n Qu\u1EA3n Tr\u1ECB";
      department = "Ph\xF2ng Qu\u1EA3n tr\u1ECB H\u1EC7 th\u1ED1ng";
      code = "ADM001";
    }
    const userData = { id: "1", name, email, role, department, code };
    setUser(userData);
    localStorage.setItem("csms_user", JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("csms_user");
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: { user, login, logout, isAuthenticated: !!user }, children });
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
export {
  AuthProvider,
  useAuth
};
