import { CheckCircle, Clock, XCircle } from "lucide-react";

const ROOM_CHANGE_STORAGE_KEY = "staff_room_change_requests";

const toDateVN = (date = new Date()) => date.toLocaleDateString("vi-VN");
const toDateTimeVN = (date = new Date()) => date.toLocaleString("vi-VN");

const ROOM_CHANGE_MOCK_REQUESTS = [
  {
    id: "RCR-2026-001",
    requester: "Nguyen Van Giang",
    requesterRole: "lecturer",
    lecturerId: "GV001",
    sectionCode: "SE304.L21",
    courseName: "Kiem thu phan mem",
    currentRoom: "A-301",
    requestedRoom: "A-305",
    date: "24/04/2026",
    slot: "Tiet 1-3",
    reason: "Phong hien tai qua tai, can phong suc chua lon hon",
    created: "23/04/2026",
    status: "pending",
    scope: "session",
    date: "24/04/2026",
    slot: "Tiet 1-3",
    rejectReason: "",
    approver: "",
    processedAt: ""
  },
  {
    id: "RCR-2026-002",
    requester: "Le Thi Thu",
    requesterRole: "lecturer",
    lecturerId: "GV002",
    sectionCode: "AI401.L03",
    courseName: "Tri tue nhan tao",
    currentRoom: "B-201",
    requestedRoom: "B-203",
    scope: "weeks",
    fromWeek: "3",
    toWeek: "6",
    reason: "Can phong co may chieu de demo mo hinh",
    created: "22/04/2026",
    status: "approved",
    rejectReason: "",
    approver: "STAFF",
    processedAt: "22/04/2026 09:30:00"
  },
  {
    id: "RCR-2026-003",
    requester: "Pham Minh Khang",
    requesterRole: "lecturer",
    lecturerId: "GV003",
    sectionCode: "DB202.L08",
    courseName: "Co so du lieu",
    currentRoom: "C-102",
    requestedRoom: "C-104",
    scope: "semester",
    fromWeek: "8",
    reason: "Phong C-102 dang bao tri he thong dien",
    created: "22/04/2026",
    status: "rejected",
    rejectReason: "Phong de xuat da duoc phan cho lop khac o cung khung gio",
    approver: "STAFF",
    processedAt: "22/04/2026 15:10:00"
  }
];

const getBrowserStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
};

const normalizeRequests = (value) => (Array.isArray(value) ? value : []);

const nextRequestId = (requests) => {
  const year = new Date().getFullYear();
  const next = requests.length + 1;
  return `RCR-${year}-${String(next).padStart(3, "0")}`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Da duyet",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: CheckCircle
      };
    case "rejected":
      return {
        label: "Tu choi",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: XCircle
      };
    default:
      return {
        label: "Cho duyet",
        className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        icon: Clock
      };
  }
};

const loadRoomChangeRequests = () => {
  const storage = getBrowserStorage();
  if (!storage) return ROOM_CHANGE_MOCK_REQUESTS;

  const raw = storage.getItem(ROOM_CHANGE_STORAGE_KEY);
  if (!raw) {
    storage.setItem(ROOM_CHANGE_STORAGE_KEY, JSON.stringify(ROOM_CHANGE_MOCK_REQUESTS));
    return ROOM_CHANGE_MOCK_REQUESTS;
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeRequests(parsed);
    if (normalized.length === 0) {
      storage.setItem(ROOM_CHANGE_STORAGE_KEY, JSON.stringify(ROOM_CHANGE_MOCK_REQUESTS));
      return ROOM_CHANGE_MOCK_REQUESTS;
    }
    return normalized;
  } catch {
    storage.setItem(ROOM_CHANGE_STORAGE_KEY, JSON.stringify(ROOM_CHANGE_MOCK_REQUESTS));
    return ROOM_CHANGE_MOCK_REQUESTS;
  }
};

const saveRoomChangeRequests = (requests) => {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.setItem(ROOM_CHANGE_STORAGE_KEY, JSON.stringify(normalizeRequests(requests)));
};

const buildRoomChangeRequest = (payload, existingRequests = []) => ({
  id: nextRequestId(existingRequests),
  requester: payload.requester,
  requesterRole: "lecturer",
  lecturerId: payload.lecturerId,
  sectionCode: payload.sectionCode,
  courseName: payload.courseName,
  currentRoom: payload.currentRoom,
  requestedRoom: payload.requestedRoom,
  date: payload.date,
  slot: payload.slot,
  reason: payload.reason,
  created: toDateVN(),
  status: "pending",
  rejectReason: "",
  approver: "",
  processedAt: ""
});

export {
  ROOM_CHANGE_STORAGE_KEY,
  ROOM_CHANGE_MOCK_REQUESTS,
  toDateVN,
  toDateTimeVN,
  getStatusConfig,
  loadRoomChangeRequests,
  saveRoomChangeRequests,
  buildRoomChangeRequest
};
