import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  Filter,
  Check,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Info,
  Layers,
  FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
import { httpClient } from "../../services/httpClient";

const getActiveSemesterId = (semesters) => {
  const activeSemester = semesters.find(
    (semester) => semester.status?.toUpperCase() === "ACTIVE",
  );
  return (activeSemester || semesters[0])?.id?.toString() || "";
};

const formatStudentCapacity = (section) => {
  const enrolledCount = section.students ?? 0;
  const maxCapacity = section.maxCapacity ?? "-";
  return `${enrolledCount}/${maxCapacity}`;
};

const getClassStudentCount = (classItem) =>
  Number(classItem?.studentCount ?? classItem?.STUDENT_COUNT ?? 0);

const getTimeSlotId = (slot) => Number(slot?.slotId ?? slot?.id ?? 0);

const getTimeSlotNo = (slot) =>
  Number(slot?.slotNo ?? slot?.slot_no ?? slot?.slotNumber ?? 0);

const getTimeSlotLabel = (slot) => {
  const slotNo = getTimeSlotNo(slot);
  const startTime = String(slot?.startTime ?? "").slice(0, 5);
  const endTime = String(slot?.endTime ?? "").slice(0, 5);
  const timeLabel = startTime && endTime ? ` (${startTime}-${endTime})` : "";
  return `Tiết ${slotNo}${timeLabel}`;
};

const getClassroomLabel = (room) => {
  const buildingCode = room?.buildingCode ?? "";
  const roomNumber = room?.roomNumber ?? "";
  const roomName = room?.roomName ?? "";

  if (buildingCode && roomNumber) {
    return `${buildingCode}-${roomNumber}`;
  }

  return roomName || roomNumber || `Phòng ${room?.id ?? ""}`;
};

// Schedule Status (Trạng thái lịch) mapping helper
const getScheduleStatusLabel = (allocationStatus) => {
  switch (allocationStatus) {
    case "NO_SCHEDULE":
      return "Chưa có lịch";
    case "UNASSIGNED":
      return "Chưa phân phòng";
    case "ASSIGNED":
      return "Đã phân phòng";
    case "PENDING_APPROVAL":
      return "Chờ duyệt";
    case "PUBLISHED":
      return "Đã công bố";
    case "CONFLICT":
      return "Có xung đột";
    default:
      return allocationStatus || "Chưa có lịch";
  }
};

const getScheduleStatusBadgeClass = (allocationStatus) => {
  switch (allocationStatus) {
    case "NO_SCHEDULE":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "UNASSIGNED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "ASSIGNED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING_APPROVAL":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "PUBLISHED":
      return "bg-green-50 text-green-700 border-green-200";
    case "CONFLICT":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

// Section Status (Trạng thái hoạt động) mapping helper
const getSectionStatusLabel = (status) => {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";
    case "CANCELLED":
      return "Đã hủy";
    case "COMPLETED":
      return "Hoàn tất";
    default:
      return status || "Hoạt động";
  }
};

const getSectionStatusBadgeClass = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
  }
};

export const AdminCourseSectionsPage = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU & BẢNG ---
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);

  // --- STATE QUẢN LÝ DANH MỤC (Lấy từ Database) ---
  const [departmentsList, setDepartmentsList] = useState([]);
  const [semestersList, setSemestersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [classroomsList, setClassroomsList] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);

  // --- BỘ LỌC BẢNG ---
  const [search, setSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterLecturer, setFilterLecturer] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // --- STATE CHO MODAL THÊM / SỬA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add", "edit", or "detail"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // --- STATE CHO CÁC MODAL THÔNG BÁO / CHI TIẾT ---
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [placeholderModal, setPlaceholderModal] = useState({ isOpen: false, title: "", message: "" });

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    semesterId: "",
    facultyCode: "all",
    departmentCode: "all",
    courseId: "",
    lecturerId: "",
    classIds: [],
    sectionCode: "",
    maxCapacity: "",
    classroomId: "",
    day: "MON",
    slotStartId: "",
    slotEndId: "",
  });

  // Khởi tạo
  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  // Gọi API lấy danh mục
  const fetchCategories = async () => {
    try {
      const [
        depRes,
        semRes,
        couRes,
        lecRes,
        classRes,
        classroomRes,
        slotRes,
      ] = await Promise.all([
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/courses"),
        httpClient.get("/api/categories/lecturers"),
        httpClient.get("/api/categories/classes"),
        httpClient.get("/api/categories/classrooms"),
        httpClient.get("/api/categories/time-slots"),
      ]);

      setDepartmentsList(depRes.data.data || []);
      const semesters = semRes.data.data || [];
      setSemestersList(semesters);
      const activeSemesterId = getActiveSemesterId(semesters);
      if (activeSemesterId) {
        setFilterSemester(activeSemesterId);
      }
      setCoursesList(couRes.data.data || []);
      setLecturersList(lecRes.data.data || []);
      setClassesList(classRes.data.data || []);
      setClassroomsList(classroomRes.data.data || []);
      setTimeSlotsList(slotRes.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  };

  // Gọi API lấy danh sách Lớp học phần
  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await httpClient.get("/api/admin/class-sections");
      const rawData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      const formattedData = rawData.map((item) => {
        // Field Mapping with fallbacks
        const fullClassCode = item.classCode || "";
        const parts = fullClassCode.split(".L");
        const fallbackCourseCode = parts[0] || "";
        const fallbackSectionCode = parts[1] || "";

        const resolvedCourseCode = item.courseCode || fallbackCourseCode;
        const resolvedSectionCode = item.sectionCode || fullClassCode;

        // Derive Nhóm/Tổ: prefer explicit groupCode, else strip courseCode prefix from sectionCode
        const deriveSectionGroup = (sectionCode, courseCode) => {
          if (!sectionCode) return "---";
          if (item.sectionGroup || item.groupCode) return item.sectionGroup || item.groupCode;
          if (courseCode && sectionCode.startsWith(courseCode)) {
            // e.g. INT1334-01 -> 01, INT1303-04-03 -> 04-03
            const suffix = sectionCode.slice(courseCode.length).replace(/^[-.]/, "");
            return suffix || sectionCode;
          }
          return sectionCode;
        };

        return {
          dbId: item.id,
          id: resolvedSectionCode, // kept internally for actions/import mapping
          sectionCode: resolvedSectionCode,
          courseCode: resolvedCourseCode, // Mã MH, e.g. INT1334
          sectionGroup: deriveSectionGroup(resolvedSectionCode, resolvedCourseCode), // Nhóm/Tổ, e.g. 01, 04-03
          name: item.courseName || item.name || "---",
          department: item.departmentCode || item.facultyCode || "---",
          credits: item.credits,
          students: item.studentCount ?? 0,
          lecturer: item.lecturerName || "---",
          day: item.day,
          slot: item.schedule,
          room: item.room,
          classIds: item.classIds || [],
          classCodes: item.classCodes || item.className || "---", // Lớp hành chính
          allocationStatus: item.allocationStatus || "NO_SCHEDULE",
          sectionStatus: item.sectionStatus || item.status || "ACTIVE",

          // DỮ LIỆU ẨN DÙNG CHO FORM SỬA (Lấy từ backend)
          semesterId: item.semesterId,
          courseId: item.courseId,
          lecturerId: item.lecturerId,
          maxCapacity: item.maxCapacity,
          dayCode: item.dayCode,
          classroomId: item.classroomId,
          slotStartId: item.slotStartId,
          slotEndId: item.slotEndId,
          slotStart: item.slotStart,
          slotEnd: item.slotEnd,
        };
      });

      setSections(formattedData);
      setSelectedSection(null);
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- MỞ MODAL THÊM / SỬA ---
  const handleOpenModal = (mode) => {
    const sortedSlots = [...timeSlotsList].sort(
      (a, b) => getTimeSlotNo(a) - getTimeSlotNo(b),
    );
    const firstSlotId = sortedSlots[0] ? getTimeSlotId(sortedSlots[0]).toString() : "";
    if (mode === "add") {
      setFormData({
        semesterId: getActiveSemesterId(semestersList),
        facultyCode: "all",
        departmentCode: "all",
        courseId: "",
        lecturerId: "",
        classIds: [],
        sectionCode: "",
        maxCapacity: "",
        classroomId: "",
        day: "MON",
        slotStartId: firstSlotId,
        slotEndId: firstSlotId,
      });
    } else if (mode === "edit" && selectedSection) {
      setFormData({
        semesterId: selectedSection.semesterId?.toString() || "",
        facultyCode: selectedSection.faculty || "all",
        departmentCode: selectedSection.department || "all",
        courseId: selectedSection.courseId?.toString() || "",
        lecturerId: selectedSection.lecturerId?.toString() || "",
        classIds: selectedSection.classIds || [],
        sectionCode: selectedSection.sectionCode || "",
        maxCapacity: selectedSection.maxCapacity?.toString() || "",
        classroomId: selectedSection.classroomId?.toString() || "",
        day: selectedSection.dayCode || "MON",
        slotStartId: selectedSection.slotStartId?.toString() || firstSlotId,
        slotEndId: selectedSection.slotEndId?.toString() || firstSlotId,
      });
    }
    setIsClassDropdownOpen(false);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // --- SUBMIT DỮ LIỆU ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selectedClassIds = formData.classIds.map(Number).filter(Boolean);
      const selectedClasses = classesList.filter((classItem) =>
        selectedClassIds.includes(Number(classItem.id)),
      );
      const selectedStudentTotal = selectedClasses.reduce(
        (total, classItem) => total + getClassStudentCount(classItem),
        0,
      );
      const maxCapacity = Number(formData.maxCapacity);
      const classroomId = Number(formData.classroomId);
      const slotStartId = Number(formData.slotStartId);
      const slotEndId = Number(formData.slotEndId);
      const slotStart = timeSlotsList.find(
        (slot) => getTimeSlotId(slot) === slotStartId,
      );
      const slotEnd = timeSlotsList.find(
        (slot) => getTimeSlotId(slot) === slotEndId,
      );
      const slotStartNo = getTimeSlotNo(slotStart);
      const slotEndNo = getTimeSlotNo(slotEnd);

      if (selectedClassIds.length < 1 || selectedClassIds.length > 2) {
        alert("Vui lòng chọn từ 1 đến tối đa 2 Lớp hành chính.");
        setIsSubmitting(false);
        return;
      }

      if (maxCapacity < selectedStudentTotal) {
        alert("Sức chứa không được nhỏ hơn tổng số sinh viên của các Lớp hành chính đã chọn.");
        setIsSubmitting(false);
        return;
      }

      if (!classroomId) {
        alert("Vui lòng chọn phòng học.");
        setIsSubmitting(false);
        return;
      }

      if (!slotStartId || !slotEndId || slotEndNo < slotStartNo) {
        alert("Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        semesterId: Number(formData.semesterId),
        courseId: Number(formData.courseId),
        lecturerId: Number(formData.lecturerId),
        sectionCode: formData.sectionCode,
        classIds: selectedClassIds,
        enrolledCount: selectedStudentTotal,
        maxCapacity,
        status: "ACTIVE",
        classroomId,
        day: formData.day,
        slotStartId,
        slotEndId,
      };

      if (modalMode === "add") {
        await httpClient.post("/api/admin/class-sections", payload);
        alert("Đã thêm lớp học phần mới thành công!");
      } else {
        await httpClient.put(
          `/api/admin/class-sections/${selectedSection.dbId}`,
          payload,
        );
        alert("Đã cập nhật lớp học phần thành công!");
      }

      setIsModalOpen(false);
      fetchSections();
    } catch (error) {
      console.error("Lỗi:", error);
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra, vui lòng kiểm tra lại!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- XÓA LỚP ---
  const handleDeleteSection = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy (xóa) lớp học phần này? Lịch học và phòng sẽ bị giải phóng!",
      )
    ) {
      return;
    }
    try {
      await httpClient.delete(
        `/api/admin/class-sections/${selectedSection.dbId}`,
      );
      alert("Đã hủy lớp học phần thành công!");
      setIsModalOpen(false);
      fetchSections();
    } catch (error) {
      alert("Lỗi khi xóa lớp!");
    }
  };

  // --- BỘ LỌC CHO BẢNG ---
  const filtered = sections.filter((s) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      s.courseCode.toLowerCase().includes(keyword) ||
      s.name.toLowerCase().includes(keyword) ||
      s.sectionGroup.toLowerCase().includes(keyword) ||
      s.lecturer.toLowerCase().includes(keyword) ||
      s.classCodes?.toLowerCase().includes(keyword);

    const matchSemester =
      filterSemester === "all" || s.semesterId?.toString() === filterSemester;
    const matchStatus =
      filterStatus === "all" ||
      s.allocationStatus === filterStatus ||
      s.sectionStatus === filterStatus;
    const matchDepartment =
      filterDepartment === "all" || s.department === filterDepartment;
    const matchClass =
      filterClass === "all" || s.classCodes?.toLowerCase().includes(filterClass.toLowerCase());
    const matchLecturer =
      filterLecturer === "all" || s.lecturerId?.toString() === filterLecturer;

    return (
      matchSearch &&
      matchSemester &&
      matchStatus &&
      matchDepartment &&
      matchClass &&
      matchLecturer
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const currentSemester = semestersList.find(
    (s) => s.id.toString() === formData.semesterId,
  );
  const isSemesterClosed = currentSemester?.status === "COMPLETED";

  const selectedClassIds = formData.classIds.map(Number).filter(Boolean);
  const selectedClasses = classesList.filter((classItem) =>
    selectedClassIds.includes(Number(classItem.id)),
  );
  const selectedStudentTotal = selectedClasses.reduce(
    (total, classItem) => total + getClassStudentCount(classItem),
    0,
  );
  const filteredClassesForModal = classesList;

  const toggleClassSelection = (classId) => {
    setFormData((prev) => {
      const nextClassId = Number(classId);
      const exists = prev.classIds.includes(nextClassId);
      if (exists) {
        return {
          ...prev,
          classIds: prev.classIds.filter((id) => id !== nextClassId),
        };
      }
      if (prev.classIds.length >= 2) {
        return prev;
      }
      return {
        ...prev,
        classIds: [...prev.classIds, nextClassId],
      };
    });
  };

  const selectedClassLabel =
    selectedClasses.length > 0
      ? selectedClasses.map((classItem) => classItem.classCode).join(", ")
      : "Chọn 1-2 lớp HC";

  const sortedTimeSlots = [...timeSlotsList].sort(
    (a, b) => getTimeSlotNo(a) - getTimeSlotNo(b),
  );
  const selectedSlotStart = sortedTimeSlots.find(
    (slot) => getTimeSlotId(slot) === Number(formData.slotStartId),
  );
  const selectedSlotStartNo = getTimeSlotNo(selectedSlotStart);

  // --- HÀM MỞ PHẨN PHỤ ĐANG PHÁT TRIỂN ---
  const handleActionPlaceholder = (actionName) => {
    setPlaceholderModal({
      isOpen: true,
      title: actionName,
      message: `Chức năng "${actionName}" đang được phát triển theo lộ trình nghiệp vụ mới và sẽ sớm sẵn sàng trong phiên bản kế tiếp.`,
    });
  };

  const handleOpenDetailModal = (s) => {
    setDetailModal({
      isOpen: true,
      data: s,
    });
  };

  if (isLoading) {
    return (
      <div className="p-5 flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">
          Đang đồng bộ dữ liệu lớp học phần...
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* HEADER TÍNH NĂNG */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý lớp học phần
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý dữ liệu đầu vào lớp học phần theo học kỳ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* IMPORT LỚP HP */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-sm border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => handleActionPlaceholder("Import lớp học phần")}
          >
            <Download className="w-4 h-4 rotate-180" />
            Import lớp HP
          </Button>

          {/* XUẤT MẪU EXCEL */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => handleActionPlaceholder("Xuất mẫu Excel")}
          >
            <FileText className="w-4 h-4" />
            Xuất mẫu Excel
          </Button>

          {/* THÊM LỚP HP */}
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm text-white shadow-sm"
            onClick={() => handleOpenModal("add")}
          >
            <Plus className="w-4 h-4" />
            Thêm lớp HP
          </Button>
        </div>
      </div>

      {/* THỐNG KÊ (7 CARDS RESPONSIVE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl border border-blue-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Tổng lớp HP</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{sections.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Chưa có lịch</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sections.filter((s) => s.allocationStatus === "NO_SCHEDULE").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Chưa phân phòng</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sections.filter((s) => s.allocationStatus === "UNASSIGNED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Đã phân phòng</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sections.filter((s) => s.allocationStatus === "ASSIGNED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Chờ duyệt</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sections.filter((s) => s.allocationStatus === "PENDING_APPROVAL").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Đã công bố</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sections.filter((s) => s.allocationStatus === "PUBLISHED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Có xung đột</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {sections.filter((s) => s.allocationStatus === "CONFLICT").length}
          </p>
        </div>
      </div>

      {/* BỘ LỌC BẢNG CHÍNH */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col lg:flex-row lg:flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã lớp HP, mã môn, tên môn, giảng viên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              setSelectedSection(null);
            }}
            className="pl-9 h-9 text-sm rounded-lg"
          />
        </div>

        {/* Học kỳ */}
        <Select
          value={filterSemester}
          onValueChange={(v) => {
            setFilterSemester(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full lg:w-48 h-9 text-sm rounded-lg bg-gray-50 border-gray-100">
            <SelectValue placeholder="Học kỳ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả học kỳ</SelectItem>
            {semestersList.map((sem) => (
              <SelectItem key={sem.id} value={sem.id.toString()}>
                {sem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Trạng thái */}
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full lg:w-44 h-9 text-sm rounded-lg bg-gray-50 border-gray-100">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="NO_SCHEDULE">Chưa có lịch</SelectItem>
            <SelectItem value="UNASSIGNED">Chưa phân phòng</SelectItem>
            <SelectItem value="ASSIGNED">Đã phân phòng</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Chờ duyệt</SelectItem>
            <SelectItem value="PUBLISHED">Đã công bố</SelectItem>
            <SelectItem value="CONFLICT">Xung đột lịch</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động (Lớp HP)</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy (Lớp HP)</SelectItem>
            <SelectItem value="COMPLETED">Hoàn tất (Lớp HP)</SelectItem>
          </SelectContent>
        </Select>

        {/* Khoa */}
        <Select
          value={filterDepartment}
          onValueChange={(v) => {
            setFilterDepartment(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full lg:w-44 h-9 text-sm rounded-lg bg-gray-50 border-gray-100">
            <SelectValue placeholder="Khoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khoa</SelectItem>
            {departmentsList.map((d) => (
              <SelectItem key={d.departmentCode} value={d.departmentCode}>
                {d.departmentName || d.departmentCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Lớp hành chính */}
        <Select
          value={filterClass}
          onValueChange={(v) => {
            setFilterClass(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full lg:w-40 h-9 text-sm rounded-lg bg-gray-50 border-gray-100">
            <SelectValue placeholder="Lớp hành chính" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lớp hành chính</SelectItem>
            {classesList.map((c) => (
              <SelectItem key={c.id} value={c.classCode}>
                {c.classCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Giảng viên */}
        <Select
          value={filterLecturer}
          onValueChange={(v) => {
            setFilterLecturer(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full lg:w-48 h-9 text-sm rounded-lg bg-gray-50 border-gray-100">
            <SelectValue placeholder="Giảng viên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả giảng viên</SelectItem>
            {lecturersList.map((l) => (
              <SelectItem key={l.id} value={l.id.toString()}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-b border-gray-200">
              <TableHead className="text-xs font-semibold text-gray-600">
                Mã MH
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tên môn học
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                Nhóm/Tổ
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Khoa
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Lớp hành chính
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                TC
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                SV
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Giảng viên
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                Trạng thái lịch
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                Trạng thái
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center min-w-[210px]">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-16 text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-gray-300" />
                    <p className="font-semibold text-gray-700">Chưa có lớp học phần trong học kỳ này.</p>
                    <p className="text-xs text-gray-400 max-w-sm">Học kỳ này chưa được nạp dữ liệu lớp học phần hoặc các bộ lọc của bạn không khớp với kết quả nào.</p>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
                      onClick={() => handleActionPlaceholder("Import lớp học phần")}
                    >
                      Import lớp học phần
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s) => {
                const schedBadge = getScheduleStatusBadgeClass(s.allocationStatus);
                const schedLabel = getScheduleStatusLabel(s.allocationStatus);
                const sectBadge = getSectionStatusBadgeClass(s.sectionStatus);
                const sectLabel = getSectionStatusLabel(s.sectionStatus);
                const isSelected = selectedSection?.dbId === s.dbId;

                const isOversized = s.students > s.maxCapacity;

                return (
                  <TableRow
                    key={s.dbId}
                    onClick={() => setSelectedSection(s)}
                    className={`cursor-pointer transition-colors border-b border-gray-100 ${isSelected ? "bg-blue-50/50 hover:bg-blue-50/50" : "hover:bg-gray-50/40"}`}
                  >
                    {/* Mã MH */}
                    <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                      {s.courseCode}
                    </TableCell>
                    {/* Tên môn học */}
                    <TableCell className="text-xs font-medium text-gray-800 max-w-[200px] truncate">
                      {s.name}
                    </TableCell>
                    {/* Nhóm/Tổ */}
                    <TableCell className="text-center">
                      <span className="inline-block font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
                        {s.sectionGroup}
                      </span>
                    </TableCell>
                    {/* Khoa */}
                    <TableCell className="text-xs text-gray-600">
                      {s.department || "---"}
                    </TableCell>
                    {/* Lớp hành chính */}
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                      {s.classCodes || "---"}
                    </TableCell>
                    {/* TC */}
                    <TableCell className="text-xs text-center font-medium">
                      {s.credits}
                    </TableCell>
                    {/* SV */}
                    <TableCell className="text-xs text-center font-semibold text-gray-700">
                      {formatStudentCapacity(s)}
                    </TableCell>
                    {/* Giảng viên */}
                    <TableCell className="text-xs text-gray-600 max-w-[120px] truncate">
                      {s.lecturer}
                    </TableCell>
                    {/* Trạng thái lịch */}
                    <TableCell className="text-center">
                      <Badge className={`${schedBadge} text-[10px] font-semibold border px-2 py-0.5 rounded-full shadow-none hover:opacity-90`}>
                        {schedLabel}
                      </Badge>
                    </TableCell>
                    {/* Trạng thái */}
                    <TableCell className="text-center">
                      <Badge className={`${sectBadge} text-[10px] font-semibold border px-2 py-0.5 rounded-full shadow-none`}>
                        {sectLabel}
                      </Badge>
                    </TableCell>
                    {/* Thao tác */}
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleOpenDetailModal(s)}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setSelectedSection(s);
                            handleOpenModal("edit");
                          }}
                        >
                          Sửa
                        </Button>
                        
                        {s.allocationStatus === "PENDING_APPROVAL" ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => handleActionPlaceholder("Đi tới duyệt lịch")}
                          >
                            Duyệt lịch
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => handleActionPlaceholder("Xem chi tiết lịch")}
                          >
                            Xem lịch
                          </Button>
                        )}

                        {s.allocationStatus === "CONFLICT" && (
                          <Button
                            size="xs"
                            className="h-7 px-2 text-[11px] bg-red-500 hover:bg-red-600 text-white font-medium shadow-none rounded-md"
                            onClick={() => handleActionPlaceholder("Xử lý xung đột lịch")}
                          >
                            Xử lý
                          </Button>
                        )}

                        {(isOversized || s.allocationStatus === "CONFLICT") && (
                          <Button
                            size="xs"
                            className="h-7 px-2 text-[11px] bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-none rounded-md"
                            onClick={() => handleActionPlaceholder("Tách lớp học phần")}
                          >
                            Tách lớp HP
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* PHÂN TRANG */}
      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 shadow-sm">
        <span>Hiển thị {paginated.length} / {filtered.length} lớp học phần</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 font-medium">Trang {currentPage} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ================= MODAL THÊM / SỬA ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">
                {modalMode === "add"
                  ? "Thêm Lớp học phần mới"
                  : `Sửa lớp: ${selectedSection?.id}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="p-6 space-y-5 bg-gray-50/40 max-h-[80vh] overflow-y-auto"
            >
              {/* CỤM 1: CÁC BỘ LỌC HỖ TRỢ */}
              <div className="bg-white p-4 rounded-lg border border-gray-200/80 shadow-sm space-y-3">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Bộ lọc hỗ trợ tìm kiếm
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Lọc theo Khoa
                    </label>
                    <Select
                      value={formData.facultyCode}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          facultyCode: v,
                          departmentCode: "all",
                          courseId: "",
                          lecturerId: "",
                          classIds: [],
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Tất cả Khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả Khoa</SelectItem>
                        {facultiesList.map((f) => (
                          <SelectItem key={f.code} value={f.code}>
                            {f.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Lọc theo Bộ môn
                    </label>
                    <Select
                      value={formData.departmentCode}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          departmentCode: v,
                          courseId: "",
                          lecturerId: "",
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Tất cả Bộ môn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả Bộ môn</SelectItem>
                        {departmentsList
                          .filter(
                            (d) =>
                              formData.facultyCode === "all" ||
                              d.facultyCode === formData.facultyCode,
                          )
                          .map((d) => (
                            <SelectItem key={d.code} value={d.code}>
                              {d.code}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Học kỳ <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.semesterId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, semesterId: v })
                      }
                      disabled={modalMode === "edit"}
                    >
                      <SelectTrigger className="border-blue-300 rounded-lg h-9">
                        <SelectValue placeholder="Chọn Học kỳ" />
                      </SelectTrigger>
                      <SelectContent>
                        {semestersList
                          .filter((sem) => sem.status !== "FINISHED")
                          .map((sem) => (
                            <SelectItem key={sem.id} value={sem.id.toString()}>
                              {sem.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {modalMode === "edit" && (
                      <p className="text-[10px] text-orange-600 italic">
                        * Không được đổi học kỳ khi sửa lớp
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CỤM 2: DỮ LIỆU LỚP HỌC PHẦN CHÍNH */}
              <div className="bg-white p-4 rounded-lg border border-gray-200/80 shadow-sm space-y-4">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Thông tin lớp học phần
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.courseId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, courseId: v })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="-- Chọn môn học --" />
                      </SelectTrigger>
                      <SelectContent>
                        {coursesList
                          .filter(
                            (c) =>
                              formData.departmentCode === "all" ||
                              c.departmentCode === formData.departmentCode,
                          )
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Giảng viên phụ trách <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.lecturerId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, lecturerId: v })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="-- Chọn giảng viên --" />
                      </SelectTrigger>
                      <SelectContent>
                        {lecturersList
                          .filter(
                            (l) =>
                              formData.departmentCode === "all" ||
                              l.departmentCode === formData.departmentCode,
                          )
                          .map((l) => (
                            <SelectItem key={l.id} value={l.id.toString()}>
                              {l.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lớp hành chính selector instead of Classes */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Lớp hành chính liên quan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsClassDropdownOpen((open) => !open)}
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className={selectedClasses.length ? "font-medium text-gray-900" : "text-gray-400"}>
                        {selectedClassLabel}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {isClassDropdownOpen && (
                      <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        {filteredClassesForModal.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            Không có lớp hành chính phù hợp.
                          </div>
                        ) : (
                          filteredClassesForModal.map((classItem) => {
                            const classId = Number(classItem.id);
                            const checked = selectedClassIds.includes(classId);
                            const disabled = !checked && selectedClassIds.length >= 2;

                            return (
                              <button
                                key={classItem.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleClassSelection(classId)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50/50 ${
                                  disabled ? "cursor-not-allowed opacity-50 font-normal" : "font-medium"
                                }`}
                              >
                                <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                                  checked
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-300 bg-white"
                                }`}>
                                  {checked && <Check className="h-3 w-3" />}
                                </span>
                                <span className="flex-1">
                                  <span className="font-semibold text-gray-800">
                                    {classItem.classCode}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {classItem.className}
                                  </span>
                                </span>
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {getClassStudentCount(classItem)} SV
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Chọn 1 hoặc 2 lớp hành chính. Tổng sinh viên hiện tại: <span className="font-semibold text-gray-700">{selectedStudentTotal}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Mã lớp HP (VD: 01) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Nhập mã phụ (vd: 01)..."
                      value={formData.sectionCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sectionCode: e.target.value,
                        })
                      }
                      className="rounded-lg h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Sức chứa <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      type="number"
                      min={Math.max(1, selectedStudentTotal)}
                      placeholder="Sức chứa tối đa..."
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: e.target.value,
                        })
                      }
                      className="rounded-lg h-9"
                    />
                    {Number(formData.maxCapacity) > 0 &&
                      Number(formData.maxCapacity) < selectedStudentTotal && (
                        <p className="text-[11px] text-red-500">
                          Phải &gt;= tổng sinh viên đã chọn ({selectedStudentTotal}).
                        </p>
                      )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Phòng học <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.classroomId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, classroomId: v })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        {classroomsList.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {getClassroomLabel(room)} - {room.capacity} chỗ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Thứ <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.day}
                      onValueChange={(v) =>
                        setFormData({ ...formData, day: v })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MON">Thứ 2</SelectItem>
                        <SelectItem value="TUE">Thứ 3</SelectItem>
                        <SelectItem value="WED">Thứ 4</SelectItem>
                        <SelectItem value="THU">Thứ 5</SelectItem>
                        <SelectItem value="FRI">Thứ 6</SelectItem>
                        <SelectItem value="SAT">Thứ 7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Tiết bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.slotStartId}
                      onValueChange={(v) =>
                        setFormData((prev) => {
                          const nextStartNo = getTimeSlotNo(
                            sortedTimeSlots.find((slot) => getTimeSlotId(slot) === Number(v)),
                          );
                          const currentEnd = sortedTimeSlots.find(
                            (slot) => getTimeSlotId(slot) === Number(prev.slotEndId),
                          );
                          const currentEndNo = getTimeSlotNo(currentEnd);

                          return {
                            ...prev,
                            slotStartId: v,
                            slotEndId:
                              currentEndNo && currentEndNo >= nextStartNo
                                ? prev.slotEndId
                                : v,
                          };
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Chọn tiết" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedTimeSlots.map((slot) => (
                          <SelectItem
                            key={getTimeSlotId(slot)}
                            value={getTimeSlotId(slot).toString()}
                          >
                            {getTimeSlotLabel(slot)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Tiết kết thúc <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.slotEndId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, slotEndId: v })
                      }
                    >
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Chọn tiết" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedTimeSlots.map((slot) => {
                          const disabled =
                            selectedSlotStartNo > 0 &&
                            getTimeSlotNo(slot) < selectedSlotStartNo;

                          return (
                            <SelectItem
                              key={getTimeSlotId(slot)}
                              value={getTimeSlotId(slot).toString()}
                              disabled={disabled}
                            >
                              {getTimeSlotLabel(slot)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {modalMode === "edit" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-lg"
                    onClick={handleDeleteSection}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Hủy Lớp Học Phần
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                    disabled={isSubmitting || isSemesterClosed}
                  >
                    {isSemesterClosed
                      ? "Học kỳ đã đóng"
                      : isSubmitting
                        ? "Đang xử lý..."
                        : "Xác nhận"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT ================= */}
      {detailModal.isOpen && detailModal.data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Info className="w-5 h-5" />
                Chi tiết Lớp học phần
              </h3>
              <button
                onClick={() => setDetailModal({ isOpen: false, data: null })}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Mã lớp HP:</span>
                <span className="text-xs font-mono font-bold text-blue-700 col-span-2">{detailModal.data.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Mã môn học:</span>
                <span className="text-xs font-semibold text-gray-800 col-span-2">{detailModal.data.courseCode}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Tên môn học:</span>
                <span className="text-xs font-semibold text-gray-800 col-span-2">{detailModal.data.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Lớp hành chính:</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.classCodes}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Số tín chỉ (TC):</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.credits}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Sĩ số sinh viên:</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.students} học viên</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Sức chứa tối đa:</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.maxCapacity || "---"} chỗ</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Giảng viên:</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.lecturer}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Khoa / Bộ môn:</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.faculty} / {detailModal.data.department}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Lịch học chi tiết:</span>
                <span className="text-xs text-gray-800 col-span-2">{detailModal.data.slot || "Chưa có lịch"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-500">Phòng học (Staff):</span>
                <span className="text-xs font-bold text-green-700 col-span-2">{detailModal.data.room || "Chưa phân phòng"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                <span className="text-xs font-bold text-gray-500">Trạng thái:</span>
                <span className="col-span-2">
                  <Badge className={`${getSectionStatusBadgeClass(detailModal.data.sectionStatus)} text-[10px] font-semibold border px-2 py-0.5 rounded-full shadow-none`}>
                    {getSectionStatusLabel(detailModal.data.sectionStatus)}
                  </Badge>
                </span>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                  onClick={() => setDetailModal({ isOpen: false, data: null })}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PLACEHOLDER (CHỨC NĂNG ĐANG PHÁT TRIỂN) ================= */}
      {placeholderModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-amber-600 px-5 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-5 h-5 animate-pulse" />
                {placeholderModal.title}
              </h3>
              <button
                onClick={() => setPlaceholderModal({ isOpen: false, title: "", message: "" })}
                className="text-white hover:text-white/80 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Tính năng đang trong lộ trình hoàn thiện</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{placeholderModal.message}</p>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <Button
                  onClick={() => setPlaceholderModal({ isOpen: false, title: "", message: "" })}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  Đồng ý
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
