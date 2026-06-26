import { useState, useEffect } from "react";
import { useLocation } from "react-router";
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
  RefreshCw,
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
import { toast } from "sonner";

const statusConfig = {
  assigned: {
    label: "Đã phân phòng",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  pending: {
    label: "Chưa phân phòng",
    className: "bg-orange-100 text-orange-700",
    icon: Clock,
  },
  conflict: {
    label: "Xung đột lịch",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

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

export const StaffSectionsPage = () => {
  const location = useLocation();
  const importedSemesterId = location.state?.semesterId;
  // --- STATE QUẢN LÝ DỮ LIỆU & BẢNG ---
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // --- STATE QUẢN LÝ DANH MỤC (Lấy từ Database) ---
  const [facultiesList, setFacultiesList] = useState([]);
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
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // --- STATE CHO MODAL THÊM / SỬA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" hoặc "edit"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    semesterId: "",
    facultyCode: "all", // Dùng để lọc UI trong modal
    departmentCode: "all", // Dùng để lọc UI trong modal
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
        facRes,
        depRes,
        semRes,
        couRes,
        lecRes,
        classRes,
        classroomRes,
        slotRes,
      ] = await Promise.all([
        httpClient.get("/api/categories/faculties"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/courses"),
        httpClient.get("/api/categories/lecturers"),
        httpClient.get("/api/categories/classes"),
        httpClient.get("/api/categories/classrooms"),
        httpClient.get("/api/categories/time-slots"),
      ]);

      setFacultiesList(facRes.data.data || []);
      setDepartmentsList(depRes.data.data || []);
      const semesters = semRes.data.data || [];
      setSemestersList(semesters);
      const activeSemesterId = getActiveSemesterId(semesters);
      const requestedSemesterExists = semesters.some(
        (semester) => String(semester.id) === String(importedSemesterId),
      );
      const initialSemesterId = requestedSemesterExists
        ? String(importedSemesterId)
        : activeSemesterId;
      if (initialSemesterId) {
        setFilterSemester(initialSemesterId);
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
  const fetchSections = async (background = false) => {
    if (background) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const response = await httpClient.get("/api/admin/class-sections");
      const rawData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      const formattedData = rawData.map((item) => {
        let mappedStatus = "pending";
        if (item.allocationStatus === "ASSIGNED") mappedStatus = "assigned";
        if (item.allocationStatus === "CONFLICT") mappedStatus = "conflict";

        return {
          dbId: item.id,
          id: item.classCode,
          name: item.courseName,
          department: item.departmentCode,
          faculty: item.facultyCode,
          credits: item.credits,
          students: item.studentCount,
          lecturer: item.lecturerName,
          day: item.day,
          slot: item.schedule,
          room: item.room,
          classIds: item.classIds || [],
          classCodes: item.classCodes || "",
          classNames: item.classNames || "",
          status: mappedStatus,
          allocationStatus: item.allocationStatus,

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
      toast.error("Không thể tải dữ liệu lớp học phần.");
    } finally {
      if (background) setIsRefreshing(false);
      else setIsLoading(false);
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
      // Tách chữ 'CS101.L01' ra để lấy mã '01'
      const rawSectionCode = selectedSection.id.includes(".L")
        ? selectedSection.id.split(".L")[1]
        : "";

      setFormData({
        semesterId: selectedSection.semesterId?.toString() || "",
        facultyCode: selectedSection.faculty || "all",
        departmentCode: selectedSection.department || "all",
        courseId: selectedSection.courseId?.toString() || "",
        lecturerId: selectedSection.lecturerId?.toString() || "",
        classIds: selectedSection.classIds || [],
        sectionCode: rawSectionCode,
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
      // Đóng gói JSON theo đúng chuẩn Backend
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
        toast.warning("Vui lòng chọn từ 1 đến tối đa 2 classes.");
        return;
      }

      if (maxCapacity < selectedStudentTotal) {
        toast.warning("Sức chứa không được nhỏ hơn tổng số sinh viên của các classes đã chọn.");
        return;
      }

      if (!classroomId) {
        toast.warning("Vui lòng chọn phòng học.");
        return;
      }

      if (!slotStartId || !slotEndId || slotEndNo < slotStartNo) {
        toast.warning("Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.");
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
        toast.success("Đã thêm lớp học phần mới thành công!");
      } else {
        await httpClient.put(
          `/api/admin/class-sections/${selectedSection.dbId}`,
          payload,
        );
        toast.success("Đã cập nhật lớp học phần thành công!");
      }

      setIsModalOpen(false);
      fetchSections();
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error(
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
      toast.success("Đã hủy lớp học phần thành công!");
      setIsModalOpen(false);
      fetchSections();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy lớp học phần!");
    }
  };

  // --- BỘ LỌC CHO BẢNG ---
  const filtered = sections.filter((s) => {
    const matchSearch =
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.lecturer.toLowerCase().includes(search.toLowerCase());
    const matchSemester =
      filterSemester === "all" || s.semesterId?.toString() === filterSemester;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchFaculty = filterFaculty === "all" || s.faculty === filterFaculty;
    const matchDepartment =
      filterDepartment === "all" || s.department === filterDepartment;

    return (
      matchSearch &&
      matchSemester &&
      matchStatus &&
      matchFaculty &&
      matchDepartment
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  // ĐẶT Ở ĐÂY: Logic này sẽ chạy lại mỗi khi formData.semesterId thay đổi
  const currentSemester = semestersList.find(
    (s) => s.id.toString() === formData.semesterId,
  );

  // Kiểm tra trạng thái học kỳ (Dựa theo enum COMPLETED trong file SQL của bạn)
  const isSemesterClosed = currentSemester?.status === "COMPLETED";
  const selectedClassIds = formData.classIds.map(Number).filter(Boolean);
  const selectedClasses = classesList.filter((classItem) =>
    selectedClassIds.includes(Number(classItem.id)),
  );
  const selectedStudentTotal = selectedClasses.reduce(
    (total, classItem) => total + getClassStudentCount(classItem),
    0,
  );
  const filteredClassesForModal = classesList.filter(
    (classItem) =>
      formData.facultyCode === "all" ||
      classItem.facultyCode === formData.facultyCode,
  );
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
      : "Chọn 1-2 classes";
  const sortedTimeSlots = [...timeSlotsList].sort(
    (a, b) => getTimeSlotNo(a) - getTimeSlotNo(b),
  );
  const selectedSlotStart = sortedTimeSlots.find(
    (slot) => getTimeSlotId(slot) === Number(formData.slotStartId),
  );
  const selectedSlotStartNo = getTimeSlotNo(selectedSlotStart);
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
    <div className="p-5 md:p-6 space-y-5">
      {/* HEADER TÍNH NĂNG */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Quản lý Lớp học phần
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Dữ liệu thời gian thực từ Database
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm"
            disabled={isRefreshing}
            onClick={() => fetchSections(true)}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          {/* NÚT SỬA */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-200 disabled:text-gray-400"
            disabled={!selectedSection}
            onClick={() => handleOpenModal("edit")}
          >
            <Edit className="w-3.5 h-3.5" /> Sửa
          </Button>

          {/* NÚT THÊM */}
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-sm"
            onClick={() => handleOpenModal("add")}
          >
            <Plus className="w-3.5 h-3.5" /> Thêm lớp HP
          </Button>
        </div>
      </div>

      {location.state?.refreshAfterImport && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Dữ liệu được tải lại từ database sau import. Bộ lọc đang mở đúng học kỳ vừa áp dụng.</span>
        </div>
      )}

      {/* THỐNG KÊ */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
          Tổng số: {sections.length}
        </span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
          Đã phân: {sections.filter((s) => s.status === "assigned").length}
        </span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">
          Chưa phân: {sections.filter((s) => s.status === "pending").length}
        </span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700">
          Xung đột: {sections.filter((s) => s.status === "conflict").length}
        </span>
      </div>

      {/* BỘ LỌC BẢNG CHÍNH */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:flex-wrap gap-3">
        <div className="flex-1 md:min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo Mã lớp học phần, tên môn, giảng viên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              setSelectedSection(null);
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select
          value={filterSemester}
          onValueChange={(v) => {
            setFilterSemester(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full md:w-48 h-9 text-sm">
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
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full md:w-44 h-9 text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="assigned">Đã phân phòng</SelectItem>
            <SelectItem value="pending">Chưa phân phòng</SelectItem>
            <SelectItem value="conflict">Xung đột lịch</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterFaculty}
          onValueChange={(v) => {
            setFilterFaculty(v);
            setFilterDepartment("all");
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full md:w-32 h-9 text-sm">
            <SelectValue placeholder="Khoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khoa</SelectItem>
            {facultiesList.map((f) => (
              <SelectItem key={f.code} value={f.code}>
                {f.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterDepartment}
          onValueChange={(v) => {
            setFilterDepartment(v);
            setCurrentPage(1);
            setSelectedSection(null);
          }}
        >
          <SelectTrigger className="w-full md:w-36 h-9 text-sm">
            <SelectValue placeholder="Bộ môn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả bộ môn</SelectItem>
            {departmentsList
              .filter(
                (d) =>
                  filterFaculty === "all" || d.facultyCode === filterFaculty,
              )
              .map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.code}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead className="text-xs font-semibold text-gray-600">
                Mã lớp học phần
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Môn học
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Bộ môn
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Classes
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
              <TableHead className="text-xs font-semibold text-gray-600">
                Lịch
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Phòng
              </TableHead>
              <TableHead className="text-center text-xs font-semibold text-gray-600">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-10 text-gray-500"
                >
                  Không tìm thấy dữ liệu.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s) => {
                const cfg = statusConfig[s.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                const isSelected = selectedSection?.dbId === s.dbId;

                return (
                  <TableRow
                    key={s.dbId}
                    onClick={() => setSelectedSection(s)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-100 hover:bg-blue-100" : "hover:bg-blue-50/30"}`}
                  >
                    <TableCell className="font-mono text-xs font-bold text-blue-700">
                      {s.id}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-800">
                      {s.name}
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-gray-600">
                        {s.department || "---"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {s.classCodes || "---"}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {s.credits}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {formatStudentCapacity(s)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {s.lecturer}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                      {s.slot}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-800">
                      {s.room || "---"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${cfg.className} text-[11px]`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* PHÂN TRANG */}
      <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500">
        Hiển thị {paginated.length} / {filtered.length} lớp học phần
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ================= MODAL THÊM / SỬA ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="bg-blue-600 px-5 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold">
                {modalMode === "add"
                  ? "Thêm Lớp học phần mới"
                  : `Sửa lớp: ${selectedSection?.id}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitForm}
              className="p-5 space-y-5 bg-gray-50/30"
            >
              {/* CỤM 1: CÁC BỘ LỌC HỖ TRỢ */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase">
                  Bộ lọc hỗ trợ tìm kiếm
                </p>
                <div className="grid grid-cols-3 gap-4">
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      // Nếu đang ở chế độ Sửa, có thể disable luôn không cho đổi học kỳ
                      disabled={modalMode === "edit"}
                    >
                      <SelectTrigger className="border-blue-300">
                        <SelectValue placeholder="Chọn Học kỳ" />
                      </SelectTrigger>
                      <SelectContent>
                        {semestersList
                          .filter((sem) => sem.status !== "FINISHED") // CHỈ HIỆN HỌC KỲ CHƯA HOÀN THÀNH
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
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                <p className="text-[11px] font-bold text-gray-500 uppercase">
                  Thông tin Lớp học phần
                </p>
                <div className="grid grid-cols-2 gap-4">
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
                      <SelectTrigger>
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
                      Giảng viên phụ trách{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.lecturerId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, lecturerId: v })
                      }
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Classes <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsClassDropdownOpen((open) => !open)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <span className={selectedClasses.length ? "font-medium text-gray-900" : "text-gray-400"}>
                        {selectedClassLabel}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {isClassDropdownOpen && (
                      <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        {filteredClassesForModal.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            Không có class phù hợp.
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
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                                  disabled ? "cursor-not-allowed opacity-50" : ""
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
                                  <span className="font-medium text-gray-800">
                                    {classItem.classCode}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {classItem.className}
                                  </span>
                                </span>
                                <span className="text-xs font-semibold text-gray-500">
                                  {getClassStudentCount(classItem)} SV
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Chọn 1 hoặc 2 classes. Tổng sinh viên: {selectedStudentTotal}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Mã lớp học phần (VD: 01) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Nhập mã phụ..."
                      value={formData.sectionCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sectionCode: e.target.value,
                        })
                      }
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
                      placeholder="Số lượng..."
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: e.target.value,
                        })
                      }
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
                      Phòng <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.classroomId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, classroomId: v })
                      }
                    >
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
              <div className="flex items-center justify-between pt-4">
                {modalMode === "edit" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={handleDeleteSection}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Hủy Lớp Học Phần
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
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
    </div>
  );
};
