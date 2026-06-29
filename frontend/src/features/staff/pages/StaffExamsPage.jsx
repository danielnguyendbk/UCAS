import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
import { APP_ROUTES } from "@/constants/routes";
import { httpClient } from "@/services/httpClient";

const PAGE_SIZE = 15;
const STAFF_EXAM_SCHEDULE_ENDPOINT = "/api/staff/exams/schedule";
const STAFF_EXAM_SCHEDULE_FALLBACK_ENDPOINT = "/api/staff/exams";
const LEGACY_SCHEDULED_STATUS = "SCHEDULED";

const STATUS_LABEL = {
  DRAFT: "Nháp",
  NEEDS_ROOM: "Chờ phân phòng",
  ROOM_ASSIGNED: "Đã phân phòng",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ Admin công bố",
  PUBLISHED: "Đã công bố",
  SCHEDULED: "Đã công bố",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
};

const STATUS_BADGE = {
  DRAFT: "bg-amber-100 text-amber-800 border-0",
  NEEDS_ROOM: "bg-orange-100 text-orange-800 border-0",
  ROOM_ASSIGNED: "bg-sky-100 text-sky-800 border-0",
  CONFLICT: "bg-red-100 text-red-800 border-0",
  READY_FOR_APPROVAL: "bg-violet-100 text-violet-800 border-0",
  PUBLISHED: "bg-blue-100 text-blue-800 border-0",
  SCHEDULED: "bg-blue-100 text-blue-800 border-0",
  CANCELLED: "bg-gray-100 text-gray-800 border-0",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-0",
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

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const settledData = (result) =>
  result.status === "fulfilled" ? getResponseData(result.value) : [];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getEntityId = (item, ...keys) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
};

const getEntityLabel = (item, ...keys) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return "—";
};

const getExamId = (exam = {}) => exam.id ?? exam.examId ?? exam.exam_id;

const getExamStatus = (exam = {}) =>
  String(exam.status ?? exam.examStatus ?? "DRAFT").toUpperCase();

const getStudentCountInfo = (exam = {}) => {
  const studentCount = exam.studentCount ?? exam.student_count ?? null;
  const enrolledCount =
    exam.enrolledCount ??
    exam.enrolled_count ??
    exam.sectionEnrolledCount ??
    exam.section_enrolled_count ??
    null;

  const hasStudentCount =
    studentCount !== null && studentCount !== undefined && studentCount !== "";
  const hasEnrolledCount =
    enrolledCount !== null && enrolledCount !== undefined && enrolledCount !== "";

  const mismatch = Boolean(
    exam.studentCountMismatch ??
      exam.student_count_mismatch ??
      (hasStudentCount &&
        hasEnrolledCount &&
        Number(studentCount) !== Number(enrolledCount)),
  );

  return {
    label: hasEnrolledCount
      ? `${hasStudentCount ? studentCount : enrolledCount} / ${enrolledCount}`
      : hasStudentCount
      ? studentCount
      : "—",
    mismatch,
  };
};

const formatDate = (value) => {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? raw
    : new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatTimeRange = (exam = {}) => {
  const startTime = exam.startTime ?? exam.start_time;
  const endTime = exam.endTime ?? exam.end_time;

  return [startTime, endTime]
    .filter(Boolean)
    .map((value) => String(value).slice(0, 5))
    .join(" - ") || "—";
};

const fetchStaffExamSchedule = async (params) => {
  try {
    return await httpClient.get(STAFF_EXAM_SCHEDULE_ENDPOINT, { params });
  } catch (error) {
    if ([404, 405].includes(error?.response?.status)) {
      return httpClient.get(STAFF_EXAM_SCHEDULE_FALLBACK_ENDPOINT, { params });
    }
    throw error;
  }
};

function PaginationControls({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems <= pageSize) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);
  const pages = Array.from({ length: safeTotalPages }, (_, index) => index + 1).filter(
    (pageNo) =>
      pageNo === 1 ||
      pageNo === safeTotalPages ||
      Math.abs(pageNo - safePage) <= 1,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-600 md:flex-row md:items-center md:justify-between">
      <span>
        Hiển thị {startItem}-{endItem} / {totalItems} lịch thi
      </span>
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Trước
        </Button>
        {pages.map((pageNo, index) => {
          const previousPage = pages[index - 1];

          return (
            <div key={pageNo} className="flex items-center gap-1">
              {previousPage && pageNo - previousPage > 1 && (
                <span className="px-1 text-gray-400">...</span>
              )}
              <Button
                variant={pageNo === safePage ? "default" : "outline"}
                size="sm"
                className={`h-8 min-w-8 px-2 text-xs ${
                  pageNo === safePage ? "bg-blue-600 hover:bg-blue-700" : ""
                }`}
                onClick={() => onPageChange(pageNo)}
              >
                {pageNo}
              </Button>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

const StaffExamsPage = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [classroomsList, setClassroomsList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedProctor, setSelectedProctor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      const [sem, dep, cls, crs, rms, lct] = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
        httpClient.get("/api/categories/courses"),
        httpClient.get("/api/categories/classrooms"),
        httpClient.get("/api/categories/lecturers"),
      ]);

      if (!isMounted) return;
      setSemesters(settledData(sem));
      setDepartments(settledData(dep));
      setClassesList(settledData(cls));
      setCoursesList(settledData(crs));
      setClassroomsList(settledData(rms));
      setLecturersList(settledData(lct));
    };

    void loadFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (selectedSemester !== "all") params.semesterId = selectedSemester;
      if (selectedStatus !== "all") params.status = selectedStatus;

      const response = await fetchStaffExamSchedule(params);
      setExams(getResponseData(response));
    } catch (requestError) {
      setExams([]);
      setError(getErrorMessage(requestError, "Không thể tải lịch thi."));
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, selectedStatus]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};
        if (selectedSemester !== "all") params.semesterId = selectedSemester;
        if (selectedStatus !== "all") params.status = selectedStatus;

        const response = await fetchStaffExamSchedule(params);
        if (isMounted) setExams(getResponseData(response));
      } catch (requestError) {
        if (isMounted) {
          setExams([]);
          setError(getErrorMessage(requestError, "Không thể tải lịch thi."));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [selectedSemester, selectedStatus]);

  const summary = useMemo(() => {
    const countByStatus = (status) =>
      exams.filter((exam) => getExamStatus(exam) === status).length;

    return {
      total: exams.length,
      draft: countByStatus("DRAFT"),
      needsRoom: countByStatus("NEEDS_ROOM"),
      roomAssigned: countByStatus("ROOM_ASSIGNED"),
      conflicts: countByStatus("CONFLICT"),
      readyForApproval: countByStatus("READY_FOR_APPROVAL"),
      published: countByStatus("PUBLISHED") + countByStatus(LEGACY_SCHEDULED_STATUS),
      completed: countByStatus("COMPLETED"),
      cancelled: countByStatus("CANCELLED"),
    };
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return exams.filter((exam) => {
      const matchesDept =
        selectedDept === "all" ||
        String(exam.departmentId ?? exam.department_id ?? "") === selectedDept;
      const matchesClass =
        selectedClass === "all" ||
        String(exam.classCodes || exam.classCode || exam.class_code || "").includes(selectedClass);
      const matchesCourse =
        selectedCourse === "all" ||
        String(exam.courseId ?? exam.course_id ?? "") === selectedCourse;
      const matchesRoom =
        selectedRoom === "all" ||
        String(exam.classroomId ?? exam.classroom_id ?? "") === selectedRoom;
      const matchesProctor =
        selectedProctor === "all" ||
        String(exam.proctorId ?? exam.proctor_lecturer_id ?? "") === selectedProctor;

      const searchable = [
        exam.courseCode,
        exam.course_code,
        exam.courseName,
        exam.course_name,
        exam.sectionCode,
        exam.section_code,
        exam.classCodes,
        exam.classCode,
        exam.roomCode,
        exam.classroomCode,
        exam.roomName,
        exam.buildingCode,
        exam.buildingName,
        exam.proctorName,
        exam.proctorCode,
        exam.examType,
        exam.exam_type,
        getExamStatus(exam),
        exam.conflictReason,
        exam.conflict_reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesDept &&
        matchesClass &&
        matchesCourse &&
        matchesRoom &&
        matchesProctor &&
        (!query || searchable.includes(query))
      );
    });
  }, [
    exams,
    searchTerm,
    selectedClass,
    selectedCourse,
    selectedDept,
    selectedProctor,
    selectedRoom,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedSemester,
    selectedDept,
    selectedClass,
    selectedCourse,
    selectedRoom,
    selectedProctor,
    selectedStatus,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / PAGE_SIZE));
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSemester("all");
    setSelectedDept("all");
    setSelectedClass("all");
    setSelectedCourse("all");
    setSelectedRoom("all");
    setSelectedProctor("all");
    setSelectedStatus("all");
  };

  const goToAllocation = (exam = null) => {
    const params = new URLSearchParams();

    if (selectedSemester !== "all") {
      params.set("semesterId", selectedSemester);
    }

    const examId = getExamId(exam);
    if (examId) {
      params.set("examId", String(examId));
    }

    const query = params.toString();
    navigate(query ? `${APP_ROUTES.staffExamAllocation}?${query}` : APP_ROUTES.staffExamAllocation);
  };

  const goToConflicts = () => {
    const params = new URLSearchParams();
    params.set("tab", "conflicts");

    if (selectedSemester !== "all") {
      params.set("semesterId", selectedSemester);
    }

    navigate(`${APP_ROUTES.staffExamAllocation}?${params.toString()}`);
  };

  const summaryCards = [
    { label: "Tổng lịch thi", value: summary.total, color: "text-purple-600 bg-purple-50" },
    { label: "Chờ phân phòng", value: summary.needsRoom, color: "text-orange-600 bg-orange-50" },
    { label: "Đã phân phòng", value: summary.roomAssigned, color: "text-sky-600 bg-sky-50" },
    { label: "Xung đột", value: summary.conflicts, color: "text-red-600 bg-red-50" },
    { label: "Chờ Admin công bố", value: summary.readyForApproval, color: "text-violet-600 bg-violet-50" },
    { label: "Đã công bố", value: summary.published, color: "text-blue-600 bg-blue-50" },
    { label: "Đã hoàn thành", value: summary.completed, color: "text-emerald-600 bg-emerald-50" },
    { label: "Đã hủy", value: summary.cancelled, color: "text-gray-600 bg-gray-50" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lịch thi phòng học</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tra cứu lịch thi để phục vụ phân phòng, kiểm tra xung đột và gửi Admin duyệt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={loadExams}
            disabled={loading}
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {actionMsg && (
        <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg("")} className="ml-4 text-blue-400 hover:text-blue-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}



      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {semesters.map((semester) => {
                  const id = getEntityId(semester, "id", "semesterId", "semester_id");
                  return (
                    <SelectItem key={id} value={id}>
                      {getEntityLabel(semester, "name", "semesterName", "semester_name", "semesterCode", "semester_code")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Khoa</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {departments.map((department) => {
                  const id = getEntityId(department, "id", "departmentId", "department_id");
                  return (
                    <SelectItem key={id} value={id}>
                      {getEntityLabel(department, "name", "departmentName", "department_name", "departmentCode", "department_code")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Lớp hành chính</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((classItem) => {
                  const id = getEntityLabel(classItem, "classCode", "class_code", "className", "class_name", "id");
                  return (
                    <SelectItem key={id} value={String(id)}>
                      {getEntityLabel(classItem, "className", "class_name", "classCode", "class_code")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Môn học</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {coursesList.map((course) => {
                  const id = getEntityId(course, "id", "courseId", "course_id");
                  return (
                    <SelectItem key={id} value={id}>
                      {getEntityLabel(course, "name", "courseName", "course_name", "courseCode", "course_code")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Phòng thi</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classroomsList.map((room) => {
                  const id = getEntityId(room, "id", "classroomId", "classroom_id");
                  return (
                    <SelectItem key={id} value={id}>
                      {getEntityLabel(room, "roomCode", "classroomCode", "roomName", "roomNumber", "room_name", "room_number")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Giám thị</Label>
            <Select value={selectedProctor} onValueChange={setSelectedProctor}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {lecturersList.map((lecturer) => {
                  const id = getEntityId(lecturer, "id", "lecturerId", "lecturer_id");
                  return (
                    <SelectItem key={id} value={id}>
                      {getEntityLabel(lecturer, "name", "fullName", "full_name", "lecturerName", "lecturer_name", "lecturerCode", "lecturer_code")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trạng thái</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm theo mã môn, tên môn, lớp, phòng thi, giám thị, lý do xung đột..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
          <Button variant="outline" onClick={resetFilters} className="h-9">
            <RefreshCw className="mr-2 h-4 w-4" />
            Đặt lại lọc
          </Button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải lịch thi...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadExams}>
            Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Mã môn</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Lớp / Nhóm</TableHead>
                  <TableHead>Ngày thi</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Phòng thi</TableHead>
                  <TableHead>Tòa nhà</TableHead>
                  <TableHead>Số SV</TableHead>
                  <TableHead>Giám thị</TableHead>
                  <TableHead>Loại thi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Xung đột</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length > 0 ? paginatedExams.map((exam) => {
                  const examId = getExamId(exam);
                  const status = getExamStatus(exam);
                  const { label: studentCountLabel, mismatch } = getStudentCountInfo(exam);
                  const conflictReason = exam.conflictReason ?? exam.conflict_reason;
                  const validationStatus = exam.validationStatus ?? exam.validation_status;

                  return (
                    <TableRow key={examId} className="hover:bg-gray-50/40">
                      <TableCell className="text-xs font-semibold text-gray-900">
                        {exam.courseCode ?? exam.course_code ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">
                        {exam.courseName ?? exam.course_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {exam.classCodes ?? exam.classCode ?? exam.sectionCode ?? exam.section_code ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-600">
                        {formatDate(exam.examDate ?? exam.exam_date)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatTimeRange(exam)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600">
                        {exam.roomCode ?? exam.classroomCode ?? exam.roomName ?? "Chưa phân"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {exam.buildingCode ?? exam.buildingName ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-600">
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span>{studentCountLabel}</span>
                          {mismatch && (
                            <Badge className="w-max border-0 bg-red-100 text-[10px] text-red-700">
                              Lệch sĩ số
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {exam.proctorName ?? exam.mainProctorName ?? exam.proctorCode ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {EXAM_TYPE_LABEL[exam.examType ?? exam.exam_type] ?? exam.examType ?? exam.exam_type ?? "—"}
                        {exam.examMethod || exam.exam_method ? (
                          <span className="ml-1 text-gray-400">
                            · {EXAM_METHOD_LABEL[exam.examMethod ?? exam.exam_method] ?? exam.examMethod ?? exam.exam_method}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[status] || "bg-gray-100 text-gray-800 border-0"}>
                          {STATUS_LABEL[status] || status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] text-xs">
                        {conflictReason ? (
                          <span className="line-clamp-2 text-red-700" title={conflictReason}>
                            {conflictReason}
                          </span>
                        ) : validationStatus === "VALID" ? (
                          <span className="text-emerald-700">Hợp lệ</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {["DRAFT", "NEEDS_ROOM", "ROOM_ASSIGNED", "CONFLICT"].includes(status) && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-xs text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                              onClick={() => goToAllocation(exam)}
                              title="Mở màn phân phòng thi"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={13} className="h-32 text-center text-sm text-gray-400">
                      Không có lịch thi phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredExams.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <div className="flex items-start gap-2">
          <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            Staff chỉ xem lịch thi và xử lý phân phòng thi. Import, hủy, công bố hoặc khóa lịch thi được thực hiện ở màn Admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffExamsPage;
export { StaffExamsPage };
