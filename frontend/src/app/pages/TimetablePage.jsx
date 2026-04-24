import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Search, Download, Wand2, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import ScheduleToolbar from "../components/ScheduleToolbar";
const timetableData = [
  {
    id: "CS101.L11",
    courseCode: "CS101.L11",
    courseName: "Lập trình hướng đối tượng",
    lecturer: "TS. Nguyễn Văn An",
    studentCount: 45,
    day: "Thứ 2",
    time: "07:00-09:30",
    assignedRoom: "A-301",
    status: "valid"
  },
  {
    id: "MATH201.L02",
    courseCode: "MATH201.L02",
    courseName: "Toán cao cấp 2",
    lecturer: "GS.TS. Trần Thị Bình",
    studentCount: 60,
    day: "Thứ 3",
    time: "09:45-12:15",
    assignedRoom: "B-105",
    status: "valid"
  },
  {
    id: "NET301.L05",
    courseCode: "NET301.L05",
    courseName: "Mạng máy tính",
    lecturer: "ThS. Lê Minh Tú",
    studentCount: 38,
    day: "Thứ 4",
    time: "07:00-09:30",
    assignedRoom: "C-105",
    status: "pending"
  },
  {
    id: "PHY101.L01",
    courseCode: "PHY101.L01",
    courseName: "Vật lý đại cương",
    lecturer: "TS. Trần Văn Hải",
    studentCount: 55,
    day: "Thứ 7",
    time: "07:00-09:30",
    assignedRoom: "E-101",
    status: "valid"
  }
];
const TimetablePage = () => {
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24",
    searchTerm: ""
  });
  const getStatusBadge = (status) => {
    switch (status) {
      case "valid":
        return /* @__PURE__ */ jsx(Badge, { className: "bg-green-100 text-green-700 hover:bg-green-100", children: "Valid" });
      case "conflict":
        return /* @__PURE__ */ jsx(Badge, { className: "bg-red-100 text-red-700 hover:bg-red-100", children: "Conflict" });
      case "pending":
        return /* @__PURE__ */ jsx(Badge, { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", children: "Pending" });
      default:
        return null;
    }
  };
  const filteredData = timetableData.filter((item) => {
    const matchesSearch = item.courseCode.toLowerCase().includes(filters.searchTerm.toLowerCase()) || item.courseName.toLowerCase().includes(filters.searchTerm.toLowerCase()) || item.lecturer.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesBuilding = filters.building === "all" || item.assignedRoom.startsWith(filters.building.replace("Tòa ", ""));
    const matchesRoom = filters.room === "all" || item.assignedRoom === filters.room;
    return matchesSearch && matchesBuilding && matchesRoom;
  });
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Timetable Management" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage course schedules and room assignments" })
    ] }),
    /* @__PURE__ */ jsx(ScheduleToolbar, { 
      filters: filters,
      onBuildingChange: (v) => setFilters(f => ({ ...f, building: v })),
      onRoomChange: (v) => setFilters(f => ({ ...f, room: v })),
      onWeekChange: (v) => setFilters(f => ({ ...f, week: v })),
      onDateChange: (v) => setFilters(f => ({ ...f, date: v })),
      onSearch: () => console.log("Searching with filters:", filters),
      onRefresh: () => window.location.reload()
    }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Course Code" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Course Name" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Lecturer" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Students" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Day" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Giờ học" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Assigned Room" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredData.map((item) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: item.courseCode }),
          /* @__PURE__ */ jsx(TableCell, { children: item.courseName }),
          /* @__PURE__ */ jsx(TableCell, { children: item.lecturer }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: item.studentCount }),
          /* @__PURE__ */ jsx(TableCell, { children: item.day }),
          /* @__PURE__ */ jsx(TableCell, { children: item.time }),
          /* @__PURE__ */ jsx(TableCell, { children: item.assignedRoom || /* @__PURE__ */ jsx("span", { className: "text-gray-400 italic", children: "Not assigned" }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: getStatusBadge(item.status) })
        ] }, item.id)) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-gray-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
          "Showing ",
          filteredData.length,
          " of ",
          timetableData.length,
          " entries"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: true, children: "Previous" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "bg-blue-50 text-blue-600", children: "1" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "2" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "3" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "Next" })
        ] })
      ] })
    ] })
  ] });
};
export {
  TimetablePage
};
export default TimetablePage;
