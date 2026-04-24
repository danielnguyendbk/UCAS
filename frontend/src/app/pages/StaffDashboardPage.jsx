import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router";
import {
  ClipboardList,
  Building2,
  AlertTriangle,
  CalendarCheck,
  ArrowRight,
  Search,
  PlusSquare,
  ListChecks,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
const stats = [
  {
    title: "L\u1EDBp h\u1ECDc ph\u1EA7n HK1",
    value: "186",
    sub: "+12 so v\u1EDBi HK tr\u01B0\u1EDBc",
    icon: ClipboardList,
    color: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-700"
  },
  {
    title: "\u0110\xE3 ph\xE2n ph\xF2ng",
    value: "161",
    sub: "86.6% t\u1ED5ng l\u1EDBp h\u1ECDc ph\u1EA7n",
    icon: Building2,
    color: "bg-green-500",
    light: "bg-green-50",
    text: "text-green-700"
  },
  {
    title: "Ch\u01B0a ph\xE2n ph\xF2ng",
    value: "25",
    sub: "C\u1EA7n x\u1EED l\xFD tr\u01B0\u1EDBc 15/08",
    icon: AlertTriangle,
    color: "bg-orange-500",
    light: "bg-orange-50",
    text: "text-orange-700"
  },
  {
    title: "Y\xEAu c\u1EA7u \u0111\u1EB7t ph\xF2ng",
    value: "8",
    sub: "3 ch\u1EDD duy\u1EC7t, 5 \u0111\xE3 duy\u1EC7t",
    icon: CalendarCheck,
    color: "bg-purple-500",
    light: "bg-purple-50",
    text: "text-purple-700"
  }
];
const quickActions = [
  { label: "Qu\u1EA3n l\xFD l\u1EDBp h\u1ECDc ph\u1EA7n", icon: ClipboardList, path: "/staff/sections", color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100" },
  { label: "Qu\u1EA3n l\xFD th\u1EDDi kh\xF3a bi\u1EC3u", icon: ListChecks, path: "/staff/schedule", color: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100" },
  { label: "Ph\xE2n ph\xF2ng & Xung \u0111\u1ED9t", icon: Building2, path: "/staff/allocation", color: "text-teal-600", bg: "bg-teal-50 hover:bg-teal-100" },
  { label: "Tra c\u1EE9u l\u1ECBch ph\xF2ng", icon: Search, path: "/staff/lookup", color: "text-cyan-600", bg: "bg-cyan-50 hover:bg-cyan-100" },
  { label: "Tra c\u1EE9u l\u1ECBch h\u1ECDc", icon: CalendarCheck, path: "/staff/lookup", color: "text-violet-600", bg: "bg-violet-50 hover:bg-violet-100" },
  { label: "Danh s\xE1ch ph\xF2ng tr\u1ED1ng", icon: Building2, path: "/staff/lookup", color: "text-emerald-600", bg: "bg-emerald-50 hover:bg-emerald-100" },
  { label: "Danh s\xE1ch \u0111\u1EB7t ph\xF2ng", icon: ListChecks, path: "/staff/booking-list", color: "text-rose-600", bg: "bg-rose-50 hover:bg-rose-100" },
  { label: "\u0110\u1EB7t ph\xF2ng kh\u1EA9n c\u1EA5p", icon: PlusSquare, path: "/staff/bookings", color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100" }

];
const recentSections = [
  { id: "CS101.L11", name: "L\u1EADp tr\xECnh h\u01B0\u1EDBng \u0111\u1ED1i t\u01B0\u1EE3ng", credits: 3, students: 45, room: "A-301", day: "Th\u1EE9 2", slot: "Ti\u1EBFt 1-3", status: "assigned" },
  { id: "MATH201.L02", name: "To\xE1n cao c\u1EA5p 2", credits: 4, students: 60, room: "B-105", day: "Th\u1EE9 3", slot: "Ti\u1EBFt 4-6", status: "assigned" },
  { id: "NET301.L05", name: "M\u1EA1ng m\xE1y t\xEDnh", credits: 3, students: 38, room: "", day: "Th\u1EE9 4", slot: "Ti\u1EBFt 1-3", status: "pending" },
  { id: "DB202.L08", name: "C\u01A1 s\u1EDF d\u1EEF li\u1EC7u", credits: 3, students: 52, room: "C-201", day: "Th\u1EE9 4", slot: "Ti\u1EBFt 7-9", status: "assigned" },
  { id: "AI401.L01", name: "Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o", credits: 3, students: 35, room: "", day: "Th\u1EE9 5", slot: "Ti\u1EBFt 1-3", status: "conflict" },
  { id: "SE302.L03", name: "C\xF4ng ngh\u1EC7 ph\u1EA7n m\u1EC1m", credits: 3, students: 48, room: "D-102", day: "Th\u1EE9 6", slot: "Ti\u1EBFt 4-6", status: "assigned" }
];
const statusConfig = {
  assigned: { label: "\u0110\xE3 ph\xE2n ph\xF2ng", className: "bg-green-100 text-green-700", icon: CheckCircle },
  pending: { label: "Ch\u01B0a ph\xE2n ph\xF2ng", className: "bg-orange-100 text-orange-700", icon: Clock },
  conflict: { label: "Xung \u0111\u1ED9t", className: "bg-red-100 text-red-700", icon: XCircle }
};
const StaffDashboardPage = () => {
  const [loading] = useState(false);
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
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map((s) => {
      const Icon = s.icon;
      return /* @__PURE__ */ jsx(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200", children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 font-medium", children: s.title }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 mt-1", children: s.value }),
          /* @__PURE__ */ jsx("p", { className: `text-[11px] mt-1 font-medium ${s.text}`, children: s.sub })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `${s.color} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`, children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5 text-white" }) })
      ] }) }) }, s.title);
    }) }),
    /* @__PURE__ */ jsx(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-blue-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gray-800", children: "Ti\u1EBFn \u0111\u1ED9 ph\xE2n ph\xF2ng HK1" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-700", children: "161 / 186 l\u1EDBp (86.6%)" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-2.5 bg-gray-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all", style: { width: "86.6%" } }) }),
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
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200 lg:col-span-1", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold text-gray-700", children: "Thao t\xE1c nhanh" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "px-4 pb-4", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: quickActions.map((action) => {
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
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200 lg:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3 flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold text-gray-700", children: "L\u1EDBp h\u1ECDc ph\u1EA7n g\u1EA7n \u0111\xE2y" }),
          /* @__PURE__ */ jsxs(Link, { to: "/staff/sections", className: "text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium", children: [
            "Xem t\u1EA5t c\u1EA3 ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-12 text-sm text-gray-400", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 animate-spin mr-2" }),
          " \u0110ang t\u1EA3i..."
        ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-gray-50", children: [
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "M\xE3 l\u1EDBp HP" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "T\xEAn m\xF4n h\u1ECDc" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-center", children: "SV" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Ph\xF2ng" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "L\u1ECBch" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-center", children: "Tr\u1EA1ng th\xE1i" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: recentSections.map((s) => {
            const cfg = statusConfig[s.status];
            const StatusIcon = cfg.icon;
            return /* @__PURE__ */ jsxs(TableRow, { className: "hover:bg-gray-50", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs font-semibold text-blue-700", children: s.id }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-xs max-w-[160px] truncate", children: s.name }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: s.students }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-xs", children: s.room ? /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-800", children: s.room }) : /* @__PURE__ */ jsx("span", { className: "text-gray-400 italic", children: "\u2014" }) }),
              /* @__PURE__ */ jsxs(TableCell, { className: "text-xs text-gray-600", children: [
                s.day,
                " \xB7 ",
                s.slot
              ] }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsxs(Badge, { className: `${cfg.className} hover:${cfg.className} text-[11px] gap-1`, children: [
                /* @__PURE__ */ jsx(StatusIcon, { className: "w-3 h-3" }),
                cfg.label
              ] }) })
            ] }, s.id);
          }) })
        ] }) }) })
      ] })
    ] })
  ] });
};
export {
  StaffDashboardPage
};
