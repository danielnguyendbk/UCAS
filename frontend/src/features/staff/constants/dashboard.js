import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  ClipboardList,
  ListChecks,
  PlusSquare,
  Search
} from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
const STAFF_STATS = [
  {
    title: "L\u1EDBp h\u1ECDc ph\u1EA7n HK1",
    value: "186",
    sub: "+12 so v\u1EDBi HK tr\u01B0\u1EDBc",
    icon: ClipboardList,
    color: "bg-blue-500",
    text: "text-blue-700"
  },
  {
    title: "\u0110\xE3 ph\xE2n ph\xF2ng",
    value: "161",
    sub: "86.6% t\u1ED5ng l\u1EDBp h\u1ECDc ph\u1EA7n",
    icon: Building2,
    color: "bg-green-500",
    text: "text-green-700"
  },
  {
    title: "Ch\u01B0a ph\xE2n ph\xF2ng",
    value: "25",
    sub: "C\u1EA7n x\u1EED l\xFD tr\u01B0\u1EDBc 15/08",
    icon: AlertTriangle,
    color: "bg-orange-500",
    text: "text-orange-700"
  },
  {
    title: "Y\xEAu c\u1EA7u \u0111\u1EB7t ph\xF2ng",
    value: "8",
    sub: "3 ch\u1EDD duy\u1EC7t, 5 \u0111\xE3 duy\u1EC7t",
    icon: CalendarCheck,
    color: "bg-purple-500",
    text: "text-purple-700"
  }
];
const STAFF_QUICK_ACTIONS = [
  {
    label: "Qu\u1EA3n l\xFD l\u1EDBp h\u1ECDc ph\u1EA7n",
    icon: ClipboardList,
    path: APP_ROUTES.staffSections,
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100"
  },
  {
    label: "Qu\u1EA3n l\xFD th\u1EDDi kh\xF3a bi\u1EC3u",
    icon: ListChecks,
    path: APP_ROUTES.staffSchedule,
    color: "text-indigo-600",
    bg: "bg-indigo-50 hover:bg-indigo-100"
  },
  {
    label: "Ph\xE2n ph\xF2ng & Xung \u0111\u1ED9t",
    icon: Building2,
    path: APP_ROUTES.staffAllocation,
    color: "text-teal-600",
    bg: "bg-teal-50 hover:bg-teal-100"
  },
  {
    label: "Tra c\u1EE9u l\u1ECBch ph\xF2ng",
    icon: Search,
    path: APP_ROUTES.staffLookup,
    color: "text-cyan-600",
    bg: "bg-cyan-50 hover:bg-cyan-100"
  },
  {
    label: "Tra c\u1EE9u l\u1ECBch h\u1ECDc",
    icon: CalendarCheck,
    path: APP_ROUTES.staffLookup,
    color: "text-violet-600",
    bg: "bg-violet-50 hover:bg-violet-100"
  },
  {
    label: "Danh s\xE1ch ph\xF2ng tr\u1ED1ng",
    icon: Building2,
    path: APP_ROUTES.staffLookup,
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100"
  },
  {
    label: "Danh s\xE1ch \u0111\u1EB7t ph\xF2ng",
    icon: ListChecks,
    path: APP_ROUTES.staffBookingList,
    color: "text-rose-600",
    bg: "bg-rose-50 hover:bg-rose-100"
  },
  {
    label: "\u0110\u1EB7t ph\xF2ng kh\u1EA9n c\u1EA5p",
    icon: PlusSquare,
    path: APP_ROUTES.staffBookings,
    color: "text-orange-600",
    bg: "bg-orange-50 hover:bg-orange-100"
  },
  
];
const RECENT_SECTIONS = [
  {
    id: "CS101.L11",
    name: "L\u1EADp tr\xECnh h\u01B0\u1EDBng \u0111\u1ED1i t\u01B0\u1EE3ng",
    credits: 3,
    students: 45,
    room: "A-301",
    day: "Th\u1EE9 2",
    slot: "Ti\u1EBFt 1-3",
    status: "assigned"
  },
  {
    id: "MATH201.L02",
    name: "To\xE1n cao c\u1EA5p 2",
    credits: 4,
    students: 60,
    room: "B-105",
    day: "Th\u1EE9 3",
    slot: "Ti\u1EBFt 4-6",
    status: "assigned"
  },
  {
    id: "NET301.L05",
    name: "M\u1EA1ng m\xE1y t\xEDnh",
    credits: 3,
    students: 38,
    room: "",
    day: "Th\u1EE9 4",
    slot: "Ti\u1EBFt 1-3",
    status: "pending"
  },
  {
    id: "DB202.L08",
    name: "C\u01A1 s\u1EDF d\u1EEF li\u1EC7u",
    credits: 3,
    students: 52,
    room: "C-201",
    day: "Th\u1EE9 4",
    slot: "Ti\u1EBFt 7-9",
    status: "assigned"
  },
  {
    id: "AI401.L01",
    name: "Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o",
    credits: 3,
    students: 35,
    room: "",
    day: "Th\u1EE9 5",
    slot: "Ti\u1EBFt 1-3",
    status: "conflict"
  },
  {
    id: "SE302.L03",
    name: "C\xF4ng ngh\u1EC7 ph\u1EA7n m\u1EC1m",
    credits: 3,
    students: 48,
    room: "D-102",
    day: "Th\u1EE9 6",
    slot: "Ti\u1EBFt 4-6",
    status: "assigned"
  }
];
const STATUS_CONFIG = {
  assigned: { label: "\u0110\xE3 ph\xE2n ph\xF2ng", className: "bg-green-100 text-green-700", icon: CalendarCheck },
  pending: { label: "Ch\u01B0a ph\xE2n ph\xF2ng", className: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  conflict: { label: "Xung \u0111\u1ED9t", className: "bg-red-100 text-red-700", icon: AlertTriangle }
};
export {
  RECENT_SECTIONS,
  STAFF_QUICK_ACTIONS,
  STAFF_STATS,
  STATUS_CONFIG
};
