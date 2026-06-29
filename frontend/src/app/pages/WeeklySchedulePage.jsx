import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  DoorOpen,
  Layers3,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { decorateItemsWithCalendarBlocks, normalizeSemester } from "../utils/calendarBlockMatcher";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { httpClient } from "../../services/httpClient";

const DAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const PERIODS = Array.from({ length: 16 }, (_, index) => index + 1);

const DAY_LABELS = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ Nhật",
};

const STATUS_META = {
  ASSIGNED: {
    label: "Đã phân phòng",
    dot: "bg-sky-500",
    block: "border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100",
    accent: "border-l-sky-500",
  },
  UNASSIGNED: {
    label: "Chưa phân phòng",
    dot: "bg-amber-500",
    block: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
    accent: "border-l-amber-500",
  },
  CONFLICT: {
    label: "Có xung đột",
    dot: "bg-red-500",
    block: "border-red-200 bg-red-50 text-red-950 hover:bg-red-100",
    accent: "border-l-red-500",
  },
  PUBLISHED: {
    label: "Đã công bố",
    dot: "bg-emerald-500",
    block: "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
    accent: "border-l-emerald-500",
  },
  INACTIVE: {
    label: "Tạm dừng",
    dot: "bg-gray-400",
    block: "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200",
    accent: "border-l-gray-400",
  },
};

const VIEW_MODES = [
  { value: "room", label: "Theo phòng" },
  { value: "section", label: "Theo lớp học phần" },
  { value: "lecturer", label: "Theo giảng viên" },
];

const DEFAULT_SEMESTER_LABEL = "Học kỳ 2 - Năm học 2025 - 2026";

const unwrapList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalize = (value) => String(value || "").trim().toUpperCase();

const formatDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfMonday = (date) => {
  const value = new Date(date);
  const day = value.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  value.setHours(0, 0, 0, 0);
  return addDays(value, offset);
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSemesterLabel = (semester) => {
  if (!semester) return DEFAULT_SEMESTER_LABEL;
  const name = semester.name || semester.semesterName || DEFAULT_SEMESTER_LABEL;
  const year = semester.academicYear || semester.academicYearName || "";
  return year && !name.includes(year) ? `${name} - Năm học ${year}` : name;
};

const buildWeekOptions = (semester) => {
  const start = toDate(semester?.startDate);
  const end = toDate(semester?.endDate);
  const baseStart = start ? startOfMonday(start) : startOfMonday(new Date());
  const totalWeeks =
    start && end
      ? Math.max(1, Math.ceil((end.getTime() - baseStart.getTime() + 1) / (7 * 24 * 60 * 60 * 1000)))
      : 20;

  return Array.from({ length: Math.min(Math.max(totalWeeks, 16), 30) }, (_, index) => {
    const weekNo = index + 1;
    const weekStart = addDays(baseStart, index * 7);
    const weekEnd = addDays(weekStart, 6);
    return {
      value: String(weekNo),
      weekNo,
      start: weekStart,
      end: weekEnd,
      label: `Tuần ${weekNo} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
    };
  });
};

const resolveCurrentWeek = (weekOptions) => {
  if (weekOptions.length === 0) return "1";
  const now = new Date();
  const found = weekOptions.find((week) => now >= week.start && now <= week.end);
  if (found) return found.value;
  return weekOptions[0].value;
};

const cleanRoomName = (roomCode) => {
  const value = String(roomCode || "").trim();
  const match = value.match(/^([A-Z]+)-([A-Z]+\d+)$/i);
  if (match) return match[2].toUpperCase();
  return value || "Chưa phân phòng";
};

const getBuildingFromRoom = (roomCode) => {
  const value = String(roomCode || "");
  if (!value || value === "---") return "";
  return value.includes("-") ? value.split("-")[0] : value.charAt(0);
};

const getRoomCodeFromClassroom = (room) => {
  const buildingCode = room.buildingCode || room.building_code || "";
  const roomNumber = room.roomNumber || room.room_number || room.roomName || room.room_name || "";
  if (!buildingCode || !roomNumber) return "";
  return `${buildingCode}-${roomNumber}`;
};

const extractCourseAndGroup = (classCode, courseCodeHint) => {
  if (!classCode) return { courseCode: courseCodeHint || "---", sectionGroup: "---" };
  if (courseCodeHint) {
    const suffix = String(classCode).replace(courseCodeHint, "").replace(/^[.\-L]+/, "");
    return { courseCode: courseCodeHint, sectionGroup: suffix || classCode };
  }
  const match = String(classCode).match(/^([A-Z]+\d+)(?:\.L|[-.])(.+)$/i);
  if (match) return { courseCode: match[1], sectionGroup: match[2] };
  return { courseCode: classCode, sectionGroup: "---" };
};

const getDisplayStatus = (item) => {
  const allocation = normalize(item.allocationStatus);
  const section = normalize(item.sectionStatus);
  const direct = normalize(item.status);
  if (allocation === "CONFLICT") return "CONFLICT";
  if (allocation === "UNASSIGNED" || allocation === "NO_SCHEDULE") return "UNASSIGNED";
  if (allocation === "PUBLISHED" || section === "PUBLISHED") return "PUBLISHED";
  // Fallback for student/lecturer direct status field
  if (direct === "UNASSIGNED") return "UNASSIGNED";
  if (direct === "INACTIVE" || direct === "CANCELLED") return "INACTIVE";
  return "ASSIGNED";
};

const mapScheduleItem = (item) => {
  const { courseCode, sectionGroup } = extractCourseAndGroup(item.classCode, item.courseCode);
  const room = item.room || item.roomCode || item.room_code || "";
  const slotStart = Number(item.slotStart ?? item.slotStartNo ?? item.slot_start ?? item.slot ?? 0);
  const slotEnd = Number(item.slotEnd ?? item.slotEndNo ?? item.slot_end ?? item.slot ?? slotStart);

  return {
    id: item.id ?? item.scheduleId ?? item.schedule_id,
    courseCode,
    sectionGroup,
    courseName: item.courseName || item.course_name || item.name || "Chưa có tên môn",
    classCode: item.classCode || item.class_code || item.sectionCode || item.section_code || "",
    classCodes: item.classCodes || item.classNames || item.className || item.class_name || "",
    lecturer: item.lecturerName || item.lecturer_name || "Chưa phân công",
    room,
    roomLabel: cleanRoomName(room),
    building: item.buildingCode || item.building_code || item.buildingName || item.building_name || getBuildingFromRoom(room),
    dayCode: item.dayCode || item.day_code || item.day || "",
    slotStart,
    slotEnd: Math.max(slotEnd, slotStart),
    semesterId: item.semesterId ?? item.semester_id,
    status: getDisplayStatus(item),
    fromWeekNo: item.fromWeekNo ?? item.from_week_no ?? null,
    toWeekNo: item.toWeekNo ?? item.to_week_no ?? null,
    startTime: item.startTime || item.start_time || null,
    endTime: item.endTime || item.end_time || null,
  };
};

const getSectionsEndpoint = (backendRole) => {
  if (backendRole === "ADMIN") return "/api/admin/class-sections";
  if (backendRole === "FACILITY") return "/api/facility/timetable";
  if (backendRole === "LECTURER") return "/api/lecturer/timetable";
  if (backendRole === "STUDENT") return "/api/student/timetable";
  return "/api/staff/class-sections";
};

const isInSelectedWeek = (item, selectedWeek) => {
  const weekNo = Number(selectedWeek);
  if (!Number.isFinite(weekNo)) return true;
  const fromWeek = Number(item.fromWeekNo || 1);
  const toWeek = Number(item.toWeekNo || 999);
  return weekNo >= fromWeek && weekNo <= toWeek;
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[0, 1].map((index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-9 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
          {Array.from({ length: 64 }, (_, cell) => (
            <div key={cell} className="h-10 animate-pulse bg-slate-50" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const LessonBlock = ({ item }) => {
  const isHolidayBlocked = Boolean(item.calendarBlock);
  const status = isHolidayBlocked
    ? {
      label: "Lịch nghỉ",
      dot: "bg-red-500",
      block: "border-red-200 bg-red-50 text-red-950 hover:bg-red-100",
      accent: "border-l-red-500",
    }
    : STATUS_META[item.status] || STATUS_META.ASSIGNED;
  const blockLabel = item.calendarBlock?.title || item.calendarBlock?.notes || "";
  const rowSpan = Math.max(1, item.slotEnd - item.slotStart + 1);

  return (
    <div
      className={`m-1 overflow-hidden rounded-md border border-l-4 p-2 text-[11px] leading-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${status.block} ${status.accent}`}
      style={{ minHeight: `${rowSpan * 38}px` }}
      title={isHolidayBlocked ? `${item.courseName} - ${item.lecturer} - ${blockLabel || "Lịch nghỉ"}` : `${item.courseName} - ${item.lecturer}`}
    >
      <div className="line-clamp-2 font-bold">{item.courseName}</div>
      <div className="mt-0.5 font-semibold">({item.courseCode})</div>
      <div>Nhóm: {item.sectionGroup}</div>
      <div className="truncate">GV: {item.lecturer}</div>
      <div>Phòng: {item.roomLabel}</div>
      {isHolidayBlocked && blockLabel && (
        <div className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-semibold leading-none text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Lịch nghỉ
        </div>
      )}
      {item.classCodes && <div className="truncate">Mã lớp: {item.classCodes}</div>}
      {item.startTime && item.endTime && (
        <div className="text-slate-500 font-medium mt-0.5">
          {item.startTime.slice(0, 5)} - {item.endTime.slice(0, 5)}
        </div>
      )}
    </div>
  );
};

/* ĐÃ ĐƯA CÁC THÀNH PHẦN CỦA THỨ VÀ NGÀY THÁNG LÊN CÙNG MỘT DÒNG */
const DayHeader = ({ code, selectedWeek }) => {
  const index = DAY_CODES.indexOf(code);
  const date = selectedWeek?.start ? addDays(selectedWeek.start, index) : null;

  return (
    <div className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 flex flex-row items-center justify-center gap-1.5 min-w-0 h-[42px]">
      <div className="text-sm font-bold text-slate-800 shrink-0">{DAY_LABELS[code]}</div>
      <div className="text-[11px] font-medium text-slate-400 shrink-0">
        {date ? `(${formatDate(date)})` : "(--/--)"}
      </div>
    </div>
  );
};

const TimetableGrid = ({ title, subtitle, items = [], selectedWeek, compact, onPrevWeek, onNextWeek, hasPrev, hasNext }) => {
  const itemsByDay = useMemo(() => {
    return items.reduce((accumulator, item) => {
      const dayKey = normalize(item.dayCode);
      if (!accumulator[dayKey]) accumulator[dayKey] = [];
      accumulator[dayKey].push(item);
      return accumulator;
    }, {});
  }, [items]);

  const rowHeight = compact ? 34 : 40;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <DoorOpen className="h-3.5 w-3.5" />
          {items.length} lịch học
        </div>
      </div>

      {/* ĐÃ BỎ max-h-[680px], GRID CHẠY THEO CUỘN DỌC CHÍNH CỦA TRANG WEB */}
      <div className="overflow-x-auto w-full">
        <div
          className="grid min-w-[1000px] w-full"
          style={{
            gridTemplateColumns: `50px repeat(7, minmax(0, 1fr)) 50px`,
            gridTemplateRows: `42px repeat(16, ${rowHeight}px)`,
          }}
        >
          {/* CỘT NÚT BÊN TRÁI STICKY CẢ DỌC LẪN NGANG */}
          {/* CỘT NÚT BÊN TRÁI STICKY CẢ DỌC LẪN NGANG */}
          <div className="sticky left-0 top-0 z-40 border-b border-r border-slate-200 bg-slate-50 flex items-center justify-center h-[42px]">
            <button
              type="button"
              onClick={onPrevWeek}
              disabled={!hasPrev}
              className="flex h-full w-full items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none"
              title="Tuần trước"
            >
              <ArrowLeft className="h-5 w-5 stroke-[3]" />
            </button>
          </div>

          {/* DÒNG TIÊU ĐỀ THỨ 2 -> CHỦ NHẬT (CÙNG MỘT DÒNG) */}
          {DAY_CODES.map((code) => (
            <DayHeader key={code} code={code} selectedWeek={selectedWeek} />
          ))}

          {/* CỘT NÚT BÊN PHẢI STICKY CẢ DỌC LẪN NGANG */}
          <div className="sticky right-0 top-0 z-40 border-b border-l border-slate-200 bg-slate-50 flex items-center justify-center h-[42px]">
            <button
              type="button"
              onClick={onNextWeek}
              disabled={!hasNext}
              className="flex h-full w-full items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-30 disabled:pointer-events-none"
              title="Tuần sau"
            >
              <ArrowRight className="h-5 w-5 stroke-[3]" />
            </button>
          </div>

          {/* CỘT TIẾT BÊN TRÁI STICKY */}
          {PERIODS.map((period) => (
            <div
              key={`period-left-${period}`}
              className="sticky left-0 z-20 border-b border-r border-slate-200 bg-blue-600 px-1 py-1 flex items-center justify-center text-xs font-bold text-white shadow-[1px_0_0_0_rgba(226,232,240,1)]"
              style={{ gridColumn: 1, gridRow: period + 1 }}
            >
              Tiết {period}
            </div>
          ))}

          {/* Ô LƯỚI TRỐNG GIỮA CÁC THỨ */}
          {DAY_CODES.map((dayCode, dayIndex) =>
            PERIODS.map((period) => (
              <div
                key={`${dayCode}-${period}`}
                className="border-b border-r border-slate-200 bg-white"
                style={{ gridColumn: dayIndex + 2, gridRow: period + 1 }}
              />
            ))
          )}

          {/* CỘT TIẾT BÊN PHẢI STICKY */}
          {PERIODS.map((period) => (
            <div
              key={`period-right-${period}`}
              className="sticky right-0 z-20 border-b border-l border-slate-200 bg-blue-600 px-1 py-1 flex items-center justify-center text-xs font-bold text-white shadow-[-1px_0_0_0_rgba(226,232,240,1)]"
              style={{ gridColumn: 9, gridRow: period + 1 }}
            >
              Tiết {period}
            </div>
          ))}

          {/* THẺ LỊCH HỌC */}
          {DAY_CODES.flatMap((dayCode, dayIndex) =>
            (itemsByDay[dayCode] || []).map((item) => (
              <div
                key={`${item.id}-${dayCode}-${item.slotStart}`}
                className="z-10 min-w-0"
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: `${Math.max(1, item.slotStart) + 1} / span ${Math.max(
                    1,
                    item.slotEnd - item.slotStart + 1,
                  )}`,
                }}
              >
                <LessonBlock item={item} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const WeeklySchedulePage = () => {
  const { user } = useAuth();
  const backendRole = user?.backendRole || user?.role || "STAFF";
  const isPersonalRole = backendRole === "STUDENT" || backendRole === "LECTURER";
  const [semesters, setSemesters] = useState([]);
  const [semesterWeeks, setSemesterWeeks] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedBuilding, setSelectedBuilding] = useState("A");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [viewMode, setViewMode] = useState("room");
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [calendarBlocks, setCalendarBlocks] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadMeta = async () => {
      setLoadingMeta(true);
      setError("");
      try {
        const [semesterResponse, buildingResponse, classroomResponse] = await Promise.all([
          httpClient.get("/api/categories/semesters"),
          httpClient.get("/api/categories/buildings"),
          httpClient.get("/api/categories/classrooms"),
        ]);

        if (!mounted) return;
        const nextSemesters = unwrapList(semesterResponse);
        const nextBuildings = unwrapList(buildingResponse);
        const nextClassrooms = unwrapList(classroomResponse);

        setSemesters(nextSemesters);
        setBuildings(nextBuildings);
        setClassrooms(nextClassrooms);

        const defaultSemester =
          nextSemesters.find((semester) => getSemesterLabel(semester) === DEFAULT_SEMESTER_LABEL) ||
          nextSemesters[0];
        const defaultBuilding =
          nextBuildings.find((building) => normalize(building.code) === "A") || nextBuildings[0];

        if (defaultSemester?.id) setSelectedSemester(String(defaultSemester.id));
        if (defaultBuilding?.code) setSelectedBuilding(defaultBuilding.code);
      } catch {
        if (mounted) {
          setError("Không tải được dữ liệu bộ lọc thời khóa biểu.");
        }
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    };

    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedSemesterData = useMemo(
    () => semesters.find((semester) => String(semester.id) === String(selectedSemester)),
    [semesters, selectedSemester],
  );
  const isFacilityUnpublished =
    backendRole === "FACILITY" &&
    !["PUBLISHED", "LOCKED"].includes(selectedSemesterData?.timetableStatus);

  useEffect(() => {
    let mounted = true;
    const semester = normalizeSemester(selectedSemesterData);

    if (!semester?.id) {
      setCalendarBlocks([]);
      return () => {
        mounted = false;
      };
    }

    const loadCalendarBlocks = async () => {
      try {
        const response = await httpClient.get("/api/categories/calendar-blocks", {
          params: { semesterId: semester.id },
        });
        if (!mounted) return;
        const payload = response?.data?.data ?? response?.data ?? [];
        setCalendarBlocks(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        if (mounted) {
          setCalendarBlocks([]);
          console.warn("Khong tai duoc calendar blocks:", loadError);
        }
      }
    };

    loadCalendarBlocks();
    return () => {
      mounted = false;
    };
  }, [selectedSemesterData]);

  useEffect(() => {
    if (!selectedSemester) {
      setSemesterWeeks([]);
      return;
    }
    let mounted = true;
    const loadSemesterWeeks = async () => {
      try {
        const response = await httpClient.get("/api/categories/semester-weeks", {
          params: { semesterId: selectedSemester },
        });
        if (!mounted) return;
        const payload = unwrapList(response);
        setSemesterWeeks(payload);
      } catch (err) {
        if (mounted) {
          setSemesterWeeks([]);
          console.warn("Khong tai duoc semester weeks:", err);
        }
      }
    };
    loadSemesterWeeks();
    return () => {
      mounted = false;
    };
  }, [selectedSemester]);

  const weekOptions = useMemo(() => {
    if (semesterWeeks && semesterWeeks.length > 0) {
      return semesterWeeks.map((sw) => {
        const weekNo = sw.weekNo ?? sw.week_no;
        const weekStart = toDate(sw.startDate || sw.start_date);
        const weekEnd = toDate(sw.endDate || sw.end_date) || (weekStart ? addDays(weekStart, 6) : null);
        return {
          value: String(weekNo),
          weekNo,
          start: weekStart,
          end: weekEnd,
          label: `Tuần ${weekNo} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
        };
      });
    }
    return buildWeekOptions(selectedSemesterData);
  }, [semesterWeeks, selectedSemesterData]);

  useEffect(() => {
    setSelectedWeek(resolveCurrentWeek(weekOptions));
  }, [weekOptions]);

  useEffect(() => {
    if (!selectedSemester) return;
    let mounted = true;
    const loadRows = async () => {
      setLoadingRows(true);
      setError("");
      try {
        const response = await httpClient.get(getSectionsEndpoint(backendRole), {
          params: { semesterId: selectedSemester },
        });
        if (mounted) {
          setRows(unwrapList(response).map(mapScheduleItem));
        }
      } catch {
        if (mounted) {
          setRows([]);
          setError("Không tải được dữ liệu thời khóa biểu toàn trường.");
        }
      } finally {
        if (mounted) setLoadingRows(false);
      }
    };

    loadRows();
    return () => {
      mounted = false;
    };
  }, [backendRole, selectedSemester]);

  const buildingOptions = useMemo(() => {
    const mapped = buildings
      .map((building) => ({
        id: building.id || building.code,
        code: building.code || building.buildingCode || "",
        name: building.name || building.buildingName || "",
      }))
      .filter((building) => building.code);

    if (mapped.length > 0) return mapped;
    return ["A", "B", "C"].map((code) => ({ id: code, code, name: `Tòa ${code}` }));
  }, [buildings]);

  const roomOptions = useMemo(() => {
    const roomsFromCategory = classrooms
      .map((room) => {
        const code = getRoomCodeFromClassroom(room);
        return code ? { code, label: cleanRoomName(code), building: getBuildingFromRoom(code) } : null;
      })
      .filter(Boolean);

    const roomsFromRows = rows
      .filter((row) => row.room)
      .map((row) => ({ code: row.room, label: cleanRoomName(row.room), building: row.building }));

    const unique = new Map();
    [roomsFromCategory, ...roomsFromRows].forEach((room) => {
      if (normalize(room.building) === normalize(selectedBuilding)) unique.set(room.code, room);
    });

    return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [classrooms, rows, selectedBuilding]);

  useEffect(() => {
    if (roomOptions && roomOptions.length > 0) {
      setSelectedRoom(roomOptions[0].code);
    } else {
      setSelectedRoom("all");
    }
  }, [roomOptions]);

  const selectedWeekData = useMemo(
    () => weekOptions.find((week) => week.value === selectedWeek) || weekOptions[0],
    [selectedWeek, weekOptions],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!row.dayCode || row.slotStart <= 0) return false;
      if (selectedSemester && String(row.semesterId) !== String(selectedSemester)) return false;
      if (!isInSelectedWeek(row, selectedWeek)) return false;
      if (!isPersonalRole) {
        if (normalize(row.building) !== normalize(selectedBuilding)) return false;
        if (selectedRoom !== "all" && row.room !== selectedRoom) return false;
      }
      if (assignedOnly && row.status !== "ASSIGNED" && row.status !== "PUBLISHED") return false;
      if (!showConflicts && row.status === "CONFLICT") return false;
      return true;
    });
  }, [assignedOnly, isPersonalRole, rows, selectedBuilding, selectedRoom, selectedSemester, selectedWeek, showConflicts]);

  const rowsWithCalendarBlocks = useMemo(
    () =>
      decorateItemsWithCalendarBlocks(filteredRows, calendarBlocks, {
        semester: selectedSemesterData,
        weekNo: Number(selectedWeek),
        weekStart: selectedWeekData?.start,
        weekEnd: selectedWeekData?.end,
      }),
    [
      calendarBlocks,
      filteredRows,
      selectedSemesterData,
      selectedWeek,
      selectedWeekData,
    ],
  );

  const groups = useMemo(() => {
    if (isPersonalRole) {
      return [{
        key: "personal",
        title: backendRole === "STUDENT" ? "Lịch học của tôi" : "Lịch dạy của tôi",
        subtitle: selectedWeekData?.label || "Tuần học",
        items: rowsWithCalendarBlocks,
      }];
    }

    if (selectedRoom !== "all" && selectedRoom !== "") {
      return [
        {
          key: selectedRoom,
          title: `Phòng ${cleanRoomName(selectedRoom)}`,
          subtitle: `Tòa ${selectedBuilding} • ${selectedWeekData?.label || "Tuần học"}`,
          items: rowsWithCalendarBlocks,
        },
      ];
    }

    if (viewMode === "section") {
      const grouped = new Map();
      rowsWithCalendarBlocks.forEach((row) => {
        const key = row.classCode || row.classCodes || row.courseCode;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(row);
      });
      return Array.from(grouped.entries()).map(([key, items]) => ({
        key,
        title: `Lớp học phần ${key}`,
        subtitle: `${items[0]?.courseName || "Môn học"} • ${selectedWeekData?.label || "Tuần học"}`,
        items,
      }));
    }

    if (viewMode === "lecturer") {
      const grouped = new Map();
      rowsWithCalendarBlocks.forEach((row) => {
        const key = row.lecturer || "Chưa phân công";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(row);
      });
      return Array.from(grouped.entries()).map(([key, items]) => ({
        key,
        title: `Giảng viên ${key}`,
        subtitle: `${items.length} lịch học • ${selectedWeekData?.label || "Tuần học"}`,
        items,
      }));
    }

    const allRoomCodes = roomOptions.map((room) => room.code);
    const roomsWithSchedule = rowsWithCalendarBlocks.map((row) => row.room).filter(Boolean);
    const roomCodes = Array.from(new Set([...allRoomCodes, ...roomsWithSchedule])).sort((a, b) =>
      cleanRoomName(a).localeCompare(cleanRoomName(b), "vi"),
    );

    return roomCodes.map((roomCode) => ({
      key: roomCode,
      title: `Phòng ${cleanRoomName(roomCode)}`,
      subtitle: `Tòa ${selectedBuilding} • ${selectedWeekData?.label || "Tuần học"}`,
      items: rowsWithCalendarBlocks.filter((row) => row.room === roomCode),
    }));
  }, [backendRole, isPersonalRole, rowsWithCalendarBlocks, roomOptions, selectedBuilding, selectedRoom, selectedWeekData, viewMode]);

  const currentWeekIdx = useMemo(() => weekOptions.findIndex((w) => w.value === selectedWeek), [weekOptions, selectedWeek]);
  const hasPrevWeek = currentWeekIdx > 0;
  const hasNextWeek = currentWeekIdx >= 0 && currentWeekIdx < weekOptions.length - 1;

  const handlePrevWeek = () => {
    if (hasPrevWeek) {
      setSelectedWeek(weekOptions[currentWeekIdx - 1].value);
    }
  };

  const handleNextWeek = () => {
    if (hasNextWeek) {
      setSelectedWeek(weekOptions[currentWeekIdx + 1].value);
    }
  };

  const selectedBuildingLabel =
    buildingOptions.find((building) => normalize(building.code) === normalize(selectedBuilding))?.name ||
    `Tòa ${selectedBuilding}`;
  const isLoading = loadingMeta || loadingRows;

  return (
    <div className="space-y-5 p-5 md:p-6 w-full max-w-full overflow-x-hidden">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Lịch học theo tuần
          </div>
          <h1 className="text-2xl font-extrabold tracking-normal text-slate-950">
            {isPersonalRole
              ? (backendRole === "STUDENT" ? "THỜI KHÓA BIỂU CÁ NHÂN" : "LỊCH GIẢNG DẠY")
              : "THỜI KHÓA BIỂU TOÀN TRƯỜNG"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isPersonalRole
              ? "Lịch học / giảng dạy của bạn theo tuần"
              : "Theo dõi lịch học và sử dụng phòng học theo tuần"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200"
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className={`grid grid-cols-1 gap-3 ${isPersonalRole ? "xl:grid-cols-[1fr_1.4fr]" : "xl:grid-cols-[1fr_1.4fr_0.8fr_0.9fr_0.9fr]"}`}>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm">
              <SelectValue placeholder={DEFAULT_SEMESTER_LABEL} />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={String(semester.id)}>
                  {getSemesterLabel(semester)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevWeek}
              disabled={!hasPrevWeek}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 text-sm">
                <SelectValue placeholder="Tuần học hiện tại" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((week) => (
                  <SelectItem key={week.value} value={week.value}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={handleNextWeek}
              disabled={!hasNextWeek}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isPersonalRole && (
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm">
                <SelectValue placeholder="Tòa A" />
              </SelectTrigger>
              <SelectContent>
                {buildingOptions.map((building) => (
                  <SelectItem key={building.id || building.code} value={building.code}>
                    {building.name || `Tòa ${building.code}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!isPersonalRole && (
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm">
                <SelectValue placeholder="Chọn phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng</SelectItem>
                {roomOptions.map((room) => (
                  <SelectItem key={room.code} value={room.code}>
                    Phòng {room.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!isPersonalRole && (
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm">
                <SelectValue placeholder="Chế độ xem" />
              </SelectTrigger>
              <SelectContent>
                {VIEW_MODES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {!isPersonalRole && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              {selectedBuildingLabel}
            </span>
          )}
          {!isPersonalRole && (
            <span className="inline-flex items-center gap-1.5">
              <Layers3 className="h-3.5 w-3.5 text-blue-500" />
              {VIEW_MODES.find((option) => option.value === viewMode)?.label}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            {filteredRows.length} lịch phù hợp
          </span>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : isFacilityUnpublished ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-12 text-center">
          <CalendarDays className="mx-auto h-9 w-9 text-amber-500" />
          <p className="mt-3 text-sm font-semibold text-amber-900">
            Thời khóa biểu chưa được công bố, chưa thể dùng để vận hành mở phòng.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <TimetableGrid
              key={group.key}
              title={group.title}
              subtitle={group.subtitle}
              items={group.items}
              selectedWeek={selectedWeekData}
              compact={selectedRoom === "all"}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              hasPrev={hasPrevWeek}
              hasNext={hasNextWeek}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { WeeklySchedulePage };
export default WeeklySchedulePage;
