import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent } from "@/components/common/Card";
const StaffStatCards = ({ stats }) => {
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map((item) => {
    const Icon = item.icon;
    return /* @__PURE__ */ jsx(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200", children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-medium", children: item.title }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 mt-1", children: item.value }),
        /* @__PURE__ */ jsx("p", { className: `text-[11px] mt-1 font-medium ${item.text}`, children: item.sub })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `${item.color} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`, children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5 text-white" }) })
    ] }) }) }, item.title);
  }) });
};
export {
  StaffStatCards
};
