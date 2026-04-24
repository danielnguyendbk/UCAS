import {
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PlusSquare,
  School,
  Search,
  Settings,
  UserCog,
  Users,
  Wand2,
  Wrench,
  History,
  ArrowLeftRight,
  Zap,
  Key
} from "lucide-react";
import { APP_ROUTES } from "./routes";
const ROLE_LABELS = {
  Admin: "Qu\u1EA3n tr\u1ECB vi\xEAn",
  Staff: "Gi\xE1o v\u1EE5",
  Lecturer: "Gi\u1EA3ng vi\xEAn",
  Employee: "Nh\xE2n vi\xEAn",
  Student: "Sinh vi\xEAn"
};
const ROLE_BADGE_CLASSES = {
  Admin: "bg-red-100 text-red-700",
  Staff: "bg-blue-100 text-blue-700",
  Lecturer: "bg-purple-100 text-purple-700",
  Employee: "bg-orange-100 text-orange-700",
  Student: "bg-green-100 text-green-700"
};
const NAVIGATION_BY_ROLE = {
  Admin: [
    { icon: LayoutDashboard, label: "T\u1ED5ng quan", path: APP_ROUTES.home },
    { icon: School, label: "Ph\xF2ng h\u1ECDc", path: APP_ROUTES.classrooms },
    { icon: BookOpen, label: "M\xF4n h\u1ECDc", path: APP_ROUTES.courses },
    { icon: Users, label: "Gi\u1EA3ng vi\xEAn", path: APP_ROUTES.lecturers },
    { icon: Calendar, label: "Th\u1EDDi kh\xF3a bi\u1EC3u", path: APP_ROUTES.timetable },
    { icon: CalendarDays, label: "L\u1ECBch tu\u1EA7n", path: APP_ROUTES.weeklySchedule },
    { icon: Wand2, label: "Ph\xE2n c\xF4ng t\u1EF1 \u0111\u1ED9ng", path: APP_ROUTES.autoAssignment },
    { icon: FileText, label: "B\xE1o c\xE1o", path: APP_ROUTES.reports },
    { icon: UserCog, label: "Qu\u1EA3n l\xFD ng\u01B0\u1EDDi d\xF9ng", path: APP_ROUTES.userManagement },
    { icon: Settings, label: "C\xE0i \u0111\u1EB7t", path: APP_ROUTES.settings }
  ],
  Staff: [
    { icon: LayoutDashboard, label: "T\u1ED5ng quan", path: APP_ROUTES.staffDashboard },
    { icon: ClipboardList, label: "L\u1EDBp h\u1ECDc ph\u1EA7n", path: APP_ROUTES.staffSections },
    { icon: Calendar, label: "Th\u1EDDi kh\xF3a bi\u1EC3u", path: APP_ROUTES.staffSchedule },
    { icon: Building2, label: "Ph\xE2n ph\xF2ng & Xung \u0111\u1ED9t", path: APP_ROUTES.staffAllocation },
    { icon: Search, label: "Tra c\u1EE9u l\u1ECBch", path: APP_ROUTES.staffLookup },
    { icon: PlusSquare, label: "\u0110\u1EB7t ph\xF2ng kh\u1EA9n c\u1EA5p", path: APP_ROUTES.staffBookings, badge: "M\u1EDBi" },
    { icon: ClipboardCheck, label: "Danh s\xE1ch \u0111\u1EB7t ph\xF2ng", path: APP_ROUTES.staffBookingList },
    { icon: Zap, label: "\u0110\u1ED5i ph\xF2ng kh\u1EA9n c\u1EA5p", path: APP_ROUTES.staffEmergencyRoomChange, badge: "G\u1EA5p" },
    { icon: Building2, label: "Danh s\xE1ch \u0111\u1ED5i ph\xF2ng", path: APP_ROUTES.staffRoomChangeList },
    { type: "divider", label: "Qu\u1EA3n l\xFD CSVC" },
    { icon: Wrench, label: "Qu\u1EA3n l\xFD s\u1EEDa ch\u1EEFa", path: APP_ROUTES.staffMaintenanceList, badge: "M\u1EDBi" }
  ],
  Lecturer: [
    { icon: CalendarCheck, label: "L\u1ECBch d\u1EA1y c\u1EE7a t\xF4i", path: APP_ROUTES.lecturerSchedule },
    { type: "divider", label: "\u0110\u1EB7t ph\xF2ng" },
    { icon: PlusSquare, label: "Y\xEAu c\u1EA7u \u0111\u1EB7t ph\xF2ng", path: APP_ROUTES.lecturerBooking },
    { icon: ClipboardList, label: "DS y\xEAu c\u1EA7u \u0111\u1EB7t ph\xF2ng", path: APP_ROUTES.lecturerBookingHistory },
    { type: "divider", label: "S\u1EEDa ch\u1EEFa" },
    { icon: Wrench, label: "Y\xEAu c\u1EA7u s\u1EEDa ch\u1EEFa", path: APP_ROUTES.lecturerMaintenanceRequest },
    { icon: History, label: "L\u1ECBch s\u1EED s\u1EEDa ch\u1EEFa", path: APP_ROUTES.lecturerMaintenanceHistory },
    { type: "divider", label: "\u0110\u1ED5i ph\xF2ng" },
    { icon: ArrowLeftRight, label: "Xin \u0111\u1ED5i ph\xF2ng", path: APP_ROUTES.lecturerRoomChangeRequest },
    { icon: ClipboardCheck, label: "Tr\u1EA1ng th\xE1i \u0111\u1ED5i ph\xF2ng", path: APP_ROUTES.lecturerRoomChangeList }
  ],
  Employee: [
    { icon: Key, label: "X\xE1c nh\u1EADn m\u1EDF c\u1EEDa", path: APP_ROUTES.employeeRoomUnlock, badge: "M\u1EDBi" },
    { icon: Eye, label: "L\u1ECBch s\u1EED d\u1EE5ng ph\xF2ng", path: APP_ROUTES.employeeUsage },
    { type: "divider", label: "S\u1EEDa ch\u1EEFa" },
    { icon: Wrench, label: "Y\xEAu c\u1EA7u s\u1EEDa ch\u1EEFa", path: APP_ROUTES.employeeMaintenanceRequest },
    { icon: History, label: "L\u1ECBch s\u1EED s\u1EEDa ch\u1EEFa", path: APP_ROUTES.employeeMaintenanceHistory }
  ],
  Student: [
    { icon: GraduationCap, label: "Lịch học của tôi", path: APP_ROUTES.studentSchedule },
    { type: "divider", label: "Đặt phòng" },
    { icon: PlusSquare, label: "Yêu cầu đặt phòng", path: APP_ROUTES.studentBooking },
    { icon: ClipboardList, label: "DS yêu cầu đặt phòng", path: APP_ROUTES.studentBookingHistory },
    { type: "divider", label: "Sửa chữa" },
    { icon: Wrench, label: "Yêu cầu sửa chữa", path: APP_ROUTES.studentMaintenanceRequest },
    { icon: History, label: "Lịch sử sửa chữa", path: APP_ROUTES.studentMaintenanceHistory }
  ]
};
export {
  NAVIGATION_BY_ROLE,
  ROLE_BADGE_CLASSES,
  ROLE_LABELS
};
