import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
const StaffQuickActions = ({ actions }) => {
  return /* @__PURE__ */ jsxs(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200 lg:col-span-1", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold text-gray-700", children: "Thao t\xE1c nhanh" }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "px-4 pb-4", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: actions.map((action) => {
      const Icon = action.icon;
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: action.path,
          className: `flex flex-col items-center gap-2 p-3 rounded-xl transition-all text-center ${action.bg}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { className: `w-5 h-5 ${action.color}` }),
            /* @__PURE__ */ jsx("span", { className: `text-[11px] font-medium leading-tight ${action.color}`, children: action.label })
          ]
        },
        action.label
      );
    }) }) })
  ] });
};
export {
  StaffQuickActions
};
