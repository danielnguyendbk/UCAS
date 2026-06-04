import { AlertTriangle, Info, XCircle } from "lucide-react";
const ALLOCATION_LIST = [
  {
    id: "CS101.L11",
    name: "L\u1EADp tr\xECnh H\u0110T",
    students: 45,
    reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226545",
    assigned: "A-301",
    capacity: 50,
    day: "Th\u1EE9 2",
    slot: "Ti\u1EBFt 1-3",
    status: "ok"
  },
  {
    id: "MATH201.L02",
    name: "To\xE1n cao c\u1EA5p 2",
    students: 60,
    reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226560",
    assigned: "B-105",
    capacity: 65,
    day: "Th\u1EE9 3",
    slot: "Ti\u1EBFt 4-6",
    status: "ok"
  },
  {
    id: "NET301.L05",
    name: "M\u1EA1ng m\xE1y t\xEDnh",
    students: 38,
    reqRoom: "Ph\xF2ng m\xE1y t\xEDnh \u226538",
    assigned: "",
    capacity: 0,
    day: "Th\u1EE9 4",
    slot: "Ti\u1EBFt 1-3",
    status: "unassigned"
  },
  {
    id: "AI401.L01",
    name: "Tr\xED tu\u1EC7 nh\xE2n t\u1EA1o",
    students: 35,
    reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226535",
    assigned: "A-301",
    capacity: 50,
    day: "Th\u1EE9 5",
    slot: "Ti\u1EBFt 1-3",
    status: "conflict"
  },
  {
    id: "SE302.L03",
    name: "C\xF4ng ngh\u1EC7 PM",
    students: 48,
    reqRoom: "Ph\xF2ng th\u01B0\u1EDDng \u226550",
    assigned: "D-102",
    capacity: 55,
    day: "Th\u1EE9 6",
    slot: "Ti\u1EBFt 4-6",
    status: "ok"
  }
];
const CONFLICT_LIST = [
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
const SEVERITY_CONFIG = {
  high: { label: "Nghi\xEAm tr\u1ECDng", className: "bg-red-100 text-red-700", icon: XCircle },
  medium: { label: "Trung b\xECnh", className: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  low: { label: "Th\u1EA5p", className: "bg-yellow-100 text-yellow-700", icon: Info }
};
const CONFLICT_TYPE_CONFIG = {
  room: { label: "Tr\xF9ng ph\xF2ng", color: "bg-red-50 text-red-600 border-red-200" },
  lecturer: { label: "Tr\xF9ng GV", color: "bg-purple-50 text-purple-600 border-purple-200" },
  capacity: { label: "Qu\xE1 s\u1EE9c ch\u1EE9a", color: "bg-orange-50 text-orange-600 border-orange-200" }
};
export {
  ALLOCATION_LIST,
  CONFLICT_LIST,
  CONFLICT_TYPE_CONFIG,
  SEVERITY_CONFIG
};
