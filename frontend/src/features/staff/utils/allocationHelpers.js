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

export const formatSlot = (slotNumber) => {
  if (slotNumber == null) return "—";
  return `Tiết ${slotNumber}`;
};

export const formatSchedule = (row) => {
  const day = formatDayOfWeek(row.dayOfWeek);
  const slot = formatSlot(row.slotNumber);
  return `${day} · ${slot}`;
};

export const isUnassigned = (row) =>
  row.status === "UNASSIGNED" || !row.assignedRoom;

export const isAssigned = (row) =>
  (row.status === "VALID" || row.status === "ASSIGNED") &&
  Boolean(row.assignedRoom);

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
