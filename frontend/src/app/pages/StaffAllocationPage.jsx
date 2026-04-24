import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Building2, AlertTriangle, CheckCircle, XCircle, Wand2, RefreshCw, Info } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
const conflicts = [
  {
    id: 1,
    type: "room",
    severity: "high",
    room: "A-301",
    day: "Th\u1EE9 4",
    slot: "Ti\u1EBFt 1-3",
    section1: "ENG102.L06 \u2014 Ti\u1EBFng Anh k\u1EF9 thu\u1EADt",
    section2: "CS501.L02 \u2014 L\u1EADp tr\xECnh m\u1EA1ng",
    desc: "Hai l\u1EDBp \u0111\u01B0\u1EE3c ph\xE2n c\xF9ng ph\xF2ng, c\xF9ng ca h\u1ECDc"
  },
  {
    id: 2,
    type: "lecturer",
    severity: "high",
    room: "\u2014",
    day: "Th\u1EE9 5",
    slot: "Ti\u1EBFt 1-3",
    section1: "AI401.L01 \u2014 Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o",
    section2: "ML402.L01 \u2014 H\u1ECDc m\xE1y",
    desc: "GV PGS.TS. Ho\xE0ng V\u0103n Nam d\u1EA1y 2 l\u1EDBp c\xF9ng th\u1EDDi \u0111i\u1EC3m"
  },
  {
    id: 3,
    type: "capacity",
    severity: "medium",
    room: "C-101",
    day: "Th\u1EE9 3",
    slot: "Ti\u1EBFt 7-9",
    section1: "STAT201.L01 \u2014 Th\u1ED1ng k\xEA \u1EE9ng d\u1EE5ng",
    section2: "\u2014",
    desc: "Ph\xF2ng C-101 s\u1EE9c ch\u1EE9a 40, l\u1EDBp c\xF3 55 sinh vi\xEAn"
  }
];
const allocationList = [
  { id: "CS101.L11", name: "L\u1EADp tr\xECnh H\u0110T", students: 45, reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226545", assigned: "A-301", capacity: 50, day: "Th\u1EE9 2", slot: "Ti\u1EBFt 1-3", status: "ok" },
  { id: "MATH201.L02", name: "To\xE1n cao c\u1EA5p 2", students: 60, reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226560", assigned: "B-105", capacity: 65, day: "Th\u1EE9 3", slot: "Ti\u1EBFt 4-6", status: "ok" },
  { id: "NET301.L05", name: "M\u1EA1ng m\xE1y t\xEDnh", students: 38, reqRoom: "Ph\xF2ng m\xE1y t\xEDnh \u226538", assigned: "", capacity: 0, day: "Th\u1EE9 4", slot: "Ti\u1EBFt 1-3", status: "unassigned" },
  { id: "AI401.L01", name: "Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o", students: 35, reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226535", assigned: "A-301", capacity: 50, day: "Th\u1EE9 5", slot: "Ti\u1EBFt 1-3", status: "conflict" },
  { id: "SE302.L03", name: "C\xF4ng ngh\u1EC7 PM", students: 48, reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226550", assigned: "D-102", capacity: 55, day: "Th\u1EE9 6", slot: "Ti\u1EBFt 4-6", status: "ok" }
];
const severityConfig = {
  high: { label: "Nghi\xEAm tr\u1ECDng", className: "bg-red-100 text-red-700", icon: XCircle },
  medium: { label: "Trung b\xECnh", className: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  low: { label: "Th\u1EA5p", className: "bg-yellow-100 text-yellow-700", icon: Info }
};
const typeConfig = {
  room: { label: "Tr\xF9ng ph\xF2ng", color: "bg-red-50 text-red-600 border-red-200" },
  lecturer: { label: "Tr\xF9ng GV", color: "bg-purple-50 text-purple-600 border-purple-200" },
  capacity: { label: "Qu\xE1 s\u1EE9c ch\u1EE9a", color: "bg-orange-50 text-orange-600 border-orange-200" }
};
const StaffAllocationPage = () => {
  const [activeTab, setActiveTab] = useState("allocation");
  const [isRunning, setIsRunning] = useState(false);
  const [runDone, setRunDone] = useState(false);
  const handleAutoAssign = () => {
    setIsRunning(true);
    setRunDone(false);
    setTimeout(() => {
      setIsRunning(false);
      setRunDone(true);
    }, 2e3);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-5 md:p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Ph\xE2n ph\xF2ng & Ki\u1EC3m tra xung \u0111\u1ED9t" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "H\u1ECDc k\u1EF3 1, N\u0103m h\u1ECDc 2024-2025" })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleAutoAssign,
          disabled: isRunning,
          className: "bg-blue-600 hover:bg-blue-700 gap-2 text-sm",
          children: [
            isRunning ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Wand2, { className: "w-4 h-4" }),
            isRunning ? "\u0110ang ph\xE2n c\xF4ng..." : "Ph\xE2n c\xF4ng t\u1EF1 \u0111\u1ED9ng"
          ]
        }
      )
    ] }),
    runDone && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Ph\xE2n c\xF4ng t\u1EF1 \u0111\u1ED9ng ho\xE0n t\u1EA5t!" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-green-700 mt-0.5", children: "\u0110\xE3 ph\xE2n 22 l\u1EDBp h\u1ECDc ph\u1EA7n th\xE0nh c\xF4ng. 3 l\u1EDBp kh\xF4ng th\u1EC3 ph\xE2n t\u1EF1 \u0111\u1ED9ng do r\xE0ng bu\u1ED9c \u0111\u1EB7c bi\u1EC7t \u2014 c\u1EA7n x\u1EED l\xFD th\u1EE7 c\xF4ng." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex border-b border-gray-200", children: [
      { key: "allocation", label: "Danh s\xE1ch ph\xE2n ph\xF2ng", icon: Building2 },
      { key: "conflicts", label: `Xung \u0111\u1ED9t l\u1ECBch (${conflicts.length})`, icon: AlertTriangle }
    ].map((tab) => {
      const Icon = tab.icon;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab(tab.key),
          className: `flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
            tab.label
          ]
        },
        tab.key
      );
    }) }),
    activeTab === "allocation" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-gray-50", children: [
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "M\xE3 l\u1EDBp HP" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "T\xEAn m\xF4n" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "SV" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Y\xEAu c\u1EA7u ph\xF2ng" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "L\u1ECBch h\u1ECDc" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Ph\xF2ng ph\xE2n" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "S\u1EE9c ch\u1EE9a" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "K\u1EBFt qu\u1EA3" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "Thao t\xE1c" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: allocationList.map((row) => /* @__PURE__ */ jsxs(TableRow, { className: `hover:bg-gray-50 border-b border-gray-100 ${row.status === "conflict" ? "bg-red-50/40" : ""}`, children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs font-bold text-blue-700", children: row.id }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-medium text-gray-800", children: row.name }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: row.students }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-500", children: row.reqRoom }),
        /* @__PURE__ */ jsxs(TableCell, { className: "text-xs text-gray-600 whitespace-nowrap", children: [
          row.day,
          " \xB7 ",
          row.slot
        ] }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-semibold text-gray-900", children: row.assigned || /* @__PURE__ */ jsx("span", { className: "text-gray-300 italic font-normal", children: "Ch\u01B0a ph\xE2n" }) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center text-gray-600", children: row.capacity > 0 ? /* @__PURE__ */ jsx("span", { className: row.capacity < row.students ? "text-red-600 font-semibold" : "text-green-600", children: row.capacity }) : "\u2014" }),
        /* @__PURE__ */ jsxs(TableCell, { className: "text-center", children: [
          row.status === "ok" && /* @__PURE__ */ jsxs(Badge, { className: "bg-green-100 text-green-700 hover:bg-green-100 text-[11px]", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
            "H\u1EE3p l\u1EC7"
          ] }),
          row.status === "unassigned" && /* @__PURE__ */ jsx(Badge, { className: "bg-orange-100 text-orange-700 hover:bg-orange-100 text-[11px]", children: "Ch\u01B0a ph\xE2n" }),
          row.status === "conflict" && /* @__PURE__ */ jsxs(Badge, { className: "bg-red-100 text-red-700 hover:bg-red-100 text-[11px]", children: [
            /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
            "Xung \u0111\u1ED9t"
          ] })
        ] }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsx("button", { className: "text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50", children: row.assigned ? "\u0110\u1ED5i ph\xF2ng" : "Ph\xE2n ph\xF2ng" }) })
      ] }, row.id)) })
    ] }) }) }),
    activeTab === "conflicts" && /* @__PURE__ */ jsx("div", { className: "space-y-4", children: conflicts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 text-center", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-12 h-12 text-green-500 mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-700", children: "Kh\xF4ng ph\xE1t hi\u1EC7n xung \u0111\u1ED9t" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-1", children: "To\xE0n b\u1ED9 l\u1ECBch ph\xE2n ph\xF2ng h\u1EE3p l\u1EC7" })
    ] }) : conflicts.map((c) => {
      const sev = severityConfig[c.severity];
      const SevIcon = sev.icon;
      const typeInfo = typeConfig[c.type];
      return /* @__PURE__ */ jsx(Card, { className: `shadow-sm border ring-1 ${c.severity === "high" ? "ring-red-200" : "ring-orange-200"}`, children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.severity === "high" ? "bg-red-100" : "bg-orange-100"}`, children: /* @__PURE__ */ jsx(SevIcon, { className: `w-5 h-5 ${c.severity === "high" ? "text-red-600" : "text-orange-600"}` }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-2", children: [
            /* @__PURE__ */ jsx(Badge, { className: `${sev.className} hover:${sev.className} text-xs`, children: sev.label }),
            /* @__PURE__ */ jsx("span", { className: `text-[11px] font-semibold border px-2 py-0.5 rounded-full ${typeInfo.color}`, children: typeInfo.label }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
              c.day,
              " \xB7 ",
              c.slot
            ] }),
            c.room !== "\u2014" && /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded", children: [
              "Ph\xF2ng ",
              c.room
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700 mb-2", children: c.desc }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-800", children: "LHP 1:" }),
              " ",
              c.section1
            ] }),
            c.section2 !== "\u2014" && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-800", children: "LHP 2:" }),
              " ",
              c.section2
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "text-xs flex-shrink-0", children: "X\u1EED l\xFD" })
      ] }) }) }, c.id);
    }) })
  ] });
};
export {
  StaffAllocationPage
};
