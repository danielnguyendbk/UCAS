import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/app/components/ui/table";
import { APP_ROUTES } from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { STATUS_CONFIG } from "../constants/dashboard";
const StaffRecentSectionsTable = ({ sections }) => {
  return /* @__PURE__ */ jsxs(Card, { className: "shadow-sm border-0 ring-1 ring-gray-200 lg:col-span-2", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3 flex flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-semibold text-gray-700", children: "L\u1EDBp h\u1ECDc ph\u1EA7n g\u1EA7n \u0111\xE2y" }),
      /* @__PURE__ */ jsxs(Link, { to: APP_ROUTES.staffSections, className: "text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium", children: [
        "Xem t\u1EA5t c\u1EA3 ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-gray-50", children: [
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "M\xE3 l\u1EDBp HP" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "T\xEAn m\xF4n h\u1ECDc" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-center", children: "SV" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Ph\xF2ng" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "L\u1ECBch" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-center", children: "Tr\u1EA1ng th\xE1i" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: sections.map((section) => {
        const statusInfo = STATUS_CONFIG[section.status];
        const StatusIcon = statusInfo.icon;
        return /* @__PURE__ */ jsxs(TableRow, { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs font-semibold text-blue-700", children: section.id }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs max-w-[160px] truncate", children: section.name }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: section.students }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs", children: section.room ? /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-800", children: section.room }) : /* @__PURE__ */ jsx("span", { className: "text-gray-400 italic", children: "\u2014" }) }),
          /* @__PURE__ */ jsxs(TableCell, { className: "text-xs text-gray-600", children: [
            section.day,
            " \xB7 ",
            section.slot
          ] }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsxs(Badge, { className: `${statusInfo.className} text-[11px] gap-1`, children: [
            /* @__PURE__ */ jsx(StatusIcon, { className: "w-3 h-3" }),
            statusInfo.label
          ] }) })
        ] }, section.id);
      }) })
    ] }) }) })
  ] });
};
export {
  StaffRecentSectionsTable
};
