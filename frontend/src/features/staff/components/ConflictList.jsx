import { jsx, jsxs } from "react/jsx-runtime";
import { CheckCircle } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/common/Card";
import { CONFLICT_TYPE_CONFIG, SEVERITY_CONFIG } from "../constants/allocation";
const ConflictList = ({ conflicts }) => {
  if (conflicts.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 text-center", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-12 h-12 text-green-500 mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700", children: "Kh\xF4ng ph\xE1t hi\u1EC7n xung \u0111\u1ED9t" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-1", children: "To\xE0n b\u1ED9 l\u1ECBch ph\xE2n ph\xF2ng h\u1EE3p l\u1EC7" })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: conflicts.map((conflict) => {
    const severityInfo = SEVERITY_CONFIG[conflict.severity];
    const SeverityIcon = severityInfo.icon;
    const typeInfo = CONFLICT_TYPE_CONFIG[conflict.type];
    return /* @__PURE__ */ jsx(
      Card,
      {
        className: `shadow-sm border ring-1 ${conflict.severity === "high" ? "ring-red-200" : "ring-orange-200"}`,
        children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${conflict.severity === "high" ? "bg-red-100" : "bg-orange-100"}`,
              children: /* @__PURE__ */ jsx(
                SeverityIcon,
                {
                  className: `w-5 h-5 ${conflict.severity === "high" ? "text-red-600" : "text-orange-600"}`
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-2", children: [
              /* @__PURE__ */ jsx(Badge, { className: `${severityInfo.className} text-xs`, children: severityInfo.label }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `text-[11px] font-semibold border px-2 py-0.5 rounded-full ${typeInfo.color}`,
                  children: typeInfo.label
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
                conflict.day,
                " \xB7 ",
                conflict.slot
              ] }),
              conflict.room !== "\u2014" && /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded", children: [
                "Ph\xF2ng ",
                conflict.room
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700 mb-2", children: conflict.desc }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-800", children: "LHP 1:" }),
                " ",
                conflict.section1
              ] }),
              conflict.section2 !== "\u2014" && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-800", children: "LHP 2:" }),
                " ",
                conflict.section2
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "text-xs flex-shrink-0", children: "X\u1EED l\xFD" })
        ] }) })
      },
      conflict.id
    );
  }) });
};
export {
  ConflictList
};
