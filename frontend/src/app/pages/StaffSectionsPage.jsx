import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Search, Plus, Download, Filter, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
const sections = [
  { id: "CS101.L11", name: "L\u1EADp tr\xECnh h\u01B0\u1EDBng \u0111\u1ED1i t\u01B0\u1EE3ng", faculty: "CNTT", credits: 3, students: 45, lecturer: "TS. Nguy\u1EC5n V\u0103n An", day: "Th\u1EE9 2", slot: "Ti\u1EBFt 1-3", room: "A-301", status: "assigned" },
  { id: "MATH201.L02", name: "To\xE1n cao c\u1EA5p 2", faculty: "TO\xC1N", credits: 4, students: 60, lecturer: "GS.TS. Tr\u1EA7n Th\u1ECB B\xECnh", day: "Th\u1EE9 3", slot: "Ti\u1EBFt 4-6", room: "B-105", status: "assigned" },
  { id: "NET301.L05", name: "M\u1EA1ng m\xE1y t\xEDnh", faculty: "CNTT", credits: 3, students: 38, lecturer: "ThS. L\xEA Minh T\xFA", day: "Th\u1EE9 4", slot: "Ti\u1EBFt 1-3", room: "", status: "pending" },
  { id: "DB202.L08", name: "C\u01A1 s\u1EDF d\u1EEF li\u1EC7u", faculty: "CNTT", credits: 3, students: 52, lecturer: "TS. Ph\u1EA1m Quang H\u01B0ng", day: "Th\u1EE9 4", slot: "Ti\u1EBFt 7-9", room: "C-201", status: "assigned" },
  { id: "AI401.L01", name: "Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o", faculty: "CNTT", credits: 3, students: 35, lecturer: "PGS.TS. Ho\xE0ng V\u0103n Nam", day: "Th\u1EE9 5", slot: "Ti\u1EBFt 1-3", room: "A-301", status: "conflict" },
  { id: "SE302.L03", name: "C\xF4ng ngh\u1EC7 ph\u1EA7n m\u1EC1m", faculty: "CNTT", credits: 3, students: 48, lecturer: "TS. V\u0169 Th\u1ECB Lan", day: "Th\u1EE9 6", slot: "Ti\u1EBFt 4-6", room: "D-102", status: "assigned" },
  { id: "PHY101.L04", name: "V\u1EADt l\xFD \u0111\u1EA1i c\u01B0\u01A1ng", faculty: "V\u1EACT L\xDD", credits: 4, students: 72, lecturer: "GS. \u0110inh V\u0103n Kh\xE1nh", day: "Th\u1EE9 2", slot: "Ti\u1EBFt 7-9", room: "B-201", status: "assigned" },
  { id: "ENG102.L06", name: "Ti\u1EBFng Anh k\u1EF9 thu\u1EADt", faculty: "NGO\u1EA0I NG\u1EEE", credits: 2, students: 40, lecturer: "ThS. Ng\xF4 Th\u1ECB Mai", day: "Th\u1EE9 5", slot: "Ti\u1EBFt 4-6", room: "", status: "pending" },
  { id: "CHEM301.L02", name: "H\xF3a \u0111\u1EA1i c\u01B0\u01A1ng", faculty: "H\xD3A", credits: 3, students: 55, lecturer: "PGS. L\xFD V\u0103n \u0110\u1EE9c", day: "Th\u1EE9 6", slot: "Ti\u1EBFt 1-3", room: "E-101", status: "assigned" },
  { id: "STAT201.L01", name: "Th\u1ED1ng k\xEA \u1EE9ng d\u1EE5ng", faculty: "TO\xC1N", credits: 3, students: 43, lecturer: "TS. Tr\u01B0\u01A1ng Th\u1ECB H\u1EA3i", day: "Th\u1EE9 3", slot: "Ti\u1EBFt 1-3", room: "", status: "pending" }
];
const statusConfig = {
  assigned: { label: "\u0110\xE3 ph\xE2n ph\xF2ng", className: "bg-green-100 text-green-700", icon: CheckCircle },
  pending: { label: "Ch\u01B0a ph\xE2n ph\xF2ng", className: "bg-orange-100 text-orange-700", icon: Clock },
  conflict: { label: "Xung \u0111\u1ED9t l\u1ECBch", className: "bg-red-100 text-red-700", icon: XCircle }
};
const StaffSectionsPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const filtered = sections.filter((s) => {
    const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()) || s.lecturer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchFaculty = filterFaculty === "all" || s.faculty === filterFaculty;
    return matchSearch && matchStatus && matchFaculty;
  });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return /* @__PURE__ */ jsxs("div", { className: "p-5 md:p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Qu\u1EA3n l\xFD L\u1EDBp h\u1ECDc ph\u1EA7n" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "H\u1ECDc k\u1EF3 1, N\u0103m h\u1ECDc 2024-2025" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-1.5 text-sm", children: [
          /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
          " Xu\u1EA5t Excel"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", className: "bg-blue-600 hover:bg-blue-700 gap-1.5 text-sm", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
          " Th\xEAm l\u1EDBp HP"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: [
      { label: "T\u1ED5ng c\u1ED9ng", value: sections.length, color: "bg-gray-100 text-gray-700" },
      { label: "\u0110\xE3 ph\xE2n ph\xF2ng", value: sections.filter((s) => s.status === "assigned").length, color: "bg-green-100 text-green-700" },
      { label: "Ch\u01B0a ph\xE2n", value: sections.filter((s) => s.status === "pending").length, color: "bg-orange-100 text-orange-700" },
      { label: "Xung \u0111\u1ED9t", value: sections.filter((s) => s.status === "conflict").length, color: "bg-red-100 text-red-700" }
    ].map((p) => /* @__PURE__ */ jsxs("span", { className: `text-xs font-semibold px-3 py-1.5 rounded-full ${p.color}`, children: [
      p.label,
      ": ",
      p.value
    ] }, p.label)) }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-4 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "T\xECm theo m\xE3 l\u1EDBp, t\xEAn m\xF4n, gi\u1EA3ng vi\xEAn...",
            value: search,
            onChange: (e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            },
            className: "pl-9 h-9 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filterStatus, onValueChange: (v) => {
        setFilterStatus(v);
        setCurrentPage(1);
      }, children: [
        /* @__PURE__ */ jsxs(SelectTrigger, { className: "w-full md:w-44 h-9 text-sm", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-3.5 h-3.5 mr-1.5 text-gray-400" }),
          /* @__PURE__ */ jsx(SelectValue, { placeholder: "Tr\u1EA1ng th\xE1i" })
        ] }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "T\u1EA5t c\u1EA3 tr\u1EA1ng th\xE1i" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "assigned", children: "\u0110\xE3 ph\xE2n ph\xF2ng" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Ch\u01B0a ph\xE2n ph\xF2ng" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "conflict", children: "Xung \u0111\u1ED9t l\u1ECBch" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filterFaculty, onValueChange: (v) => {
        setFilterFaculty(v);
        setCurrentPage(1);
      }, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-40 h-9 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Khoa/B\u1ED9 m\xF4n" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "T\u1EA5t c\u1EA3 khoa" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "CNTT", children: "CNTT" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "TO\xC1N", children: "To\xE1n" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "V\u1EACT L\xDD", children: "V\u1EADt l\xFD" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "H\xD3A", children: "H\xF3a h\u1ECDc" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "NGO\u1EA0I NG\u1EEE", children: "Ngo\u1EA1i ng\u1EEF" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: [
      paginated.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Search, { className: "w-6 h-6 text-gray-400" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-700", children: "Kh\xF4ng t\xECm th\u1EA5y l\u1EDBp h\u1ECDc ph\u1EA7n" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Th\u1EED thay \u0111\u1ED5i b\u1ED9 l\u1ECDc ho\u1EB7c t\u1EEB kh\xF3a t\xECm ki\u1EBFm" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-gray-50 border-b border-gray-200", children: [
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "M\xE3 l\u1EDBp HP" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "T\xEAn m\xF4n h\u1ECDc" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Khoa" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "TC" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "SV" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Gi\u1EA3ng vi\xEAn" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "L\u1ECBch h\u1ECDc" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Ph\xF2ng" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "Tr\u1EA1ng th\xE1i" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "Thao t\xE1c" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: paginated.map((s) => {
          const cfg = statusConfig[s.status];
          const StatusIcon = cfg.icon;
          return /* @__PURE__ */ jsxs(TableRow, { className: "hover:bg-blue-50/30 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs font-bold text-blue-700", children: s.id }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-medium text-gray-800 max-w-[170px]", children: /* @__PURE__ */ jsx("div", { className: "truncate", title: s.name, children: s.name }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded", children: s.faculty }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center font-medium", children: s.credits }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: s.students }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-600 max-w-[150px]", children: /* @__PURE__ */ jsx("div", { className: "truncate", title: s.lecturer, children: s.lecturer }) }),
            /* @__PURE__ */ jsxs(TableCell, { className: "text-xs text-gray-600 whitespace-nowrap", children: [
              s.day,
              " \xB7 ",
              s.slot
            ] }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-medium text-gray-800", children: s.room || /* @__PURE__ */ jsx("span", { className: "text-gray-300 italic", children: "Ch\u01B0a ph\xE2n" }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsxs(Badge, { className: `${cfg.className} hover:${cfg.className} gap-1 text-[11px]`, children: [
              /* @__PURE__ */ jsx(StatusIcon, { className: "w-3 h-3" }),
              cfg.label
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
              /* @__PURE__ */ jsx("button", { className: "text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50", children: "S\u1EEDa" }),
              s.status !== "assigned" && /* @__PURE__ */ jsx("button", { className: "text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50", children: "Ph\xE2n ph\xF2ng" })
            ] }) })
          ] }, s.id);
        }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-gray-100", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
          "Hi\u1EC3n th\u1ECB ",
          paginated.length,
          " / ",
          filtered.length,
          " l\u1EDBp h\u1ECDc ph\u1EA7n"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage === 1, className: "h-7 w-7 p-0", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3.5 h-3.5" }) }),
          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => /* @__PURE__ */ jsx(
            Button,
            {
              variant: currentPage === page ? "default" : "outline",
              size: "sm",
              onClick: () => setCurrentPage(page),
              className: `h-7 w-7 p-0 text-xs ${currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}`,
              children: page
            },
            page
          )),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages, className: "h-7 w-7 p-0", children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }) })
        ] })
      ] })
    ] })
  ] });
};
export {
  StaffSectionsPage
};
