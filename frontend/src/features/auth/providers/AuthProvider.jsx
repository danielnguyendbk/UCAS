import { jsx } from "react/jsx-runtime";
import { createContext, useMemo, useState } from "react";
import { authService } from "../services/authService";
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getPersistedUser());
  const login = async (email, password) => {
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
    authService.persistUser(loggedInUser);
  };
  const logout = () => {
    setUser(null);
    authService.persistUser(null);
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
