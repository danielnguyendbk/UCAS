import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Search, RefreshCw, Calendar, Building2, CalendarDays, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
const roomScheduleData = [
  { room: "A-301", building: "To\xE0 A", capacity: 50, time: "Th\u1EE9 2 \xB7 Ti\u1EBFt 1-3", course: "CS101.L11 \u2014 L\u1EADp tr\xECnh H\u0110T", lecturer: "TS. Nguy\u1EC5n V\u0103n An", students: 45, status: "inuse" },
  { room: "A-301", building: "To\xE0 A", capacity: 50, time: "Th\u1EE9 4 \xB7 Ti\u1EBFt 7-9", course: "ENG102.L06 \u2014 Ti\u1EBFng Anh KT", lecturer: "ThS. Ng\xF4 Th\u1ECB Mai", students: 40, status: "inuse" },
  { room: "B-105", building: "To\xE0 B", capacity: 65, time: "Th\u1EE9 3 \xB7 Ti\u1EBFt 4-6", course: "MATH201.L02 \u2014 To\xE1n cao c\u1EA5p 2", lecturer: "GS.TS. Tr\u1EA7n Th\u1ECB B\xECnh", students: 60, status: "inuse" },
  { room: "C-201", building: "To\xE0 C", capacity: 45, time: "Th\u1EE9 4 \xB7 Ti\u1EBFt 7-9", course: "DB202.L08 \u2014 C\u01A1 s\u1EDF d\u1EEF li\u1EC7u", lecturer: "TS. Ph\u1EA1m Quang H\u01B0ng", students: 52, status: "inuse" }
];
const classScheduleData = [
  { section: "CS101.L11", name: "L\u1EADp tr\xECnh H\u0110T", day: "Th\u1EE9 2", slot: "Ti\u1EBFt 1-3", room: "A-301", lecturer: "TS. Nguy\u1EC5n V\u0103n An", students: 45 },
  { section: "DB202.L08", name: "C\u01A1 s\u1EDF d\u1EEF li\u1EC7u", day: "Th\u1EE9 4", slot: "Ti\u1EBFt 7-9", room: "C-201", lecturer: "TS. Ph\u1EA1m Quang H\u01B0ng", students: 52 },
  { section: "SE302.L03", name: "C\xF4ng ngh\u1EC7 PM", day: "Th\u1EE9 6", slot: "Ti\u1EBFt 4-6", room: "D-102", lecturer: "TS. V\u0169 Th\u1ECB Lan", students: 48 }
];
const emptyRooms = [
  { room: "A-201", building: "To\xE0 A", type: "Ph\xF2ng th\u01B0\u1EDDng", capacity: 45, available: ["Th\u1EE9 2 Ti\u1EBFt 4-6", "Th\u1EE9 3 Ti\u1EBFt 1-3", "Th\u1EE9 5 Ti\u1EBFt 7-9"], floor: 2 },
  { room: "B-302", building: "To\xE0 B", type: "Ph\xF2ng m\xE1y", capacity: 30, available: ["Th\u1EE9 2 Ti\u1EBFt 7-9", "Th\u1EE9 4 Ti\u1EBFt 4-6"], floor: 3 },
  { room: "C-102", building: "To\xE0 C", type: "Ph\xF2ng th\u01B0\u1EDDng", capacity: 60, available: ["Th\u1EE9 3 Ti\u1EBFt 4-6", "Th\u1EE9 6 Ti\u1EBFt 1-3", "Th\u1EE9 6 Ti\u1EBFt 4-6"], floor: 1 },
  { room: "D-201", building: "To\xE0 D", type: "H\u1ED9i tr\u01B0\u1EDDng nh\u1ECF", capacity: 100, available: ["Th\u1EE9 5 Ti\u1EBFt 1-3", "Th\u1EE9 5 Ti\u1EBFt 4-6"], floor: 2 }
];

const getToday = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
};

const StaffLookupPage = () => {
  const [activeTab, setActiveTab] = useState("room-schedule");
  const [building, setBuilding] = useState("all");
  const [room, setRoom] = useState("all");
  const [week, setWeek] = useState("15");
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getToday());

  const tabs = [
    { key: "room-schedule", label: "Tra c\u1EE9u l\u1ECBch ph\xF2ng", icon: Building2 },
    { key: "class-schedule", label: "Tra c\u1EE9u l\u1ECBch h\u1ECDc", icon: CalendarDays },
    { key: "empty-rooms", label: "Danh s\xE1ch ph\xF2ng tr\u1ED1ng", icon: Calendar }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "p-5 md:p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Tra c\u1EE9u l\u1ECBch" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-0.5", children: "Tra c\u1EE9u l\u1ECBch ph\xF2ng, l\u1ECBch h\u1ECDc v\xE0 danh s\xE1ch ph\xF2ng tr\u1ED1ng" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex border-b border-gray-200 overflow-x-auto", children: tabs.map((tab) => {
      const Icon = tab.icon;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            setActiveTab(tab.key);
            setSearched(false);
          },
          className: `flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
            tab.label
          ]
        },
        tab.key
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-4 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-3", children: [
      (activeTab === "room-schedule" || activeTab === "empty-rooms") && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Select, { value: building, onValueChange: setBuilding, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-40 h-9 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "To\xE0 nh\xE0" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "T\u1EA5t c\u1EA3 to\xE0" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "A", children: "To\xE0 A" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "B", children: "To\xE0 B" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "C", children: "To\xE0 C" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "D", children: "To\xE0 D" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: room, onValueChange: setRoom, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-40 h-9 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Ph\xF2ng h\u1ECDc" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "T\u1EA5t c\u1EA3 ph\xF2ng" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "A-301", children: "A-301" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "B-105", children: "B-105" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "C-201", children: "C-201" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "D-102", children: "D-102" })
          ] })
        ] })
      ] }),
      activeTab === "class-schedule" && /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "T\xECm theo m\xE3 l\u1EDBp HP, t\xEAn m\xF4n h\u1ECDc...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9 text-sm"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: week, onValueChange: setWeek, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-36 h-9 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Tu\u1EA7n h\u1ECDc" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: Array.from({ length: 20 }, (_, i) => i + 1).map((w) => /* @__PURE__ */ jsxs(SelectItem, { value: String(w), children: [
          "Tu\u1EA7n ",
          w
        ] }, w)) })
      ] }),
      /* @__PURE__ */ jsx("input", { type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "h-9 px-3 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { onClick: () => setSearched(true), className: "bg-blue-600 hover:bg-blue-700 h-9 text-sm gap-1.5", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
          " T\xECm ki\u1EBFm"
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {setSearched(false); setSelectedDate(getToday());}, className: "h-9 text-sm gap-1.5", children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }) })
      ] })
    ] }) }),
    !searched ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Search, { className: "w-6 h-6 text-blue-400" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-700", children: "Nh\u1EADp \u0111i\u1EC1u ki\u1EC7n v\xE0 nh\u1EA5n T\xECm ki\u1EBFm" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Ch\u1ECDn tu\u1EA7n h\u1ECDc, to\xE0 nh\xE0 ho\u1EB7c ph\xF2ng c\u1EA7n tra c\u1EE9u" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      activeTab === "room-schedule" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-gray-100 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-gray-800", children: [
            "K\u1EBFt qu\u1EA3 tra c\u1EE9u \u2014 Tu\u1EA7n ",
            week
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
            roomScheduleData.length,
            " b\u1EA3n ghi"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-gray-50", children: [
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Ph\xF2ng" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "To\xE0 nh\xE0" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "S\u1EE9c ch\u1EE9a" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Th\u1EDDi gian" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "L\u1EDBp h\u1ECDc ph\u1EA7n" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Gi\u1EA3ng vi\xEAn" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "SV" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "Thao t\xE1c" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: roomScheduleData.map((r, i) => /* @__PURE__ */ jsxs(TableRow, { className: "hover:bg-gray-50 border-b border-gray-100", children: [
            /* @__PURE__ */ jsx(TableCell, { className: "font-semibold text-xs text-blue-700", children: r.room }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-600", children: r.building }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: r.capacity }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-700 whitespace-nowrap", children: r.time }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-700 max-w-[180px]", children: /* @__PURE__ */ jsx("div", { className: "truncate", title: r.course, children: r.course }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-600 max-w-[130px]", children: /* @__PURE__ */ jsx("div", { className: "truncate", title: r.lecturer, children: r.lecturer }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: r.students }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 mx-auto", children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3" }),
              " Chi ti\u1EBFt"
            ] }) })
          ] }, i)) })
        ] }) })
      ] }),
      activeTab === "class-schedule" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-gray-50", children: [
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "M\xE3 l\u1EDBp HP" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "T\xEAn m\xF4n h\u1ECDc" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Th\u1EE9" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Ca h\u1ECDc" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Ph\xF2ng" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600", children: "Gi\u1EA3ng vi\xEAn" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "SV" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs font-semibold text-gray-600 text-center", children: "Thao t\xE1c" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: classScheduleData.map((c) => /* @__PURE__ */ jsxs(TableRow, { className: "hover:bg-gray-50 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs font-bold text-blue-700", children: c.section }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-medium text-gray-800", children: c.name }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-600", children: c.day }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-600", children: c.slot }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-medium text-gray-900", children: c.room }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-gray-600", children: c.lecturer }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center", children: c.students }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 mx-auto", children: [
            /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3" }),
            " Chi ti\u1EBFt"
          ] }) })
        ] }, c.section)) })
      ] }) }) }),
      activeTab === "empty-rooms" && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: emptyRooms.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200 text-center", children: [
        /* @__PURE__ */ jsx(Building2, { className: "w-10 h-10 text-gray-300 mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-500", children: "Kh\xF4ng c\xF3 ph\xF2ng tr\u1ED1ng trong tu\u1EA7n n\xE0y" })
      ] }) : emptyRooms.map((r) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900 text-sm", children: r.room }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
              r.building,
              " \xB7 T\u1EA7ng ",
              r.floor
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full", children: r.type }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
              "SC: ",
              r.capacity
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-gray-600 mb-2", children: [
            "Ca tr\u1ED1ng trong tu\u1EA7n ",
            week,
            ":"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: r.available.map((slot) => /* @__PURE__ */ jsx(Badge, { className: "text-[11px] bg-green-50 text-green-700 hover:bg-green-50 border-green-200 border", children: slot }, slot)) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "mt-3 w-full text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors", children: "\u0110\u1EB7t ph\xF2ng" })
      ] }, r.room)) })
    ] })
  ] });
};
export {
  StaffLookupPage
};
