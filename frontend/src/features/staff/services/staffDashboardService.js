import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";
import { httpClient } from "@/services/httpClient";
import { RECENT_SECTIONS, STAFF_QUICK_ACTIONS, STAFF_STATS } from "../constants/dashboard";

const unwrapList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalize = (value) => String(value || "").trim().toUpperCase();

const getActiveSemester = (semesters) =>
  semesters.find((semester) => normalize(semester.status) === "ACTIVE") ||
  semesters[0] ||
  null;

const toPercent = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
};

const countByStatus = (items, status) =>
  items.filter((item) => normalize(item.status) === status).length;

const getSectionStatus = (section) => {
  const status = normalize(section.allocationStatus);
  if (status === "ASSIGNED") return "assigned";
  if (status === "CONFLICT") return "conflict";
  return "pending";
};

const buildStats = ({ classSections, roomBorrowRequests, activeSemester }) => {
  const totalSections = classSections.length;
  const assignedSections = classSections.filter(
    (section) => getSectionStatus(section) === "assigned",
  ).length;
  const conflictSections = classSections.filter(
    (section) => getSectionStatus(section) === "conflict",
  ).length;
  const pendingSections = Math.max(totalSections - assignedSections - conflictSections, 0);
  const pendingRequests = countByStatus(roomBorrowRequests, "PENDING");
  const approvedRequests = countByStatus(roomBorrowRequests, "APPROVED");
  const assignedPercent = toPercent(assignedSections, totalSections);

  return [
    {
      title: "Lớp học phần",
      value: totalSections.toString(),
      sub: activeSemester?.name || "Theo học kỳ hiện tại",
      icon: ClipboardList,
      color: "bg-blue-500",
      text: "text-blue-700",
    },
    {
      title: "Đã phân phòng",
      value: assignedSections.toString(),
      sub: `${assignedPercent}% tổng lớp học phần`,
      icon: Building2,
      color: "bg-green-500",
      text: "text-green-700",
    },
    {
      title: "Chưa phân phòng",
      value: pendingSections.toString(),
      sub: conflictSections
        ? `${conflictSections} lớp đang xung đột`
        : "Cần xử lý trong học kỳ active",
      icon: AlertTriangle,
      color: "bg-orange-500",
      text: "text-orange-700",
    },
    {
      title: "Yêu cầu đặt phòng",
      value: roomBorrowRequests.length.toString(),
      sub: `${pendingRequests} chờ duyệt, ${approvedRequests} đã duyệt`,
      icon: CalendarCheck,
      color: "bg-purple-500",
      text: "text-purple-700",
    },
  ];
};

const buildProgress = (classSections) => {
  const total = classSections.length;
  const assigned = classSections.filter(
    (section) => getSectionStatus(section) === "assigned",
  ).length;
  const conflicts = classSections.filter(
    (section) => getSectionStatus(section) === "conflict",
  ).length;
  const pending = Math.max(total - assigned - conflicts, 0);

  return {
    total,
    assigned,
    pending,
    conflicts,
    percent: toPercent(assigned, total),
  };
};

const buildRecentSections = (classSections) =>
  classSections.slice(0, 6).map((section) => ({
    id: section.classCode || section.id || "-",
    name: section.courseName || "-",
    credits: section.credits || 0,
    students: section.studentCount ?? section.maxCapacity ?? 0,
    maxCapacity: section.maxCapacity ?? 0,
    room: section.room || "",
    day: section.day || section.dayCode || "-",
    slot: section.schedule || (section.slot ? `Ca ${section.slot}` : "-"),
    status: getSectionStatus(section),
  }));

const filterBySemester = (items, semesterId) => {
  if (!semesterId) return items;
  return items.filter((item) => String(item.semesterId) === String(semesterId));
};

const staffDashboardService = {
  async getSemesters() {
    const response = await httpClient.get("/api/categories/semesters");
    return unwrapList(response);
  },

  async getActiveSemester() {
    const semesters = await this.getSemesters();
    return getActiveSemester(semesters);
  },

  async getClassSections(semesterId) {
    const response = await httpClient.get("/api/staff/class-sections", {
      params: semesterId ? { semesterId } : {},
    });
    return unwrapList(response);
  },

  async getRoomBorrowRequests() {
    const response = await httpClient.get("/api/staff/room-borrow-requests");
    return unwrapList(response);
  },

  async getQuickActions() {
    return STAFF_QUICK_ACTIONS;
  },

  async getDashboardData() {
    let activeSemester = null;
    try {
      activeSemester = await this.getActiveSemester();
    } catch (error) {
      console.error("Không tải được học kỳ active:", error);
    }

    const [classSectionsResult, roomBorrowRequestsResult] = await Promise.allSettled([
      this.getClassSections(activeSemester?.id),
      this.getRoomBorrowRequests(),
    ]);

    const classSections =
      classSectionsResult.status === "fulfilled" ? classSectionsResult.value : [];
    const allRoomBorrowRequests =
      roomBorrowRequestsResult.status === "fulfilled" ? roomBorrowRequestsResult.value : [];
    const roomBorrowRequests = filterBySemester(allRoomBorrowRequests, activeSemester?.id);
    const hasClassSectionData = classSectionsResult.status === "fulfilled";
    const hasRoomBorrowData = roomBorrowRequestsResult.status === "fulfilled";
    const hasDashboardData = hasClassSectionData || hasRoomBorrowData;
    const hasPartialError =
      classSectionsResult.status === "rejected" ||
      roomBorrowRequestsResult.status === "rejected" ||
      !activeSemester;

    return {
      activeSemester,
      stats: hasDashboardData
        ? buildStats({ classSections, roomBorrowRequests, activeSemester })
        : STAFF_STATS,
      progress: hasClassSectionData ? buildProgress(classSections) : buildProgress([]),
      quickActions: await this.getQuickActions(),
      recentSections: hasClassSectionData ? buildRecentSections(classSections) : RECENT_SECTIONS,
      partialError: hasPartialError
        ? "Một số dữ liệu tổng quan chưa tải được, đang hiển thị phần còn lại."
        : "",
    };
  },
};

export {
  staffDashboardService
};
