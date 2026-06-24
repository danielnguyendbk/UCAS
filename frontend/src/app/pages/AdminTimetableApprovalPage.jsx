import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  Eye,
  Loader2,
  LockKeyhole,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
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

const detailRows = (section) => [
  ["Mã môn", getCourseCode(section)],
  ["Tên môn", section.courseName || "—"],
  ["Lớp", section.classCodes || section.classNames || "—"],
  ["Giảng viên", section.lecturerName || "—"],
  ["Thứ / tiết", `${section.day || "—"} / ${section.slotStart ?? "—"}-${section.slotEnd ?? "—"}`],
  ["Tuần học", `${section.fromWeekNo ?? "—"}-${section.toWeekNo ?? "—"}`],
  ["Phòng", section.classroomCode || section.room || "Chưa phân"],
  ["Trạng thái lịch", section.scheduleStatus || "—"],
  ["Trạng thái kiểm tra", section.validationStatus || "NOT_CHECKED"],
  ["Lý do xung đột", section.conflictReason || "—"],
  ["Ghi chú xử lý", section.note || "—"],
];

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
                  return <TableRow key={`${section.id}-${section.scheduleId || "none"}`}>
                    <TableCell className="text-xs font-semibold">{getCourseCode(section)}</TableCell>
                    <TableCell className="text-xs">{section.courseName || "—"}</TableCell>
                    <TableCell className="text-xs">{section.classCodes || section.classNames || "—"}</TableCell>
                    <TableCell className="text-xs">{section.lecturerName || "—"}</TableCell>
                    <TableCell className="text-xs">{section.day || "—"}</TableCell>
                    <TableCell className="text-xs">{section.slotStart && section.slotEnd ? `${section.slotStart}-${section.slotEnd}` : "—"}</TableCell>
                    <TableCell className="text-xs font-semibold text-blue-700">{section.classroomCode || section.room || "Chưa phân"}</TableCell>
                    <TableCell className="text-xs">{section.studentCount ?? 0}</TableCell>
                    <TableCell><Badge className={STATUS_BADGE[status]}>{STATUS_LABEL[status] || status}</Badge></TableCell>
                    <TableCell><div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => setDetailSection(section)} title="Xem chi tiết"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="xs" disabled={!canEdit || !section.scheduleId} onClick={() => openEdit(section)} title={canEdit ? "Sửa lịch" : "Chỉ sửa khi workflow là DRAFT hoặc CONFLICT"}><Pencil className="h-3.5 w-3.5" /></Button>
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
          {detailSection && <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">{detailRows(detailSection).map(([label, value]) => <div key={label} className="contents"><dt className="font-medium text-gray-500">{label}</dt><dd className="text-gray-900">{value}</dd></div>)}</dl>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editSection)} onOpenChange={(open) => { if (!open && !isActionRunning) { setEditSection(null); setEditForm(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Sửa lịch học</DialogTitle><DialogDescription>Sau khi lưu, kết quả kiểm tra được reset về NOT_CHECKED.</DialogDescription></DialogHeader>
          {editForm && <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Giảng viên</Label><Select value={editForm.lecturerId} onValueChange={(value) => updateEditField("lecturerId", value)}><SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger><SelectContent>{lecturers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name || item.staffCode}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Thứ</Label><Select value={editForm.dayOfWeek} onValueChange={(value) => updateEditField("dayOfWeek", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAY_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Tiết bắt đầu</Label><Select value={editForm.slotStartId} onValueChange={(value) => updateEditField("slotStartId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timeSlots.map((item) => <SelectItem key={item.slotId} value={String(item.slotId)}>Tiết {item.slotNo} ({String(item.startTime).slice(0, 5)})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Tiết kết thúc</Label><Select value={editForm.slotEndId} onValueChange={(value) => updateEditField("slotEndId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timeSlots.map((item) => <SelectItem key={item.slotId} value={String(item.slotId)}>Tiết {item.slotNo} ({String(item.endTime).slice(0, 5)})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Phòng</Label><Select value={editForm.classroomId} onValueChange={(value) => updateEditField("classroomId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Chưa phân phòng</SelectItem>{classrooms.map((item) => <SelectItem key={item.id} value={String(item.id)}>{roomLabel(item)} · {item.capacity ?? "—"} chỗ</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Tuần bắt đầu</Label><Input type="number" min="1" max="53" value={editForm.fromWeekNo} onChange={(event) => updateEditField("fromWeekNo", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tuần kết thúc</Label><Input type="number" min="1" max="53" value={editForm.toWeekNo} onChange={(event) => updateEditField("toWeekNo", event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Sức chứa tối đa của lớp học phần</Label><Input type="number" min={editSection?.studentCount || 1} value={editForm.maxCapacity} onChange={(event) => updateEditField("maxCapacity", event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Ghi chú xử lý</Label><Textarea maxLength={255} value={editForm.note} onChange={(event) => updateEditField("note", event.target.value)} placeholder="Ví dụ: [SPLIT_SUGGESTION] Đề xuất tách lớp..." /></div>
          </div>}
          <DialogFooter><Button variant="outline" disabled={isActionRunning} onClick={() => { setEditSection(null); setEditForm(null); }}>Hủy</Button><Button disabled={isActionRunning || !editForm?.lecturerId || !editForm?.slotStartId || !editForm?.slotEndId} onClick={saveSchedule}>{isActionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi</Button></DialogFooter>
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
