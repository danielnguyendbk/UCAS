import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  LayoutGrid,
  List,
  X,
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
import { useAuth } from "@/features/auth/hooks/useAuth";
import { httpClient } from "../../services/httpClient";
import { RoomTimetableGridView } from "../components/RoomTimetableGridView";

// ─────────────────────────────────────────────
// Helpers – Status
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  NO_SCHEDULE:      { label: "Chưa có lịch",     cls: "bg-orange-50 text-orange-700 border-orange-200" },
  UNASSIGNED:       { label: "Chưa phân phòng",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  ASSIGNED:         { label: "Đã phân phòng",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING_APPROVAL: { label: "Chờ duyệt",         cls: "bg-purple-50 text-purple-700 border-purple-200" },
  PUBLISHED:        { label: "Đã công bố",        cls: "bg-green-50 text-green-700 border-green-200" },
  CONFLICT:         { label: "Có xung đột",       cls: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED:        { label: "Đã hủy",            cls: "bg-gray-100 text-gray-500 border-gray-200" },
  ACTIVE:           { label: "Hoạt động",         cls: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED:        { label: "Hoàn tất",          cls: "bg-teal-50 text-teal-700 border-teal-200" },
};

const getStatusCfg = (status) =>
  STATUS_CONFIG[status] ?? { label: status || "---", cls: "bg-gray-100 text-gray-600 border-gray-200" };

// ─────────────────────────────────────────────
// Helpers – Day label
// ─────────────────────────────────────────────
const DAY_LABELS = {
  MON: "Thứ 2", TUE: "Thứ 3", WED: "Thứ 4",
  THU: "Thứ 5", FRI: "Thứ 6", SAT: "Thứ 7", SUN: "CN",
};
const getDayLabel = (day) => DAY_LABELS[day] || day || "---";

// ─────────────────────────────────────────────
// Helpers – Section group derivation
// ─────────────────────────────────────────────
const deriveGroup = (sectionCode, courseCode) => {
  if (!sectionCode) return "---";
  if (courseCode && sectionCode.startsWith(courseCode)) {
    const suffix = sectionCode.slice(courseCode.length).replace(/^[-.]/, "");
    return suffix || sectionCode;
  }
  return sectionCode;
};

// ─────────────────────────────────────────────
// Helpers – Course code extraction from classCode
// classCode patterns:
//   INT1334-01           -> courseCode=INT1334, group=01
//   INT1303-04-03        -> courseCode=INT1303, group=04-03
//   CS101.L11            -> courseCode=CS101, group=L11   (legacy)
// ─────────────────────────────────────────────
const extractCourseAndGroup = (classCode, courseCodeHint) => {
  if (!classCode) return { courseCode: courseCodeHint || "---", sectionGroup: "---" };

  // If backend already sent courseCode separately, use it
  if (courseCodeHint) {
    return {
      courseCode: courseCodeHint,
      sectionGroup: deriveGroup(classCode, courseCodeHint),
    };
  }

  // Legacy pattern: COURSECODE.LGROUP
  if (classCode.includes(".L")) {
    const [cc, grp] = classCode.split(".L");
    return { courseCode: cc, sectionGroup: grp || classCode };
  }

  // Pattern: LETTERS+DIGITS-group  e.g. INT1334-01
  const match = classCode.match(/^([A-Z]+\d+)[-.](.+)$/);
  if (match) return { courseCode: match[1], sectionGroup: match[2] };

  return { courseCode: classCode, sectionGroup: "---" };
};

// ─────────────────────────────────────────────
// Map raw API item → display row
// ─────────────────────────────────────────────
const mapItem = (item) => {
  const { courseCode, sectionGroup } = extractCourseAndGroup(
    item.classCode,
    item.courseCode,
  );
  const room = item.room || "---";
  const buildingCode = room !== "---" ? room.split("-")[0] : "---";

  return {
    _raw: item,
    id: item.id,
    courseCode,
    sectionGroup,
    courseName: item.courseName || item.name || "---",
    classCodes: item.classCodes || item.classNames || item.className || "---",
    lecturer: item.lecturerName || "---",
    students: item.studentCount ?? 0,
    department: item.departmentCode || item.facultyCode || "---",
    day: getDayLabel(item.dayCode || item.day),
    dayCode: item.dayCode || item.day || "",
    slotLabel:
      item.slotStart && item.slotEnd
        ? `Tiết ${item.slotStart}–${item.slotEnd}`
        : item.schedule || "---",
    timeLabel: item.schedule || "---",
    weekLabel: item.fromWeekNo && item.toWeekNo
      ? `Tuần ${item.fromWeekNo}–${item.toWeekNo}`
      : item.weekNo
      ? `Tuần ${item.weekNo}`
      : "---",
    room,
    building: item.buildingCode || item.buildingName || buildingCode,
    allocationStatus: item.allocationStatus || "NO_SCHEDULE",
    sectionStatus: item.sectionStatus || item.status || "ACTIVE",
    semesterId: item.semesterId,
    lecturerId: item.lecturerId,
    slotStartId: item.slotStartId ?? null,
    slotEndId: item.slotEndId ?? null,
    slotStart: item.slotStart ?? null,
    slotEnd: item.slotEnd ?? null,
  };
};

// ─────────────────────────────────────────────
// Placeholder modal
// ─────────────────────────────────────────────
const PlaceholderModal = ({ title, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 py-6 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">Chức năng đang phát triển</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Chức năng <strong>"{title}"</strong> đang được phát triển theo lộ trình nghiệp vụ mới và sẽ sớm sẵn sàng trong phiên bản kế tiếp.
        </p>
      </div>
      <div className="px-5 pb-4 flex justify-center">
        <Button size="sm" variant="outline" onClick={onClose} className="px-6">
          Đóng
        </Button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export const WeeklySchedulePage = () => {
  const { user } = useAuth();
  const role = user?.role || "Admin"; // Admin | Staff | Employee (Facility)
  const isFacility = role === "Employee" || role === "Facility";
  const isAdminOrStaff = role === "Admin" || role === "Staff";

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [semestersList, setSemestersList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterWeek, setFilterWeek] = useState("all");
  const [filterDay, setFilterDay] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterLecturer, setFilterLecturer] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // UI
  const [viewMode, setViewMode] = useState(isFacility ? "grid" : "list"); // "list" | "grid"
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [placeholderModal, setPlaceholderModal] = useState({ open: false, title: "" });

  // ── Fetch ─────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [sectionsRes, semRes, lecRes, classRes, depRes, slotsRes] = await Promise.allSettled([
        httpClient.get("/api/admin/class-sections"),
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/lecturers"),
        httpClient.get("/api/categories/classes"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/time-slots"),
      ]);

      // Sections
      if (sectionsRes.status === "fulfilled") {
        const raw = Array.isArray(sectionsRes.value.data)
          ? sectionsRes.value.data
          : sectionsRes.value.data?.data || [];
        setRows(raw.map(mapItem));
      }

      if (semRes.status === "fulfilled") {
        const sems = semRes.value.data?.data || semRes.value.data || [];
        setSemestersList(sems);
        // Auto-select active semester
        const active = sems.find((s) => s.status?.toUpperCase() === "ACTIVE");
        if (active) setFilterSemester(active.id.toString());
      }
      if (lecRes.status === "fulfilled")
        setLecturersList(lecRes.value.data?.data || lecRes.value.data || []);
      if (classRes.status === "fulfilled")
        setClassesList(classRes.value.data?.data || classRes.value.data || []);
      if (depRes.status === "fulfilled")
        setDepartmentsList(depRes.value.data?.data || depRes.value.data || []);
      if (slotsRes.status === "fulfilled") {
        const slots = slotsRes.value.data?.data || slotsRes.value.data || [];
        setTimeSlotsList(Array.isArray(slots) ? slots : []);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu thời khóa biểu:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived dynamic options ───────────────
  const buildingOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.building).filter((b) => b && b !== "---"));
    return [...set].sort();
  }, [rows]);

  const roomOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.room).filter((r) => r && r !== "---"));
    return [...set].sort();
  }, [rows]);

  const weekOptions = useMemo(() => {
    return Array.from({ length: 20 }, (_, index) => index + 1);
  }, []);

  // ── Filter ────────────────────────────────
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (kw && ![r.courseCode, r.courseName, r.sectionGroup, r.classCodes, r.lecturer, r.room]
        .some((v) => v?.toLowerCase().includes(kw))) return false;
      if (filterSemester !== "all" && r.semesterId?.toString() !== filterSemester) return false;
      
      // Filter Week
      if (filterWeek !== "all") {
        const targetWeek = parseInt(filterWeek, 10);
        if (r._raw.fromWeekNo && r._raw.toWeekNo) {
          const from = parseInt(r._raw.fromWeekNo, 10);
          const to = parseInt(r._raw.toWeekNo, 10);
          if (targetWeek < from || targetWeek > to) return false;
        } else if (r._raw.weekNo) {
          if (parseInt(r._raw.weekNo, 10) !== targetWeek) return false;
        } else {
          if (!r.weekLabel?.includes(filterWeek)) return false;
        }
      }

      if (filterStatus !== "all" && r.allocationStatus !== filterStatus && r.sectionStatus !== filterStatus) return false;
      if (filterDay !== "all" && r.dayCode !== filterDay) return false;
      if (filterDepartment !== "all" && r.department !== filterDepartment) return false;
      if (filterClass !== "all" && !r.classCodes?.toLowerCase().includes(filterClass.toLowerCase())) return false;
      if (filterLecturer !== "all" && r.lecturerId?.toString() !== filterLecturer) return false;
      if (filterBuilding !== "all" && r.building !== filterBuilding) return false;
      if (filterRoom !== "all" && r.room !== filterRoom) return false;
      return true;
    });
  }, [rows, search, filterSemester, filterWeek, filterStatus, filterDay, filterDepartment, filterClass, filterLecturer, filterBuilding, filterRoom]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setCurrentPage(1);

  // ── Actions ───────────────────────────────
  const openPlaceholder = (title) => setPlaceholderModal({ open: true, title });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-sm text-gray-500 font-medium">Đang tải thời khóa biểu...</p>
      </div>
    );
  }

  // Highlight filters for building and room if Facility staff
  const getSelectTriggerClass = (isHighlighted) => {
    return `h-9 text-sm rounded-lg bg-gray-50 border-gray-100 ${
      isHighlighted ? "border-blue-300 ring-1 ring-blue-100 font-medium text-blue-900" : ""
    }`;
  };

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* ── HEADER ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Thời khóa biểu toàn trường
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tra cứu lịch học, phòng học, giảng viên và trạng thái sử dụng phòng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "list" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Danh sách
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "grid" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Dạng lưới
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={fetchAll}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => openPlaceholder("Xuất Excel")}
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-sm border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => openPlaceholder("In lịch")}
          >
            <Printer className="w-3.5 h-3.5" />
            In lịch
          </Button>

          {isAdminOrStaff && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => openPlaceholder("Kiểm tra xung đột")}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Kiểm tra xung đột
            </Button>
          )}
        </div>
      </div>

      {/* ── SUMMARY CARDS ──────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Tổng lớp HP",     val: rows.length,                                                   cls: "bg-white rounded-xl border border-blue-100 p-3 shadow-sm hover:shadow-md transition-all", lblCls: "text-[11px] font-bold text-blue-600 uppercase tracking-wider" },
          { label: "Chưa có lịch",    val: rows.filter((r) => r.allocationStatus === "NO_SCHEDULE").length,   cls: "bg-white rounded-xl border border-orange-100 p-3 shadow-sm hover:shadow-md transition-all", lblCls: "text-[11px] font-bold text-orange-600 uppercase tracking-wider" },
          { label: "Chưa phân phòng", val: rows.filter((r) => r.allocationStatus === "UNASSIGNED").length,    cls: "bg-white rounded-xl border border-amber-100 p-3 shadow-sm hover:shadow-md transition-all", lblCls: "text-[11px] font-bold text-amber-600 uppercase tracking-wider" },
          { label: "Đã phân phòng",   val: rows.filter((r) => r.allocationStatus === "ASSIGNED").length,      cls: "bg-white rounded-xl border border-emerald-100 p-3 shadow-sm hover:shadow-md transition-all", lblCls: "text-[11px] font-bold text-emerald-600 uppercase tracking-wider" },
          { label: "Đã công bố",      val: rows.filter((r) => r.allocationStatus === "PUBLISHED").length,     cls: "bg-white rounded-xl border border-green-100 p-3 shadow-sm hover:shadow-md transition-all", lblCls: "text-[11px] font-bold text-green-600 uppercase tracking-wider" },
          { label: "Có xung đột",     val: rows.filter((r) => r.allocationStatus === "CONFLICT").length,      cls: "bg-white rounded-xl border border-red-100 p-3 shadow-sm hover:shadow-md transition-all", lblCls: "text-[11px] font-bold text-red-600 uppercase tracking-wider" },
        ].map(({ label, val, cls, lblCls }) => (
          <div key={label} className={cls}>
            <p className={lblCls}>{label}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{val}</p>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ─────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Input (spans 2 columns on small screens and up) */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm theo mã môn, tên môn, lớp, giảng viên, phòng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>

          {/* Học kỳ */}
          <Select value={filterSemester} onValueChange={(v) => { setFilterSemester(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
              <SelectValue placeholder="Học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả học kỳ</SelectItem>
              {semestersList.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tuần học */}
          <Select value={filterWeek} onValueChange={(v) => { setFilterWeek(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
              <SelectValue placeholder="Tuần học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tuần</SelectItem>
              {weekOptions.map((w) => (
                <SelectItem key={w} value={w.toString()}>Tuần {w}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Thứ / Ngày */}
          <Select value={filterDay} onValueChange={(v) => { setFilterDay(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
              <SelectValue placeholder="Thứ / Ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thứ</SelectItem>
              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d) => (
                <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Khoa */}
          <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
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
          <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
              <SelectValue placeholder="Lớp hành chính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp HC</SelectItem>
              {classesList.map((c) => (
                <SelectItem key={c.id} value={c.classCode}>{c.classCode}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Giảng viên */}
          <Select value={filterLecturer} onValueChange={(v) => { setFilterLecturer(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
              <SelectValue placeholder="Giảng viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giảng viên</SelectItem>
              {lecturersList.map((l) => (
                <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tòa nhà */}
          <Select value={filterBuilding} onValueChange={(v) => { setFilterBuilding(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(isFacility)}>
              <SelectValue placeholder="Tòa nhà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tòa</SelectItem>
              {buildingOptions.map((b) => (
                <SelectItem key={b} value={b}>Tòa {b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Phòng */}
          <Select value={filterRoom} onValueChange={(v) => { setFilterRoom(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(isFacility)}>
              <SelectValue placeholder="Phòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng</SelectItem>
              {roomOptions.map((r) => (
                <SelectItem key={r} value={r}>Phòng {r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trạng thái */}
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); resetPage(); }}>
            <SelectTrigger className={getSelectTriggerClass(false)}>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="NO_SCHEDULE">Chưa có lịch</SelectItem>
              <SelectItem value="UNASSIGNED">Chưa phân phòng</SelectItem>
              <SelectItem value="ASSIGNED">Đã phân phòng</SelectItem>
              <SelectItem value="PENDING_APPROVAL">Chờ duyệt</SelectItem>
              <SelectItem value="PUBLISHED">Đã công bố</SelectItem>
              <SelectItem value="CONFLICT">Có xung đột</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── TABLE (LIST MODE) ──────────────── */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-200">
                  <TableHead className="text-xs font-semibold text-gray-600 whitespace-nowrap">Mã MH</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Tên môn học</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Nhóm/Tổ</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 whitespace-nowrap">Lớp hành chính</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Giảng viên</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">SV</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Thứ</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center whitespace-nowrap">Tiết</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 whitespace-nowrap">Thời gian</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 whitespace-nowrap">Tuần học</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Tòa nhà</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center min-w-[160px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="w-10 h-10 text-gray-300" />
                        <p className="font-semibold text-gray-700">
                          Chưa có dữ liệu thời khóa biểu cho bộ lọc hiện tại.
                        </p>
                        <p className="text-xs text-gray-400">
                          Vui lòng chọn học kỳ hoặc bộ lọc khác.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r) => {
                    const statusCfg = getStatusCfg(r.allocationStatus);
                    const isConflict = r.allocationStatus === "CONFLICT";
                    return (
                      <TableRow
                        key={r.id}
                        className={`transition-colors border-b border-gray-100 hover:bg-gray-50/40 ${
                          isConflict ? "bg-red-50/30" : ""
                        }`}
                      >
                        {/* Mã MH */}
                        <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                          {r.courseCode}
                        </TableCell>
                        {/* Tên môn học */}
                        <TableCell className="text-xs font-medium text-gray-800 max-w-[180px] truncate">
                          {r.courseName}
                        </TableCell>
                        {/* Nhóm/Tổ */}
                        <TableCell className="text-center">
                          <span className="inline-block font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
                            {r.sectionGroup}
                          </span>
                        </TableCell>
                        {/* Lớp hành chính */}
                        <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                          {r.classCodes}
                        </TableCell>
                        {/* Giảng viên */}
                        <TableCell className="text-xs text-gray-600 max-w-[130px] truncate">
                          {r.lecturer}
                        </TableCell>
                        {/* SV */}
                        <TableCell className="text-xs text-center font-semibold text-gray-700">
                          {r.students}
                        </TableCell>
                        {/* Thứ */}
                        <TableCell className="text-xs text-center text-gray-700 whitespace-nowrap">
                          {r.day}
                        </TableCell>
                        {/* Tiết */}
                        <TableCell className="text-xs text-center text-gray-700 whitespace-nowrap">
                          {r.slotLabel}
                        </TableCell>
                        {/* Thời gian */}
                        <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                          {r.timeLabel}
                        </TableCell>
                        {/* Tuần học */}
                        <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                          {r.weekLabel}
                        </TableCell>
                        {/* Phòng */}
                        <TableCell className="text-xs font-semibold text-gray-900">
                          {r.room !== "---" ? r.room : (
                            <span className="text-gray-400 italic text-[11px]">Chưa phân</span>
                          )}
                        </TableCell>
                        {/* Tòa nhà */}
                        <TableCell className="text-xs text-gray-600">
                          {r.building !== "---" ? r.building : "---"}
                        </TableCell>
                        {/* Trạng thái */}
                        <TableCell className="text-center">
                          <Badge className={`${statusCfg.cls} text-[10px] font-semibold border px-2 py-0.5 rounded-full shadow-none`}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        {/* Thao tác */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {isFacility ? (
                              <>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => openPlaceholder("Chi tiết lớp học phần")}
                                >
                                  Chi tiết
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => openPlaceholder("Báo sự cố phòng " + r.room)}
                                >
                                  Báo sự cố
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                  onClick={() => openPlaceholder("Mở/Đóng phòng " + r.room)}
                                >
                                  Mở/Đóng
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => openPlaceholder("Chi tiết lớp học phần")}
                                >
                                  Chi tiết
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                  onClick={() => openPlaceholder("Xem theo tuần")}
                                >
                                  Theo tuần
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                  onClick={() => openPlaceholder("Xem phòng")}
                                >
                                  Xem phòng
                                </Button>
                                {isAdminOrStaff && isConflict && (
                                  <Button
                                    size="xs"
                                    className="h-7 px-2 text-[11px] bg-red-500 hover:bg-red-600 text-white font-medium shadow-none rounded-md"
                                    onClick={() => openPlaceholder("Xem xung đột")}
                                  >
                                    Xung đột
                                  </Button>
                                )}
                              </>
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
        </div>
      )}

      {/* ── GRID MODE ─────────────────────── */}
      {viewMode === "grid" && (
        <RoomTimetableGridView
          rows={filtered}
          timeSlots={timeSlotsList}
          onCellClick={() => openPlaceholder("Chi tiết lớp học phần")}
        />
      )}

      {/* ── PAGINATION ────────────────────── */}
      {viewMode === "list" && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-xs text-gray-500">
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
      )}

      {/* ── LEGEND ────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Chú thích trạng thái</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, { label, cls }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`inline-block text-[10px] font-semibold border px-2 py-0.5 rounded-full ${cls}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PLACEHOLDER MODAL ─────────────── */}
      {placeholderModal.open && (
        <PlaceholderModal
          title={placeholderModal.title}
          onClose={() => setPlaceholderModal({ open: false, title: "" })}
        />
      )}
    </div>
  );
};

export default WeeklySchedulePage;
