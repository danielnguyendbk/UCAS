import { jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, Download, Search, Wand2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/app/components/ui/select";
const TimetableToolbar = ({
  searchTerm,
  onSearchTermChange,
  filterDay,
  onFilterDayChange,
  filterRoom,
  onFilterRoomChange,
  filterLecturer,
  onFilterLecturerChange
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search courses, lecturers...",
            value: searchTerm,
            onChange: (event) => onSearchTermChange(event.target.value),
            className: "pl-10"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filterDay, onValueChange: onFilterDayChange, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full lg:w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by Day" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Days" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Monday", children: "Monday" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Tuesday", children: "Tuesday" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Wednesday", children: "Wednesday" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Thursday", children: "Thursday" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Friday", children: "Friday" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Saturday", children: "Saturday" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filterRoom, onValueChange: onFilterRoomChange, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full lg:w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by Room" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Rooms" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "A-301", children: "A-301" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "B-105", children: "B-105" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "C-201", children: "C-201" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "D-102", children: "D-102" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filterLecturer, onValueChange: onFilterLecturerChange, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full lg:w-[200px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by Lecturer" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Lecturers" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Dr. Sarah Johnson", children: "Dr. Sarah Johnson" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Prof. Michael Chen", children: "Prof. Michael Chen" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "Dr. Emily Brown", children: "Dr. Emily Brown" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-4", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "default", className: "bg-blue-600 hover:bg-blue-700", children: [
        /* @__PURE__ */ jsx(Wand2, { className: "w-4 h-4 mr-2" }),
        "Auto Assign Rooms"
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 mr-2" }),
        "Check Conflicts"
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
        /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
        "Export to Excel"
      ] })
    ] })
  ] });
};
export {
  TimetableToolbar
};
