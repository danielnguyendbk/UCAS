import { jsx } from "react/jsx-runtime";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
const AppProviders = ({ children }) => {
  return /* @__PURE__ */ jsx(AuthProvider, { children });
};
export {
  AppProviders
};
