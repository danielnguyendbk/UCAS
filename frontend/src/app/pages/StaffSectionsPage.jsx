import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Search,
  XCircle,
} from "lucide-react";
import { httpClient } from "@/services/httpClient";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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

const pageSize = 8;

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

const getPayloadList = (response) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const pick = (object, keys, fallback = "") => {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return fallback;
};

const getActiveSemesterId = (semesters) => {
  const activeSemester = semesters.find(
    (semester) => String(semester.status || "").toUpperCase() === "ACTIVE",
  );
  return String((activeSemester || semesters[0])?.id || "all");
};

const mapStatus = (allocationStatus) => {
  if (allocationStatus === "ASSIGNED") return "assigned";
  if (allocationStatus === "CONFLICT") return "conflict";
  return "pending";
};

const formatStudentCapacity = (section) =>
  `${section.students ?? 0}/${section.maxCapacity ?? "-"}`;

const formatSchedule = (section) => {
  if (section.schedule) return section.schedule;
  if (section.day && section.slotStart && section.slotEnd) {
    return `${section.day} - Tiết ${section.slotStart}-${section.slotEnd}`;
  }
  return "-";
};

const splitCourseAndSection = (item) => {
  const rawClassCode = pick(item, ["classCode", "class_code", "id"]);
  const rawSectionCode = pick(item, ["sectionCode", "section_code", "groupCode", "group_code"]);
  const rawCourseCode = pick(item, ["courseCode", "course_code", "subjectCode", "subject_code", "course_code_code"]);

  let courseCode = rawCourseCode;
  let sectionCode = rawSectionCode || rawClassCode;

  if (!courseCode && rawClassCode.includes(".")) {
    const [left, ...right] = rawClassCode.split(".");
    courseCode = left;
    sectionCode = right.join(".") || rawSectionCode || rawClassCode;
  }

  if (courseCode && sectionCode.startsWith(`${courseCode}.`)) {
    sectionCode = sectionCode.slice(courseCode.length + 1);
  }

  return {
    courseCode,
    sectionCode: sectionCode || rawClassCode,
  };
};

const StaffClassSectionsPage = ({
  endpoint = "/api/staff/class-sections",
  description = "Staff chỉ xem danh sách lớp học phần, không thêm sửa xóa.",
}) => {
  const [sections, setSections] = useState([]);
  const [semestersList, setSemestersList] = useState([]);
  const [facultiesList, setFacultiesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [search, setSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [facRes, depRes, semRes] = await Promise.all([
          httpClient.get("/api/categories/faculties"),
          httpClient.get("/api/categories/departments"),
          httpClient.get("/api/categories/semesters"),
        ]);

        setFacultiesList(getPayloadList(facRes));
        setDepartmentsList(getPayloadList(depRes));
        const semesters = getPayloadList(semRes);
        setSemestersList(semesters);
        setFilterSemester(getActiveSemesterId(semesters));
      } catch (error) {
        console.error("Không tải được danh mục lớp học phần:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      setIsLoading(true);
      try {
        const response = await httpClient.get(endpoint, {
          params: filterSemester !== "all" ? { semesterId: filterSemester } : {},
        });

        const data = getPayloadList(response).map((item) => {
          const { courseCode, sectionCode } = splitCourseAndSection(item);

          return {
            dbId: pick(item, ["id", "sectionId", "section_id", "classSectionId", "class_section_id"]),
            courseCode,
            sectionCode,
            name: pick(item, ["courseName", "course_name", "subjectName", "subject_name"], "-"),
            department: pick(item, ["departmentCode", "department_code"]),
            faculty: pick(item, ["facultyCode", "faculty_code"]),
            credits: pick(item, ["credits"], "-"),
            students: pick(item, ["studentCount", "student_count", "students"], 0),
            lecturer: pick(item, ["lecturerName", "lecturer_name", "teacherName", "teacher_name"]),
            day: pick(item, ["day"]),
            slot: formatSchedule(item),
            room: pick(item, ["room", "roomCode", "room_code", "classroomCode", "classroom_code"]),
            classCodes: pick(item, ["classCodes", "class_codes"]),
            classNames: pick(item, ["classNames", "class_names"]),
            status: mapStatus(item.allocationStatus),
            allocationStatus: item.allocationStatus,
            semesterId: item.semesterId,
            maxCapacity: pick(item, ["maxCapacity", "max_capacity"], "-"),
          };
        });

        setSections(data);
      } catch (error) {
        setSections([]);
        console.error("Không tải được danh sách lớp học phần:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, [endpoint, filterSemester]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sections.filter((section) => {
      const matchSearch =
        !keyword ||
        section.courseCode?.toLowerCase().includes(keyword) ||
        section.sectionCode?.toLowerCase().includes(keyword) ||
        section.name?.toLowerCase().includes(keyword) ||
        section.lecturer?.toLowerCase().includes(keyword) ||
        section.classCodes?.toLowerCase().includes(keyword);
      const matchStatus = filterStatus === "all" || section.status === filterStatus;
      const matchFaculty = filterFaculty === "all" || section.faculty === filterFaculty;
      const matchDepartment =
        filterDepartment === "all" || section.department === filterDepartment;

      return matchSearch && matchStatus && matchFaculty && matchDepartment;
    });
  }, [sections, search, filterStatus, filterFaculty, filterDepartment]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSemester, filterStatus, filterFaculty, filterDepartment]);

  if (isLoading && sections.length === 0) {
    return (
      <div className="p-5 flex flex-col justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-500 font-medium text-sm">
          Đang đồng bộ dữ liệu lớp học phần...
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lớp học phần</h1>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <Button variant="outline" disabled className="w-fit border-gray-200">
          <Download className="w-4 h-4" />
          Xuất Excel
        </Button>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:flex-wrap gap-3">
        <div className="flex-1 md:min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã học phần, nhóm/tổ, tên môn, giảng viên..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger className="h-9 w-full md:w-[220px] bg-gray-50 border-none text-sm font-medium">
            <SelectValue placeholder="Học kỳ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả học kỳ</SelectItem>
            {semestersList.map((semester) => (
              <SelectItem key={semester.id} value={semester.id.toString()}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-full md:w-[190px] bg-gray-50 border-none text-sm font-medium">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="assigned">Đã phân phòng</SelectItem>
            <SelectItem value="pending">Chưa phân phòng</SelectItem>
            <SelectItem value="conflict">Xung đột</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterFaculty} onValueChange={setFilterFaculty}>
          <SelectTrigger className="h-9 w-full md:w-[140px] bg-gray-50 border-none text-sm font-medium">
            <SelectValue placeholder="Khoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khoa</SelectItem>
            {facultiesList.map((faculty) => (
              <SelectItem key={faculty.code} value={faculty.code}>
                {faculty.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="h-9 w-full md:w-[160px] bg-gray-50 border-none text-sm font-medium">
            <SelectValue placeholder="Bộ môn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả bộ môn</SelectItem>
            {departmentsList
              .filter(
                (department) =>
                  filterFaculty === "all" || department.facultyCode === filterFaculty,
              )
              .map((department) => (
                <SelectItem key={department.code} value={department.code}>
                  {department.code}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="text-xs font-bold text-gray-600">Học phần / Nhóm</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Môn học</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Bộ môn</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Classes</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">TC</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">SV</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Giảng viên</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Lịch</TableHead>
              <TableHead className="text-xs font-bold text-gray-600">Phòng</TableHead>
              <TableHead className="text-xs font-bold text-gray-600 text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((section) => {
              const config = statusConfig[section.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <TableRow key={section.dbId || `${section.courseCode}-${section.sectionCode}`} className="hover:bg-gray-50 border-b">
                  <TableCell className="text-xs">
                    {section.courseCode ? (
                      <p className="font-semibold text-blue-700">{section.courseCode}</p>
                    ) : null}
                    <p className={section.courseCode ? "mt-0.5 text-gray-600" : "font-semibold text-blue-700"}>
                      {section.sectionCode || "-"}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 text-sm">
                    {section.name}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {section.department}
                  </TableCell>
                  <TableCell className="text-xs text-gray-700 min-w-[210px]">
                    {section.classCodes || "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm">{section.credits}</TableCell>
                  <TableCell className="text-center text-sm">
                    {formatStudentCapacity(section)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {section.lecturer || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {section.slot || "-"}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {section.room || "---"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${config.className} gap-1 px-2 py-1 font-medium`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-sm text-gray-500">
                  Không có lớp học phần phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-1">
        <p className="text-sm text-gray-500">
          Hiển thị {paginated.length} / {filtered.length} lớp học phần
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffClassSectionsPage;
