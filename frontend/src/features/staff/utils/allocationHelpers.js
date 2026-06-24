const DAY_LABELS = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ nhật",
};

export const formatDayOfWeek = (value) => {
  if (!value) return "—";
  const key = String(value).trim().toUpperCase();
  return DAY_LABELS[key] || value;
};

export const formatSlot = (slotNumber, slotEndNumber) => {
  if (slotNumber == null) return "—";
  if (slotEndNumber != null && Number(slotEndNumber) !== Number(slotNumber)) {
    return `Tiết ${slotNumber}-${slotEndNumber}`;
  }
  return `Tiết ${slotNumber}`;
};

export const formatSchedule = (row) => {
  const day = formatDayOfWeek(row.dayOfWeek);
  const slot = formatSlot(row.slotNumber, row.slotEndNumber);
  return `${day} · ${slot}`;
};

const hasClassroomIdField = (row) =>
  Object.prototype.hasOwnProperty.call(row || {}, "classroomId");

export const isUnassigned = (row) => {
  if (!row) return false;
  if (row.allocationStatus) return row.allocationStatus === "UNASSIGNED";
  if (row.scheduleStatus === "UNASSIGNED" || row.status === "UNASSIGNED") return true;
  return hasClassroomIdField(row) ? row.classroomId == null : !row.assignedRoom;
};

export const isAssigned = (row) => {
  if (!row) return false;
  if (row.allocationStatus) {
    return row.allocationStatus === "ASSIGNED" && row.classroomId != null;
  }
  if (hasClassroomIdField(row)) {
    return row.scheduleStatus === "ASSIGNED" && row.classroomId != null;
  }
  return ["VALID", "CONFLICT", "ASSIGNED"].includes(row.status) && Boolean(row.assignedRoom);
};

export const extractBuilding = (roomCode) => {
  if (!roomCode) return "—";
  const parts = String(roomCode).split("-");
  return parts.length > 1 ? parts[0] : "—";
};

export const getCourseCode = (row) =>
  row.classCode || row.sectionCode?.split(".")?.[0] || "—";

export const CONFLICT_TYPE_LABELS = {
  UNASSIGNED: "Không có phòng phù hợp",
  CAPACITY_EXCEEDED: "Phòng không đủ sức chứa",
  ROOM_TIME_CONFLICT: "Trùng phòng theo giờ và tuần",
  LECTURER_TIME_CONFLICT: "Giảng viên trùng lịch",
  ROOM_TYPE_MISMATCH: "Phòng sai loại yêu cầu",
  ROOM_INACTIVE_OR_DELETED: "Phòng ngừng hoạt động",
  CALENDAR_BLOCK_CONFLICT: "Trùng ngày nghỉ / lịch học vụ",
  INVALID_WEEK_RANGE: "Khoảng tuần không hợp lệ",
  INVALID_TIME_RANGE: "Khoảng thời gian không hợp lệ",
  ROOM_CONFLICT: "Trùng phòng",
  LECTURER_CONFLICT: "Trùng giảng viên",
  CLASS_CONFLICT: "Trùng lớp hành chính",
  CALENDAR_BLOCK: "Trùng ngày nghỉ / lịch học vụ",
};

export const SEVERITY_LABELS = {
  HIGH: "Nghiêm trọng",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

export const getConflictSuggestion = (conflictType) => {
  const suggestions = {
    UNASSIGNED: "Chọn một phòng phù hợp hoặc điều chỉnh yêu cầu phòng trong dữ liệu học phần.",
    CAPACITY_EXCEEDED: "Chọn phòng có sức chứa lớn hơn; nếu không có, Admin cần điều chỉnh dữ liệu hoặc chia lớp qua file import.",
    ROOM_TIME_CONFLICT: "Chọn phòng khác hoặc điều chỉnh thời gian học bằng file import.",
    LECTURER_TIME_CONFLICT: "Admin cần đổi giờ, đổi giảng viên hoặc import lại thời khóa biểu.",
    ROOM_TYPE_MISMATCH: "Chọn đúng loại phòng yêu cầu hoặc đề nghị Admin sửa yêu cầu phòng.",
    ROOM_INACTIVE_OR_DELETED: "Chọn phòng đang hoạt động khác.",
    CALENDAR_BLOCK_CONFLICT: "Admin cần đổi lịch học ra ngoài ngày nghỉ hoặc khoảng khóa lịch.",
    INVALID_WEEK_RANGE: "Admin cần sửa khoảng tuần trong file import.",
    INVALID_TIME_RANGE: "Admin cần sửa tiết hoặc thời gian bắt đầu/kết thúc trong file import.",
    ROOM_CONFLICT: "Chọn phòng khác hoặc điều chỉnh thời gian học bằng file import.",
    LECTURER_CONFLICT: "Admin cần đổi giờ, đổi giảng viên hoặc import lại thời khóa biểu.",
    CLASS_CONFLICT: "Admin cần điều chỉnh lịch của lớp hành chính trong file import.",
    CALENDAR_BLOCK: "Admin cần đổi lịch học ra ngoài ngày nghỉ hoặc khoảng khóa lịch.",
  };

  return suggestions[conflictType] || "Kiểm tra lại lịch học, yêu cầu phòng và dữ liệu import trước khi gửi duyệt.";
};
