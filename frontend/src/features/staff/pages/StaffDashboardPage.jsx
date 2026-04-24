import { jsx, jsxs } from "react/jsx-runtime";
import { RefreshCw } from "lucide-react";
import { StaffProgressOverview } from "../components/StaffProgressOverview";
import { StaffQuickActions } from "../components/StaffQuickActions";
import { StaffRecentSectionsTable } from "../components/StaffRecentSectionsTable";
import { StaffStatCards } from "../components/StaffStatCards";
import { useStaffDashboard } from "../hooks/useStaffDashboard";
const StaffDashboardPage = () => {
  const { stats, quickActions, recentSections } = useStaffDashboard();
  return /* @__PURE__ */ jsxs("div", { className: "p-5 md:p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900", children: "T\u1ED5ng quan \u2014 Ph\xF2ng \u0110\xE0o t\u1EA1o" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "H\u1ECDc k\u1EF3 1, N\u0103m h\u1ECDc 2024-2025 \xB7 C\u1EADp nh\u1EADt l\xFAc 08:30, 11/04/2025" })
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" }),
        "L\xE0m m\u1EDBi"
      ] })
    ] }),
    /* @__PURE__ */ jsx(StaffStatCards, { stats }),
    /* @__PURE__ */ jsx(StaffProgressOverview, {}),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsx(StaffQuickActions, { actions: quickActions }),
      /* @__PURE__ */ jsx(StaffRecentSectionsTable, { sections: recentSections })
    ] })
  ] });
};
var stdin_default = StaffDashboardPage;
export {
  stdin_default as default
};
