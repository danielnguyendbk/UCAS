import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { Toaster } from "@/app/components/ui/sonner";
const AppProviders = ({ children }) => {
  return /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs(Fragment, { children: [children, /* @__PURE__ */ jsx(Toaster, {})] }) });
};
export {
  AppProviders
};
