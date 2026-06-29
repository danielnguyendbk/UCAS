import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  Loader2,
  LockKeyhole,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UnlockKeyhole,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Textarea } from "@/app/components/ui/textarea";
import { httpClient } from "@/services/httpClient";
import { getDisplayClassCodes, getDisplayCourseCode, getDisplaySectionCode } from "@/utils/sectionDisplay";

const PAGE_SIZE = 10;

const WORKFLOW_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  VALIDATING: "Đang kiểm tra",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PUBLISHED: "Đã công bố",
  LOCKED: "Đã khóa",
};

const WORKFLOW_STATUS_BADGE = {
  DRAFT: "border-0 bg-slate-100 text-slate-700",
  VALIDATING: "border-0 bg-blue-100 text-blue-800",
  CONFLICT: "border-0 bg-red-100 text-red-800",
  READY_FOR_APPROVAL: "border-0 bg-violet-100 text-violet-800",
  APPROVED: "border-0 bg-indigo-100 text-indigo-800",
  PUBLISHED: "border-0 bg-emerald-100 text-emerald-800",
  LOCKED: "border-0 bg-gray-200 text-gray-800",
};

const STATUS_LABEL = {
  DRAFT: "Nháp",
  NEEDS_ROOM: "Chờ phân phòng",
  ROOM_ASSIGNED: "Đã phân phòng",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ công bố",
  PUBLISHED: "Đã công bố",
  SCHEDULED: "Đã công bố",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
};

const STATUS_BADGE = {
  DRAFT: "border-0 bg-amber-100 text-amber-800",
  NEEDS_ROOM: "border-0 bg-orange-100 text-orange-800",
  ROOM_ASSIGNED: "border-0 bg-blue-100 text-blue-800",
  CONFLICT: "border-0 bg-red-100 text-red-800",
  READY_FOR_APPROVAL: "border-0 bg-violet-100 text-violet-800",
  PUBLISHED: "border-0 bg-emerald-100 text-emerald-800",
  SCHEDULED: "border-0 bg-emerald-100 text-emerald-800",
  CANCELLED: "border-0 bg-gray-100 text-gray-700",
  COMPLETED: "border-0 bg-slate-100 text-slate-800",
};

const EXAM_TYPE_LABEL = {
  MIDTERM: "Giữa kỳ",
  FINAL: "Cuối kỳ",
  MAKEUP: "Thi lại",
  OTHER: "Khác",
};

const EXAM_METHOD_LABEL = {
  WRITTEN: "Viết",
  ORAL: "Vấn đáp",
  PRACTICAL: "Thực hành",
  ONLINE: "Trực tuyến",
};

const PUBLISHABLE_STATUSES = new Set([]);
const CANCELLABLE_STATUSES = new Set([
  "DRAFT",
  "NEEDS_ROOM",
  "ROOM_ASSIGNED",
  "CONFLICT",
  "READY_FOR_APPROVAL",
  "PUBLISHED",
  "SCHEDULED",
]);
const EDITABLE_WORKFLOW_STATUSES = new Set(["DRAFT", "CONFLICT"]);
const REOPENABLE_STATUSES = new Set(["CANCELLED", "COMPLETED"]);
const COMPLETABLE_STATUSES = new Set([]);

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const getExamId = (exam) => exam?.id ?? exam?.examId ?? exam?.exam_id;
const getExamStatus = (exam) =>
  String(exam?.status ?? exam?.examStatus ?? exam?.exam_status ?? "DRAFT").toUpperCase();
const getWorkflowStatus = (workflow) =>
  String(
    workflow?.examWorkflowStatus ??
      workflow?.exam_workflow_status ??
      workflow?.workflowStatus ??
      workflow?.workflow_status ??
      workflow?.timetableStatus ??
      "DRAFT",
  ).toUpperCase();

const getSemesterId = (semester) => semester?.semesterId ?? semester?.semester_id ?? semester?.id;
const getSemesterName = (semester) =>
  semester?.semesterName ?? semester?.semester_name ?? semester?.name ?? semester?.semesterCode ?? semester?.semester_code ?? "—";
const getSemesterStatus = (semester) => String(semester?.status ?? "").toUpperCase();

const getCourseCode = (exam) => getDisplayCourseCode(exam);
const getCourseName = (exam) => exam?.courseName ?? exam?.course_name ?? "—";
const getSectionCode = (exam) => getDisplaySectionCode(exam);
const getClassCodes = (exam) => getDisplayClassCodes(exam, getSectionCode(exam));
const getRoomCode = (exam) => exam?.roomCode ?? exam?.classroomCode ?? exam?.classroom_code ?? exam?.roomName ?? exam?.room_name ?? "";
const getBuildingCode = (exam) => exam?.buildingCode ?? exam?.building_code ?? "—";
const getProctorName = (exam) =>
  exam?.proctorName ?? exam?.mainProctorName ?? exam?.proctorCode ?? exam?.mainProctorCode ?? exam?.proctor_code ?? "—";
const getDepartmentCode = (exam) => exam?.departmentCode ?? exam?.department_code ?? String(exam?.departmentId ?? exam?.department_id ?? "");
const getStudentCount = (exam) => exam?.studentCount ?? exam?.student_count ?? exam?.enrolledCount ?? exam?.enrolled_count ?? "—";

const formatDate = (value) => {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatTime = (value) => (value ? String(value).slice(0, 5) : "");
const formatTimeRange = (exam) => {
  const start = exam?.startTime ?? exam?.start_time;
  const end = exam?.endTime ?? exam?.end_time;
  return [formatTime(start), formatTime(end)].filter(Boolean).join(" – ") || "—";
};

const getErrorMessage = (error, fallback = "Thao tác thất bại.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;


const NONE_SELECT_VALUE = "__NONE__";
const MAX_DROPDOWN_ITEMS = 80;

const toSelectValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return NONE_SELECT_VALUE;
  return String(value);
};

const getRoomId = (room) => room?.classroomId ?? room?.classroom_id ?? room?.id ?? room?.roomId ?? room?.room_id;
const getRoomOptionCode = (room) =>
  room?.roomCode ?? room?.room_code ?? room?.classroomCode ?? room?.classroom_code ?? room?.roomNumber ?? room?.room_number ?? room?.code ?? "";
const getRoomOptionValue = (room) => toSelectValue(getRoomId(room) ?? getRoomOptionCode(room));
const getRoomOptionLabel = (room) => {
  const code = getRoomOptionCode(room) || `Phòng #${getRoomId(room) ?? "?"}`;
  const name = room?.classroomName ?? room?.classroom_name ?? room?.roomName ?? room?.room_name ?? "";
  const building = room?.buildingCode ?? room?.building_code ?? room?.buildingName ?? room?.building_name ?? "";
  const capacity = room?.capacity ?? room?.roomCapacity ?? room?.room_capacity ?? "";
  const type = room?.roomType ?? room?.room_type ?? room?.classroomType ?? room?.classroom_type ?? "";
  return [code, name, building && `Tòa ${building}`, capacity && `${capacity} SV`, type].filter(Boolean).join(" · ");
};

const getLecturerId = (lecturer) => lecturer?.lecturerId ?? lecturer?.lecturer_id ?? lecturer?.id ?? lecturer?.proctorId ?? lecturer?.proctor_id;
const getLecturerCode = (lecturer) =>
  lecturer?.lecturerCode ?? lecturer?.lecturer_code ?? lecturer?.proctorCode ?? lecturer?.proctor_code ?? lecturer?.code ?? lecturer?.username ?? "";
const getLecturerName = (lecturer) =>
  lecturer?.fullName ?? lecturer?.full_name ?? lecturer?.lecturerName ?? lecturer?.lecturer_name ?? lecturer?.proctorName ?? lecturer?.proctor_name ?? lecturer?.name ?? "";
const getLecturerOptionValue = (lecturer) => toSelectValue(getLecturerId(lecturer) ?? getLecturerCode(lecturer));
const getLecturerOptionLabel = (lecturer) => {
  const code = getLecturerCode(lecturer);
  const name = getLecturerName(lecturer);
  const department = lecturer?.departmentCode ?? lecturer?.department_code ?? lecturer?.departmentName ?? lecturer?.department_name ?? "";
  return [code, name, department].filter(Boolean).join(" · ") || `Giảng viên #${getLecturerId(lecturer) ?? "?"}`;
};

const optionMatches = (item, query, keys) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return keys.some((key) => String(item?.[key] ?? "").toLowerCase().includes(q));
};

const firstSuccessfulList = async (requests) => {
  let lastError = null;
  for (const request of requests) {
    try {
      const response = await httpClient.get(request.url, { params: request.params });
      return unwrapList(response);
    } catch (error) {
      lastError = error;
      if (![404, 405].includes(error?.response?.status)) throw error;
    }
  }
  if (lastError) throw lastError;
  return [];
};


const detailRows = (exam) => [
  ["Mã môn", getCourseCode(exam)],
  ["Tên môn", getCourseName(exam)],
  ["Lớp / nhóm", getClassCodes(exam)],
  ["Ngày thi", formatDate(exam?.examDate ?? exam?.exam_date)],
  ["Thời gian", formatTimeRange(exam)],
  ["Phòng thi", getRoomCode(exam) || "Chưa phân"],
  ["Tòa nhà", getBuildingCode(exam)],
  ["Số sinh viên", getStudentCount(exam)],
  ["Giám thị", getProctorName(exam)],
  ["Loại thi", EXAM_TYPE_LABEL[exam?.examType ?? exam?.exam_type] ?? exam?.examType ?? exam?.exam_type ?? "—"],
  ["Hình thức", EXAM_METHOD_LABEL[exam?.examMethod ?? exam?.exam_method] ?? exam?.examMethod ?? exam?.exam_method ?? "—"],
  ["Khoảng số báo danh", exam?.seatRange ?? exam?.seat_range ?? "—"],
  ["Trạng thái", STATUS_LABEL[getExamStatus(exam)] ?? getExamStatus(exam)],
  ["Trạng thái kiểm tra", exam?.validationStatus ?? exam?.validation_status ?? "NOT_CHECKED"],
  ["Lý do xung đột", exam?.conflictReason ?? exam?.conflict_reason ?? "—"],
  ["Ghi chú", exam?.note ?? exam?.notes ?? "—"],
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="mt-2 block text-xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

function Pagination({ page, totalPages, totalItems, onPageChange }) {
  if (totalItems === 0) return null;
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-gray-500">
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
}

const AdminExamApprovalPage = () => {
  const [exams, setExams] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [detailExam, setDetailExam] = useState(null);
  const [editExam, setEditExam] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editOptions, setEditOptions] = useState({ rooms: [], proctors: [], assistantProctors: [] });
  const [editOptionsLoading, setEditOptionsLoading] = useState(false);
  const [editOptionsFallback, setEditOptionsFallback] = useState(false);
  const [editOptionWarning, setEditOptionWarning] = useState("");
  const [roomOptionSearch, setRoomOptionSearch] = useState("");
  const [mainProctorSearch, setMainProctorSearch] = useState("");
  const [assistantProctorSearch, setAssistantProctorSearch] = useState("");
  const [cancelExam, setCancelExam] = useState(null);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadFilters = async () => {
      const responses = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
      ]);
      if (!mounted) return;
      const listAt = (index) => (responses[index].status === "fulfilled" ? unwrapList(responses[index].value) : []);
      const semesterItems = listAt(0);
      setSemesters(semesterItems);
      setDepartments(listAt(1));
      setClassesList(listAt(2));
      const defaultSemester = semesterItems.find((item) => getSemesterStatus(item) === "ACTIVE") || semesterItems[0];
      if (defaultSemester) setSelectedSemester(String(getSemesterId(defaultSemester)));
    };
    void loadFilters();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshData = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!selectedSemester) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const params = { semesterId: selectedSemester };
        if (selectedStatus !== "all") params.status = selectedStatus;
        const [examResponse, workflowResponse] = await Promise.allSettled([
          httpClient.get("/api/admin/exams", { params }),
          httpClient.get("/api/admin/exam-workflow/status", { params: { semesterId: selectedSemester } }),
        ]);

        if (!mounted) return;
        if (examResponse.status === "rejected") throw examResponse.reason;
        setExams(unwrapList(examResponse.value));
        setWorkflow(workflowResponse.status === "fulfilled" ? workflowResponse.value?.data?.data ?? workflowResponse.value?.data ?? null : null);
      } catch (requestError) {
        if (!mounted) return;
        setExams([]);
        setWorkflow(null);
        setError(getErrorMessage(requestError, "Không thể tải dữ liệu lịch thi."));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadData();
    return () => {
      mounted = false;
    };
  }, [selectedSemester, selectedStatus, refreshVersion]);

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return exams.filter((exam) => {
      const matchesStatus = selectedStatus === "all" || getExamStatus(exam) === selectedStatus;
      const matchesDepartment = selectedDepartment === "all" || getDepartmentCode(exam) === selectedDepartment || String(exam.departmentId ?? exam.department_id ?? "") === selectedDepartment;
      const matchesClass =
        selectedClass === "all" ||
        getClassCodes(exam).includes(selectedClass);
      const searchable = [
        getCourseCode(exam),
        getCourseName(exam),
        getSectionCode(exam),
        getClassCodes(exam),
        getRoomCode(exam),
        getBuildingCode(exam),
        getProctorName(exam),
        exam?.examType,
        exam?.exam_type,
        exam?.conflictReason,
        exam?.conflict_reason,
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && matchesDepartment && matchesClass && (!query || searchable.includes(query));
    });
  }, [exams, searchTerm, selectedClass, selectedDepartment, selectedStatus]);

  const summary = useMemo(() => {
    const countStatus = (status) => exams.filter((exam) => getExamStatus(exam) === status).length;
    const validCount = exams.filter((exam) => String(exam?.validationStatus ?? exam?.validation_status ?? "").toUpperCase() === "VALID").length;
    const conflictCount = countStatus("CONFLICT") + exams.filter((exam) => String(exam?.validationStatus ?? exam?.validation_status ?? "").toUpperCase() === "CONFLICT").length;
    return {
      total: exams.length,
      valid: workflow?.validCount ?? workflow?.valid_count ?? validCount,
      conflict: workflow?.conflictCount ?? workflow?.conflict_count ?? conflictCount,
      workflowStatus: WORKFLOW_STATUS_LABEL[getWorkflowStatus(workflow)] || getWorkflowStatus(workflow) || "Chưa chọn học kỳ",
    };
  }, [exams, workflow]);

  const roomOptions = useMemo(() => {
    const payload = editOptions || {};
    return payload.availableRooms || payload.rooms || payload.classrooms || [];
  }, [editOptions]);

  const proctorOptions = useMemo(() => {
    const payload = editOptions || {};
    return payload.availableProctors || payload.proctors || payload.lecturers || [];
  }, [editOptions]);

  const assistantProctorOptions = useMemo(() => {
    const payload = editOptions || {};
    return payload.assistantProctors || payload.availableAssistantProctors || payload.availableProctors || payload.proctors || payload.lecturers || [];
  }, [editOptions]);

  const filteredRoomOptions = useMemo(
    () =>
      roomOptions
        .filter((room) =>
          optionMatches(room, roomOptionSearch, [
            "roomCode",
            "room_code",
            "classroomCode",
            "classroom_code",
            "roomNumber",
            "room_number",
            "roomName",
            "room_name",
            "classroomName",
            "classroom_name",
            "buildingCode",
            "building_code",
            "buildingName",
            "building_name",
            "capacity",
          ]),
        )
        .slice(0, MAX_DROPDOWN_ITEMS),
    [roomOptions, roomOptionSearch],
  );

  const filteredProctorOptions = useMemo(
    () =>
      proctorOptions
        .filter((lecturer) =>
          optionMatches(lecturer, mainProctorSearch, [
            "lecturerCode",
            "lecturer_code",
            "proctorCode",
            "proctor_code",
            "fullName",
            "full_name",
            "lecturerName",
            "lecturer_name",
            "proctorName",
            "proctor_name",
            "departmentCode",
            "department_code",
            "departmentName",
            "department_name",
          ]),
        )
        .slice(0, MAX_DROPDOWN_ITEMS),
    [proctorOptions, mainProctorSearch],
  );

  const filteredAssistantProctorOptions = useMemo(
    () =>
      assistantProctorOptions
        .filter((lecturer) =>
          optionMatches(lecturer, assistantProctorSearch, [
            "lecturerCode",
            "lecturer_code",
            "proctorCode",
            "proctor_code",
            "fullName",
            "full_name",
            "lecturerName",
            "lecturer_name",
            "proctorName",
            "proctor_name",
            "departmentCode",
            "department_code",
            "departmentName",
            "department_name",
          ]),
        )
        .slice(0, MAX_DROPDOWN_ITEMS),
    [assistantProctorOptions, assistantProctorSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / PAGE_SIZE));
  const pagedExams = useMemo(
    () => filteredExams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredExams],
  );

  const workflowStatus = getWorkflowStatus(workflow);
  const isWorkflowPublished = ["PUBLISHED", "LOCKED"].includes(workflowStatus);
  const hasBlockingRows = exams.some((exam) => ["NEEDS_ROOM", "CONFLICT"].includes(getExamStatus(exam)));
  const hasUncheckedRows = exams.some((exam) => {
    const status = getExamStatus(exam);
    if (["CANCELLED", "COMPLETED", "PUBLISHED", "SCHEDULED"].includes(status)) return false;
    const validationStatus = String(exam?.validationStatus ?? exam?.validation_status ?? "NOT_CHECKED").toUpperCase();
    return validationStatus !== "VALID";
  });
  const canValidate = ["DRAFT", "CONFLICT"].includes(workflowStatus);
  const canEdit = EDITABLE_WORKFLOW_STATUSES.has(workflowStatus);
  const workflowTotalExams = Number(workflow?.totalExams ?? workflow?.total_exams ?? 0);
  const workflowValidCount = Number(workflow?.validCount ?? workflow?.valid_count ?? 0);
  const workflowConflictCount = Number(workflow?.conflictCount ?? workflow?.conflict_count ?? 0);

  const workflowReadyAndValid =
    workflowStatus === "READY_FOR_APPROVAL" &&
    workflowTotalExams > 0 &&
    workflowValidCount === workflowTotalExams &&
    workflowConflictCount === 0;

  const rowsReadyAndValid =
    workflowStatus === "READY_FOR_APPROVAL" &&
    exams.length > 0 &&
    !hasBlockingRows &&
    !hasUncheckedRows;

  const canApprove = workflowReadyAndValid || rowsReadyAndValid;
  const canPublish = workflowStatus === "APPROVED";
  const canLock = workflowStatus === "PUBLISHED";
  const canReopen = ["READY_FOR_APPROVAL", "APPROVED", "PUBLISHED", "LOCKED"].includes(workflowStatus);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSemester, selectedStatus, selectedDepartment, selectedClass]);
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const runWorkflowAction = async (action) => {
    if (!selectedSemester) return false;
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      const response = await httpClient.post(`/api/admin/exam-workflow/${action}`, null, {
        params: { semesterId: selectedSemester },
      });
      const nextWorkflow = response.data?.data ?? response.data;
      setWorkflow(nextWorkflow);
      const nextStatus = getWorkflowStatus(nextWorkflow);
      const validationPassed = action === "validate"
        && (nextWorkflow?.conflictCount ?? nextWorkflow?.conflict_count ?? 0) === 0
        && (nextWorkflow?.totalExams ?? nextWorkflow?.total_exams ?? 0) > 0;
      setActionMessage({
        tone: action === "validate" ? (validationPassed ? "success" : "error") : "success",
        text:
          action === "validate"
            ? validationPassed
              ? "Không còn xung đột — có thể duyệt hợp lệ."
              : "Còn xung đột hoặc ca chưa hợp lệ, vui lòng xử lý trước."
            : action === "approve"
            ? "Đã duyệt hợp lệ. Có thể công bố lịch thi."
            : action === "publish"
            ? "Đã công bố lịch thi cho sinh viên và giảng viên."
            : response.data?.message || "Cập nhật trạng thái lịch thi thành công.",
      });
      refreshData();
      return true;
    } catch (requestError) {
      setActionMessage({ tone: "error", text: getErrorMessage(requestError, "Không thể cập nhật trạng thái lịch thi.") });
      refreshData();
      return false;
    } finally {
      setIsActionRunning(false);
    }
  };

  const runExamAction = async (exam, actionKey, endpoints, successText) => {
    const examId = getExamId(exam);
    if (!examId) return;
    setIsActionRunning(true);
    setActionMessage(null);
    let lastError = null;
    try {
      for (const endpoint of endpoints) {
        try {
          await httpClient.request({
            url: endpoint.path.replace(":id", examId),
            method: endpoint.method || "POST",
            data: endpoint.data,
          });
          setActionMessage({ tone: "success", text: successText });
          refreshData();
          return;
        } catch (error) {
          lastError = error;
          if (![404, 405].includes(error?.response?.status)) throw error;
        }
      }
      throw lastError || new Error("Không có endpoint phù hợp.");
    } catch (requestError) {
      setActionMessage({ tone: "error", text: getErrorMessage(requestError) });
    } finally {
      setIsActionRunning(false);
    }
  };

  const resetEditOptions = () => {
    setEditOptions({ rooms: [], proctors: [], assistantProctors: [] });
    setEditOptionsFallback(false);
    setEditOptionWarning("");
    setRoomOptionSearch("");
    setMainProctorSearch("");
    setAssistantProctorSearch("");
  };

  const buildEditForm = (exam) => ({
    examDate: String(exam?.examDate ?? exam?.exam_date ?? "").slice(0, 10),
    startTime: formatTime(exam?.startTime ?? exam?.start_time),
    endTime: formatTime(exam?.endTime ?? exam?.end_time),
    classroomId: toSelectValue(exam?.classroomId ?? exam?.classroom_id ?? ""),
    classroomCode: getRoomCode(exam),
    mainProctorId: toSelectValue(exam?.mainProctorId ?? exam?.main_proctor_id ?? exam?.proctorId ?? exam?.proctor_id ?? exam?.proctorLecturerId ?? exam?.proctor_lecturer_id ?? ""),
    mainProctorCode: exam?.mainProctorCode ?? exam?.main_proctor_code ?? exam?.proctorCode ?? exam?.proctor_code ?? "",
    assistantProctorId: toSelectValue(exam?.assistantProctorId ?? exam?.assistant_proctor_id ?? ""),
    assistantProctorCode: exam?.assistantProctorCode ?? exam?.assistant_proctor_code ?? "",
    examType: exam?.examType ?? exam?.exam_type ?? "FINAL",
    examMethod: exam?.examMethod ?? exam?.exam_method ?? "",
    studentCount: String(exam?.studentCount ?? exam?.student_count ?? ""),
    seatRange: exam?.seatRange ?? exam?.seat_range ?? "",
    note: exam?.note ?? exam?.notes ?? "",
  });

  const reconcileEditSelection = (form, rooms, proctors, assistantProctors) => {
    const next = {};
    const warnings = [];
    if (form.classroomId && form.classroomId !== NONE_SELECT_VALUE && !rooms.some((room) => getRoomOptionValue(room) === form.classroomId)) {
      next.classroomId = NONE_SELECT_VALUE;
      next.classroomCode = "";
      warnings.push("PhÃ²ng Ä‘Ã£ chá»n khÃ´ng cÃ²n há»£p lá»‡ theo ngÃ y/giá» má»›i.");
    }
    if (form.mainProctorId && form.mainProctorId !== NONE_SELECT_VALUE && !proctors.some((lecturer) => getLecturerOptionValue(lecturer) === form.mainProctorId)) {
      next.mainProctorId = NONE_SELECT_VALUE;
      next.mainProctorCode = "";
      warnings.push("GiÃ¡m thá»‹ chÃ­nh Ä‘Ã£ chá»n khÃ´ng cÃ²n há»£p lá»‡.");
    }
    if (form.assistantProctorId && form.assistantProctorId !== NONE_SELECT_VALUE && !assistantProctors.some((lecturer) => getLecturerOptionValue(lecturer) === form.assistantProctorId)) {
      next.assistantProctorId = NONE_SELECT_VALUE;
      next.assistantProctorCode = "";
      warnings.push("GiÃ¡m thá»‹ phá»¥ Ä‘Ã£ chá»n khÃ´ng cÃ²n há»£p lá»‡.");
    }
    setEditOptionWarning(warnings.join(" "));
    if (Object.keys(next).length > 0) {
      setEditForm((current) => (current ? { ...current, ...next } : current));
    }
  };

  const loadEditOptions = async (exam, form) => {
    const examId = getExamId(exam);
    const params = {
      semesterId: selectedSemester || exam?.semesterId || exam?.semester_id,
      examDate: form.examDate || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      minCapacity: form.studentCount ? Number(form.studentCount) : undefined,
      excludeExamId: examId,
    };

    setEditOptionsLoading(true);
    try {
      try {
        const response = await httpClient.get(`/api/admin/exams/${examId}/edit-options`, { params });
        const payload = response?.data?.data ?? response?.data ?? {};
        const rooms = payload.availableRooms || payload.rooms || payload.classrooms || [];
        const proctors = payload.availableProctors || payload.proctors || payload.lecturers || [];
        const assistantProctors = payload.assistantProctors || payload.availableAssistantProctors || proctors;
        setEditOptions({
          rooms,
          proctors,
          assistantProctors,
        });
        setEditOptionsFallback(false);
        reconcileEditSelection(form, rooms, proctors, assistantProctors);
        return;
      } catch (error) {
        if (![404, 405].includes(error?.response?.status)) throw error;
      }

      const [rooms, lecturers] = await Promise.all([
        firstSuccessfulList([
          { url: "/api/admin/exams/available-rooms", params },
          { url: "/api/admin/exams/rooms", params },
          { url: "/api/categories/classrooms", params: { semesterId: params.semesterId } },
          { url: "/api/classrooms", params: { semesterId: params.semesterId } },
        ]),
        firstSuccessfulList([
          { url: "/api/admin/exams/available-proctors", params },
          { url: "/api/admin/exams/proctors", params },
          { url: "/api/admin/exams/lecturers", params },
          { url: "/api/categories/lecturers", params: { semesterId: params.semesterId } },
          { url: "/api/lecturers", params: { semesterId: params.semesterId } },
        ]),
      ]);

      setEditOptions({
        rooms,
        proctors: lecturers,
        assistantProctors: lecturers,
      });
      setEditOptionsFallback(false);
      reconcileEditSelection(form, rooms, lecturers, lecturers);
    } catch (requestError) {
      setEditOptions({ rooms: [], proctors: [], assistantProctors: [] });
      setEditOptionsFallback(true);
      setEditOptionWarning("");
      setActionMessage({
        tone: "error",
        text: getErrorMessage(requestError, "Không tải được danh sách phòng/giám thị. Có thể nhập mã thủ công."),
      });
    } finally {
      setEditOptionsLoading(false);
    }
  };

  const openEdit = (exam) => {
    const form = buildEditForm(exam);
    setEditExam(exam);
    setEditForm(form);
    resetEditOptions();
    void loadEditOptions(exam, form);
  };

  const updateEditField = (field, value) => setEditForm((form) => ({ ...form, [field]: value }));

  useEffect(() => {
    if (!editExam || !editForm) return;
    if (!editForm.examDate || !editForm.startTime || !editForm.endTime || editForm.startTime >= editForm.endTime) return;
    const timer = window.setTimeout(() => {
      void loadEditOptions(editExam, editForm);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [editExam, editForm?.examDate, editForm?.startTime, editForm?.endTime, editForm?.studentCount]);

  const saveExam = async () => {
    if (!editExam || !editForm) return;
    if (!editForm.examDate || !editForm.startTime || !editForm.endTime) {
      setActionMessage({ tone: "error", text: "Ngày thi, giờ bắt đầu và giờ kết thúc là bắt buộc." });
      return;
    }
    if (editForm.startTime >= editForm.endTime) {
      setActionMessage({ tone: "error", text: "Giờ kết thúc phải sau giờ bắt đầu." });
      return;
    }
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      await httpClient.put(`/api/admin/exams/${getExamId(editExam)}`, {
        examDate: editForm.examDate || null,
        startTime: editForm.startTime || null,
        endTime: editForm.endTime || null,
        classroomId: editForm.classroomId && editForm.classroomId !== NONE_SELECT_VALUE ? Number(editForm.classroomId) : null,
        classroomCode: editForm.classroomCode || null,
        mainProctorId: editForm.mainProctorId && editForm.mainProctorId !== NONE_SELECT_VALUE ? Number(editForm.mainProctorId) : null,
        mainProctorCode: editForm.mainProctorCode || null,
        proctorLecturerId: editForm.mainProctorId && editForm.mainProctorId !== NONE_SELECT_VALUE ? Number(editForm.mainProctorId) : null,
        assistantProctorId: editForm.assistantProctorId && editForm.assistantProctorId !== NONE_SELECT_VALUE ? Number(editForm.assistantProctorId) : null,
        assistantProctorCode: editForm.assistantProctorCode || null,
        examType: editForm.examType || null,
        examMethod: editForm.examMethod || null,
        studentCount: editForm.studentCount ? Number(editForm.studentCount) : null,
        seatRange: editForm.seatRange || null,
        note: editForm.note || null,
      });
      setEditExam(null);
      setEditForm(null);
      setActionMessage({ tone: "success", text: "Đã cập nhật lịch thi. Vui lòng kiểm tra xung đột trước khi công bố." });
      refreshData();
    } catch (requestError) {
      setActionMessage({ tone: "error", text: getErrorMessage(requestError, "Không thể cập nhật lịch thi.") });
    } finally {
      setIsActionRunning(false);
    }
  };

  const confirmCancelExam = async () => {
    if (!cancelExam) return;
    await runExamAction(
      cancelExam,
      "cancel",
      [
        { method: "POST", path: "/api/admin/exams/:id/cancel" },
        { method: "PATCH", path: "/api/admin/exams/:id/cancel" },
        { method: "PATCH", path: "/api/admin/exams/:id/status", data: { status: "CANCELLED" } },
      ],
      "Đã hủy lịch thi.",
    );
    setCancelExam(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Duyệt và công bố lịch thi</h1>
          <p className="mt-1 text-sm text-gray-500">Kiểm tra, chỉnh sửa và công bố lịch thi theo toàn bộ học kỳ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canValidate && (
            <Button variant="outline" disabled={isActionRunning} onClick={() => runWorkflowAction("validate")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Kiểm tra xung đột
            </Button>
          )}
          <Button
            variant="outline"
            disabled={isActionRunning || !canApprove}
            onClick={() => runWorkflowAction("approve")}
            className="mr-2 border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Duyệt hợp lệ
          </Button>
          <Button
            disabled={isActionRunning || !canPublish}
            onClick={() => runWorkflowAction("publish")}
            className="bg-blue-800 text-white hover:bg-blue-900 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Công bố lịch
          </Button>
          <Button variant="outline" disabled={isActionRunning || !canLock} onClick={() => runWorkflowAction("lock")}>
            <LockKeyhole className="mr-2 h-4 w-4" />
            Khóa lịch thi
          </Button>
          <Button
            variant="outline"
            disabled={isActionRunning || !canReopen}
            onClick={() => setIsReopenConfirmOpen(true)}
            title={
              canReopen
                ? "Mở lại lịch thi để chỉnh sửa"
                : "Chỉ mở lại được khi lịch thi đang chờ duyệt, đã duyệt, đã công bố hoặc đã khóa"
            }
            className={
              canReopen
                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                : "text-gray-400"
            }
          >
            <UnlockKeyhole className="mr-2 h-4 w-4" />
            Mở lại chỉnh sửa
          </Button>
          <Button variant="ghost" disabled={loading} onClick={refreshData} title="Tải lại dữ liệu">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {workflowStatus === "DRAFT" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Lịch thi đang ở bản nháp. Sau khi Staff phân phòng xong, nhấn <strong>Kiểm tra xung đột</strong> để kiểm tra toàn bộ lịch thi.
        </div>
      )}
      {workflowStatus === "CONFLICT" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Lịch thi còn xung đột hoặc ca chưa hợp lệ. Hãy chỉnh sửa, xử lý xung đột rồi nhấn <strong>Kiểm tra xung đột</strong> lại.
        </div>
      )}
      {workflowStatus === "READY_FOR_APPROVAL" && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          Lịch thi không còn xung đột. Nhấn <strong>Duyệt hợp lệ</strong> để chuyển sang trạng thái đã duyệt.
        </div>
      )}
      {workflowStatus === "APPROVED" && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          Lịch thi đã được duyệt hợp lệ. Nhấn <strong>Công bố lịch</strong> để sinh viên và giảng viên xem được lịch thi.
        </div>
      )}
      {isWorkflowPublished && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Lịch thi học kỳ này <strong>đã được công bố</strong>
          {workflowStatus === "LOCKED" ? " và đã khóa" : ""}. Không thể kiểm tra hay duyệt lại. Các nút duyệt từng ca thi đã bị vô hiệu hóa.
          {workflowStatus === "PUBLISHED" && (
            <> Nếu cần điều chỉnh, hãy nhấn <strong>Mở lại chỉnh sửa</strong>.</>
          )}
        </div>
      )}

      {actionMessage && (
        <div className={`flex items-center justify-between rounded-xl border p-4 text-sm ${actionMessage.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-4 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Tổng số lịch", workflow?.totalExams ?? workflow?.total_exams ?? summary.total],
          ["Lịch hợp lệ", summary.valid],
          ["Lịch xung đột", summary.conflict],
          ["Trạng thái workflow", summary.workflowStatus],
        ].map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
              <SelectContent>
                {semesters.map((item) => {
                  const id = String(getSemesterId(item));
                  return <SelectItem key={id} value={id}>{getSemesterName(item)}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Trạng thái lịch</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(STATUS_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Khoa</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {departments.map((item) => {
                  const value = item.departmentCode || item.code || String(item.id);
                  return <SelectItem key={item.id ?? value} value={value}>{item.name || item.departmentName || item.departmentCode || value}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Lớp hành chính</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((item) => {
                  const value = item.classCode || item.className || String(item.id);
                  return <SelectItem key={item.id ?? value} value={value}>{item.className || item.classCode || value}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm mã môn, lớp, giám thị, phòng..." className="pl-9" />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-gray-600">Đang tải lịch thi...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Mã MH</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Ngày thi</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>SV</TableHead>
                  <TableHead>Giám thị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const examId = getExamId(exam);
                  return (
                    <TableRow key={examId ?? `${getCourseCode(exam)}-${getSectionCode(exam)}`}>
                      <TableCell className="text-xs font-semibold">{getCourseCode(exam)}</TableCell>
                      <TableCell className="text-xs">{getCourseName(exam)}</TableCell>
                      <TableCell className="text-xs">{getClassCodes(exam)}</TableCell>
                      <TableCell className="text-xs">{formatDate(exam?.examDate ?? exam?.exam_date)}</TableCell>
                      <TableCell className="text-xs">{formatTimeRange(exam)}</TableCell>
                      <TableCell className="text-xs font-semibold text-blue-700">{getRoomCode(exam) || "Chưa phân"}</TableCell>
                      <TableCell className="text-xs">{getStudentCount(exam)}</TableCell>
                      <TableCell className="text-xs">{getProctorName(exam)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge className={STATUS_BADGE[status] ?? "border-0 bg-gray-100 text-gray-700"}>{STATUS_LABEL[status] ?? status}</Badge>
                          {String(exam?.validationStatus ?? exam?.validation_status ?? "").toUpperCase() === "CONFLICT" && (
                            <Badge className="border-0 bg-red-100 text-red-800">Có lỗi kiểm tra</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => setDetailExam(exam)} title="Xem chi tiết">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={!canEdit}
                            onClick={() => openEdit(exam)}
                            title={canEdit ? "Sửa lịch thi" : "Chỉ sửa khi workflow là DRAFT hoặc CONFLICT"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {PUBLISHABLE_STATUSES.has(status) && !isWorkflowPublished && (
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={isActionRunning}
                              onClick={() => runExamAction(exam, "publish", [
                                { method: "POST", path: "/api/admin/exams/:id/approve" },
                                { method: "POST", path: "/api/admin/exams/:id/publish" },
                                { method: "PATCH", path: "/api/admin/exams/:id/publish" },
                              ], "Đã công bố lịch thi.")}
                              title="Duyệt & công bố lịch thi này"
                              className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {COMPLETABLE_STATUSES.has(status) && (
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={isActionRunning}
                              onClick={() => runExamAction(exam, "complete", [
                                { method: "POST", path: "/api/admin/exams/:id/complete" },
                                { method: "PATCH", path: "/api/admin/exams/:id/complete" },
                                { method: "PATCH", path: "/api/admin/exams/:id/status", data: { status: "COMPLETED" } },
                              ], "Đã hoàn tất lịch thi.")}
                              title="Đánh dấu hoàn tất"
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {REOPENABLE_STATUSES.has(status) && (
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={isActionRunning}
                              onClick={() => runExamAction(exam, "reopen", [
                                { method: "POST", path: "/api/admin/exams/:id/reopen" },
                                { method: "PATCH", path: "/api/admin/exams/:id/reopen" },
                                { method: "PATCH", path: "/api/admin/exams/:id/status", data: { status: "DRAFT" } },
                              ], "Đã mở lại lịch thi.")}
                              title="Mở lại lịch thi"
                              className="text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {CANCELLABLE_STATUSES.has(status) && (
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={isActionRunning}
                              onClick={() => setCancelExam(exam)}
                              title="Hủy lịch thi"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pagedExams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-sm text-gray-400">
                      Không có lịch thi phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination page={currentPage} totalPages={totalPages} totalItems={filteredExams.length} onPageChange={setCurrentPage} />
        </div>
      )}

      <Dialog open={Boolean(detailExam)} onOpenChange={(open) => !open && setDetailExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết lịch thi</DialogTitle>
            <DialogDescription>Dữ liệu lịch thi và kết quả kiểm tra gần nhất.</DialogDescription>
          </DialogHeader>
          {detailExam && String(detailExam?.conflictReason ?? detailExam?.conflict_reason ?? "").trim() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Có ghi nhận xung đột</p>
              <p className="mt-1">{detailExam.conflictReason ?? detailExam.conflict_reason}</p>
            </div>
          )}
          {detailExam && (
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
              {detailRows(detailExam).map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="font-medium text-gray-500">{label}</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editExam)} onOpenChange={(open) => { if (!open && !isActionRunning) { setEditExam(null); setEditForm(null); resetEditOptions(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa lịch thi</DialogTitle>
            <DialogDescription>Sau khi lưu, kết quả kiểm tra nên được validate lại trước khi duyệt/công bố.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ngày thi</Label>
                <Input type="date" value={editForm.examDate} onChange={(event) => updateEditField("examDate", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ bắt đầu</Label>
                <Input type="time" value={editForm.startTime} onChange={(event) => updateEditField("startTime", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ kết thúc</Label>
                <Input type="time" value={editForm.endTime} onChange={(event) => updateEditField("endTime", event.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Phòng thi</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={editOptionsLoading}
                    onClick={() => loadEditOptions(editExam, editForm)}
                  >
                    {editOptionsLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                    Tải phòng/giám thị hợp lệ
                  </Button>
                </div>
                {editOptionWarning && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{editOptionWarning}</p>
                )}
                {editOptionsFallback && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Fallback: API danh sÃ¡ch phÃ²ng/giÃ¡m thá»‹ Ä‘ang lá»—i, chá»‰ khi Ä‘Ã³ má»›i nháº­p mÃ£ thá»§ cÃ´ng.
                  </p>
                )}
                <Input
                  value={roomOptionSearch}
                  onChange={(event) => setRoomOptionSearch(event.target.value)}
                  placeholder="Tìm mã phòng, tòa, sức chứa..."
                  disabled={isActionRunning}
                />
                <Select
                  value={editForm.classroomId}
                  onValueChange={(value) => {
                    const room = roomOptions.find((item) => getRoomOptionValue(item) === value);
                    updateEditField("classroomId", value);
                    updateEditField("classroomCode", room ? getRoomOptionCode(room) : "");
                  }}
                  disabled={isActionRunning || editOptionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng thi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_SELECT_VALUE}>Không chọn phòng</SelectItem>
                    {filteredRoomOptions.length === 0 ? (
                      <SelectItem value="__EMPTY_ROOM_OPTIONS__" disabled>Không có phòng phù hợp</SelectItem>
                    ) : (
                      filteredRoomOptions.map((room, index) => (
                        <SelectItem key={`${getRoomOptionValue(room)}-${index}`} value={getRoomOptionValue(room)}>
                          {getRoomOptionLabel(room)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {editOptionsFallback && (
                  <Input
                    value={editForm.classroomCode}
                    onChange={(event) => {
                      updateEditField("classroomCode", event.target.value);
                      updateEditField("classroomId", NONE_SELECT_VALUE);
                    }}
                    placeholder="Fallback nhập mã phòng thủ công, VD: A-101"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Giám thị chính</Label>
                <Input
                  value={mainProctorSearch}
                  onChange={(event) => setMainProctorSearch(event.target.value)}
                  placeholder="Tìm mã hoặc tên giám thị..."
                  disabled={isActionRunning}
                />
                <Select
                  value={editForm.mainProctorId}
                  onValueChange={(value) => {
                    const lecturer = proctorOptions.find((item) => getLecturerOptionValue(item) === value);
                    updateEditField("mainProctorId", value);
                    updateEditField("mainProctorCode", lecturer ? getLecturerCode(lecturer) : "");
                  }}
                  disabled={isActionRunning || editOptionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giám thị chính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_SELECT_VALUE}>Không chọn</SelectItem>
                    {filteredProctorOptions.map((lecturer, index) => (
                      <SelectItem key={`${getLecturerOptionValue(lecturer)}-${index}`} value={getLecturerOptionValue(lecturer)}>
                        {getLecturerOptionLabel(lecturer)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editOptionsFallback && (
                  <Input
                    value={editForm.mainProctorCode}
                    onChange={(event) => {
                      updateEditField("mainProctorCode", event.target.value);
                      updateEditField("mainProctorId", NONE_SELECT_VALUE);
                    }}
                    placeholder="Fallback nhập mã giám thị, VD: GV001"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Giám thị phụ</Label>
                <Input
                  value={assistantProctorSearch}
                  onChange={(event) => setAssistantProctorSearch(event.target.value)}
                  placeholder="Tìm mã hoặc tên giám thị phụ..."
                  disabled={isActionRunning}
                />
                <Select
                  value={editForm.assistantProctorId}
                  onValueChange={(value) => {
                    const lecturer = assistantProctorOptions.find((item) => getLecturerOptionValue(item) === value);
                    updateEditField("assistantProctorId", value);
                    updateEditField("assistantProctorCode", lecturer ? getLecturerCode(lecturer) : "");
                  }}
                  disabled={isActionRunning || editOptionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giám thị phụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_SELECT_VALUE}>Không chọn</SelectItem>
                    {filteredAssistantProctorOptions.map((lecturer, index) => (
                      <SelectItem key={`${getLecturerOptionValue(lecturer)}-${index}`} value={getLecturerOptionValue(lecturer)}>
                        {getLecturerOptionLabel(lecturer)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editOptionsFallback && (
                  <Input
                    value={editForm.assistantProctorCode}
                    onChange={(event) => {
                      updateEditField("assistantProctorCode", event.target.value);
                      updateEditField("assistantProctorId", NONE_SELECT_VALUE);
                    }}
                    placeholder="Fallback nhập mã giám thị phụ, VD: GV002"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Số sinh viên</Label>
                <Input type="number" min="1" value={editForm.studentCount} onChange={(event) => updateEditField("studentCount", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Loại thi</Label>
                <Select value={editForm.examType} onValueChange={(value) => updateEditField("examType", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXAM_TYPE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hình thức thi</Label>
                <Select value={editForm.examMethod || "none"} onValueChange={(value) => updateEditField("examMethod", value === "none" ? "" : value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không xác định</SelectItem>
                    {Object.entries(EXAM_METHOD_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Khoảng số báo danh</Label>
                <Input value={editForm.seatRange} onChange={(event) => updateEditField("seatRange", event.target.value)} placeholder="VD: 001-060" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ghi chú xử lý</Label>
                <Textarea maxLength={255} value={editForm.note} onChange={(event) => updateEditField("note", event.target.value)} placeholder="Ghi chú điều chỉnh lịch thi..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={isActionRunning} onClick={() => { setEditExam(null); setEditForm(null); resetEditOptions(); }}>Hủy</Button>
            <Button disabled={isActionRunning || !editForm?.examDate || !editForm?.startTime || !editForm?.endTime || editForm.startTime >= editForm.endTime} onClick={saveExam}>
              {isActionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelExam)} onOpenChange={(open) => { if (!open && !isActionRunning) setCancelExam(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch thi?</DialogTitle>
            <DialogDescription>Lịch thi sẽ chuyển sang trạng thái đã hủy, không bị xóa cứng khỏi hệ thống.</DialogDescription>
          </DialogHeader>
          {cancelExam && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">{getCourseCode(cancelExam)} · {getSectionCode(cancelExam)}</p>
              <p className="mt-1">{getCourseName(cancelExam)} - {formatDate(cancelExam.examDate ?? cancelExam.exam_date)} - {formatTimeRange(cancelExam)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={isActionRunning} onClick={() => setCancelExam(null)}>Hủy</Button>
            <Button disabled={isActionRunning} onClick={confirmCancelExam} className="bg-red-600 hover:bg-red-700">
              {isActionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận hủy lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReopenConfirmOpen} onOpenChange={setIsReopenConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mở lại lịch thi để chỉnh sửa?</DialogTitle>
            <DialogDescription>Workflow sẽ quay về bản nháp để Admin chỉnh sửa, kiểm tra xung đột, duyệt và công bố lại.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Workflow sẽ chuyển về DRAFT. Các lịch thi đang hoạt động sẽ được reset trạng thái kiểm tra để có thể sửa và validate lại.
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isActionRunning} onClick={() => setIsReopenConfirmOpen(false)}>Hủy</Button>
            <Button disabled={isActionRunning} onClick={async () => { if (await runWorkflowAction("reopen")) setIsReopenConfirmOpen(false); }} className="bg-amber-600 hover:bg-amber-700">
              Xác nhận mở lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExamApprovalPage;
export { AdminExamApprovalPage };
