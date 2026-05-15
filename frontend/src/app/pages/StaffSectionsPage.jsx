import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router";
import { APP_ROUTES } from "@/constants/routes";
import {
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  MapPin,
  Trash2,
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

export const StaffSectionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ DỮ LIỆU & BẢNG ---
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);

  // --- STATE QUẢN LÝ DANH MỤC (Lấy từ Database) ---
  const [facultiesList, setFacultiesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [semestersList, setSemestersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);

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

  // Dữ liệu Form
  const [formData, setFormData] = useState({
    semesterId: "",
    facultyCode: "all", // Dùng để lọc UI trong modal
    departmentCode: "all", // Dùng để lọc UI trong modal
    courseId: "",
    lecturerId: "",
    sectionCode: "",
    maxCapacity: "",
    day: "MON",
    slot: "1",
  });

  // Khởi tạo
  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  // Gọi API lấy danh mục
  const fetchCategories = async () => {
    try {
      const [facRes, depRes, semRes, couRes, lecRes] = await Promise.all([
        httpClient.get("/api/categories/faculties"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/courses"),
        httpClient.get("/api/categories/lecturers"),
      ]);

      setFacultiesList(facRes.data.data || []);
      setDepartmentsList(depRes.data.data || []);
      const semesters = semRes.data.data || [];
      setSemestersList(semesters);
      const activeSemesterId = getActiveSemesterId(semesters);
      if (activeSemesterId) {
        setFilterSemester(activeSemesterId);
      }
      setCoursesList(couRes.data.data || []);
      setLecturersList(lecRes.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  };

  // Gọi API lấy danh sách Lớp học phần
  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await httpClient.get("/api/staff/class-sections");
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
          status: mappedStatus,
          allocationStatus: item.allocationStatus,

          // DỮ LIỆU ẨN DÙNG CHO FORM SỬA (Lấy từ backend)
          semesterId: item.semesterId,
          courseId: item.courseId,
          lecturerId: item.lecturerId,
          maxCapacity: item.maxCapacity,
          dayCode: item.dayCode,
          slotNumber: item.slot,
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
    if (mode === "add") {
      setFormData({
        semesterId: getActiveSemesterId(semestersList),
        facultyCode: "all",
        departmentCode: "all",
        courseId: "",
        lecturerId: "",
        sectionCode: "",
        maxCapacity: "",
        day: "MON",
        slot: "1",
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
        sectionCode: rawSectionCode,
        maxCapacity: selectedSection.maxCapacity?.toString() || "",
        day: selectedSection.dayCode || "MON",
        slot: selectedSection.slotNumber?.toString() || "1",
      });
    }
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // --- SUBMIT DỮ LIỆU ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Đóng gói JSON theo đúng chuẩn Backend
      const payload = {
        semesterId: Number(formData.semesterId),
        courseId: Number(formData.courseId),
        lecturerId: Number(formData.lecturerId),
        sectionCode: formData.sectionCode,
        enrolledCount: modalMode === "edit" ? selectedSection.students : 0,
        maxCapacity: Number(formData.maxCapacity),
        status: "ACTIVE",
        day: formData.day,
        slot: Number(formData.slot),
      };

      if (modalMode === "add") {
        await httpClient.post("/api/staff/class-sections", payload);
        alert("Đã thêm lớp học phần mới thành công!");
      } else {
        await httpClient.put(
          `/api/staff/class-sections/${selectedSection.dbId}`,
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
        `/api/staff/class-sections/${selectedSection.dbId}`,
      );
      alert("Đã hủy lớp học phần thành công!");
      setIsModalOpen(false);
      fetchSections();
    } catch (error) {
      alert("Lỗi khi xóa lớp!");
    }
  };

  // --- BỘ LỌC CHO BẢNG ---
  const handleAssignSection = () => {
    if (!selectedSection) return;

    navigate(APP_ROUTES.staffAllocation, {
      state: {
        openRoomSearch: true,
        semesterId: selectedSection.semesterId?.toString(),
        sectionId: selectedSection.dbId,
        sectionCode: selectedSection.id,
        courseName: selectedSection.name,
        dayCode: selectedSection.dayCode,
        slotNumber: selectedSection.slotNumber,
        maxCapacity: selectedSection.maxCapacity,
      },
    });
  };

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

          {/* NÚT PHÂN CÔNG */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm border-green-600 text-green-600 hover:bg-green-50 disabled:border-gray-200 disabled:text-gray-400"
            disabled={!selectedSection || selectedSection.allocationStatus !== "UNASSIGNED"}
            onClick={handleAssignSection}
          >
            <MapPin className="w-3.5 h-3.5" /> Phân công
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
            placeholder="Tìm theo mã lớp, tên môn, giảng viên..."
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
                Mã lớp
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Môn học
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Bộ môn
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
                  colSpan={9}
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
                    <TableCell className="text-xs text-center">
                      {s.credits}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {s.students}
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

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Mã Lớp (VD: 01) <span className="text-red-500">*</span>
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
                      placeholder="Số lượng..."
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: e.target.value,
                        })
                      }
                    />
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
                      Tiết học <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={formData.slot}
                      onValueChange={(v) =>
                        setFormData({ ...formData, slot: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Tiết 1-3</SelectItem>
                        <SelectItem value="2">Tiết 4-6</SelectItem>
                        <SelectItem value="3">Tiết 7-9</SelectItem>
                        <SelectItem value="4">Tiết 10-12</SelectItem>
                        <SelectItem value="5">Tiết 13-15</SelectItem>
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
