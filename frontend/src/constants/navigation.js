import {
  ArrowLeftRight,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  History,
  Key,
  LayoutDashboard,
  PlusSquare,
  School,
  Settings,
  Upload,
  Wrench,
  ShieldAlert,
} from "lucide-react";
import { APP_ROUTES } from "./routes";

const ROLE_LABELS = {
  Admin: "Quản trị viên",
  Staff: "Giáo vụ",
  Lecturer: "Giảng viên",
  Employee: "Nhân viên CSVC",
  Student: "Sinh viên",
};

const ROLE_BADGE_CLASSES = {
  Admin: "bg-red-100 text-red-700",
  Staff: "bg-blue-100 text-blue-700",
  Lecturer: "bg-purple-100 text-purple-700",
  Employee: "bg-orange-100 text-orange-700",
  Student: "bg-green-100 text-green-700",
};

const NAVIGATION_BY_ROLE = {
  Admin: [
    {
      type: "group",
      id: "admin-overview",
      label: "Tổng quan",
      icon: LayoutDashboard,
      children: [
        {
          id: "admin-dashboard",
          label: "Bảng điều khiển",
          path: APP_ROUTES.adminDashboard,
        },
      ],
    },
    {
      type: "group",
      id: "admin-training",
      label: "Quản lý đào tạo",
      icon: GraduationCap,
      children: [
        { id: "admin-courses", label: "Môn học", path: APP_ROUTES.adminCourses },
        { id: "admin-lecturers", label: "Giảng viên", path: APP_ROUTES.adminLecturers },
        { id: "admin-sections", label: "Lớp học phần", path: APP_ROUTES.adminSections },
      ],
    },
    {
      type: "group",
      id: "admin-timetable",
      label: "Thời khóa biểu",
      icon: Calendar,
      children: [
        {
          id: "admin-timetable-view",
          label: "Thời khóa biểu toàn trường",
          path: APP_ROUTES.adminTimetable,
        },
        {
          id: "admin-timetable-import",
          label: "Import thời khóa biểu",
          path: APP_ROUTES.adminTimetableImport,
        },
        {
          id: "admin-timetable-approval",
          label: "Duyệt & công bố TKB",
          path: APP_ROUTES.adminTimetableApproval,
        },
        {
          id: "admin-calendar-blocks",
          label: "Ngày nghỉ & lịch học vụ",
          path: APP_ROUTES.adminCalendarBlocks,
        },
      ],
    },
    {
      type: "group",
      id: "admin-exams",
      label: "Thi cử",
      icon: ClipboardCheck,
      children: [
        {
          id: "admin-exams-list",
          label: "Lịch thi",
          path: APP_ROUTES.adminExams,
        },
        {
          id: "admin-exams-import",
          label: "Import lịch thi",
          path: APP_ROUTES.adminExamImport,
        },
        {
          id: "admin-exams-approval",
          label: "Duyệt & công bố lịch thi",
          path: APP_ROUTES.adminExamApproval,
        },
      ],
    },
    {
      type: "group",
      id: "admin-facilities",
      label: "Cơ sở vật chất",
      icon: School,
      children: [
        { id: "admin-rooms", label: "Phòng học", path: APP_ROUTES.adminRooms },
        {
          id: "admin-facility-staff",
          label: "Nhân viên CSVC",
          path: APP_ROUTES.adminFacilityStaff,
        },
      ],
    },
    {
      type: "group",
      id: "admin-system",
      label: "Hệ thống",
      icon: Settings,
      children: [
        { id: "admin-reports", label: "Báo cáo", path: APP_ROUTES.adminReports },
        { id: "admin-users", label: "Tài khoản người dùng", path: APP_ROUTES.adminUsers },
        { id: "admin-audit-logs", label: "Nhật ký hệ thống", path: APP_ROUTES.adminAuditLogs },
        { id: "admin-settings", label: "Cài đặt hệ thống", path: APP_ROUTES.adminSettings },
      ],
    },
  ],

  Staff: [
    {
      type: "group",
      id: "staff-overview",
      label: "Tổng quan",
      icon: LayoutDashboard,
      children: [
        {
          id: "staff-dashboard",
          label: "Bảng điều khiển",
          path: APP_ROUTES.staffDashboard,
        },
      ],
    },
    {
      type: "group",
      id: "staff-timetable",
      label: "Thời khóa biểu",
      icon: Calendar,
      children: [
        {
          id: "staff-timetable-view",
          label: "Thời khóa biểu toàn trường",
          path: APP_ROUTES.staffTimetable,
        },
        {
          id: "staff-auto-assignment",
          label: "Phân phòng học",
          path: APP_ROUTES.staffAutoAssignment,
        },
        {
          id: "staff-class-sections",
          label: "Lớp học phần",
          path: APP_ROUTES.staffClassSections,
        },
      ],
    },
    {
      type: "group",
      id: "staff-exams",
      label: "Thi cử",
      icon: ClipboardCheck,
      children: [
        {
            id: "staff-exam-schedule",
            label: "Lịch thi phòng học",
            path: APP_ROUTES.staffExamSchedule,
        },
        {
          id: "staff-exam-allocation",
          label: "Phân phòng thi",
          path: APP_ROUTES.staffExamAllocation,
        },

      ],
    },
    {
      type: "group",
      id: "staff-room-operations",
      label: "Đặt / đổi phòng",
      icon: PlusSquare,
      children: [
        {
          id: "staff-emergency-room-change",
          label: "Đặt/đổi phòng khẩn cấp",
          path: APP_ROUTES.staffEmergencyRoomChange,
          badge: "Gấp",
        },
        {
          id: "staff-booking-list",
          label: "Danh sách đặt phòng",
          path: APP_ROUTES.staffBookingList,
        },
        {
          id: "staff-room-change-list",
          label: "Danh sách đổi phòng",
          path: APP_ROUTES.staffRoomChangeList,
        },
      ],
    },
    {
      type: "group",
      id: "staff-maintenance",
      label: "Sửa chữa",
      icon: Wrench,
      children: [
        {
          id: "staff-maintenance-requests",
          label: "Yêu cầu sửa chữa",
          path: APP_ROUTES.staffMaintenanceRequests,
        },
      ],
    },
  ],

  Employee: [
    {
      type: "group",
      id: "facility-operations",
      label: "Vận hành phòng",
      icon: Key,
      children: [
        {
          id: "facility-open-close",
          label: "Mở khóa phòng",
          path: APP_ROUTES.facilityOpenClose,
          badge: "Hôm nay",
        },
        {
          id: "facility-timetable",
          label: "Thời khóa biểu toàn trường",
          path: APP_ROUTES.facilityTimetable,
        },
      ],
    },
    {
      type: "group",
      id: "facility-maintenance",
      label: "Sửa chữa",
      icon: Wrench,
      children: [
        {
          id: "facility-maintenance-request",
          label: "Gửi yêu cầu sửa chữa",
          path: APP_ROUTES.facilityMaintenanceRequest,
        },
        {
          id: "facility-issues",
          label: "Lịch sử sự cố sửa chữa",
          path: APP_ROUTES.facilityIssues,
        },
      ],
    },
  ],

  Lecturer: [
    {
      type: "group",
      id: "lecturer-teaching",
      label: "Giảng dạy",
      icon: CalendarCheck,
      children: [
        {
          id: "lecturer-timetable",
          label: "Thời khóa biểu",
          path: APP_ROUTES.lecturerTimetable,
        },
        {
          id: "lecturer-room-change-request",
          label: "Xin đổi phòng",
          path: APP_ROUTES.lecturerRoomChangeRequest,
        },
        {
          id: "lecturer-room-change-list",
          label: "Trạng thái đổi phòng",
          path: APP_ROUTES.lecturerRoomChangeList,
        },
      ],
    },
    {
      type: "group",
      id: "lecturer-exams",
      label: "Thi cử",
      icon: ClipboardCheck,
      children: [
        {
          id: "lecturer-exams",
          label: "Lịch coi thi",
          path: APP_ROUTES.lecturerExams,
        },
      ],
    },
    {
      type: "group",
      id: "lecturer-booking",
      label: "Đặt phòng",
      icon: PlusSquare,
      children: [
        {
          id: "lecturer-room-booking",
          label: "Yêu cầu đặt phòng",
          path: APP_ROUTES.lecturerRoomBooking,
        },
        {
          id: "lecturer-booking-history",
          label: "Danh sách yêu cầu đặt phòng",
          path: APP_ROUTES.lecturerBookingHistory,
        },
      ],
    },
    {
      type: "group",
      id: "lecturer-maintenance",
      label: "Sửa chữa",
      icon: Wrench,
      children: [
        {
          id: "lecturer-maintenance-request",
          label: "Yêu cầu sửa chữa",
          path: APP_ROUTES.lecturerMaintenanceRequest,
        },
        {
          id: "lecturer-maintenance-history",
          label: "Lịch sử sửa chữa",
          path: APP_ROUTES.lecturerMaintenanceHistory,
        },
      ],
    },
  ],

  Student: [
    {
      type: "group",
      id: "student-study",
      label: "Học tập",
      icon: GraduationCap,
      children: [
        {
          id: "student-timetable",
          label: "Thời khóa biểu",
          path: APP_ROUTES.studentTimetable,
        },
        {
          id: "student-exams",
          label: "Lịch thi",
          path: APP_ROUTES.studentExams,
        },
      ],
    },
    {
      type: "group",
      id: "student-booking",
      label: "Đặt phòng",
      icon: PlusSquare,
      children: [
        {
          id: "student-room-booking",
          label: "Đặt phòng",
          path: APP_ROUTES.studentRoomBooking,
        },
        {
          id: "student-booking-history",
          label: "DS yêu cầu đặt phòng",
          path: APP_ROUTES.studentBookingHistory,
        },
      ],
    },
    {
      type: "group",
      id: "student-maintenance",
      label: "Sửa chữa",
      icon: Wrench,
      children: [
        {
          id: "student-maintenance-request",
          label: "Yêu cầu sửa chữa",
          path: APP_ROUTES.studentMaintenanceRequest,
        },
        {
          id: "student-maintenance-history",
          label: "Lịch sử sửa chữa",
          path: APP_ROUTES.studentMaintenanceHistory,
        },
      ],
    },
  ],
};

export { NAVIGATION_BY_ROLE, ROLE_BADGE_CLASSES, ROLE_LABELS };
