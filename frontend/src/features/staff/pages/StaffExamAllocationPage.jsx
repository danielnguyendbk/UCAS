import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { httpClient } from "@/services/httpClient";

const PAGE_SIZE = 10;
const ADMIN_NOTE_MAX_LENGTH = 255;

const WORKFLOW_TABS = [
  { value: "pending", label: "Chờ phân phòng" },
  { value: "assigned", label: "Đã phân phòng" },
  { value: "conflicts", label: "Xung đột" },
  { value: "submit", label: "Gửi duyệt" },
];

const VALID_TABS = new Set(WORKFLOW_TABS.map((tab) => tab.value));

const STATUS_LABELS = {
  DRAFT: "Nháp",
  NEEDS_ROOM: "Chờ phân phòng",
  ROOM_ASSIGNED: "Đã phân phòng",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ Admin duyệt",
  PUBLISHED: "Đã công bố",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  SCHEDULED: "Đã công bố",
  LOCKED: "Đã khóa",
  VALIDATING: "Đang kiểm tra",
};

const STATUS_BADGE_CLASSES = {
  DRAFT: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  NEEDS_ROOM: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  ROOM_ASSIGNED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  CONFLICT: "bg-red-100 text-red-800 hover:bg-red-100",
  READY_FOR_APPROVAL: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  PUBLISHED: "bg-green-100 text-green-800 hover:bg-green-100",
  CANCELLED: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  COMPLETED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  SCHEDULED: "bg-green-100 text-green-800 hover:bg-green-100",
  LOCKED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  VALIDATING: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
};

const CONFLICT_TYPE_LABELS = {
  MISSING_ROOM: "Chưa có phòng thi",
  ROOM_EXAM_CONFLICT: "Trùng phòng ",
  ROOM_CLASS_CONFLICT: "Trùng lịch học",
  ROOM_BORROW_CONFLICT: "Trùng lịch mượn phòng",
  CAPACITY_EXCEEDED: "Không đủ sức chứa",
  ROOM_INACTIVE_OR_DELETED: "Phòng không hoạt động",
  PROCTOR_TIME_CONFLICT: "Giám thị trùng lịch",
  STUDENT_EXAM_CONFLICT: "Sinh viên trùng lịch thi",
  CALENDAR_BLOCK_CONFLICT: "Ngày thi nằm trong lịch nghỉ",
  INVALID_EXAM_TIME: "Thời gian thi không hợp lệ",
  OUT_OF_SEMESTER_RANGE: "Ngày thi ngoài học kỳ",
};

const READ_ONLY_STATUSES = new Set([
  "PUBLISHED",
  "SCHEDULED",
  "LOCKED",
  "CANCELLED",
  "COMPLETED",
]);

const normalize = (value) => String(value || "").trim().toUpperCase();

const getResponseData = (response) => response?.data?.data ?? response?.data ?? null;

const getResponseList = (response) => {
  const payload = getResponseData(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const pick = (object, keys, fallback = "") => {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "-";
  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
};

const paginate = (items, page) => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

const requestWithFallback = async (requests) => {
  let lastError;

  for (const request of requests) {
    try {
      const { method = "post", url, data, config } = request;
      return await httpClient[method](url, data, config);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (![404, 405].includes(status)) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getErrorMessage = (error, fallback = "Thao tác thất bại. Vui lòng thử lại.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeSemester = (semester) => ({
  id: String(pick(semester, ["semesterId", "id"])),
  name: pick(semester, ["name", "semesterName"], `Học kỳ #${pick(semester, ["semesterId", "id"])}`),
  status: normalize(pick(semester, ["status"])),
});

const normalizeExam = (exam) => {
  const status = normalize(pick(exam, ["status", "examStatus"], "DRAFT"));
  const roomCode = pick(exam, ["classroomCode", "roomCode", "assignedRoom", "classroomName"]);
  const buildingCode = pick(exam, ["buildingCode", "buildingName"]);
  const examId = pick(exam, ["examId", "id"]);

  return {
    ...exam,
    examId,
    id: examId,
    courseCode: pick(exam, ["courseCode", "subjectCode", "code"]),
    courseName: pick(exam, ["courseName", "subjectName", "name"]),
    sectionCode: pick(exam, ["sectionCode", "classCode", "className"]),
    examDate: pick(exam, ["examDate", "date"]),
    startTime: pick(exam, ["startTime", "start_time"]),
    endTime: pick(exam, ["endTime", "end_time"]),
    roomCode,
    buildingCode,
    classroomId: pick(exam, ["classroomId", "roomId"]),
    studentCount: pick(exam, ["studentCount", "enrolledCount", "maxCapacity"]),
    proctorId: pick(exam, ["proctorId", "proctorLecturerId", "mainProctorId", "lecturerId"]),
    proctorCode: pick(exam, ["proctorCode", "lecturerCode", "mainProctorCode"]),
    proctorName: pick(exam, ["proctorName", "proctorLecturerName", "lecturerName", "mainProctorName", "fullName"]),
    note: pick(exam, ["note", "notes", "adminNote", "staffNote"]),
    examType: normalize(pick(exam, ["examType"], "FINAL")),
    examMethod: normalize(pick(exam, ["examMethod"])),
    conflictReason: pick(exam, ["conflictReason", "validationMessage", "reason"]),
    validationStatus: normalize(pick(exam, ["validationStatus"], "NOT_CHECKED")),
    status,
  };
};

const normalizeConflict = (conflict) => ({
  ...conflict,
  examId: pick(conflict, ["examId", "id"]),
  conflictType: normalize(pick(conflict, ["conflictType", "type"], "CONFLICT")),
  description: pick(conflict, ["description", "message", "conflictReason", "reason"]),
  courseCode: pick(conflict, ["courseCode", "subjectCode", "code"]),
  courseName: pick(conflict, ["courseName", "subjectName", "name"]),
  sectionCode: pick(conflict, ["sectionCode", "classCode", "className"]),
  roomCode: pick(conflict, ["classroomCode", "roomCode", "assignedRoom"]),
  examDate: pick(conflict, ["examDate", "date"]),
  startTime: pick(conflict, ["startTime", "start_time"]),
  endTime: pick(conflict, ["endTime", "end_time"]),
  note: pick(conflict, ["note", "notes", "adminNote", "staffNote"]),
});

const isUnassignedExam = (exam) =>
  !exam.roomCode || ["DRAFT", "NEEDS_ROOM"].includes(normalize(exam.status));

const isAssignedExam = (exam) =>
  Boolean(exam.roomCode) &&
  ["ROOM_ASSIGNED", "READY_FOR_APPROVAL", "PUBLISHED", "SCHEDULED", "LOCKED", "COMPLETED"].includes(normalize(exam.status));

const examMatchesSearch = (exam, normalizedSearch) => {
  if (!normalizedSearch) return true;
  return [
    exam.courseCode,
    exam.courseName,
    exam.sectionCode,
    exam.roomCode,
    exam.buildingCode,
    exam.proctorName,
    exam.conflictReason,
  ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
};

const buildExamAdminNoteTemplate = (conflict, exam) => {
  const conflictType = CONFLICT_TYPE_LABELS[conflict.conflictType] || conflict.conflictType || "CONFLICT";
  const note = [
    `[STAFF_SUGGESTION] ${exam.courseCode || conflict.courseCode || "-"} - ${exam.courseName || conflict.courseName || "-"}`,
    `Thi: ${formatDate(exam.examDate || conflict.examDate)} ${formatTime(exam.startTime || conflict.startTime)}-${formatTime(exam.endTime || conflict.endTime)}. Phong: ${exam.roomCode || conflict.roomCode || "chua co"}.`,
    `Loi: ${conflictType}. ${conflict.description || exam.conflictReason || "Can Admin kiem tra."}`,
  ].join("\n");

  return note.length > ADMIN_NOTE_MAX_LENGTH
    ? `${note.slice(0, ADMIN_NOTE_MAX_LENGTH - 3)}...`
    : note;
};

const StatusBadge = ({ status }) => {
  const normalized = normalize(status);
  return (
    <Badge className={STATUS_BADGE_CLASSES[normalized] || "bg-gray-100 text-gray-700 hover:bg-gray-100"}>
      {STATUS_LABELS[normalized] || status || "-"}
    </Badge>
  );
};

const NONE_SELECT_VALUE = "__NONE__";
const MAX_DROPDOWN_ITEMS = 80;

const toSelectValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return NONE_SELECT_VALUE;
  return String(value);
};

const getRoomId = (room) => pick(room, ["classroomId", "id", "roomId"]);
const getRoomCode = (room) => pick(room, ["classroomCode", "roomCode", "roomNumber", "code"]);
const getRoomValue = (room) => toSelectValue(getRoomId(room) || getRoomCode(room));
const getRoomLabel = (room) => {
  const code = getRoomCode(room) || `Phòng #${getRoomId(room) || "?"}`;
  const building = pick(room, ["buildingCode", "buildingName"]);
  const capacity = pick(room, ["capacity"]);
  const type = pick(room, ["roomType", "classroomType"]);
  return [code, building && `Tòa ${building}`, capacity && `${capacity} SV`, type].filter(Boolean).join(" · ");
};

const getProctorId = (lecturer) => pick(lecturer, ["lecturerId", "id", "proctorId", "userId"]);
const getProctorCode = (lecturer) => pick(lecturer, ["lecturerCode", "proctorCode", "code", "username"]);
const getProctorName = (lecturer) => pick(lecturer, ["fullName", "lecturerName", "proctorName", "name"]);
const getProctorValue = (lecturer) => toSelectValue(getProctorId(lecturer) || getProctorCode(lecturer));
const getProctorLabel = (lecturer) => {
  const code = getProctorCode(lecturer);
  const name = getProctorName(lecturer);
  const department = pick(lecturer, ["departmentCode", "departmentName"]);
  return [code, name, department].filter(Boolean).join(" · ") || `Giảng viên #${getProctorId(lecturer) || "?"}`;
};

const optionMatches = (item, query, keys) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return keys.some((key) => String(item?.[key] || "").toLowerCase().includes(normalizedQuery));
};

const EmptyRow = ({ colSpan, children = "Không có dữ liệu phù hợp." }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-500">
      {children}
    </td>
  </tr>
);

const LoadingRows = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-500">
      <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
      Đang tải dữ liệu...
    </td>
  </tr>
);

const ExamAllocationTable = ({
  items,
  isLoading,
  onViewExam,
  onEditExam,
  onCancelExam,
  readOnly,
  showConflict = false,
}) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] table-fixed text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="w-[90px] px-4 py-3">Mã môn</th>
            <th className="w-[120px] px-4 py-3">Tên môn học</th>
            <th className="w-[120px] px-4 py-3">Lớp/Nhóm</th>
            <th className="w-[120px] px-4 py-3">Ngày thi</th>
            <th className="w-[120px] px-4 py-3">Thời gian</th>
            <th className="w-[80px] px-4 py-3 text-center">Số SV</th>
            <th className="w-[110px] px-4 py-3">Phòng thi</th>
            <th className="w-[150px] px-4 py-3">Giám thị</th>
            <th className="w-[150px] px-4 py-3">Trạng thái</th>
            {showConflict && <th className="w-[240px] px-4 py-3">Lý do</th>}
            <th className="w-[130px] px-4 py-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <LoadingRows colSpan={showConflict ? 11 : 10} />
          ) : items.length === 0 ? (
            <EmptyRow colSpan={showConflict ? 11 : 10} />
          ) : (
            items.map((exam) => (
              <tr key={exam.examId} className="hover:bg-gray-50/70">
                <td className="px-4 py-3 font-semibold text-gray-900">{exam.courseCode || "-"}</td>
                <td className="px-4 py-3 text-gray-800">
                  <div className="truncate" title={exam.courseName}>{exam.courseName || "-"}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{exam.sectionCode || "-"}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(exam.examDate)}</td>
                <td className="px-4 py-3 text-gray-700">
                  {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{exam.studentCount || "-"}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{exam.roomCode || "Chưa có"}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="truncate" title={exam.proctorName}>{exam.proctorName || "-"}</div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={exam.status} /></td>
                {showConflict && (
                  <td className="px-4 py-3 text-xs text-red-700">
                    <div className="line-clamp-2 break-words" title={exam.conflictReason}>
                      {exam.conflictReason || "Có xung đột cần kiểm tra"}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      title="Xem chi tiết"
                      onClick={() => onViewExam?.(exam)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Sửa ca thi"
                      disabled={readOnly}
                      onClick={() => onEditExam?.(exam)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Hủy ca thi"
                      disabled={readOnly}
                      onClick={() => onCancelExam?.(exam)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ExamConflictTable = ({
  conflicts,
  examsById,
  isLoading,
  onViewExam,
  onEditExam,
  onCancelExam,
  onOpenAdminNote,
  readOnly,
}) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1150px] table-fixed text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th className="w-[130px] px-4 py-3">Loại lỗi</th>
            <th className="w-[90px] px-4 py-3">Mã môn</th>
            <th className="w-[120px] px-4 py-3">Tên môn học</th>
            <th className="w-[120px] px-4 py-3">Lớp/Nhóm</th>
            <th className="w-[90px] px-4 py-3">Phòng</th>
            <th className="w-[280px] px-4 py-3">Mô tả</th>
            <th className="w-[130px] px-4 py-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <LoadingRows colSpan={7} />
          ) : conflicts.length === 0 ? (
            <EmptyRow colSpan={7}>Không có xung đột phòng thi.</EmptyRow>
          ) : (
            conflicts.map((conflict, index) => {
              const exam = examsById.get(Number(conflict.examId)) || conflict;
              return (
                <tr key={`${conflict.examId}-${conflict.conflictType}-${index}`} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                      {CONFLICT_TYPE_LABELS[conflict.conflictType] || conflict.conflictType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{exam.courseCode || "-"}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div className="truncate" title={exam.courseName}>{exam.courseName || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{exam.sectionCode || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{exam.roomCode || "Chưa có"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    <div className="line-clamp-2 break-words" title={conflict.description}>
                      {conflict.description || exam.conflictReason || "Cần kiểm tra lại ca thi này."}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Xem chi tiết"
                        onClick={() => onViewExam?.(exam)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Sửa / chọn phòng khác"
                        disabled={readOnly}
                        onClick={() => onEditExam?.(exam)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Ghi chu Admin"
                        disabled={readOnly}
                        onClick={() => onOpenAdminNote?.(conflict, exam)}
                      >
                        <MessageSquareText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Hủy ca thi"
                        disabled={readOnly}
                        onClick={() => onCancelExam?.(exam)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const SummaryCards = ({ summary }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">Tổng ca thi</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
      </CardContent>
    </Card>
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">Chờ phân phòng</p>
        <p className="mt-2 text-2xl font-bold text-orange-600">{summary.unassigned}</p>
      </CardContent>
    </Card>
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">Đã phân phòng</p>
        <p className="mt-2 text-2xl font-bold text-blue-700">{summary.assigned}</p>
      </CardContent>
    </Card>
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">Xung đột</p>
        <p className="mt-2 text-2xl font-bold text-red-600">{summary.conflicts}</p>
      </CardContent>
    </Card>
    <Card className="rounded-xl border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">Có thể gửi duyệt</p>
        <p className={`mt-2 text-2xl font-bold ${summary.canSubmit ? "text-green-700" : "text-gray-400"}`}>
          {summary.canSubmit ? "Có" : "Chưa"}
        </p>
      </CardContent>
    </Card>
  </div>
);

const ListPagination = ({ page, totalItems, onPageChange }) => {
  if (totalItems === 0) return null;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
      <span>
        Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} / {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Trước
        </Button>
        <span>Trang {page}/{totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
};

const StaffExamAllocationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : "pending";

  const [semestersList, setSemestersList] = useState([]);
  const [semesterId, setSemesterId] = useState("");
  const [exams, setExams] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [dataError, setDataError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);
  const [runDoneMessage, setRunDoneMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [conflictTypeFilter, setConflictTypeFilter] = useState("ALL");
  const [pages, setPages] = useState({ pending: 1, assigned: 1, conflicts: 1 });
  const [isAutoAssignConfirmOpen, setIsAutoAssignConfirmOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewExam, setViewExam] = useState(null);
  const [cancelExamTarget, setCancelExamTarget] = useState(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [editForm, setEditForm] = useState({ roomValue: NONE_SELECT_VALUE, proctorValue: NONE_SELECT_VALUE });
  const [editOptions, setEditOptions] = useState({ availableRooms: [], availableProctors: [] });
  const [isLoadingEditOptions, setIsLoadingEditOptions] = useState(false);
  const [isEditOptionsFallback, setIsEditOptionsFallback] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [proctorSearch, setProctorSearch] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteValue, setNoteValue] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const activeStatus = normalize(workflow?.status || workflow?.examWorkflowStatus || workflow?.timetableStatus);
  const isExamReadOnly = READ_ONLY_STATUSES.has(activeStatus);

  const availableRooms = useMemo(() => {
    const payload = editOptions || {};
    return payload.availableRooms || payload.rooms || payload.classrooms || [];
  }, [editOptions]);

  const availableProctors = useMemo(() => {
    const payload = editOptions || {};
    return payload.availableProctors || payload.proctors || payload.lecturers || [];
  }, [editOptions]);

  const filteredRooms = useMemo(
    () => availableRooms
      .filter((room) => optionMatches(room, roomSearch, ["classroomCode", "roomCode", "roomNumber", "classroomName", "roomName", "buildingCode", "buildingName"]))
      .slice(0, MAX_DROPDOWN_ITEMS),
    [availableRooms, roomSearch],
  );

  const filteredProctors = useMemo(
    () => availableProctors
      .filter((lecturer) => optionMatches(lecturer, proctorSearch, ["lecturerCode", "proctorCode", "fullName", "lecturerName", "proctorName", "departmentCode", "departmentName"]))
      .slice(0, MAX_DROPDOWN_ITEMS),
    [availableProctors, proctorSearch],
  );

  const refreshData = async (targetSemesterId = semesterId, options = {}) => {
    if (!targetSemesterId) return;
    const { clearMessages = false } = options;
    setIsLoading(true);
    setDataError("");
    if (clearMessages) {
      setActionMessage(null);
      setRunDoneMessage("");
    }

    try {
      const [allocationResponse, conflictResponse, workflowResponse] = await Promise.allSettled([
        httpClient.get("/api/staff/exams/allocations", { params: { semesterId: targetSemesterId } }),
        httpClient.get("/api/staff/exams/conflicts", { params: { semesterId: targetSemesterId } }),
        httpClient.get("/api/staff/exams/workflow/status", { params: { semesterId: targetSemesterId } }),
      ]);

      if (allocationResponse.status === "fulfilled") {
        setExams(getResponseList(allocationResponse.value).map(normalizeExam));
      } else {
        setExams([]);
      }

      if (conflictResponse.status === "fulfilled") {
        setConflicts(getResponseList(conflictResponse.value).map(normalizeConflict));
      } else {
        setConflicts([]);
      }

      if (workflowResponse.status === "fulfilled") {
        setWorkflow(getResponseData(workflowResponse.value));
      } else {
        setWorkflow(null);
      }

      if ([allocationResponse, conflictResponse].some((result) => result.status === "rejected")) {
        setDataError("Một phần dữ liệu phân phòng thi chưa tải được. Kiểm tra backend API staff exams.");
      }
    } catch (error) {
      setDataError(getErrorMessage(error, "Không tải được dữ liệu phân phòng thi."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchSemesters = async () => {
      try {
        const response = await httpClient.get("/api/categories/semesters");
        const semesters = getResponseList(response).map(normalizeSemester).filter((item) => item.id);
        if (!mounted) return;
        setSemestersList(semesters);
        const activeSemester = semesters.find((item) => item.status === "ACTIVE") || semesters[0];
        if (activeSemester && !semesterId) {
          setSemesterId(activeSemester.id);
        }
      } catch (error) {
        if (mounted) {
          setDataError(getErrorMessage(error, "Không tải được danh sách học kỳ."));
        }
      }
    };

    void fetchSemesters();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (semesterId) {
      void refreshData(semesterId);
    }
  }, [semesterId]);

  useEffect(() => {
    if (!tabParam || !VALID_TABS.has(tabParam)) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [tabParam, activeTab, setSearchParams]);

  useEffect(() => {
    setPages({ pending: 1, assigned: 1, conflicts: 1 });
  }, [activeTab, searchTerm, statusFilter, conflictTypeFilter, semesterId]);

  const allUnassignedItems = useMemo(() => exams.filter(isUnassignedExam), [exams]);
  const allAssignedItems = useMemo(() => exams.filter(isAssignedExam), [exams]);
  const examsById = useMemo(() => new Map(exams.map((exam) => [Number(exam.examId), exam])), [exams]);

  const examMatchesFilters = (exam) => {
    const matchesStatus = statusFilter === "ALL" || normalize(exam.status) === statusFilter;
    return examMatchesSearch(exam, normalizedSearch) && matchesStatus;
  };

  const filteredUnassignedItems = useMemo(
    () => allUnassignedItems.filter(examMatchesFilters),
    [allUnassignedItems, normalizedSearch, statusFilter],
  );

  const filteredAssignedItems = useMemo(
    () => allAssignedItems.filter(examMatchesFilters),
    [allAssignedItems, normalizedSearch, statusFilter],
  );

  const filteredConflicts = useMemo(
    () =>
      conflicts.filter((conflict) => {
        const exam = examsById.get(Number(conflict.examId)) || conflict;
        const matchesSearch = examMatchesSearch({ ...exam, conflictReason: conflict.description }, normalizedSearch);
        const matchesType = conflictTypeFilter === "ALL" || conflict.conflictType === conflictTypeFilter;
        const matchesStatus = statusFilter === "ALL" || normalize(exam.status) === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      }),
    [conflicts, examsById, normalizedSearch, conflictTypeFilter, statusFilter],
  );

  const conflictTypes = useMemo(
    () => [...new Set(conflicts.map((item) => item.conflictType).filter(Boolean))].sort(),
    [conflicts],
  );

  const pageItems = useMemo(
    () => ({
      pending: paginate(filteredUnassignedItems, pages.pending),
      assigned: paginate(filteredAssignedItems, pages.assigned),
      conflicts: paginate(filteredConflicts, pages.conflicts),
    }),
    [filteredUnassignedItems, filteredAssignedItems, filteredConflicts, pages],
  );

  const summary = useMemo(
    () => ({
      total: exams.length,
      assigned: allAssignedItems.length,
      unassigned: allUnassignedItems.length,
      conflicts: new Set(conflicts.map((item) => Number(item.examId))).size,
      canSubmit: conflicts.length === 0 && allUnassignedItems.length === 0 && exams.length > 0,
    }),
    [exams.length, allAssignedItems.length, allUnassignedItems.length, conflicts],
  );

  const setActiveTab = (value) => setSearchParams({ tab: value }, { replace: true });
  const setListPage = (list, page) => setPages((current) => ({ ...current, [list]: page }));

  const runAutoAssign = async () => {
    if (!semesterId) return;
    setIsRunning(true);
    setActionMessage(null);
    setRunDoneMessage("");

    try {
      const response = await requestWithFallback([
        { method: "post", url: "/api/staff/exams/auto-assign", data: null, config: { params: { semesterId } } },
        { method: "post", url: "/api/staff/exams/allocations/auto-assign", data: { semesterId } },
        { method: "post", url: "/api/staff/exams/auto-assignment", data: { semesterId } },
      ]);
      const message =
        response?.data?.message ||
        getResponseData(response)?.message ||
        "Đã chạy phân phòng thi tự động.";

      setRunDoneMessage(message);
      await refreshData();
    } catch (error) {
      setActionMessage({ tone: "error", text: getErrorMessage(error, "Không chạy được phân phòng thi tự động.") });
    } finally {
      setIsRunning(false);
    }
  };

  const validateAllocations = async () => {
    if (!semesterId) return;
    setIsValidating(true);
    setActionMessage(null);

    try {
      await requestWithFallback([
        { method: "post", url: "/api/staff/exams/validate", data: null, config: { params: { semesterId } } },
        { method: "post", url: "/api/staff/exams/allocations/validate", data: { semesterId } },
      ]);
      setActionMessage({ tone: "success", text: "Đã kiểm tra và cập nhật trạng thái phân phòng thi." });
      await refreshData();
    } catch (error) {
      setActionMessage({ tone: "error", text: getErrorMessage(error, "Không kiểm tra được trạng thái phân phòng thi.") });
    } finally {
      setIsValidating(false);
    }
  };

  const submitForApproval = async () => {
    if (!semesterId) return;
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      await requestWithFallback([
        { method: "post", url: "/api/staff/exams/submit", data: null, config: { params: { semesterId } } },
        { method: "post", url: "/api/staff/exams/workflow/submit", data: { semesterId } },
        { method: "post", url: "/api/staff/exams/approval-submit", data: { semesterId } },
      ]);
      setActionMessage({ tone: "success", text: "Đã gửi lịch thi cho Admin duyệt/công bố." });
      await refreshData();
    } catch (error) {
      setActionMessage({ tone: "error", text: getErrorMessage(error, "Không gửi được lịch thi cho Admin duyệt.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignRoomDialog = async (exam) => {
    setSelectedExam(exam);
    setRoomCodeInput(exam.roomCode || "");
    setEditForm({
      roomValue: toSelectValue(exam.classroomId || exam.roomCode),
      proctorValue: toSelectValue(exam.proctorId || exam.proctorCode),
    });
    setEditOptions({ availableRooms: [], availableProctors: [] });
    setIsEditOptionsFallback(false);
    setRoomSearch("");
    setProctorSearch("");
    setActionMessage(null);
    setIsLoadingEditOptions(true);

    try {
      const response = await httpClient.get(`/api/staff/exams/${exam.examId}/edit-options`);
      const payload = getResponseData(response) || {};
      const normalizedExam = payload.exam ? normalizeExam(payload.exam) : exam;
      setEditOptions(payload);
      setIsEditOptionsFallback(false);
      setRoomCodeInput(normalizedExam.roomCode || exam.roomCode || "");
      setEditForm({
        roomValue: toSelectValue(normalizedExam.classroomId || normalizedExam.roomCode || exam.classroomId || exam.roomCode),
        proctorValue: toSelectValue(normalizedExam.proctorId || normalizedExam.proctorCode || exam.proctorId || exam.proctorCode),
      });
    } catch (error) {
      setEditOptions({ availableRooms: [], availableProctors: [] });
      setIsEditOptionsFallback(true);
      setActionMessage({
        tone: "error",
        text: getErrorMessage(error, "Không tải được danh sách phòng/giám thị hợp lệ. Có thể nhập mã phòng thủ công."),
      });
    } finally {
      setIsLoadingEditOptions(false);
    }
  };

  const closeAssignRoomDialog = () => {
    if (isAssigning) return;
    setSelectedExam(null);
    setRoomCodeInput("");
    setEditForm({ roomValue: NONE_SELECT_VALUE, proctorValue: NONE_SELECT_VALUE });
    setEditOptions({ availableRooms: [], availableProctors: [] });
    setIsEditOptionsFallback(false);
    setRoomSearch("");
    setProctorSearch("");
  };

  const handleViewExam = (exam) => {
    setViewExam(exam);
  };

  const handleEditExam = (exam) => {
    void openAssignRoomDialog(exam);
  };

  const openAdminNoteDialog = (conflict, exam) => {
    const existingNote = exam.note || conflict.note || "";
    setNoteTarget({ conflict, exam });
    setNoteValue(existingNote || buildExamAdminNoteTemplate(conflict, exam));
    setActionMessage(null);
  };

  const closeAdminNoteDialog = () => {
    if (isSavingNote) return;
    setNoteTarget(null);
    setNoteValue("");
  };

  const saveAdminNote = async () => {
    const examId = noteTarget?.exam?.examId || noteTarget?.conflict?.examId;
    const note = noteValue.trim();
    if (!examId || !note) return;

    setIsSavingNote(true);
    setActionMessage(null);
    try {
      const response = await httpClient.patch(`/api/staff/exams/${examId}/note`, { note });
      setActionMessage({
        tone: "success",
        text: response?.data?.message || "Da luu ghi chu cho Admin.",
      });
      setNoteTarget(null);
      setNoteValue("");
      await refreshData();
    } catch (error) {
      const noteError = error?.response?.data?.errors?.note || error?.response?.data?.details?.note;
      setActionMessage({
        tone: "error",
        text:
          noteError === "NOTE_REQUIRED"
            ? "Vui long nhap ghi chu truoc khi luu."
            : noteError === "NOTE_TOO_LONG"
              ? "Ghi chu toi da 255 ky tu."
              : getErrorMessage(error, "Khong luu duoc ghi chu cho Admin."),
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelExam = (exam) => {
    setCancelExamTarget(exam);
    setActionMessage(null);
  };

  const handleConfirmCancelExam = async () => {
    if (!cancelExamTarget?.examId) return;
    setIsCancelling(true);
    setActionMessage(null);

    try {
      await httpClient.delete(`/api/staff/exams/${cancelExamTarget.examId}`);
      setCancelExamTarget(null);
      await refreshData(semesterId, { clearMessages: true });
      setActionMessage({ tone: "success", text: "Đã hủy ca thi." });
    } catch (error) {
      setActionMessage({ tone: "error", text: getErrorMessage(error, "Không hủy được ca thi.") });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedExam?.examId) {
      setActionMessage({ tone: "error", text: "Không tìm thấy ca thi." });
      return;
    }

    const selectedRoom = availableRooms.find((room) => getRoomValue(room) === editForm.roomValue);
    const selectedProctor = availableProctors.find((lecturer) => getProctorValue(lecturer) === editForm.proctorValue);
    const classroomId = selectedRoom ? getRoomId(selectedRoom) : pick(selectedExam, ["classroomId"]);
    const classroomCode = selectedRoom ? getRoomCode(selectedRoom) : roomCodeInput.trim();
    const proctorLecturerId = selectedProctor ? getProctorId(selectedProctor) : undefined;

    if (!classroomId && !classroomCode) {
      setActionMessage({ tone: "error", text: "Vui lòng chọn phòng thi hoặc nhập mã phòng thi." });
      return;
    }

    setIsAssigning(true);
    setActionMessage(null);

    try {
      await requestWithFallback([
        {
          method: "patch",
          url: `/api/staff/exams/${selectedExam.examId}`,
          data: {
            classroomId: classroomId ? Number(classroomId) : null,
            classroomCode: classroomCode || null,
            proctorLecturerId: proctorLecturerId ? Number(proctorLecturerId) : null,
          },
        },
        {
          method: "patch",
          url: `/api/staff/exams/${selectedExam.examId}/room`,
          data: { classroomCode },
        },
        {
          method: "post",
          url: `/api/staff/exams/${selectedExam.examId}/assign-room`,
          data: { classroomCode },
        },
        {
          method: "post",
          url: "/api/staff/exams/assign-room",
          data: { examId: selectedExam.examId, classroomCode },
        },
      ]);
      closeAssignRoomDialog();
      await refreshData(semesterId, { clearMessages: true });
      setActionMessage({ tone: "success", text: "Đã cập nhật ca thi." });
    } catch (error) {
      setActionMessage({ tone: "error", text: getErrorMessage(error, "Không cập nhật được ca thi.") });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân phòng thi</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Phân phòng tự động cho các ca thi, xử lý xung đột phòng thi và gửi Admin duyệt/công bố.
          </p>
          <div className="mt-3 w-72">
            <Select
              value={semesterId}
              onValueChange={(value) => {
                setSemesterId(value);
                setActionMessage(null);
                setRunDoneMessage("");
                setDataError("");
              }}
            >
              <SelectTrigger className="h-8 bg-white text-sm">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                {semestersList.map((sem) => (
                  <SelectItem key={sem.id} value={sem.id}>
                    {sem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "pending" && (
            <Button
              onClick={() => setIsAutoAssignConfirmOpen(true)}
              disabled={isRunning || !semesterId || isExamReadOnly}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isRunning ? "Đang xử lý..." : "Chạy phân phòng thi"}
            </Button>
          )}
          <Button variant="outline" onClick={validateAllocations} disabled={isValidating || !semesterId || isExamReadOnly}>
            {isValidating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Kiểm tra xung đột
          </Button>
          <Button variant="outline" onClick={() => refreshData(semesterId, { clearMessages: true })} disabled={isLoading || !semesterId}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </Button>
        </div>
      </div>

      <SummaryCards summary={summary} />

      {isExamReadOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>Lịch thi đã công bố/đã hủy/đã hoàn thành. Staff không thể phân phòng trực tiếp.</p>
        </div>
      )}

      {dataError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p>{dataError}</p>
            <button className="mt-1 text-xs font-semibold underline" onClick={() => refreshData(semesterId, { clearMessages: true })}>
              Thử tải lại
            </button>
          </div>
        </div>
      )}

      {runDoneMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-semibold">Hoàn tất!</p>
            <p className="mt-0.5 text-xs text-green-700">{runDoneMessage}</p>
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            actionMessage.tone === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {actionMessage.tone === "success" ? (
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          )}
          <p>{actionMessage.text}</p>
        </div>
      )}

      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto w-full flex-wrap justify-start bg-gray-100">
              {WORKFLOW_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs data-[state=active]:bg-white">
                  {tab.value === "conflicts" ? `${tab.label} (${conflicts.length})` : tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {["pending", "assigned", "conflicts"].includes(activeTab) && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3 md:flex-row md:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm mã môn, tên môn, lớp, phòng, giám thị..."
                    className="bg-white pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-white md:w-56">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="NEEDS_ROOM">Chờ phân phòng</SelectItem>
                    <SelectItem value="ROOM_ASSIGNED">Đã phân phòng</SelectItem>
                    <SelectItem value="CONFLICT">Có xung đột</SelectItem>
                    <SelectItem value="READY_FOR_APPROVAL">Chờ Admin duyệt</SelectItem>
                    <SelectItem value="VALIDATING">Đang kiểm tra</SelectItem>
                    <SelectItem value="PUBLISHED">Đã công bố</SelectItem>
                    <SelectItem value="LOCKED">Đã khóa</SelectItem>
                  </SelectContent>
                </Select>
                {activeTab === "conflicts" && (
                  <Select value={conflictTypeFilter} onValueChange={setConflictTypeFilter}>
                    <SelectTrigger className="w-full bg-white md:w-72">
                      <SelectValue placeholder="Loại xung đột" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả loại xung đột</SelectItem>
                      {conflictTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CONFLICT_TYPE_LABELS[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <TabsContent value="pending" className="mt-4">
              <ExamAllocationTable
                items={pageItems.pending}
                isLoading={isLoading}
                onViewExam={handleViewExam}
                onEditExam={handleEditExam}
                onCancelExam={handleCancelExam}
                onOpenAdminNote={openAdminNoteDialog}
                readOnly={isExamReadOnly}
              />
              <ListPagination
                page={pages.pending}
                totalItems={filteredUnassignedItems.length}
                onPageChange={(page) => setListPage("pending", page)}
              />
            </TabsContent>

            <TabsContent value="assigned" className="mt-4">
              <ExamAllocationTable
                items={pageItems.assigned}
                isLoading={isLoading}
                onViewExam={handleViewExam}
                onEditExam={handleEditExam}
                onCancelExam={handleCancelExam}
                readOnly={isExamReadOnly}
              />
              <ListPagination
                page={pages.assigned}
                totalItems={filteredAssignedItems.length}
                onPageChange={(page) => setListPage("assigned", page)}
              />
            </TabsContent>

            <TabsContent value="conflicts" className="mt-4">
              <ExamConflictTable
                conflicts={pageItems.conflicts}
                examsById={examsById}
                isLoading={isLoading}
                onViewExam={handleViewExam}
                onEditExam={handleEditExam}
                onCancelExam={handleCancelExam}
                readOnly={isExamReadOnly}
              />
              <ListPagination
                page={pages.conflicts}
                totalItems={filteredConflicts.length}
                onPageChange={(page) => setListPage("conflicts", page)}
              />
            </TabsContent>

            <TabsContent value="submit" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div>
                    <p className="text-xs text-gray-500">Trạng thái lịch thi</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {workflow?.semesterName || semestersList.find((item) => item.id === semesterId)?.name || "Học kỳ đang chọn"}
                    </p>
                  </div>
                  <StatusBadge status={activeStatus || "DRAFT"} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Tổng ca thi</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Đã phân phòng</p>
                      <p className="text-2xl font-bold text-blue-700">{summary.assigned}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Chưa phân phòng</p>
                      <p className="text-2xl font-bold text-orange-600">{summary.unassigned}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">Xung đột</p>
                      <p className="text-2xl font-bold text-red-600">{summary.conflicts}</p>
                    </CardContent>
                  </Card>
                </div>

                {!summary.canSubmit && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <p>Cần xử lý hết ca chưa có phòng và xung đột trước khi gửi Admin duyệt.</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={submitForApproval}
                    disabled={isSubmitting || !semesterId || !summary.canSubmit || isExamReadOnly}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Gửi Admin duyệt
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isAutoAssignConfirmOpen} onOpenChange={setIsAutoAssignConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chạy phân phòng thi tự động</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tự động gán phòng cho các ca thi đang chờ phân phòng trong học kỳ đã chọn.
              Staff chỉ phân phòng và gửi duyệt, Admin mới công bố lịch thi chính thức.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Vui lòng kiểm tra trước khi tiếp tục</p>
                <p className="mt-1 text-xs">
                  Chờ phân phòng: {summary.unassigned} ca · Đang có xung đột: {summary.conflicts}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isRunning} onClick={() => setIsAutoAssignConfirmOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isRunning || !semesterId || isExamReadOnly}
              onClick={async () => {
                setIsAutoAssignConfirmOpen(false);
                await runAutoAssign();
              }}
            >
              {isRunning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isRunning ? "Đang xử lý..." : "Xác nhận chạy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewExam)} onOpenChange={(open) => !open && setViewExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết ca thi</DialogTitle>
            <DialogDescription>Thông tin lịch thi đã import và trạng thái phân phòng hiện tại.</DialogDescription>
          </DialogHeader>
          {viewExam && (
            <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <div><span className="text-xs uppercase text-gray-400">Mã môn</span><p className="font-semibold text-gray-900">{viewExam.courseCode || "-"}</p></div>
              <div><span className="text-xs uppercase text-gray-400">Lớp/Nhóm</span><p className="font-semibold text-gray-900">{viewExam.sectionCode || "-"}</p></div>
              <div className="sm:col-span-2"><span className="text-xs uppercase text-gray-400">Tên môn học</span><p className="font-semibold text-gray-900">{viewExam.courseName || "-"}</p></div>
              <div><span className="text-xs uppercase text-gray-400">Ngày thi</span><p>{formatDate(viewExam.examDate)}</p></div>
              <div><span className="text-xs uppercase text-gray-400">Thời gian</span><p>{formatTime(viewExam.startTime)} - {formatTime(viewExam.endTime)}</p></div>
              <div><span className="text-xs uppercase text-gray-400">Số sinh viên</span><p>{viewExam.studentCount || "-"}</p></div>
              <div><span className="text-xs uppercase text-gray-400">Phòng thi</span><p className="font-semibold text-blue-600">{viewExam.roomCode || "Chưa có"}</p></div>
              <div className="sm:col-span-2"><span className="text-xs uppercase text-gray-400">Giám thị</span><p>{viewExam.proctorName || "-"}</p></div>
              <div className="sm:col-span-2"><StatusBadge status={viewExam.status} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewExam(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedExam)} onOpenChange={(open) => !open && closeAssignRoomDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa ca thi</DialogTitle>
            <DialogDescription>
              Chọn phòng và giám thị từ danh sách hợp lệ. Backend sẽ kiểm tra lại ràng buộc trước khi lưu.
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
                  {selectedExam.courseCode} · {selectedExam.courseName}
                </p>
                <p className="mt-1 text-xs">
                  {selectedExam.sectionCode} · {formatDate(selectedExam.examDate)} · {formatTime(selectedExam.startTime)} - {formatTime(selectedExam.endTime)} · {selectedExam.studentCount || "-"} SV
                </p>
              </div>

              {isLoadingEditOptions && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                  <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
                  Đang tải phòng và giám thị hợp lệ...
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-gray-500">Phòng thi</label>
                <Input
                  value={roomSearch}
                  onChange={(event) => setRoomSearch(event.target.value)}
                  placeholder="Tìm mã phòng, tòa, sức chứa..."
                  disabled={isAssigning}
                />
                <Select
                  value={editForm.roomValue}
                  onValueChange={(value) => {
                    const room = availableRooms.find((item) => getRoomValue(item) === value);
                    setEditForm((current) => ({ ...current, roomValue: value }));
                    if (room) setRoomCodeInput(getRoomCode(room));
                  }}
                  disabled={isAssigning || isLoadingEditOptions}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn phòng thi" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRooms.length === 0 ? (
                      <SelectItem value={NONE_SELECT_VALUE}>Không có phòng phù hợp</SelectItem>
                    ) : (
                      filteredRooms.map((room) => (
                        <SelectItem key={getRoomValue(room)} value={getRoomValue(room)}>
                          {getRoomLabel(room)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {isEditOptionsFallback && (
                  <label className="block space-y-1.5">
                    <span className="text-xs text-gray-500">Fallback: nhập mã phòng thủ công nếu API option chưa sẵn sàng</span>
                    <Input
                      value={roomCodeInput}
                      onChange={(event) => setRoomCodeInput(event.target.value)}
                      placeholder="VD: A-A101, B201, C201..."
                      disabled={isAssigning}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-gray-500">Giám thị chính</label>
                <Input
                  value={proctorSearch}
                  onChange={(event) => setProctorSearch(event.target.value)}
                  placeholder="Tìm mã hoặc tên giám thị..."
                  disabled={isAssigning}
                />
                <Select
                  value={editForm.proctorValue}
                  onValueChange={(value) => setEditForm((current) => ({ ...current, proctorValue: value }))}
                  disabled={isAssigning || isLoadingEditOptions || availableProctors.length === 0}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn giám thị" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProctors.length === 0 ? (
                      <SelectItem value={NONE_SELECT_VALUE}>Không có giám thị phù hợp</SelectItem>
                    ) : (
                      filteredProctors.map((lecturer) => (
                        <SelectItem key={getProctorValue(lecturer)} value={getProctorValue(lecturer)}>
                          {getProctorLabel(lecturer)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={isAssigning} onClick={closeAssignRoomDialog}>
              Hủy
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={isAssigning || (!roomCodeInput.trim() && editForm.roomValue === NONE_SELECT_VALUE)} onClick={handleAssignRoom}>
              {isAssigning && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Lưu cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noteTarget)} onOpenChange={(open) => !open && closeAdminNoteDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ghi chu cho Admin</DialogTitle>
            <DialogDescription>
              Noi dung duoc luu vao ca thi de Admin xem khi duyet/xu ly xung dot.
            </DialogDescription>
          </DialogHeader>
          {noteTarget && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                {noteTarget.exam.courseCode || "-"} · {noteTarget.exam.courseName || "-"}
              </p>
              <p className="mt-1 text-xs">
                {noteTarget.exam.sectionCode || "-"} · {formatDate(noteTarget.exam.examDate)} · {formatTime(noteTarget.exam.startTime)} - {formatTime(noteTarget.exam.endTime)}
              </p>
            </div>
          )}
          <Textarea
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
            className="min-h-[220px] font-mono text-xs leading-5"
            maxLength={ADMIN_NOTE_MAX_LENGTH}
            placeholder="Nhap ghi chu cho Admin..."
          />
          <p className="text-right text-xs text-gray-500">
            {noteValue.length}/{ADMIN_NOTE_MAX_LENGTH}
          </p>
          <DialogFooter>
            <Button variant="outline" disabled={isSavingNote} onClick={closeAdminNoteDialog}>
              Huy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSavingNote || !noteValue.trim() || noteValue.length > ADMIN_NOTE_MAX_LENGTH}
              onClick={saveAdminNote}
            >
              {isSavingNote && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Luu ghi chu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelExamTarget)} onOpenChange={(open) => !open && setCancelExamTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy ca thi</DialogTitle>
            <DialogDescription>
              Thao tác này không xóa dữ liệu vĩnh viễn. Backend chỉ chuyển trạng thái ca thi sang Đã hủy.
            </DialogDescription>
          </DialogHeader>
          {cancelExamTarget && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">{cancelExamTarget.courseCode} · {cancelExamTarget.courseName}</p>
              <p className="mt-1 text-xs">
                {cancelExamTarget.sectionCode} · {formatDate(cancelExamTarget.examDate)} · {formatTime(cancelExamTarget.startTime)} - {formatTime(cancelExamTarget.endTime)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={isCancelling} onClick={() => setCancelExamTarget(null)}>
              Không hủy
            </Button>
            <Button variant="destructive" disabled={isCancelling} onClick={handleConfirmCancelExam}>
              {isCancelling && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffExamAllocationPage;
