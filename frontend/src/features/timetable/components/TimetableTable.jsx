import { jsx, jsxs } from "react/jsx-runtime";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/app/components/ui/table";
const statusBadgeMap = {
  valid: { className: "bg-green-100 text-green-700 hover:bg-green-100", label: "Valid" },
  conflict: { className: "bg-red-100 text-red-700 hover:bg-red-100", label: "Conflict" },
  pending: { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", label: "Pending" }
};
const TimetableTable = ({ items }) => {
  return /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
    /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
      /* @__PURE__ */ jsx(TableHead, { children: "Course Code" }),
      /* @__PURE__ */ jsx(TableHead, { children: "Course Name" }),
      /* @__PURE__ */ jsx(TableHead, { children: "Lecturer" }),
      /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Students" }),
      /* @__PURE__ */ jsx(TableHead, { children: "Day" }),
      /* @__PURE__ */ jsx(TableHead, { children: "Time Slot" }),
      /* @__PURE__ */ jsx(TableHead, { children: "Assigned Room" }),
      /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Status" })
    ] }) }),
    /* @__PURE__ */ jsx(TableBody, { children: items.map((item) => {
      const statusBadge = statusBadgeMap[item.status];
      return /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: item.courseCode }),
        /* @__PURE__ */ jsx(TableCell, { children: item.courseName }),
        /* @__PURE__ */ jsx(TableCell, { children: item.lecturer }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: item.studentCount }),
        /* @__PURE__ */ jsx(TableCell, { children: item.day }),
        /* @__PURE__ */ jsx(TableCell, { children: item.timeSlot }),
        /* @__PURE__ */ jsx(TableCell, { children: item.assignedRoom || /* @__PURE__ */ jsx("span", { className: "text-gray-400 italic", children: "Not assigned" }) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsx(Badge, { className: statusBadge.className, children: statusBadge.label }) })
      ] }, item.id);
    }) })
  ] }) }) });
};
export {
  TimetableTable
};
