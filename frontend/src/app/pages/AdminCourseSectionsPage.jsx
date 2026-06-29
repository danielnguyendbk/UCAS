import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { httpClient } from "@/services/httpClient";
import StaffClassSectionsPage from "@/features/staff/pages/StaffClassSectionsPage";

const EMPTY_FORM = {
  id: null,
  semester_id: "",
  course_id: "",
  lecturer_id: "",
  section_code: "",
  enrolled_count: "",
  max_capacity: "",
  status: "ACTIVE",
};

const DAY_LABELS = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ nhật",
};

const SECTION_STATUS_LABELS = {
  ACTIVE: "Hoạt động",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
};

const SCHEDULE_STATUS_LABELS = {
  NO_SCHEDULE: "Chưa có lịch",
  UNASSIGNED: "Chưa phân phòng",
  ASSIGNED: "Đã phân phòng",
  CONFLICT: "Có xung đột",
};

const SCHEDULE_BADGE_CLASSES = {
  NO_SCHEDULE: "bg-orange-50 text-orange-700 border-orange-200",
  UNASSIGNED: "bg-amber-50 text-amber-700 border-amber-200",
  ASSIGNED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CONFLICT: "bg-red-50 text-red-700 border-red-200",
};

const SECTION_BADGE_CLASSES = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  CANCELLED: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
};

const getResponseData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const asString = (value) => String(value ?? "").trim();

const asNumber = (value) => Number(value || 0);

const formatTime = (value) => {
  if (!value) return "";
  return String(value).slice(0, 5);
};

const getActiveSemesterId = (semesters) => {
  const active = semesters.find(
    (semester) => String(semester.status || "").toUpperCase() === "ACTIVE",
  );

  return String((active || semesters[0])?.id || "");
};

const normalizeSemester = (semester) => ({
  id: semester.id,
  semester_name:
    semester.semester_name ||
    semester.semesterName ||
    semester.name ||
    "",
  status: semester.status || "",
});

const normalizeCourse = (course) => ({
  id: course.id,
  course_code: course.course_code || course.courseCode || "",
  course_name: course.course_name || course.courseName || "",
  credits: course.credits ?? "",
  department_id: course.department_id || course.departmentId || "",
  department_name:
    course.department_name ||
    course.departmentName ||
    course.department ||
    "",
  department_code:
    course.department_code ||
    course.departmentCode ||
    "",
});

const normalizeLecturer = (lecturer) => ({
  id: lecturer.id,
  full_name:
    lecturer.full_name ||
    lecturer.fullName ||
    lecturer.name ||
    "",
  department_id: lecturer.department_id || lecturer.departmentId || "",
  department_name:
    lecturer.department_name ||
    lecturer.departmentName ||
    "",
  staff_code: lecturer.staff_code || lecturer.staffCode || "",
});

const normalizeSchedule = (schedule) => ({
  id: schedule.id,
  section_id: schedule.section_id || schedule.sectionId,
  classroom_id: schedule.classroom_id || schedule.classroomId,
  day_of_week: schedule.day_of_week || schedule.dayOfWeek,
  slot_start_id: schedule.slot_start_id || schedule.slotStartId,
  slot_end_id: schedule.slot_end_id || schedule.slotEndId,
  start_time: schedule.start_time || schedule.startTime,
  end_time: schedule.end_time || schedule.endTime,
  status: schedule.status || "ACTIVE",
});

const normalizeClassroom = (room) => ({
  id: room.id,
  room_number: room.room_number || room.roomNumber || "",
  room_name: room.room_name || room.roomName || "",
  building_code: room.building_code || room.buildingCode || "",
  capacity: room.capacity || "",
});

const getRoomLabel = (room) => {
  if (!room) return "Chưa phân phòng";
  if (room.room_name) return room.room_name;
  if (room.building_code && room.room_number) {
    return `${room.building_code}-${room.room_number}`;
  }
  return room.room_number || "Chưa phân phòng";
};

const isOverlapping = (a, b) =>
  asNumber(a.slot_start_id) <= asNumber(b.slot_end_id) &&
  asNumber(b.slot_start_id) <= asNumber(a.slot_end_id);

const LegacyAdminCourseSectionsPage = () => {
  const [rawSections, setRawSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [search, setSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterLecturer, setFilterLecturer] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [sectionForm, setSectionForm] = useState(EMPTY_FORM);

  const [viewSection, setViewSection] = useState(null);
  const [cancelSection, setCancelSection] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        sectionsResponse,
        semestersResponse,
        coursesResponse,
        lecturersResponse,
        schedulesResponse,
        classroomsResponse,
      ] = await Promise.all([
        httpClient.get("/api/class-sections"),
        httpClient.get("/api/semesters"),
        httpClient.get("/api/courses"),
        httpClient.get("/api/lecturers"),
        httpClient.get("/api/schedules"),
        httpClient.get("/api/classrooms"),
      ]);

      const nextSemesters = getResponseData(semestersResponse).map(normalizeSemester);

      setRawSections(getResponseData(sectionsResponse));
      setSemesters(nextSemesters);
      setCourses(getResponseData(coursesResponse).map(normalizeCourse));
      setLecturers(getResponseData(lecturersResponse).map(normalizeLecturer));
      setSchedules(getResponseData(schedulesResponse).map(normalizeSchedule));
      setClassrooms(getResponseData(classroomsResponse).map(normalizeClassroom));

      const activeSemesterId = getActiveSemesterId(nextSemesters);
      if (activeSemesterId) {
        setFilterSemester((current) => current === "all" ? activeSemesterId : current);
      }
    } catch (error) {
      console.error("Không tải được dữ liệu lớp học phần:", error);
      setErrorMessage("Không tải được dữ liệu lớp học phần. Vui lòng kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const courseMap = useMemo(() => {
    const map = new Map();
    courses.forEach((course) => map.set(String(course.id), course));
    return map;
  }, [courses]);

  const lecturerMap = useMemo(() => {
    const map = new Map();
    lecturers.forEach((lecturer) => map.set(String(lecturer.id), lecturer));
    return map;
  }, [lecturers]);

  const semesterMap = useMemo(() => {
    const map = new Map();
    semesters.forEach((semester) => map.set(String(semester.id), semester));
    return map;
  }, [semesters]);

  const classroomMap = useMemo(() => {
    const map = new Map();
    classrooms.forEach((room) => map.set(String(room.id), room));
    return map;
  }, [classrooms]);

  const schedulesBySection = useMemo(() => {
    const map = new Map();

    schedules
      .filter((schedule) => String(schedule.status || "").toUpperCase() === "ACTIVE")
      .forEach((schedule) => {
        const key = String(schedule.section_id);
        const current = map.get(key) || [];
        current.push(schedule);
        map.set(key, current);
      });

    return map;
  }, [schedules]);

  const conflictedSectionIds = useMemo(() => {
    const result = new Set();
    const activeSchedules = schedules.filter(
      (schedule) => String(schedule.status || "").toUpperCase() === "ACTIVE",
    );

    for (let i = 0; i < activeSchedules.length; i += 1) {
      for (let j = i + 1; j < activeSchedules.length; j += 1) {
        const a = activeSchedules[i];
        const b = activeSchedules[j];

        if (String(a.day_of_week) !== String(b.day_of_week)) continue;
        if (!isOverlapping(a, b)) continue;

        const sectionA = rawSections.find(
          (section) => String(section.id) === String(a.section_id),
        );
        const sectionB = rawSections.find(
          (section) => String(section.id) === String(b.section_id),
        );

        const sameRoom =
          a.classroom_id &&
          b.classroom_id &&
          String(a.classroom_id) === String(b.classroom_id);

        const sameLecturer =
          sectionA?.lecturer_id &&
          sectionB?.lecturer_id &&
          String(sectionA.lecturer_id) === String(sectionB.lecturer_id);

        if (sameRoom || sameLecturer) {
          result.add(String(a.section_id));
          result.add(String(b.section_id));
        }
      }
    }

    return result;
  }, [schedules, rawSections]);

  const sections = useMemo(() => {
    return rawSections.map((section) => {
      const course = courseMap.get(String(section.course_id)) || {};
      const lecturer = lecturerMap.get(String(section.lecturer_id)) || {};
      const semester = semesterMap.get(String(section.semester_id)) || {};
      const sectionSchedules = schedulesBySection.get(String(section.id)) || [];

      let allocationStatus = "NO_SCHEDULE";

      if (sectionSchedules.length > 0) {
        const hasConflict = conflictedSectionIds.has(String(section.id));
        const hasRoom = sectionSchedules.some((schedule) => schedule.classroom_id);

        if (hasConflict) {
          allocationStatus = "CONFLICT";
        } else if (hasRoom) {
          allocationStatus = "ASSIGNED";
        } else {
          allocationStatus = "UNASSIGNED";
        }
      }

      const scheduleText = sectionSchedules.length
        ? sectionSchedules
            .map((schedule) => {
              const room = classroomMap.get(String(schedule.classroom_id));
              const day = DAY_LABELS[schedule.day_of_week] || schedule.day_of_week;
              const time = `${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`;
              return `${day} ${time} · ${getRoomLabel(room)}`;
            })
            .join("; ")
        : "Chưa có lịch";

      return {
        id: section.id,
        semester_id: section.semester_id,
        course_id: section.course_id,
        lecturer_id: section.lecturer_id,
        section_code: section.section_code || "",
        enrolled_count: section.enrolled_count ?? 0,
        max_capacity: section.max_capacity ?? 0,
        status: section.status || "ACTIVE",

        semester_name: section.semester_name || semester.semester_name || "",
        course_code: section.course_code || course.course_code || "",
        course_name: section.course_name || course.course_name || "",
        credits: section.credits || course.credits || "",
        department_code: course.department_code || "",
        department_name: course.department_name || "",
        lecturer_name: section.lecturer_name || lecturer.full_name || "",

        allocationStatus,
        scheduleText,
      };
    });
  }, [
    rawSections,
    courseMap,
    lecturerMap,
    semesterMap,
    schedulesBySection,
    conflictedSectionIds,
    classroomMap,
  ]);

  const departmentOptions = useMemo(() => {
    const map = new Map();

    courses.forEach((course) => {
      if (course.department_code || course.department_name) {
        map.set(course.department_code || course.department_name, {
          code: course.department_code || course.department_name,
          name: course.department_name || course.department_code,
        });
      }
    });

    return Array.from(map.values());
  }, [courses]);

  const filteredSections = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sections.filter((section) => {
      const matchSearch =
        !keyword ||
        [
          section.course_code,
          section.course_name,
          section.section_code,
          section.lecturer_name,
          section.department_name,
          section.department_code,
        ].some((value) => String(value || "").toLowerCase().includes(keyword));

      const matchSemester =
        filterSemester === "all" ||
        String(section.semester_id) === String(filterSemester);

      const matchStatus =
        filterStatus === "all" ||
        section.allocationStatus === filterStatus ||
        section.status === filterStatus;

      const matchDepartment =
        filterDepartment === "all" ||
        section.department_code === filterDepartment ||
        section.department_name === filterDepartment;

      const matchLecturer =
        filterLecturer === "all" ||
        String(section.lecturer_id) === String(filterLecturer);

      return (
        matchSearch &&
        matchSemester &&
        matchStatus &&
        matchDepartment &&
        matchLecturer
      );
    });
  }, [
    sections,
    search,
    filterSemester,
    filterStatus,
    filterDepartment,
    filterLecturer,
  ]);

  const statsScope = useMemo(() => {
    return sections.filter(
      (section) =>
        filterSemester === "all" ||
        String(section.semester_id) === String(filterSemester),
    );
  }, [sections, filterSemester]);

  const stats = useMemo(() => {
    const activeSections = statsScope.filter((section) => section.status !== "CANCELLED");

    return {
      total: activeSections.length,
      noSchedule: activeSections.filter((section) => section.allocationStatus === "NO_SCHEDULE").length,
      unassigned: activeSections.filter((section) => section.allocationStatus === "UNASSIGNED").length,
      assigned: activeSections.filter((section) => section.allocationStatus === "ASSIGNED").length,
      conflict: activeSections.filter((section) => section.allocationStatus === "CONFLICT").length,
      cancelled: statsScope.filter((section) => section.status === "CANCELLED").length,
      completed: statsScope.filter((section) => section.status === "COMPLETED").length,
    };
  }, [statsScope]);

  const openCreateDialog = () => {
    setFormMode("create");
    setSectionForm({
      ...EMPTY_FORM,
      semester_id:
        filterSemester !== "all"
          ? filterSemester
          : getActiveSemesterId(semesters),
      course_id: courses[0]?.id ? String(courses[0].id) : "",
      lecturer_id: lecturers[0]?.id ? String(lecturers[0].id) : "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditDialog = (section) => {
    setFormMode("edit");
    setSectionForm({
      id: section.id,
      semester_id: section.semester_id ? String(section.semester_id) : "",
      course_id: section.course_id ? String(section.course_id) : "",
      lecturer_id: section.lecturer_id ? String(section.lecturer_id) : "",
      section_code: section.section_code || "",
      enrolled_count: String(section.enrolled_count ?? ""),
      max_capacity: String(section.max_capacity ?? ""),
      status: section.status || "ACTIVE",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleChangeForm = (field, value) => {
    setSectionForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!sectionForm.semester_id) return "Vui lòng chọn học kỳ.";
    if (!sectionForm.course_id) return "Vui lòng chọn môn học.";
    if (!sectionForm.lecturer_id) return "Vui lòng chọn giảng viên.";
    if (!sectionForm.section_code.trim()) return "Mã nhóm/tổ không được để trống.";

    if (Number(sectionForm.enrolled_count) < 0) {
      return "Số sinh viên không hợp lệ.";
    }

    if (!sectionForm.max_capacity || Number(sectionForm.max_capacity) <= 0) {
      return "Sức chứa tối đa phải lớn hơn 0.";
    }

    if (Number(sectionForm.max_capacity) < Number(sectionForm.enrolled_count || 0)) {
      return "Sức chứa tối đa không được nhỏ hơn số sinh viên.";
    }

    return "";
  };

  const buildPayload = () => ({
    semester_id: Number(sectionForm.semester_id),
    course_id: Number(sectionForm.course_id),
    lecturer_id: Number(sectionForm.lecturer_id),
    section_code: sectionForm.section_code.trim(),
    enrolled_count: Number(sectionForm.enrolled_count || 0),
    max_capacity: Number(sectionForm.max_capacity),
    status: sectionForm.status || "ACTIVE",
  });

  const handleSaveSection = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = buildPayload();

      if (formMode === "edit" && sectionForm.id) {
        await httpClient.put(`/api/class-sections/${sectionForm.id}`, payload);
      } else {
        await httpClient.post("/api/class-sections", payload);
      }

      setIsFormOpen(false);
      setSectionForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error("Không lưu được lớp học phần:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không lưu được lớp học phần. Vui lòng kiểm tra dữ liệu nhập.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSection = async () => {
    if (!cancelSection?.id) return;

    setSaving(true);
    setErrorMessage("");

    try {
      await httpClient.put(`/api/class-sections/${cancelSection.id}`, {
        semester_id: cancelSection.semester_id,
        course_id: cancelSection.course_id,
        lecturer_id: cancelSection.lecturer_id,
        section_code: cancelSection.section_code,
        enrolled_count: cancelSection.enrolled_count,
        max_capacity: cancelSection.max_capacity,
        status: "CANCELLED",
      });

      setCancelSection(null);
      await loadData();
    } catch (error) {
      console.error("Không hủy được lớp học phần:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không hủy được lớp học phần. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium text-sm">
          Đang đồng bộ dữ liệu lớp học phần...
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý lớp học phần
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý dữ liệu đầu vào lớp học phần theo học kỳ
          </p>
        </div>

        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm text-white shadow-sm"
          onClick={openCreateDialog}
        >
          <Plus className="w-4 h-4" />
          Thêm lớp HP
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard color="blue" label="Tổng lớp HP" value={stats.total} />
        <StatCard color="orange" label="Chưa có lịch" value={stats.noSchedule} />
        <StatCard color="amber" label="Chưa phân phòng" value={stats.unassigned} />
        <StatCard color="green" label="Đã phân phòng" value={stats.assigned} />
        <StatCard color="red" label="Có xung đột" value={stats.conflict} />
        <StatCard color="slate" label="Đã hủy" value={stats.cancelled} />
        <StatCard color="indigo" label="Hoàn tất" value={stats.completed} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã môn, tên môn, nhóm/tổ, giảng viên..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-9 text-sm rounded-lg"
          />
        </div>

        <select
          value={filterSemester}
          onChange={(event) => setFilterSemester(event.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
        >
          <option value="all">Tất cả học kỳ</option>
          {semesters.map((semester) => (
            <option key={semester.id} value={semester.id}>
              {semester.semester_name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="NO_SCHEDULE">Chưa có lịch</option>
          <option value="UNASSIGNED">Chưa phân phòng</option>
          <option value="ASSIGNED">Đã phân phòng</option>
          <option value="CONFLICT">Có xung đột</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="COMPLETED">Hoàn tất</option>
        </select>

        <select
          value={filterLecturer}
          onChange={(event) => setFilterLecturer(event.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
        >
          <option value="all">Tất cả giảng viên</option>
          {lecturers.map((lecturer) => (
            <option key={lecturer.id} value={lecturer.id}>
              {lecturer.full_name}
            </option>
          ))}
        </select>

        <select
          value={filterDepartment}
          onChange={(event) => setFilterDepartment(event.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm lg:col-start-4 lg:col-span-2"
        >
          <option value="all">Tất cả bộ môn/khoa</option>
          {departmentOptions.map((department) => (
            <option key={department.code} value={department.code}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-b border-gray-200">
              <TableHead>Mã MH</TableHead>
              <TableHead>Tên môn học</TableHead>
              <TableHead className="text-center">Nhóm/Tổ</TableHead>
              <TableHead>Bộ môn/Khoa</TableHead>
              <TableHead className="text-center">TC</TableHead>
              <TableHead className="text-center">SV</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Lịch học</TableHead>
              <TableHead className="text-center">Trạng thái lịch</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-gray-300" />
                    <p className="font-semibold text-gray-700">
                      Chưa có lớp học phần phù hợp.
                    </p>
                    <p className="text-xs text-gray-400">
                      Hãy kiểm tra lại bộ lọc hoặc thêm lớp học phần mới.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => (
                <TableRow key={section.id} className="hover:bg-gray-50/40">
                  <TableCell className="font-mono text-xs font-bold text-blue-700">
                    {section.course_code}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-800 max-w-[220px]">
                    {section.course_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-block font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
                      {section.section_code}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {section.department_name || section.department_code || "---"}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {section.credits || "---"}
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold">
                    {section.enrolled_count}/{section.max_capacity}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[140px]">
                    {section.lecturer_name || "---"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-[260px]">
                    {section.scheduleText}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${SCHEDULE_BADGE_CLASSES[section.allocationStatus]} text-[10px] font-semibold border px-2 py-0.5 rounded-full shadow-none`}>
                      {SCHEDULE_STATUS_LABELS[section.allocationStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${SECTION_BADGE_CLASSES[section.status] || SECTION_BADGE_CLASSES.ACTIVE} text-[10px] font-semibold border px-2 py-0.5 rounded-full shadow-none`}>
                      {SECTION_STATUS_LABELS[section.status] || section.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewSection(section)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(section)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setCancelSection(section)}
                        disabled={section.status === "CANCELLED"}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hủy
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 shadow-sm">
        <span>
          Hiển thị {filteredSections.length} / {sections.length} lớp học phần
        </span>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Cập nhật lớp học phần" : "Thêm lớp học phần"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin lớp học phần theo học kỳ, môn học và giảng viên.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldSelect
                label="Học kỳ"
                value={sectionForm.semester_id}
                onChange={(value) => handleChangeForm("semester_id", value)}
                options={semesters.map((semester) => ({
                  value: semester.id,
                  label: semester.semester_name,
                }))}
              />

              <FieldSelect
                label="Môn học"
                value={sectionForm.course_id}
                onChange={(value) => handleChangeForm("course_id", value)}
                options={courses.map((course) => ({
                  value: course.id,
                  label: `${course.course_code} - ${course.course_name}`,
                }))}
              />
            </div>

            <FieldSelect
              label="Giảng viên phụ trách"
              value={sectionForm.lecturer_id}
              onChange={(value) => handleChangeForm("lecturer_id", value)}
              options={lecturers.map((lecturer) => ({
                value: lecturer.id,
                label: lecturer.full_name,
              }))}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Mã nhóm/tổ</Label>
                <Input
                  placeholder="VD: 01"
                  value={sectionForm.section_code}
                  onChange={(event) =>
                    handleChangeForm("section_code", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Số sinh viên</Label>
                <Input
                  type="number"
                  min="0"
                  value={sectionForm.enrolled_count}
                  onChange={(event) =>
                    handleChangeForm("enrolled_count", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Sức chứa tối đa</Label>
                <Input
                  type="number"
                  min="1"
                  value={sectionForm.max_capacity}
                  onChange={(event) =>
                    handleChangeForm("max_capacity", event.target.value)
                  }
                />
              </div>
            </div>

            <FieldSelect
              label="Trạng thái"
              value={sectionForm.status}
              onChange={(value) => handleChangeForm("status", value)}
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "CANCELLED", label: "Đã hủy" },
                { value: "COMPLETED", label: "Hoàn tất" },
              ]}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveSection}
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : formMode === "edit"
                  ? "Lưu thay đổi"
                  : "Tạo lớp HP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewSection)} onOpenChange={() => setViewSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết lớp học phần</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết lớp học phần trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          {viewSection && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Học kỳ" value={viewSection.semester_name} />
              <DetailRow label="Mã môn" value={viewSection.course_code} />
              <DetailRow label="Tên môn" value={viewSection.course_name} />
              <DetailRow label="Nhóm/Tổ" value={viewSection.section_code} />
              <DetailRow label="Bộ môn/Khoa" value={viewSection.department_name || viewSection.department_code} />
              <DetailRow label="Số tín chỉ" value={viewSection.credits || "---"} />
              <DetailRow label="Sinh viên" value={`${viewSection.enrolled_count}/${viewSection.max_capacity}`} />
              <DetailRow label="Giảng viên" value={viewSection.lecturer_name} />
              <DetailRow label="Lịch học" value={viewSection.scheduleText} />
              <DetailRow label="Trạng thái lịch" value={SCHEDULE_STATUS_LABELS[viewSection.allocationStatus]} />
              <DetailRow label="Trạng thái lớp HP" value={SECTION_STATUS_LABELS[viewSection.status] || viewSection.status} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSection(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelSection)} onOpenChange={() => setCancelSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lớp học phần</DialogTitle>
            <DialogDescription>
              Lớp học phần sẽ được chuyển sang trạng thái Đã hủy, không xóa khỏi database.
            </DialogDescription>
          </DialogHeader>

          {cancelSection && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">
                {cancelSection.course_code} - Nhóm {cancelSection.section_code}
              </p>
              <p className="mt-1 text-gray-500">
                {cancelSection.course_name} · {cancelSection.lecturer_name}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelSection(null)}
              disabled={saving}
            >
              Đóng
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelSection}
              disabled={saving}
            >
              {saving ? "Đang hủy..." : "Hủy lớp HP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ color, label, value }) => {
  const colorClassMap = {
    blue: "border-blue-100 text-blue-600",
    orange: "border-orange-100 text-orange-600",
    amber: "border-amber-100 text-amber-600",
    green: "border-green-100 text-green-600",
    red: "border-red-100 text-red-600",
    slate: "border-slate-100 text-slate-600",
    indigo: "border-indigo-100 text-indigo-600",
  };

  return (
    <div className={`bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow ${colorClassMap[color] || colorClassMap.blue}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">
        {value}
      </p>
    </div>
  );
};

const FieldSelect = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">Chọn {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 border-b border-gray-50 py-2">
    <span className="text-xs font-bold text-gray-500">{label}:</span>
    <span className="col-span-2 text-xs text-gray-800">{value || "---"}</span>
  </div>
);

// The previous CRUD screen targets retired /api/class-sections and /api/schedules
// contracts. Keep it available for a later, deliberate CRUD migration while the
// active Admin route uses the compatible read endpoint already provided by backend.
const AdminCourseSectionsPage = () => (
  <StaffClassSectionsPage
    endpoint="/api/admin/class-sections"
    description="Admin xem danh sách lớp học phần và trạng thái phân phòng từ database."
  />
);

export { AdminCourseSectionsPage, LegacyAdminCourseSectionsPage };
