import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScheduleGridView } from "../components/ScheduleGridView";
import ScheduleToolbar from "../components/ScheduleToolbar";
import { decorateItemsWithCalendarBlocks, normalizeSemester } from "../utils/calendarBlockMatcher";
import { useNavigate } from "react-router";
import { httpClient } from "../../services/httpClient";

const dayLabels = {
  MON: "Thu 2",
  TUE: "Thu 3",
  WED: "Thu 4",
  THU: "Thu 5",
  FRI: "Thu 6",
  SAT: "Thu 7",
  SUN: "Chu nhat",
};

const statusConfigSchedule = {
  ASSIGNED: { label: "Da xep phong", cls: "bg-green-100 text-green-700", color: "blue" },
  UNASSIGNED: { label: "Chua xep phong", cls: "bg-orange-100 text-orange-700", color: "orange" },
  INACTIVE: { label: "Tam dung", cls: "bg-gray-100 text-gray-600", color: "gray" },
  CANCELLED: { label: "Da huy", cls: "bg-red-100 text-red-700", color: "red" },
  ACTIVE: { label: "Dang day", cls: "bg-blue-100 text-blue-700", color: "blue" },
  DEFAULT: { label: "Da co lich", cls: "bg-blue-100 text-blue-700", color: "blue" },
};

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const formatTime = (value) => {
  if (!value) return "";
  return String(value).slice(0, 5);
};

const buildSlotLabel = (item) => {
  if (item.timeSlotName) return item.timeSlotName;
  if (item.slotStart && item.slotEnd) {
    return item.slotStart === item.slotEnd
      ? `Tiet ${item.slotStart}`
      : `Tiet ${item.slotStart}-${item.slotEnd}`;
  }
  if (item.slotNumber) return `Tiet ${item.slotNumber}`;
  return "";
};

const buildWeekLabel = (item) => {
  if (item.fromWeekNo && item.toWeekNo) return `Tuan ${item.fromWeekNo}-${item.toWeekNo}`;
  if (item.fromWeekNo) return `Tu tuan ${item.fromWeekNo}`;
  if (item.toWeekNo) return `Den tuan ${item.toWeekNo}`;
  return "Tat ca cac tuan";
};

const normalizeScheduleItem = (item) => {
  const dayCode = item.dayCode ?? item.day_code ?? "";
  const startTime = formatTime(item.startTime ?? item.start_time);
  const endTime = formatTime(item.endTime ?? item.end_time);
  const roomCode = item.roomCode ?? item.room_code ?? "";
  const roomName = item.roomName ?? item.room_name ?? "";
  const status = String(item.status ?? "ASSIGNED").toUpperCase();

  return {
    id: item.id ?? item.scheduleId ?? item.schedule_id,
    scheduleId: item.scheduleId ?? item.schedule_id ?? item.id,
    sectionId: item.sectionId ?? item.section_id,
    semesterId: item.semesterId ?? item.semester_id,
    section: item.classCode ?? item.class_code ?? item.sectionCode ?? item.section_code ?? "",
    className: item.className ?? item.class_name ?? "",
    courseCode: item.courseCode ?? item.course_code ?? "",
    name: item.courseName ?? item.course_name ?? "Hoc phan",
    credits: Number(item.credits ?? 0),
    students: Number(item.studentCount ?? item.student_count ?? item.enrolledCount ?? 0),
    maxCapacity: Number(item.maxCapacity ?? item.max_capacity ?? 0),
    dayCode,
    day: dayLabels[dayCode] ?? item.dayOfWeek ?? item.day_of_week ?? dayCode,
    slot: buildSlotLabel(item),
    slotStartId: item.slotStartId ?? item.slot_start_id,
    slotEndId: item.slotEndId ?? item.slot_end_id,
    slotStart: item.slotStart ?? item.slot_start,
    slotEnd: item.slotEnd ?? item.slot_end,
    startTime,
    endTime,
    time: startTime && endTime ? `${startTime} - ${endTime}` : "",
    room: roomCode || roomName || "Chua xep phong",
    roomName,
    building: item.buildingName ?? item.building_name ?? item.buildingCode ?? item.building_code ?? "",
    buildingCode: item.buildingCode ?? item.building_code ?? "",
    status,
    week: buildWeekLabel(item),
    fromWeekNo: item.fromWeekNo ?? item.from_week_no,
    toWeekNo: item.toWeekNo ?? item.to_week_no,
  };
};

const getScheduleErrorMessage = (error) => {
  const message = error?.response?.data?.message ?? error?.message;
  return message || "Khong the tai lich day. Vui long thu lai.";
};

const LecturerSchedulePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [calendarBlocks, setCalendarBlocks] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [filters, setFilters] = useState({
    week: "15",
    date: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchTimeSlots = async () => {
      try {
        const response = await httpClient.get("/api/categories/time-slots");
        const slots = getResponseData(response);
        if (isMounted) setTimeSlots(slots);
      } catch (error) {
        console.error("Loi tai khung gio thoi khoa bieu:", error);
      }
    };

    fetchTimeSlots();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchSemesters = async () => {
      try {
        const response = await httpClient.get("/api/categories/semesters");
        const slots = getResponseData(response);
        if (isMounted) setSemesters(slots);
      } catch (error) {
        console.error("Loi tai danh sach hoc ky:", error);
      }
    };

    fetchSemesters();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTimetable = useCallback(async () => {
    setScheduleLoading(true);
    setScheduleError("");

    try {
      const params = {};
      if (filters.date) params.weekStartDate = filters.date;

      const response = await httpClient.get("/api/lecturer/timetable", { params });
      setScheduleItems(getResponseData(response).map(normalizeScheduleItem));
      setSelectedSession(null);
    } catch (error) {
      setScheduleError(getScheduleErrorMessage(error));
      setScheduleItems([]);
      setSelectedSession(null);
    } finally {
      setScheduleLoading(false);
    }
  }, [filters.date]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const currentSemesterId = useMemo(
    () => scheduleItems.find((item) => item.semesterId != null)?.semesterId ?? null,
    [scheduleItems],
  );

  const currentSemester = useMemo(() => {
    const semester = semesters.find((item) => String(item.id) === String(currentSemesterId));
    return normalizeSemester(semester);
  }, [currentSemesterId, semesters]);

  useEffect(() => {
    let isMounted = true;

    if (!currentSemester?.id) {
      setCalendarBlocks([]);
      return () => {
        isMounted = false;
      };
    }

    const fetchCalendarBlocks = async () => {
      try {
        const response = await httpClient.get("/api/categories/calendar-blocks", {
          params: { semesterId: currentSemester.id },
        });
        if (!isMounted) return;
        const payload = response?.data?.data ?? response?.data ?? [];
        setCalendarBlocks(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (isMounted) {
          setCalendarBlocks([]);
          console.warn("Khong tai duoc calendar blocks:", error);
        }
      }
    };

    fetchCalendarBlocks();
    return () => {
      isMounted = false;
    };
  }, [currentSemester?.id]);

  const filteredSchedule = useMemo(() => {
    return scheduleItems.filter((item) => {
      const selectedWeek = Number(filters.week);
      const matchWeek = !Number.isFinite(selectedWeek)
        || (
          (item.fromWeekNo == null || Number(item.fromWeekNo) <= selectedWeek)
          && (item.toWeekNo == null || Number(item.toWeekNo) >= selectedWeek)
        );

      return matchWeek;
    });
  }, [filters.week, scheduleItems]);

  const decoratedSchedule = useMemo(
    () =>
      decorateItemsWithCalendarBlocks(
        filteredSchedule.map((item) => {
          const currentStatus = statusConfigSchedule[item.status] ?? statusConfigSchedule.DEFAULT;

          return {
            id: item.id,
            name: item.name,
            subLabel: item.section,
            detail1: `${item.className || "Lop hoc phan"} - ${item.students} SV`,
            detail2: item.building ? `${item.room} (${item.building})` : item.room,
            day: item.day,
            dayCode: item.dayCode,
            slot: item.slot,
            slotStartId: item.slotStartId,
            slotEndId: item.slotEndId,
            slotStart: item.slotStart,
            slotEnd: item.slotEnd,
            startTime: item.startTime,
            endTime: item.endTime,
            time: item.time,
            color: currentStatus.color,
            badge: currentStatus.label,
            semesterId: item.semesterId,
          };
        }),
        calendarBlocks,
        { semester: currentSemester, weekNo: Number(filters.week) },
      ),
    [calendarBlocks, currentSemester, filteredSchedule, filters.week],
  );

  const summary = useMemo(() => {
    const uniqueSections = new Map();
    scheduleItems.forEach((item) => {
      if (!item.sectionId || uniqueSections.has(item.sectionId)) return;
      uniqueSections.set(item.sectionId, item);
    });

    const weeklySlots = scheduleItems.reduce((sum, item) => {
      const start = Number(item.slotStart);
      const end = Number(item.slotEnd);
      return sum + (Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start + 1 : 0);
    }, 0);
    const totalStudents = [...uniqueSections.values()]
      .reduce((sum, item) => sum + Number(item.students || 0), 0);

    return {
      sectionCount: uniqueSections.size,
      weeklySlots,
      totalStudents,
      unavailableCount: scheduleItems.filter((item) => ["INACTIVE", "CANCELLED"].includes(item.status)).length,
    };
  }, [scheduleItems]);

  const renderScheduleContent = () => {
    if (scheduleLoading) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Dang tai lich day...</p>
        </div>
      );
    }

    if (scheduleError) {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-red-400" />
          <p className="text-sm font-bold text-red-700">Khong tai duoc lich day</p>
          <p className="mt-1 text-xs text-red-600">{scheduleError}</p>
        </div>
      );
    }

    if (filteredSchedule.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Chua co lich day phu hop.</p>
          <p className="mt-1 text-xs text-gray-400">
            Neu giang vien da duoc phan cong, kiem tra class section va schedule trong database.
          </p>
        </div>
      );
    }

    return (
      <ScheduleGridView
        items={decoratedSchedule}
        timeSlots={timeSlots}
        onItemClick={(item) => {
          const session = scheduleItems.find((sessionItem) => sessionItem.id === item.id);
          if (session) setSelectedSession(session);
        }}
        compactDays={false}
      />
    );
  };

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lich day cua toi</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {user?.name} - {user?.code} - {user?.department}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-gray-400">Du lieu tu phan cong giang day</p>
          <p className="mt-0.5 text-xs font-semibold text-blue-700">
            {summary.sectionCount} lop dang phu trach
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Lop phu trach", value: summary.sectionCount, icon: BookOpen, color: "bg-blue-50 text-blue-600" },
          { label: "Tong tiet/tuan", value: summary.weeklySlots, icon: Clock, color: "bg-purple-50 text-purple-600" },
          { label: "Tong sinh vien", value: summary.totalStudents, icon: Users, color: "bg-green-50 text-green-600" },
          { label: "Lich tam dung", value: summary.unavailableCount, icon: XCircle, color: "bg-red-50 text-red-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScheduleToolbar
            filters={filters}
            showBuildingRoom={false}
            onWeekChange={(value) => setFilters((current) => ({ ...current, week: value }))}
            onDateChange={(value) => setFilters((current) => ({ ...current, date: value }))}
            onSearch={fetchTimetable}
            onRefresh={fetchTimetable}
          />

          <div className="mt-4">{renderScheduleContent()}</div>
        </div>

        <div>
          {selectedSession ? (
            <Card className="sticky top-4 border-0 shadow-sm ring-1 ring-blue-200">
              <CardHeader className="rounded-t-xl bg-blue-600 pb-3">
                <CardTitle className="text-sm font-bold text-white">{selectedSession.name}</CardTitle>
                <p className="mt-0.5 font-mono text-xs text-blue-200">{selectedSession.section}</p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {[
                  { icon: Users, label: "Lop sinh vien", value: selectedSession.className || "Lop hoc phan" },
                  { icon: Users, label: "So sinh vien", value: `${selectedSession.students} SV` },
                  { icon: BookOpen, label: "So tin chi", value: `${selectedSession.credits} TC` },
                  { icon: Calendar, label: "Lich hoc", value: `${selectedSession.day} - ${selectedSession.slot}` },
                  { icon: Clock, label: "Gio hoc", value: selectedSession.time || "Chua co gio hoc" },
                  { icon: MapPin, label: "Phong hoc", value: selectedSession.building ? `${selectedSession.room} (${selectedSession.building})` : selectedSession.room },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Icon className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">{item.label}</p>
                        <p className="text-xs font-semibold text-gray-900">{item.value}</p>
                      </div>
                    </div>
                  );
                })}

                {selectedSession.status === "UNASSIGNED" && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="text-xs font-semibold text-orange-700">Lop nay chua duoc xep phong</p>
                    <p className="mt-1 text-[11px] text-orange-600">
                      Co the can doi phong hoac cho nhan vien phan bo phong hoc.
                    </p>
                  </div>
                )}

                <Button
                  size="sm"
                  className="mt-2 w-full gap-1.5 bg-blue-600 text-xs hover:bg-blue-700"
                  onClick={() => navigate("/lecturer/room-change-request")}
                >
                  <Send className="h-3.5 w-3.5" /> Gui yeu cau cho lop nay
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <Calendar className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">Chon mot buoi hoc</p>
              <p className="mt-1 text-xs text-gray-300">de xem thong tin chi tiet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { LecturerSchedulePage };
