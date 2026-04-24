import { jsx, jsxs } from "react/jsx-runtime";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/common/Card";
const StaffProgressOverview = () => {
  return /* @__PURE__ */ jsx(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-blue-600" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gray-800", children: "Ti\u1EBFn \u0111\u1ED9 ph\xE2n ph\xF2ng HK1" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "161 / 186 l\u1EDBp (86.6%)" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-2.5 bg-gray-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all",
        style: { width: "86.6%" }
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4 mt-2.5 text-xs text-gray-500", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-green-500 inline-block" }),
        "\u0110\xE3 ph\xE2n: 161"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-orange-400 inline-block" }),
        "Ch\u1EDD ph\xE2n: 25"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-red-400 inline-block" }),
        "Xung \u0111\u1ED9t: 3"
      ] })
    ] })
  ] }) });
};
export {
  StaffProgressOverview
};
