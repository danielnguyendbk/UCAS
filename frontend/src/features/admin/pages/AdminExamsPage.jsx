import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
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

const PAGE_SIZE = 10;
const NONE_SELECT_VALUE = "__NONE__";

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

const emptyForm = {
  sectionCode: "",
  examDate: "",
  startTime: "",
  endTime: "",
  classroomCode: "",
  mainProctorCode: "",
  assistantProctorCode: "",
  examType: "FINAL",
  examMethod: "WRITTEN",
  studentCount: "",
  seatRange: "",
  note: "",
};

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const getErrorMessage = (error, fallback = "Thao tác thất bại.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getSemesterId = (semester) =>
  semester?.semesterId ?? semester?.semester_id ?? semester?.id;

const getSemesterName = (semester) =>
  semester?.semesterName ??
  semester?.semester_name ??
  semester?.name ??
  semester?.semesterCode ??
  semester?.semester_code ??
  "—";

const getSemesterStatus = (semester) =>
  String(
    semester?.status ?? semester?.semesterStatus ?? semester?.semester_status ?? "",
  ).toUpperCase();

const getExamId = (exam) => exam?.id ?? exam?.examId ?? exam?.exam_id;

const getExamStatus = (exam) =>
  String(exam?.status ?? exam?.examStatus ?? exam?.exam_status ?? "DRAFT").toUpperCase();

const getCourseCode = (exam) => exam?.courseCode ?? exam?.course_code ?? "—";
const getCourseName = (exam) => exam?.courseName ?? exam?.course_name ?? "—";

const getSectionCode = (exam) =>
  exam?.sectionCode ?? exam?.section_code ?? exam?.classCode ?? exam?.class_code ?? "—";

const getClassCodes = (exam) =>
  exam?.classCodes ??
  exam?.class_codes ??
  exam?.classCode ??
  exam?.class_code ??
  getSectionCode(exam);

const getRoomCode = (exam) =>
  exam?.roomCode ??
  exam?.classroomCode ??
  exam?.classroom_code ??
  exam?.roomName ??
  exam?.room_name ??
  "";

const getDepartmentCode = (exam) =>
  exam?.departmentCode ??
  exam?.department_code ??
  String(exam?.departmentId ?? exam?.department_id ?? "");

const getProctorName = (exam) =>
  exam?.proctorName ??
  exam?.mainProctorName ??
  exam?.proctorCode ??
  exam?.mainProctorCode ??
  exam?.proctor_code ??
  "—";

const getStudentCount = (exam) =>
  exam?.studentCount ??
  exam?.student_count ??
  exam?.enrolledCount ??
  exam?.enrolled_count ??
  "—";

const formatDate = (value) => {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? raw
    : new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatTime = (value) => (value ? String(value).slice(0, 5) : "");

const formatTimeRange = (exam) => {
  const start = exam?.startTime ?? exam?.start_time;
  const end = exam?.endTime ?? exam?.end_time;
  return [formatTime(start), formatTime(end)].filter(Boolean).join(" – ") || "—";
};

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const buildFormFromExam = (exam) => ({
  sectionCode: getSectionCode(exam) === "—" ? "" : getSectionCode(exam),
  examDate: toDateInput(exam?.examDate ?? exam?.exam_date),
  startTime: formatTime(exam?.startTime ?? exam?.start_time),
  endTime: formatTime(exam?.endTime ?? exam?.end_time),
  classroomCode: getRoomCode(exam),
  mainProctorCode:
    exam?.mainProctorCode ??
    exam?.main_proctor_code ??
    exam?.proctorCode ??
    exam?.proctor_code ??
    "",
  assistantProctorCode:
    exam?.assistantProctorCode ?? exam?.assistant_proctor_code ?? "",
  examType: exam?.examType ?? exam?.exam_type ?? "FINAL",
  examMethod: exam?.examMethod ?? exam?.exam_method ?? "WRITTEN",
  studentCount: String(exam?.studentCount ?? exam?.student_count ?? ""),
  seatRange: exam?.seatRange ?? exam?.seat_range ?? "",
  note: exam?.note ?? exam?.notes ?? "",
});

function Pagination({ page, totalPages, totalItems, onPageChange }) {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-gray-500">
      <span>
        Hiển thị {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, totalItems)} / {totalItems}
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </Button>

        <span>Trang {page}/{totalPages}</span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="mt-2 block text-xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionRunning, setActionRunning] = useState(false);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [detailExam, setDetailExam] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [formExam, setFormExam] = useState(null);
  const [examForm, setExamForm] = useState(emptyForm);
  const [cancelExam, setCancelExam] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadFilters = async () => {
      const responses = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
      ]);

      if (!mounted) return;

      const listAt = (index) =>
        responses[index].status === "fulfilled" ? unwrapList(responses[index].value) : [];

      const semesterItems = listAt(0);
      setSemesters(semesterItems);
      setDepartments(listAt(1));
      setClassesList(listAt(2));

      const defaultSemester =
        semesterItems.find((item) => getSemesterStatus(item) === "ACTIVE") ||
        semesterItems[0];

      if (defaultSemester) {
        setSelectedSemester(String(getSemesterId(defaultSemester)));
      }
    };

    void loadFilters();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshData = () => setRefreshVersion((version) => version + 1);

  useEffect(() => {
    let mounted = true;

    const loadExams = async () => {
      if (!selectedSemester) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = { semesterId: selectedSemester };
        if (selectedStatus !== "all") params.status = selectedStatus;

        const response = await httpClient.get("/api/admin/exams", { params });

        if (!mounted) return;
        setExams(unwrapList(response));
      } catch (requestError) {
        if (!mounted) return;
        setExams([]);
        setError(getErrorMessage(requestError, "Không thể tải danh sách lịch thi."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadExams();

    return () => {
      mounted = false;
    };
  }, [selectedSemester, selectedStatus, refreshVersion]);

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesStatus = selectedStatus === "all" || getExamStatus(exam) === selectedStatus;

      const matchesDepartment =
        selectedDepartment === "all" ||
        getDepartmentCode(exam) === selectedDepartment ||
        String(exam.departmentId ?? exam.department_id ?? "") === selectedDepartment;

      const matchesClass =
        selectedClass === "all" ||
        String(
          exam.classCodes ??
            exam.class_codes ??
            exam.classCode ??
            exam.class_code ??
            "",
        ).includes(selectedClass);

      const searchable = [
        getCourseCode(exam),
        getCourseName(exam),
        getSectionCode(exam),
        getClassCodes(exam),
        getRoomCode(exam),
        getProctorName(exam),
        exam?.examType,
        exam?.exam_type,
        exam?.note,
        exam?.notes,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        matchesDepartment &&
        matchesClass &&
        (!query || searchable.includes(query))
      );
    });
  }, [exams, searchTerm, selectedClass, selectedDepartment, selectedStatus]);

  const summary = useMemo(() => {
    const count = (status) => exams.filter((exam) => getExamStatus(exam) === status).length;
    return {
      total: exams.length,
      needsRoom: count("NEEDS_ROOM"),
      assigned: count("ROOM_ASSIGNED"),
      published: count("PUBLISHED") + count("SCHEDULED"),
    };
  }, [exams]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / PAGE_SIZE));
  const pagedExams = filteredExams.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSemester, selectedStatus, selectedDepartment, selectedClass]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const updateFormField = (field, value) => {
    setExamForm((current) => ({ ...current, [field]: value }));
  };

  const openCreateForm = () => {
    setFormMode("create");
    setFormExam(null);
    setExamForm(emptyForm);
  };

  const openEditForm = (exam) => {
    setFormMode("edit");
    setFormExam(exam);
    setExamForm(buildFormFromExam(exam));
  };

  const closeForm = () => {
    if (actionRunning) return;
    setFormMode(null);
    setFormExam(null);
    setExamForm(emptyForm);
  };

  const validateForm = () => {
    if (!selectedSemester) return "Vui lòng chọn học kỳ.";
    if (!examForm.sectionCode.trim()) return "Vui lòng nhập lớp / nhóm học phần.";
    if (!examForm.examDate) return "Vui lòng chọn ngày thi.";
    if (!examForm.startTime || !examForm.endTime) return "Vui lòng nhập giờ thi.";
    if (examForm.startTime >= examForm.endTime) return "Giờ kết thúc phải sau giờ bắt đầu.";
    if (!examForm.examType) return "Vui lòng chọn loại thi.";
    return "";
  };

  const buildPayload = () => ({
    semesterId: Number(selectedSemester),
    sectionCode: examForm.sectionCode.trim(),
    examDate: examForm.examDate,
    startTime: examForm.startTime,
    endTime: examForm.endTime,
    classroomCode: examForm.classroomCode.trim() || null,
    mainProctorCode: examForm.mainProctorCode.trim() || null,
    assistantProctorCode: examForm.assistantProctorCode.trim() || null,
    examType: examForm.examType,
    examMethod: examForm.examMethod === NONE_SELECT_VALUE ? null : examForm.examMethod || null,
    studentCount: examForm.studentCount ? Number(examForm.studentCount) : null,
    seatRange: examForm.seatRange.trim() || null,
    note: examForm.note.trim() || null,
  });

  const saveExam = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setActionRunning(true);

    try {
      const payload = buildPayload();

      if (formMode === "edit" && formExam) {
        await httpClient.put(`/api/admin/exams/${getExamId(formExam)}`, payload);
        toast.success("Đã cập nhật lịch thi.");
      } else {
        await httpClient.post("/api/admin/exams", payload);
        toast.success("Đã thêm lịch thi.");
      }

      closeForm();
      refreshData();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không lưu được lịch thi."));
    } finally {
      setActionRunning(false);
    }
  };

  const confirmCancelExam = async () => {
    if (!cancelExam) return;

    setActionRunning(true);

    try {
      await httpClient.post(`/api/admin/exams/${getExamId(cancelExam)}/cancel`);
      toast.success("Đã hủy lịch thi.");
      setCancelExam(null);
      refreshData();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Không hủy được lịch thi."));
    } finally {
      setActionRunning(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Lịch thi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý danh sách lịch thi theo học kỳ. Màn này chỉ dùng để xem,
            thêm, sửa và hủy mềm lịch thi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openCreateForm} className="bg-blue-700 hover:bg-blue-800">
            <Plus className="mr-2 h-4 w-4" />
            Thêm lịch thi
          </Button>

          <Button variant="ghost" disabled={loading} onClick={refreshData} title="Tải lại dữ liệu">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Tổng số lịch" value={summary.total} />
        <SummaryCard label="Chờ phân phòng" value={summary.needsRoom} />
        <SummaryCard label="Đã phân phòng" value={summary.assigned} />
        <SummaryCard label="Đã công bố" value={summary.published} />
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((item) => {
                  const id = String(getSemesterId(item));
                  return (
                    <SelectItem key={id} value={id}>
                      {getSemesterName(item)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Trạng thái lịch</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Khoa</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {departments.map((item) => {
                  const value = item.departmentCode || item.code || String(item.id);
                  return (
                    <SelectItem key={item.id ?? value} value={value}>
                      {item.name || item.departmentName || item.departmentCode || value}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Lớp hành chính</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((item) => {
                  const value = item.classCode || item.className || String(item.id);
                  return (
                    <SelectItem key={item.id ?? value} value={value}>
                      {item.className || item.classCode || value}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm mã môn, lớp, giám thị, phòng..."
            className="pl-9"
          />
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
                  <TableHead>Loại thi</TableHead>
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
                      <TableCell className="text-xs">
                        {EXAM_TYPE_LABEL[exam?.examType ?? exam?.exam_type] ??
                          exam?.examType ??
                          exam?.exam_type ??
                          "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(exam?.examDate ?? exam?.exam_date)}
                      </TableCell>
                      <TableCell className="text-xs">{formatTimeRange(exam)}</TableCell>
                      <TableCell className="text-xs font-semibold text-blue-700">
                        {getRoomCode(exam) || "Chưa phân"}
                      </TableCell>
                      <TableCell className="text-xs">{getStudentCount(exam)}</TableCell>
                      <TableCell className="text-xs">{getProctorName(exam)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[status] ?? "border-0 bg-gray-100 text-gray-700"}>
                          {STATUS_LABEL[status] ?? status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setDetailExam(exam)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => openEditForm(exam)}
                            title="Sửa lịch thi"
                            className="text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={["CANCELLED", "COMPLETED"].includes(status)}
                            onClick={() => setCancelExam(exam)}
                            title="Hủy lịch thi"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {pagedExams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-sm text-gray-400">
                      Không có lịch thi phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredExams.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Dialog open={Boolean(detailExam)} onOpenChange={(open) => !open && setDetailExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết lịch thi</DialogTitle>
            <DialogDescription>Thông tin ca thi đang được lưu trong hệ thống.</DialogDescription>
          </DialogHeader>

          {detailExam && (
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-sm">
              {[
                ["Mã môn", getCourseCode(detailExam)],
                ["Tên môn", getCourseName(detailExam)],
                ["Lớp / nhóm", getClassCodes(detailExam)],
                ["Loại thi", EXAM_TYPE_LABEL[detailExam?.examType ?? detailExam?.exam_type] ?? detailExam?.examType ?? detailExam?.exam_type ?? "—"],
                ["Ngày thi", formatDate(detailExam?.examDate ?? detailExam?.exam_date)],
                ["Thời gian", formatTimeRange(detailExam)],
                ["Phòng thi", getRoomCode(detailExam) || "Chưa phân"],
                ["Số sinh viên", getStudentCount(detailExam)],
                ["Giám thị", getProctorName(detailExam)],
                ["Trạng thái", STATUS_LABEL[getExamStatus(detailExam)] ?? getExamStatus(detailExam)],
                ["Ghi chú", detailExam?.note ?? detailExam?.notes ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="font-medium text-gray-500">{label}</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(formMode)} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Sửa lịch thi" : "Thêm lịch thi"}
            </DialogTitle>
            <DialogDescription>
              Thao tác thêm/sửa sẽ đưa lịch thi về trạng thái cần kiểm tra lại trước khi công bố.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Lớp / nhóm học phần</Label>
              <Input
                value={examForm.sectionCode}
                onChange={(event) => updateFormField("sectionCode", event.target.value)}
                placeholder="VD: D22DTVT01 hoặc D22-DTVT-1"
                disabled={formMode === "edit"}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Ngày thi</Label>
              <Input
                type="date"
                value={examForm.examDate}
                onChange={(event) => updateFormField("examDate", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Giờ bắt đầu</Label>
              <Input
                type="time"
                value={examForm.startTime}
                onChange={(event) => updateFormField("startTime", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Giờ kết thúc</Label>
              <Input
                type="time"
                value={examForm.endTime}
                onChange={(event) => updateFormField("endTime", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phòng thi</Label>
              <Input
                value={examForm.classroomCode}
                onChange={(event) => updateFormField("classroomCode", event.target.value)}
                placeholder="VD: A-101"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Giám thị chính</Label>
              <Input
                value={examForm.mainProctorCode}
                onChange={(event) => updateFormField("mainProctorCode", event.target.value)}
                placeholder="VD: GV001"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Giám thị phụ</Label>
              <Input
                value={examForm.assistantProctorCode}
                onChange={(event) => updateFormField("assistantProctorCode", event.target.value)}
                placeholder="VD: GV002"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Số sinh viên</Label>
              <Input
                type="number"
                min="1"
                value={examForm.studentCount}
                onChange={(event) => updateFormField("studentCount", event.target.value)}
                placeholder="VD: 60"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Loại thi</Label>
              <Select value={examForm.examType} onValueChange={(value) => updateFormField("examType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXAM_TYPE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Hình thức thi</Label>
              <Select
                value={examForm.examMethod || NONE_SELECT_VALUE}
                onValueChange={(value) =>
                  updateFormField("examMethod", value === NONE_SELECT_VALUE ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_SELECT_VALUE}>Không xác định</SelectItem>
                  {Object.entries(EXAM_METHOD_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Khoảng số báo danh</Label>
              <Input
                value={examForm.seatRange}
                onChange={(event) => updateFormField("seatRange", event.target.value)}
                placeholder="VD: 001-060"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={examForm.note}
                onChange={(event) => updateFormField("note", event.target.value)}
                placeholder="Ghi chú lịch thi..."
                maxLength={255}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={actionRunning} onClick={closeForm}>
              Hủy
            </Button>
            <Button disabled={actionRunning} onClick={saveExam}>
              {actionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formMode === "edit" ? "Lưu thay đổi" : "Thêm lịch thi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelExam)} onOpenChange={(open) => !open && setCancelExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch thi?</DialogTitle>
            <DialogDescription>
              Lịch thi sẽ chuyển sang trạng thái đã hủy, không bị xóa cứng khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>

          {cancelExam && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">
                {getCourseCode(cancelExam)} · {getSectionCode(cancelExam)}
              </p>
              <p className="mt-1">
                {getCourseName(cancelExam)} - {formatDate(cancelExam.examDate ?? cancelExam.exam_date)} - {formatTimeRange(cancelExam)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={actionRunning} onClick={() => setCancelExam(null)}>
              Không hủy
            </Button>
            <Button
              disabled={actionRunning}
              onClick={confirmCancelExam}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AdminExamsPage };
