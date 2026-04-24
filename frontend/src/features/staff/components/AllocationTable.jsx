import { jsx, jsxs } from "react/jsx-runtime";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/app/components/ui/table";
const AllocationTable = ({ items }) => {
  return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
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
    /* @__PURE__ */ jsx(TableBody, { children: items.map((row) => /* @__PURE__ */ jsxs(
      TableRow,
      {
        className: `hover:bg-gray-50 border-b border-gray-100 ${row.status === "conflict" ? "bg-red-50/40" : ""}`,
        children: [
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
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center text-gray-600", children: row.capacity > 0 ? /* @__PURE__ */ jsx(
            "span",
            {
              className: row.capacity < row.students ? "text-red-600 font-semibold" : "text-green-600",
              children: row.capacity
            }
          ) : "\u2014" }),
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
        ]
      },
      row.id
    )) })
  ] }) }) });
};
export {
  AllocationTable
};
