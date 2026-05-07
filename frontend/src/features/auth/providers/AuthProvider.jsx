import { jsx } from "react/jsx-runtime";
import { createContext, useMemo, useState } from "react";
import { authService } from "../services/authService";
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getPersistedUser());
  const login = async (username, password) => {
    const { user: loggedInUser } = await authService.login({ username, password });
    setUser(loggedInUser);
    return loggedInUser;
  };
  const logout = () => {
    setUser(null);
    authService.clearAuth();
  };
  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user)
    }),
    [user]
  );
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: contextValue, children });
};
export {
  AuthContext,
  AuthProvider
};
