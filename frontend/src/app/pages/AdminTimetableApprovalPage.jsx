import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  Eye,
  Loader2,
  LockKeyhole,
  Pencil,
  RefreshCw,
  Search,
  Scissors,
  ShieldCheck,
  Trash2,
  UnlockKeyhole,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { httpClient } from "@/services/httpClient";
import { getApiError } from "@/utils/apiError";

const PAGE_SIZE = 10;
const DAY_OPTIONS = [
  ["MON", "Thứ 2"],
  ["TUE", "Thứ 3"],
  ["WED", "Thứ 4"],
  ["THU", "Thứ 5"],
  ["FRI", "Thứ 6"],
  ["SAT", "Thứ 7"],
  ["SUN", "Chủ nhật"],
];

const STATUS_LABEL = {
  NO_SCHEDULE: "Chưa có lịch",
  UNASSIGNED: "Chưa phân phòng",
  ASSIGNED: "Đã phân phòng",
  PENDING_APPROVAL: "Chờ duyệt",
  PUBLISHED: "Đã công bố",
  CONFLICT: "Có xung đột",
};

const STATUS_BADGE = {
  NO_SCHEDULE: "border-0 bg-gray-100 text-gray-700",
  UNASSIGNED: "border-0 bg-amber-100 text-amber-800",
  ASSIGNED: "border-0 bg-blue-100 text-blue-800",
  PENDING_APPROVAL: "border-0 bg-amber-100 text-amber-800",
  PUBLISHED: "border-0 bg-emerald-100 text-emerald-800",
  CONFLICT: "border-0 bg-red-100 text-red-800",
};

const WORKFLOW_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  VALIDATING: "Đang kiểm tra",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PUBLISHED: "Đã công bố",
  LOCKED: "Đã khóa",
};

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const getStatus = (section) => {
  if (section.allocationStatus) return section.allocationStatus;
  if (!section.scheduleId) return "NO_SCHEDULE";
  if (section.scheduleStatus === "UNASSIGNED" || section.classroomId == null) return "UNASSIGNED";
  if (section.validationStatus === "CONFLICT") return "CONFLICT";
  return "ASSIGNED";
};

const getCourseCode = (section) => {
  const value = section.classCode || "";
  return value.includes(".L") ? value.split(".L")[0] : value;
};

const roomLabel = (room) => {
  if (room.buildingCode && room.roomNumber) return `${room.buildingCode}-${room.roomNumber}`;
  return room.roomName || room.name || `Phòng ${room.id}`;
};

const hasSplitSuggestion = (section) =>
  String(section?.note || "").toUpperCase().includes("[SPLIT_SUGGESTION]");

const isCapacityConflict = (section) =>
  String(section?.conflictReason || "").toUpperCase() === "CAPACITY_EXCEEDED";

const isSplitCandidate = (section) =>
  Boolean(section?.scheduleId && (isCapacityConflict(section) || hasSplitSuggestion(section) || getStatus(section) === "UNASSIGNED"));

const getRawSectionCode = (section) => {
  if (section?.sectionCode) return section.sectionCode;
  const classCode = String(section?.classCode || "");
  return classCode.includes(".L") ? classCode.split(".L").slice(1).join(".L") : classCode;
};

const detailRows = (section) => [
  ["Mã môn", getCourseCode(section)],
  ["Mã nhóm", section.sectionCode || getRawSectionCode(section) || "—"],
  ["Tên môn", section.courseName || "—"],
  ["Lớp", section.classCodes || section.classNames || "—"],
  ["Giảng viên", section.lecturerName || "—"],
  ["Thứ / tiết", `${section.day || "—"} / ${section.slotStart ?? "—"}-${section.slotEnd ?? "—"}`],
  ["Tuần học", `${section.fromWeekNo ?? "—"}-${section.toWeekNo ?? "—"}`],
  ["Phòng", section.classroomCode || section.room || "Chưa phân"],
  ["Loại phòng yêu cầu", section.requiredRoomType || "—"],
  ["Sức chứa phòng hiện tại", section.roomCapacity ?? "—"],
  ["Trạng thái lịch", section.scheduleStatus || "—"],
  ["Trạng thái kiểm tra", section.validationStatus || "NOT_CHECKED"],
  ["Lý do xung đột", section.conflictReason || "—"],
  ["Ghi chú xử lý", section.note || "—"],
];

const normalizeSplitPartCount = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 2;
  return Math.min(5, Math.max(2, parsed));
};

const createSplitParts = (section, count) => {
  const total = Number(section?.studentCount || 0);
  const base = Math.floor(total / count);
  const remainder = total % count;
  const rawCode = getRawSectionCode(section);
  return Array.from({ length: count }, (_, index) => ({
    sectionCode: `${rawCode}-${index + 1}`,
    studentCount: String(base + (index < remainder ? 1 : 0)),
    lecturerId: section?.lecturerId ? String(section.lecturerId) : "",
    dayOfWeek: section?.dayCode || "MON",
    slotStartId: section?.slotStartId ? String(section.slotStartId) : "",
    slotEndId: section?.slotEndId ? String(section.slotEndId) : "",
  }));
};

const SplitSectionDialog = ({
  section,
  open,
  onOpenChange,
  lecturers,
  timeSlots,
  onSubmit,
  isSubmitting,
}) => {
  const [partCount, setPartCount] = useState("2");
  const [parts, setParts] = useState([]);
  const [roomCheck, setRoomCheck] = useState({ loading: false, rooms: [] });
  const [suggestionState, setSuggestionState] = useState({
    loading: false,
    suggestions: [],
    failureReasons: [],
    error: "",
  });
  const [selectedSuggestionId, setSelectedSuggestionId] = useState("");

  useEffect(() => {
    if (!open || !section) return;
    setPartCount("2");
    setParts(createSplitParts(section, 2));
    setSelectedSuggestionId("");
    setSuggestionState({ loading: false, suggestions: [], failureReasons: [], error: "" });
    let mounted = true;
    const checkLargerRooms = async () => {
      setRoomCheck({ loading: true, rooms: [] });
      try {
        const response = await httpClient.get("/api/staff/allocations/available-rooms", {
          params: {
            semesterId: section.semesterId,
            dayOfWeek: section.dayCode,
            slot: section.slotStart,
            expectedAttendees: section.studentCount,
            roomType: section.requiredRoomType || "",
            scheduleId: section.scheduleId,
          },
        });
        if (mounted) setRoomCheck({ loading: false, rooms: unwrapList(response) });
      } catch {
        if (mounted) setRoomCheck({ loading: false, rooms: [] });
      }
    };
    checkLargerRooms();
    return () => { mounted = false; };
  }, [open, section]);

  const totalStudents = parts.reduce((sum, part) => sum + Number(part.studentCount || 0), 0);
  const expectedStudents = Number(section?.studentCount || 0);
  const totalMatches = totalStudents === expectedStudents;
  const updatePart = (index, field, value) => {
    setParts((current) => current.map((part, partIndex) => (
      partIndex === index
        ? {
            ...part,
            [field]: value,
            ...(field === "dayOfWeek" || field === "slotStartId" || field === "slotEndId"
              ? { classroomId: "", roomCode: "", roomCapacity: "", roomType: "" }
              : {}),
          }
        : part
    )));
    setSelectedSuggestionId("");
  };
  const changePartCount = (value) => {
    const nextCount = normalizeSplitPartCount(value);
    setPartCount(String(nextCount));
    setParts(createSplitParts(section, nextCount));
    setSelectedSuggestionId("");
  };
  const resetEqualSplit = () => {
    setParts(createSplitParts(section, normalizeSplitPartCount(partCount)));
    setSelectedSuggestionId("");
  };

  useEffect(() => {
    if (!open || !section?.id || !section?.scheduleId || !totalMatches) {
      setSuggestionState((current) => ({ ...current, loading: false, suggestions: [], failureReasons: [] }));
      return;
    }
    if (parts.some((part) => !part.sectionCode.trim() || !part.lecturerId || Number(part.studentCount || 0) <= 0)) {
      setSuggestionState((current) => ({ ...current, loading: false, suggestions: [], failureReasons: [] }));
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(async () => {
      setSuggestionState({ loading: true, suggestions: [], failureReasons: [], error: "" });
      try {
        const response = await httpClient.post(
          `/api/admin/class-sections/${section.id}/split/suggestions`,
          {
            scheduleId: section.scheduleId,
            partCount: Number(partCount),
            parts: parts.map((part) => ({
              sectionCode: part.sectionCode.trim(),
              studentCount: Number(part.studentCount),
              lecturerId: Number(part.lecturerId),
            })),
          },
        );
        const payload = response.data?.data ?? response.data ?? {};
        if (!mounted) return;
        setSuggestionState({
          loading: false,
          suggestions: payload.suggestions || [],
          failureReasons: payload.failureReasons || [],
          error: "",
        });
      } catch (requestError) {
        if (!mounted) return;
        setSuggestionState({
          loading: false,
          suggestions: [],
          failureReasons: [],
          error: getApiError(requestError, "Khong the lay phuong an de xuat.").message,
        });
      }
    }, 350);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [open, section, partCount, parts, totalMatches]);

  const applySuggestion = (suggestion) => {
    setSelectedSuggestionId(suggestion.suggestionId);
    setParts((current) => current.map((part, index) => {
      const proposed = suggestion.parts.find((item) => Number(item.partIndex) === index);
      if (!proposed) return part;
      return {
        ...part,
        dayOfWeek: proposed.dayOfWeek,
        slotStartId: String(proposed.slotStartId),
        slotEndId: String(proposed.slotEndId),
        classroomId: String(proposed.classroomId),
        roomCode: proposed.roomCode,
        roomCapacity: proposed.roomCapacity,
        roomType: proposed.roomType,
      };
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tách lớp do vượt sức chứa</DialogTitle>
          <DialogDescription>
            Chia sĩ số và tạo các lịch mới ở trạng thái chờ phân phòng. Enrollment sinh viên không được chia tự động.
          </DialogDescription>
        </DialogHeader>

        {section && (
          <>
            <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-gray-500">Học phần</p><p className="mt-1 font-semibold">{section.classCode}</p></div>
              <div><p className="text-xs text-gray-500">Sĩ số gốc</p><p className="mt-1 font-semibold">{section.studentCount ?? 0} sinh viên</p></div>
              <div><p className="text-xs text-gray-500">Phòng hiện tại</p><p className="mt-1 font-semibold">{section.classroomCode || "Chưa phân"} · {section.roomCapacity ?? "—"} chỗ</p></div>
              <div><p className="text-xs text-gray-500">Loại phòng yêu cầu</p><p className="mt-1 font-semibold">{section.requiredRoomType || "—"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-gray-500">Conflict</p><p className="mt-1 font-medium text-red-700">{section.conflictReason || "Đề xuất học vụ"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-gray-500">Ghi chú Staff</p><p className="mt-1 font-medium">{section.note || "Không có ghi chú"}</p></div>
            </div>

            <div className={`rounded-lg border px-4 py-3 text-sm ${roomCheck.rooms.length > 0 ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {roomCheck.loading
                ? "Đang kiểm tra phòng lớn hơn khả dụng..."
                : roomCheck.rooms.length > 0
                  ? `Có ${roomCheck.rooms.length} phòng đủ sức chứa đang khả dụng. Nên cân nhắc đổi phòng trước khi tách lớp.`
                  : "Không tìm thấy phòng cùng loại đủ sức chứa ở thời gian hiện tại; tách lớp là phương án phù hợp."}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="w-52 space-y-1.5">
                <Label>Số nhóm sau tách</Label>
                <Input
                  type="number"
                  min="2"
                  max="5"
                  value={partCount}
                  onChange={(event) => changePartCount(event.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={resetEqualSplit}>
                Chia đều sĩ số
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Phương án hệ thống đề xuất</p>
                  <p className="text-xs text-gray-500">
                    Hệ thống tự lọc trùng phòng, trùng giảng viên, sai loại phòng, thiếu sức chứa và calendar block.
                  </p>
                </div>
                {suggestionState.loading && (
                  <span className="inline-flex items-center gap-2 text-xs text-blue-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang tìm phương án...
                  </span>
                )}
              </div>

              {suggestionState.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {suggestionState.error}
                </div>
              )}

              {!suggestionState.loading && suggestionState.suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestionState.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.suggestionId}
                      className={`rounded-lg border p-3 ${selectedSuggestionId === suggestion.suggestionId ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{suggestion.label}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedSuggestionId === suggestion.suggestionId ? "default" : "outline"}
                          onClick={() => applySuggestion(suggestion)}
                        >
                          {selectedSuggestionId === suggestion.suggestionId ? "Đang chọn" : "Chọn phương án"}
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Nhóm</TableHead>
                              <TableHead className="text-xs">Thời gian</TableHead>
                              <TableHead className="text-xs">Phòng</TableHead>
                              <TableHead className="text-xs">Sức chứa</TableHead>
                              <TableHead className="text-xs">Loại</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {suggestion.parts.map((item) => (
                              <TableRow key={`${suggestion.suggestionId}-${item.partIndex}`}>
                                <TableCell className="text-xs font-medium">{item.sectionCode}</TableCell>
                                <TableCell className="text-xs">
                                  {item.dayLabel || item.dayOfWeek}, tiết {item.slotStartNo}-{item.slotEndNo}
                                </TableCell>
                                <TableCell className="text-xs font-semibold text-blue-700">{item.roomCode}</TableCell>
                                <TableCell className="text-xs">{item.roomCapacity} / {item.studentCount} SV</TableCell>
                                <TableCell className="text-xs">{item.roomType}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!suggestionState.loading && suggestionState.suggestions.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <p className="font-semibold">Chưa có phương án hoàn toàn hợp lệ.</p>
                  {(suggestionState.failureReasons.length > 0
                    ? suggestionState.failureReasons
                    : ["Có thể tạo các nhóm mới ở trạng thái chưa phân phòng."]).map((reason) => (
                    <p key={reason} className="mt-1">- {reason}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {parts.map((part, index) => (
                <div key={index} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between"><p className="font-semibold text-gray-900">Nhóm {index + 1}</p><Badge className="border-0 bg-slate-100 text-slate-700">{part.studentCount || 0} SV</Badge></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-1.5 lg:col-span-2"><Label>Mã nhóm</Label><Input value={part.sectionCode} maxLength={20} placeholder={`${getRawSectionCode(section)}-${index + 1}`} onChange={(event) => updatePart(index, "sectionCode", event.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Sĩ số</Label><Input type="number" min="1" value={part.studentCount} onChange={(event) => updatePart(index, "studentCount", event.target.value)} /></div>
                    <div className="space-y-1.5 lg:col-span-2"><Label>Giảng viên</Label><Select value={part.lecturerId} onValueChange={(value) => updatePart(index, "lecturerId", value)}><SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger><SelectContent>{lecturers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name || item.staffCode}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>Thu</Label><Select value={part.dayOfWeek} onValueChange={(value) => updatePart(index, "dayOfWeek", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAY_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5 lg:col-span-2"><Label>Tiet bat dau</Label><Select value={part.slotStartId} onValueChange={(value) => updatePart(index, "slotStartId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timeSlots.map((item) => <SelectItem key={item.slotId} value={String(item.slotId)}>Tiet {item.slotNo} ({String(item.startTime).slice(0, 5)})</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5 lg:col-span-2"><Label>Tiet ket thuc</Label><Select value={part.slotEndId} onValueChange={(value) => updatePart(index, "slotEndId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timeSlots.map((item) => <SelectItem key={item.slotId} value={String(item.slotId)}>Tiet {item.slotNo} ({String(item.endTime).slice(0, 5)})</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5 lg:col-span-5">
                      <Label>Phòng đề xuất</Label>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {part.roomCode
                          ? `${part.roomCode} · ${part.roomCapacity ?? "?"} chỗ · ${part.roomType || ""}`
                          : "Chưa chọn phương án; nhóm này sẽ tạo ở trạng thái chưa phân phòng."}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Nếu giữ cùng giảng viên và cùng thời gian, hệ thống có thể phát sinh conflict giảng viên.</span>
              <span className={totalMatches ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>Tổng: {totalStudents}/{expectedStudents} SV</span>
            </div>
          </>
        )}



        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            disabled={isSubmitting || !totalMatches || parts.some((part) => !part.sectionCode.trim() || !part.lecturerId || !part.slotStartId || !part.slotEndId)}
            onClick={() => onSubmit(parts)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scissors className="mr-2 h-4 w-4" />}
            Xác nhận tách lớp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminTimetableApprovalPage = () => {
  const [sections, setSections] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
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
  const [detailSection, setDetailSection] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [availableRooms, setAvailableRooms] = useState({ loading: false, rooms: [], error: "" });
  const [deleteSection, setDeleteSection] = useState(null);
  const [splitSection, setSplitSection] = useState(null);
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadFilters = async () => {
      const responses = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
        httpClient.get("/api/categories/lecturers"),
        httpClient.get("/api/categories/classrooms"),
        httpClient.get("/api/categories/time-slots"),
      ]);
      if (!mounted) return;
      const listAt = (index) => responses[index].status === "fulfilled" ? unwrapList(responses[index].value) : [];
      const semesterItems = listAt(0);
      setSemesters(semesterItems);
      setDepartments(listAt(1));
      setClassesList(listAt(2));
      setLecturers(listAt(3));
      setClassrooms(listAt(4).filter((room) => room.active !== false));
      setTimeSlots(listAt(5));
      const defaultSemester = semesterItems.find((semester) => semester.status === "ACTIVE") || semesterItems[0];
      if (defaultSemester) setSelectedSemester(String(defaultSemester.id));
    };
    loadFilters();
    return () => { mounted = false; };
  }, []);

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
        const [sectionResponse, workflowResponse] = await Promise.all([
          httpClient.get("/api/admin/class-sections", { params }),
          httpClient.get("/api/admin/timetable-workflow/pending", { params }),
        ]);
        if (mounted) {
          setSections(unwrapList(sectionResponse));
          setWorkflow(workflowResponse.data?.data ?? workflowResponse.data ?? null);
        }
      } catch (requestError) {
        if (mounted) {
          setSections([]);
          setWorkflow(null);
          setError(getApiError(requestError, "Không thể tải dữ liệu lớp học phần.").message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [selectedSemester, refreshVersion]);

  const filteredSections = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return sections.filter((section) => {
      const matchesStatus = selectedStatus === "all" || getStatus(section) === selectedStatus;
      const matchesDepartment = selectedDepartment === "all" || section.departmentCode === selectedDepartment;
      const matchesClass = selectedClass === "all" || String(section.classCodes || section.classNames || "").includes(selectedClass);
      const searchable = [
        section.classCode,
        section.courseName,
        section.classCodes,
        section.classNames,
        section.lecturerName,
        section.day,
        section.schedule,
        section.room,
      ].join(" ").toLowerCase();
      return matchesStatus && matchesDepartment && matchesClass && (!query || searchable.includes(query));
    });
  }, [searchTerm, sections, selectedClass, selectedDepartment, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSections.length / PAGE_SIZE));
  const pagedSections = useMemo(
    () => filteredSections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredSections],
  );
  const hasBlockingRows = sections.some((section) => ["NO_SCHEDULE", "CONFLICT", "UNASSIGNED"].includes(getStatus(section)));
  const hasUncheckedRows = sections.some((section) => section.scheduleId && section.validationStatus !== "VALID");
  const workflowStatus = workflow?.timetableStatus;
  const canValidate = ["DRAFT", "CONFLICT"].includes(workflowStatus);
  const canEdit = canValidate;
  const canApprove = ["DRAFT", "CONFLICT", "READY_FOR_APPROVAL"].includes(workflowStatus)
    && (workflow?.totalSchedules ?? 0) > 0
    && (workflow?.conflictCount ?? 0) === 0
    && !hasBlockingRows
    && !hasUncheckedRows;
  const canPublish = workflowStatus === "APPROVED"
    && (workflow?.conflictCount ?? 0) === 0
    && !hasBlockingRows;
  const canReopen = ["PUBLISHED", "LOCKED"].includes(workflowStatus);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSemester, selectedStatus, selectedDepartment, selectedClass]);
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const refreshData = () => setRefreshVersion((version) => version + 1);

  const runWorkflowAction = async (action) => {
    if (!selectedSemester) return false;
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      const response = await httpClient.post(`/api/admin/timetable-workflow/${action}`, null, {
        params: { semesterId: selectedSemester },
      });
      const nextWorkflow = response.data?.data ?? response.data;
      setWorkflow(nextWorkflow);
      const validationPassed = action === "validate"
        && (nextWorkflow?.conflictCount ?? 0) === 0
        && (nextWorkflow?.totalSchedules ?? 0) > 0;
      setActionMessage({
        tone: validationPassed || action !== "validate" ? "success" : "error",
        text: action === "validate"
          ? validationPassed
            ? "Không còn xung đột, có thể duyệt hợp lệ."
            : "Còn xung đột/chưa phân phòng, vui lòng xử lý trước."
          : response.data?.message || "Cập nhật trạng thái thành công.",
      });
      refreshData();
      return true;
    } catch (requestError) {
      const apiError = getApiError(requestError, "Không thể cập nhật trạng thái thời khóa biểu.");
      if (apiError.details?.timetableStatus) setWorkflow(apiError.details);
      setActionMessage({ tone: "error", text: apiError.message });
      refreshData();
      return false;
    } finally {
      setIsActionRunning(false);
    }
  };

  const openEdit = (section) => {
    setEditSection(section);
    setEditForm({
      lecturerId: section.lecturerId ? String(section.lecturerId) : "",
      dayOfWeek: section.dayCode || "MON",
      slotStartId: section.slotStartId ? String(section.slotStartId) : "",
      slotEndId: section.slotEndId ? String(section.slotEndId) : "",
      classroomId: section.classroomId ? String(section.classroomId) : "unassigned",
      fromWeekNo: String(section.fromWeekNo ?? 1),
      toWeekNo: String(section.toWeekNo ?? 16),
      maxCapacity: String(section.maxCapacity ?? section.studentCount ?? 1),
      note: section.note || "",
    });
  };

  const updateEditField = (field, value) => setEditForm((form) => ({ ...form, [field]: value }));

  useEffect(() => {
    if (!editSection?.scheduleId || !editForm) {
      setAvailableRooms({ loading: false, rooms: [], error: "" });
      return;
    }
    if (!selectedSemester || !editForm.dayOfWeek || !editForm.slotStartId || !editForm.slotEndId || !editForm.fromWeekNo || !editForm.toWeekNo) {
      setAvailableRooms({ loading: false, rooms: [], error: "" });
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(async () => {
      setAvailableRooms((current) => ({ ...current, loading: true, error: "" }));
      try {
        const response = await httpClient.get(
          `/api/admin/class-sections/${editSection.id}/schedules/${editSection.scheduleId}/available-rooms`,
          {
            params: {
              semesterId: selectedSemester,
              dayOfWeek: editForm.dayOfWeek,
              slotStartId: Number(editForm.slotStartId),
              slotEndId: Number(editForm.slotEndId),
              fromWeekNo: Number(editForm.fromWeekNo),
              toWeekNo: Number(editForm.toWeekNo),
              expectedAttendees: Number(editForm.maxCapacity || editSection.studentCount || 0),
              roomType: editSection.requiredRoomType || "",
            },
          },
        );
        if (!mounted) return;
        const rooms = unwrapList(response);
        setAvailableRooms({ loading: false, rooms, error: "" });
        if (
          editForm.classroomId
          && editForm.classroomId !== "unassigned"
          && !rooms.some((room) => String(room.classroomId) === String(editForm.classroomId))
        ) {
          setEditForm((form) => form ? { ...form, classroomId: "unassigned" } : form);
        }
      } catch (requestError) {
        if (!mounted) return;
        setAvailableRooms({
          loading: false,
          rooms: [],
          error: getApiError(requestError, "Khong the tai danh sach phong kha dung.").message,
        });
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [
    editSection,
    editForm?.dayOfWeek,
    editForm?.slotStartId,
    editForm?.slotEndId,
    editForm?.fromWeekNo,
    editForm?.toWeekNo,
    editForm?.maxCapacity,
    selectedSemester,
  ]);

  const saveSchedule = async () => {
    if (!editSection?.scheduleId || !editForm) return;
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      await httpClient.put(
        `/api/admin/class-sections/${editSection.id}/schedules/${editSection.scheduleId}`,
        {
          lecturerId: editForm.lecturerId ? Number(editForm.lecturerId) : null,
          dayOfWeek: editForm.dayOfWeek,
          slotStartId: Number(editForm.slotStartId),
          slotEndId: Number(editForm.slotEndId),
          classroomId: editForm.classroomId === "unassigned" ? null : Number(editForm.classroomId),
          fromWeekNo: Number(editForm.fromWeekNo),
          toWeekNo: Number(editForm.toWeekNo),
          maxCapacity: Number(editForm.maxCapacity),
          note: editForm.note,
        },
      );
      setEditSection(null);
      setEditForm(null);
      setActionMessage({
        tone: "success",
        text: "Đã cập nhật lịch. Vui lòng kiểm tra xung đột trước khi duyệt/công bố.",
      });
      refreshData();
    } catch (requestError) {
      setActionMessage({
        tone: "error",
        text: getApiError(requestError, "Không thể cập nhật lịch.").message,
      });
    } finally {
      setIsActionRunning(false);
    }
  };

  const saveSplit = async (parts) => {
    if (!splitSection?.scheduleId) return;
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      await httpClient.post(
        `/api/admin/class-sections/${splitSection.id}/split`,
        {
          scheduleId: splitSection.scheduleId,
          clearRoomAssignments: true,
          parts: parts.map((part) => ({
            sectionCode: part.sectionCode.trim(),
            studentCount: Number(part.studentCount),
            lecturerId: Number(part.lecturerId),
            dayOfWeek: part.dayOfWeek,
            slotStartId: Number(part.slotStartId),
            slotEndId: Number(part.slotEndId),
            classroomId: part.classroomId ? Number(part.classroomId) : null,
          })),
        },
      );
      setSplitSection(null);
      setActionMessage({
        tone: "success",
        text: "Đã tách lớp. Vui lòng phân phòng/kiểm tra xung đột lại.",
      });
      refreshData();
    } catch (requestError) {
      setActionMessage({
        tone: "error",
        text: getApiError(requestError, "Không thể tách lớp học phần.").message,
      });
    } finally {
      setIsActionRunning(false);
    }
  };

  const confirmDeleteSection = async () => {
    if (!deleteSection?.id) return;
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      await httpClient.delete(`/api/admin/class-sections/${deleteSection.id}`);
      setDeleteSection(null);
      setActionMessage({
        tone: "success",
        text: "Da xoa hoc phan va huy cac lich lien quan.",
      });
      refreshData();
    } catch (requestError) {
      setActionMessage({
        tone: "error",
        text: getApiError(requestError, "Khong the xoa hoc phan.").message,
      });
    } finally {
      setIsActionRunning(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Duyệt và công bố thời khóa biểu</h1>
          <p className="mt-1 text-sm text-gray-500">Kiểm tra, chỉnh sửa và công bố lịch theo toàn bộ học kỳ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canValidate && (
            <Button variant="outline" disabled={isActionRunning} onClick={() => runWorkflowAction("validate")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Kiểm tra xung đột
            </Button>
          )}
          <Button variant="outline" disabled={isActionRunning || !canApprove} onClick={() => runWorkflowAction("approve")}>
            <Check className="mr-2 h-4 w-4" />
            Duyệt hợp lệ
          </Button>
          <Button disabled={isActionRunning || !canPublish} onClick={() => runWorkflowAction("publish")} className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="mr-2 h-4 w-4" />
            Công bố lịch
          </Button>
          <Button variant="outline" disabled={isActionRunning || workflowStatus !== "PUBLISHED"} onClick={() => runWorkflowAction("lock")}>
            <LockKeyhole className="mr-2 h-4 w-4" />
            Khóa thời khóa biểu
          </Button>
          {canReopen && (
            <Button variant="outline" disabled={isActionRunning} onClick={() => setIsReopenConfirmOpen(true)} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <UnlockKeyhole className="mr-2 h-4 w-4" />
              Mở lại chỉnh sửa
            </Button>
          )}
          <Button variant="ghost" disabled={loading} onClick={refreshData} title="Tải lại dữ liệu">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {workflowStatus === "DRAFT" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Thời khóa biểu đang ở bản nháp. Admin có thể chỉnh sửa trực tiếp, sau đó kiểm tra và duyệt hợp lệ trước khi công bố.
        </div>
      )}
      {actionMessage && (
        <div className={`rounded-xl border p-4 text-sm ${actionMessage.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Tổng số lịch", workflow?.totalSchedules ?? 0],
          ["Lịch hợp lệ", workflow?.validCount ?? 0],
          ["Lịch xung đột", workflow?.conflictCount ?? 0],
          ["Trạng thái workflow", WORKFLOW_STATUS_LABEL[workflowStatus] || workflowStatus || "Chưa chọn học kỳ"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <span className="mt-2 block text-xl font-bold text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
              <SelectContent>{semesters.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
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
                {departments.map((item) => <SelectItem key={item.id} value={item.departmentCode || item.code || String(item.id)}>{item.name || item.departmentName || item.departmentCode}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Lớp hành chính</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((item) => <SelectItem key={item.id} value={item.classCode || item.className || String(item.id)}>{item.className || item.classCode}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm mã môn, lớp, giảng viên, phòng..." className="pl-9" />
        </div>
      </div>

      {loading && <div className="rounded-xl border bg-white p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" /><p className="mt-3 text-sm text-gray-600">Đang tải lớp học phần...</p></div>}
      {!loading && error && <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-500" /><p className="mt-3 text-sm font-semibold text-red-700">{error}</p></div>}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50"><TableRow>
                <TableHead>Mã MH</TableHead><TableHead>Tên môn học</TableHead><TableHead>Lớp</TableHead><TableHead>Giảng viên</TableHead><TableHead>Thứ</TableHead><TableHead>Tiết</TableHead><TableHead>Phòng</TableHead><TableHead>SV</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {pagedSections.map((section) => {
                  const status = getStatus(section);
                  const splitCandidate = isSplitCandidate(section);
                  return <TableRow key={`${section.id}-${section.scheduleId || "none"}`}>
                    <TableCell className="text-xs font-semibold">{getCourseCode(section)}</TableCell>
                    <TableCell className="text-xs">{section.courseName || "—"}</TableCell>
                    <TableCell className="text-xs">{section.classCodes || section.classNames || "—"}</TableCell>
                    <TableCell className="text-xs">{section.lecturerName || "—"}</TableCell>
                    <TableCell className="text-xs">{section.day || "—"}</TableCell>
                    <TableCell className="text-xs">{section.slotStart && section.slotEnd ? `${section.slotStart}-${section.slotEnd}` : "—"}</TableCell>
                    <TableCell className="text-xs font-semibold text-blue-700">{section.classroomCode || section.room || "Chưa phân"}</TableCell>
                    <TableCell className="text-xs">{section.studentCount ?? 0}</TableCell>
                    <TableCell><div className="flex flex-col items-start gap-1"><Badge className={STATUS_BADGE[status]}>{STATUS_LABEL[status] || status}</Badge>{hasSplitSuggestion(section) && <Badge className="border-0 bg-amber-100 text-amber-800">Có đề xuất</Badge>}</div></TableCell>
                    <TableCell><div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => setDetailSection(section)} title="Xem chi tiết"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="xs" disabled={!canEdit || !section.scheduleId} onClick={() => openEdit(section)} title={canEdit ? "Sửa lịch" : "Chỉ sửa khi workflow là DRAFT hoặc CONFLICT"}><Pencil className="h-3.5 w-3.5" /></Button>
                      {splitCandidate && <Button variant="ghost" size="xs" disabled={!canEdit} onClick={() => setSplitSection(section)} title={canEdit ? "Tách lớp do vượt sức chứa" : "Mở lại chỉnh sửa trước khi tách lớp"} className="text-amber-700 hover:bg-amber-50 hover:text-amber-800"><Scissors className="mr-1 h-3.5 w-3.5" />Tách lớp</Button>}
                      <Button variant="ghost" size="xs" disabled={!canEdit} onClick={() => setDeleteSection(section)} title={canEdit ? "Xoa hoc phan" : "Chi xoa khi workflow la DRAFT hoac CONFLICT"} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div></TableCell>
                  </TableRow>;
                })}
                {pagedSections.length === 0 && <TableRow><TableCell colSpan={10} className="h-32 text-center text-sm text-gray-400">Không có lớp học phần phù hợp.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          {filteredSections.length > 0 && <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-gray-500">
            <span>Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredSections.length)} / {filteredSections.length}</span>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Trước</Button><span>Trang {currentPage}/{totalPages}</span><Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Sau</Button></div>
          </div>}
        </div>
      )}

      <Dialog open={Boolean(detailSection)} onOpenChange={(open) => !open && setDetailSection(null)}>
        <DialogContent><DialogHeader><DialogTitle>Chi tiết lịch học</DialogTitle><DialogDescription>Dữ liệu lịch và kết quả kiểm tra gần nhất.</DialogDescription></DialogHeader>
          {detailSection && hasSplitSuggestion(detailSection) && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><p className="font-semibold">Có đề xuất tách lớp từ Staff</p><p className="mt-1">{detailSection.note}</p></div>}
          {detailSection && <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">{detailRows(detailSection).map(([label, value]) => <div key={label} className="contents"><dt className="font-medium text-gray-500">{label}</dt><dd className="text-gray-900">{value}</dd></div>)}</dl>}
        </DialogContent>
      </Dialog>

      <SplitSectionDialog
        section={splitSection}
        open={Boolean(splitSection)}
        onOpenChange={(open) => !open && !isActionRunning && setSplitSection(null)}
        lecturers={lecturers}
        timeSlots={timeSlots}
        onSubmit={saveSplit}
        isSubmitting={isActionRunning}
      />

      <Dialog open={Boolean(editSection)} onOpenChange={(open) => { if (!open && !isActionRunning) { setEditSection(null); setEditForm(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Sửa lịch học</DialogTitle><DialogDescription>Sau khi lưu, kết quả kiểm tra được reset về NOT_CHECKED.</DialogDescription></DialogHeader>
          {editForm && <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Giảng viên</Label><Select value={editForm.lecturerId} onValueChange={(value) => updateEditField("lecturerId", value)}><SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger><SelectContent>{lecturers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name || item.staffCode}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Thu</Label><Select value={editForm.dayOfWeek} onValueChange={(value) => updateEditField("dayOfWeek", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAY_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Tiet bat dau</Label><Select value={editForm.slotStartId} onValueChange={(value) => updateEditField("slotStartId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timeSlots.map((item) => <SelectItem key={item.slotId} value={String(item.slotId)}>Tiet {item.slotNo} ({String(item.startTime).slice(0, 5)})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Tiet ket thuc</Label><Select value={editForm.slotEndId} onValueChange={(value) => updateEditField("slotEndId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timeSlots.map((item) => <SelectItem key={item.slotId} value={String(item.slotId)}>Tiet {item.slotNo} ({String(item.endTime).slice(0, 5)})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Phong kha dung</Label><Select value={editForm.classroomId} onValueChange={(value) => updateEditField("classroomId", value)} disabled={availableRooms.loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Chua phan phong</SelectItem>{availableRooms.rooms.map((item) => <SelectItem key={item.classroomId} value={String(item.classroomId)}>{item.roomCode} - {item.capacity ?? "-"} cho - {item.roomTypeText || item.roomType}</SelectItem>)}</SelectContent></Select>{availableRooms.loading && <p className="text-xs text-blue-600">Dang kiem tra phong trong...</p>}{availableRooms.error && <p className="text-xs text-red-600">{availableRooms.error}</p>}{!availableRooms.loading && !availableRooms.error && availableRooms.rooms.length === 0 && <p className="text-xs text-amber-700">Khong co phong phu hop; co the luu chua phan phong hoac tach lop.</p>}</div>
            <div className="space-y-1.5"><Label>Tuần bắt đầu</Label><Input type="number" min="1" max="53" value={editForm.fromWeekNo} onChange={(event) => updateEditField("fromWeekNo", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tuần kết thúc</Label><Input type="number" min="1" max="53" value={editForm.toWeekNo} onChange={(event) => updateEditField("toWeekNo", event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Sức chứa tối đa của lớp học phần</Label><Input type="number" min={editSection?.studentCount || 1} value={editForm.maxCapacity} onChange={(event) => updateEditField("maxCapacity", event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Ghi chú xử lý</Label><Textarea maxLength={255} value={editForm.note} onChange={(event) => updateEditField("note", event.target.value)} placeholder="Ví dụ: [SPLIT_SUGGESTION] Đề xuất tách lớp..." /></div>
          </div>}
          <DialogFooter><Button variant="outline" disabled={isActionRunning} onClick={() => { setEditSection(null); setEditForm(null); }}>Hủy</Button><Button disabled={isActionRunning || !editForm?.lecturerId || !editForm?.slotStartId || !editForm?.slotEndId} onClick={saveSchedule}>{isActionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteSection)} onOpenChange={(open) => { if (!open && !isActionRunning) setDeleteSection(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoa hoc phan?</DialogTitle>
            <DialogDescription>
              He thong se huy cac lich cua hoc phan nay. Neu hoc phan da co sinh vien tham gia, backend se tu choi xoa.
            </DialogDescription>
          </DialogHeader>
          {deleteSection && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">{deleteSection.classCode || getCourseCode(deleteSection)}</p>
              <p className="mt-1">{deleteSection.courseName || "Khong co ten mon"} - {deleteSection.classCodes || deleteSection.classNames || "Khong co lop"}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={isActionRunning} onClick={() => setDeleteSection(null)}>Huy</Button>
            <Button disabled={isActionRunning} onClick={confirmDeleteSection} className="bg-red-600 hover:bg-red-700">
              {isActionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xoa hoc phan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReopenConfirmOpen} onOpenChange={setIsReopenConfirmOpen}>
        <DialogContent><DialogHeader><DialogTitle>Mở lại thời khóa biểu để chỉnh sửa?</DialogTitle><DialogDescription>Sinh viên, giảng viên và Facility sẽ tạm thời không xem được lịch cho đến khi Admin công bố lại.</DialogDescription></DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Workflow sẽ chuyển về DRAFT. Admin có thể sửa lịch, kiểm tra xung đột và duyệt lại.</div>
          <DialogFooter><Button variant="outline" disabled={isActionRunning} onClick={() => setIsReopenConfirmOpen(false)}>Hủy</Button><Button disabled={isActionRunning} onClick={async () => { if (await runWorkflowAction("reopen")) setIsReopenConfirmOpen(false); }} className="bg-amber-600 hover:bg-amber-700">Xác nhận mở lại</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTimetableApprovalPage;
export { AdminTimetableApprovalPage };





