import { jsx } from "react/jsx-runtime";
import { RouterProvider } from "react-router";
import { AppProviders } from "./providers/AppProviders";
import { appRouter } from "./routes/index";
function App() {
  return /* @__PURE__ */ jsx(AppProviders, { children: /* @__PURE__ */ jsx(RouterProvider, { router: appRouter }) });
}
export {
  App as default
};
