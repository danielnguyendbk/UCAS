import { jsx, jsxs } from "react/jsx-runtime";
import { AlertTriangle, Building2, CheckCircle, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { AllocationTable } from "../components/AllocationTable";
import { ConflictList } from "../components/ConflictList";
import { useStaffAllocation } from "../hooks/useStaffAllocation";
const STAFF_ALLOCATION_TABS = [
  { key: "allocation", label: "Danh s\xE1ch ph\xE2n ph\xF2ng", icon: Building2 },
  { key: "conflicts", label: "Xung \u0111\u1ED9t l\u1ECBch", icon: AlertTriangle }
];
const StaffAllocationPage = () => {
  const {
    activeTab,
    setActiveTab,
    isRunning,
    runDone,
    allocations,
    conflicts,
    runAutoAssign
  } = useStaffAllocation();
  return /* @__PURE__ */ jsxs("div", { className: "p-5 md:p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Ph\xE2n ph\xF2ng & Ki\u1EC3m tra xung \u0111\u1ED9t" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "H\u1ECDc k\u1EF3 1, N\u0103m h\u1ECDc 2024-2025" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: runAutoAssign, disabled: isRunning, className: "bg-blue-600 hover:bg-blue-700 gap-2 text-sm", children: [
        isRunning ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Wand2, { className: "w-4 h-4" }),
        isRunning ? "\u0110ang ph\xE2n c\xF4ng..." : "Ph\xE2n c\xF4ng t\u1EF1 \u0111\u1ED9ng"
      ] })
    ] }),
    runDone && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Ph\xE2n c\xF4ng t\u1EF1 \u0111\u1ED9ng ho\xE0n t\u1EA5t!" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-green-700 mt-0.5", children: "\u0110\xE3 ph\xE2n 22 l\u1EDBp h\u1ECDc ph\u1EA7n th\xE0nh c\xF4ng. 3 l\u1EDBp kh\xF4ng th\u1EC3 ph\xE2n t\u1EF1 \u0111\u1ED9ng do r\xE0ng bu\u1ED9c \u0111\u1EB7c bi\u1EC7t, c\u1EA7n x\u1EED l\xFD th\u1EE7 c\xF4ng." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex border-b border-gray-200", children: STAFF_ALLOCATION_TABS.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.key;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab(tab.key),
          className: `flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${isActive ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
            tab.key === "conflicts" ? `${tab.label} (${conflicts.length})` : tab.label
          ]
        },
        tab.key
      );
    }) }),
    activeTab === "allocation" ? /* @__PURE__ */ jsx(AllocationTable, { items: allocations }) : /* @__PURE__ */ jsx(ConflictList, { conflicts })
  ] });
};
var stdin_default = StaffAllocationPage;
export {
  stdin_default as default
};
