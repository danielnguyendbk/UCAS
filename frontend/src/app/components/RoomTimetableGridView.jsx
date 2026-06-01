import { useMemo } from "react";
import { AlertCircle, MapPin, User } from "lucide-react";

const DAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const DAY_LABELS = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ nhật",
};

const STEP_MINUTES = 30;
const ROW_HEIGHT_PX = 36;
const TIME_AXIS_WIDTH = 62;
const DAY_HEADER_HEIGHT = 40;
const ROOM_HEADER_HEIGHT = 42;

const PREP_READY_STATUSES = new Set([
  "PUBLISHED",
  "ASSIGNED",
  "COMPLETED",
  "ACTIVE",
]);

const parseTimeToMinutes = (value) => {
  if (value == null || value === "") return null;
  const str = String(value).slice(0, 5);
  const [hours, minutes] = str.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const normalizeTimeSlot = (slot = {}) => ({
  slotId: Number(slot.slotId ?? slot.slot_id ?? 0),
  slotNo: Number(slot.slotNo ?? slot.slot_no ?? 0),
  slotLabel: slot.slotLabel ?? slot.slot_label ?? "",
  startTime: slot.startTime ?? slot.start_time ?? "",
  endTime: slot.endTime ?? slot.end_time ?? "",
});

const buildSlotLookups = (timeSlots) => {
  const normalized = timeSlots
    .map(normalizeTimeSlot)
    .filter((slot) => slot.slotId > 0 && slot.slotNo > 0);

  return {
    byId: new Map(normalized.map((slot) => [slot.slotId, slot])),
    byNo: new Map(normalized.map((slot) => [slot.slotNo, slot])),
    normalized,
  };
};

const buildTimeAxis = (timeSlots) => {
  const { normalized } = buildSlotLookups(timeSlots);
  if (normalized.length === 0) {
    return { ticks: [], startMinutes: 0, endMinutes: 0, gridHeight: 0 };
  }

  let minStart = Infinity;
  let maxEnd = -Infinity;

  normalized.forEach((slot) => {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);
    if (start != null) minStart = Math.min(minStart, start);
    if (end != null) maxEnd = Math.max(maxEnd, end);
  });

  if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) {
    return { ticks: [], startMinutes: 0, endMinutes: 0, gridHeight: 0 };
  }

  const axisStart = Math.floor(minStart / STEP_MINUTES) * STEP_MINUTES;
  const axisEnd = Math.ceil(maxEnd / STEP_MINUTES) * STEP_MINUTES;
  const ticks = [];

  for (let minute = axisStart; minute <= axisEnd; minute += STEP_MINUTES) {
    ticks.push(minute);
  }

  return {
    ticks,
    startMinutes: axisStart,
    endMinutes: axisEnd,
    gridHeight: Math.max(ticks.length - 1, 0) * ROW_HEIGHT_PX,
  };
};

const resolveClockTimes = (item, lookups) => {
  const { byId, byNo } = lookups;
  const raw = item._raw ?? item;
  const slotStartId = item.slotStartId ?? raw.slotStartId ?? raw.slot_start_id;
  const slotEndId = item.slotEndId ?? raw.slotEndId ?? raw.slot_end_id;
  const slotStartNo =
    item.slotStart ?? item.slotStartNo ?? raw.slotStart ?? raw.slotStartNo ?? raw.slot_start;
  const slotEndNo =
    item.slotEnd ?? item.slotEndNo ?? raw.slotEnd ?? raw.slotEndNo ?? raw.slot_end;

  if (slotStartId != null && slotEndId != null) {
    const startSlot = byId.get(Number(slotStartId));
    const endSlot = byId.get(Number(slotEndId));
    if (startSlot && endSlot) {
      const startMinutes = parseTimeToMinutes(startSlot.startTime);
      const endMinutes = parseTimeToMinutes(endSlot.endTime);
      if (startMinutes != null && endMinutes != null && endMinutes > startMinutes) {
        return { startMinutes, endMinutes };
      }
    }
  }

  if (slotStartNo != null && slotEndNo != null) {
    const startSlot = byNo.get(Number(slotStartNo));
    const endSlot = byNo.get(Number(slotEndNo));
    if (startSlot && endSlot) {
      const startMinutes = parseTimeToMinutes(startSlot.startTime);
      const endMinutes = parseTimeToMinutes(endSlot.endTime);
      if (startMinutes != null && endMinutes != null && endMinutes > startMinutes) {
        return { startMinutes, endMinutes };
      }
    }
  }

  const directStart = parseTimeToMinutes(item.startTime ?? raw.startTime ?? raw.start_time);
  const directEnd = parseTimeToMinutes(item.endTime ?? raw.endTime ?? raw.end_time);
  if (directStart != null && directEnd != null && directEnd > directStart) {
    return { startMinutes: directStart, endMinutes: directEnd };
  }

  return null;
};

const getBlockPosition = (startMinutes, endMinutes, axisStartMinutes) => {
  const top = ((startMinutes - axisStartMinutes) / STEP_MINUTES) * ROW_HEIGHT_PX;
  const height = Math.max(
    ((endMinutes - startMinutes) / STEP_MINUTES) * ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  );
  return { top, height };
};

const getPrepBadge = (item) => {
  if (item?.allocationStatus === "CONFLICT") {
    return { label: "Xung đột", wrap: "bg-red-50 text-red-700", dot: "bg-red-500" };
  }
  if (PREP_READY_STATUSES.has(item?.allocationStatus)) {
    return { label: "Đã chuẩn bị", wrap: "bg-green-50 text-green-700", dot: "bg-green-500" };
  }
  return { label: "Chưa chuẩn bị", wrap: "bg-orange-50 text-orange-700", dot: "bg-orange-500" };
};

const getBlockTheme = (item) => {
  if (item.allocationStatus === "CONFLICT") {
    return {
      wrap: "bg-red-50/95 border-red-200 border-l-red-500",
      title: "text-red-900",
      sub: "text-red-700",
    };
  }
  return {
    wrap: "bg-sky-50/95 border-sky-200 border-l-sky-500",
    title: "text-sky-950",
    sub: "text-sky-700",
  };
};

const TimeAxisColumn = ({ ticks, side = "left" }) => (
  <div
    className={`shrink-0 bg-slate-50 ${
      side === "left" ? "border-r border-slate-200" : "border-l border-slate-200"
    }`}
    style={{ width: TIME_AXIS_WIDTH, paddingTop: DAY_HEADER_HEIGHT }}
  >
    {ticks.slice(0, -1).map((minute) => (
      <div
        key={`${side}-${minute}`}
        className={`relative flex items-start px-2 text-[10px] font-semibold text-slate-500 ${
          side === "right" ? "justify-end" : ""
        }`}
        style={{ height: ROW_HEIGHT_PX }}
      >
        <span className="-mt-1.5">{formatMinutes(minute)}</span>
      </div>
    ))}
  </div>
);

const CalendarBlock = ({ item, onCellClick }) => {
  const theme = getBlockTheme(item);
  const badge = getPrepBadge(item);
  const timeLabel = `${formatMinutes(item.startMinutes)} - ${formatMinutes(item.endMinutes)}`;
  const title = item.courseName !== "---" ? item.courseName : item.courseCode;
  const sectionRoom = [item.sectionGroup, item.room]
    .filter((value) => value && value !== "---")
    .join(" / ");

  return (
    <button
      type="button"
      onClick={() => onCellClick?.(item)}
      className={`absolute z-10 flex flex-col overflow-hidden rounded-md border border-l-[3px] px-1.5 py-1 text-left shadow-sm transition-shadow hover:z-20 hover:shadow-md ${theme.wrap}`}
      style={{
        top: item.top,
        height: item.height,
        left: 3,
        right: 3,
        minHeight: 30,
      }}
      title={`${title} - ${timeLabel}`}
    >
      <p className={`truncate text-[11px] font-bold leading-tight ${theme.title}`}>
        {title}
      </p>
      <p className={`truncate font-mono text-[9px] leading-tight ${theme.sub}`}>
        {item.courseCode}
        {sectionRoom ? ` / ${sectionRoom}` : ""}
      </p>
      <p className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] leading-tight text-gray-600">
        <User className="h-2.5 w-2.5 shrink-0 text-gray-400" />
        {item.lecturer}
      </p>
      {badge && (
        <span
          className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold leading-none ${badge.wrap}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      )}
    </button>
  );
};

const RoomCalendarGrid = ({ room, items, timeAxis, onCellClick }) => {
  const dayCount = DAY_CODES.length;
  const minWidth = TIME_AXIS_WIDTH * 2 + dayCount * 132;

  const itemsByDay = useMemo(() => {
    const grouped = Object.fromEntries(DAY_CODES.map((code) => [code, []]));
    items.forEach((item) => {
      if (grouped[item.dayCode]) grouped[item.dayCode].push(item);
    });
    DAY_CODES.forEach((dayCode) => {
      grouped[dayCode].sort((a, b) => a.startMinutes - b.startMinutes);
    });
    return grouped;
  }, [items]);

  return (
    <section className="border-b border-gray-200 last:border-b-0">
      <div
        className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 shadow-sm"
        style={{ height: ROOM_HEADER_HEIGHT }}
      >
        <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
        <h3 className="text-sm font-bold tracking-tight text-slate-800">{room}</h3>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-full" style={{ minWidth: `${minWidth}px` }}>
          <TimeAxisColumn ticks={timeAxis.ticks} side="left" />

          <div className="min-w-0 flex-1">
            <div
              className="sticky z-20 grid border-b border-gray-200 bg-gray-50"
              style={{
                top: ROOM_HEADER_HEIGHT,
                height: DAY_HEADER_HEIGHT,
                gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`,
              }}
            >
              {DAY_CODES.map((dayCode) => (
                <div
                  key={dayCode}
                  className="flex items-center justify-center border-r border-gray-200 px-1 text-xs font-semibold text-gray-700 last:border-r-0"
                >
                  {DAY_LABELS[dayCode]}
                </div>
              ))}
            </div>

            <div
              className="relative grid border-b border-gray-200 bg-white"
              style={{
                height: timeAxis.gridHeight,
                gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`,
              }}
            >
              {DAY_CODES.map((dayCode, dayIndex) => (
                <div
                  key={dayCode}
                  className={`relative ${
                    dayIndex < dayCount - 1 ? "border-r border-gray-200" : ""
                  }`}
                  style={{ height: timeAxis.gridHeight }}
                >
                  {timeAxis.ticks.slice(0, -1).map((minute, index) => (
                    <div
                      key={`${dayCode}-${minute}`}
                      className={`absolute left-0 right-0 border-t ${
                        index % 2 === 0
                          ? "border-gray-100 bg-white"
                          : "border-gray-100 bg-gray-50/30"
                      }`}
                      style={{ top: index * ROW_HEIGHT_PX, height: ROW_HEIGHT_PX }}
                    />
                  ))}

                  {itemsByDay[dayCode].map((item) => (
                    <CalendarBlock
                      key={`${item.id}-${item.dayCode}-${item.startMinutes}`}
                      item={item}
                      onCellClick={onCellClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <TimeAxisColumn ticks={timeAxis.ticks} side="right" />
        </div>
      </div>
    </section>
  );
};

const RoomTimetableGridView = ({ rows, timeSlots = [], onCellClick }) => {
  const lookups = useMemo(() => buildSlotLookups(timeSlots), [timeSlots]);
  const timeAxis = useMemo(() => buildTimeAxis(timeSlots), [timeSlots]);

  const rooms = useMemo(() => {
    const set = new Set(rows.map((row) => row.room).filter((room) => room && room !== "---"));
    return [...set].sort();
  }, [rows]);

  const itemsByRoom = useMemo(() => {
    if (timeAxis.gridHeight <= 0) return {};

    const grouped = {};
    rows.forEach((row) => {
      if (!row.room || row.room === "---") return;
      if (!row.dayCode || !DAY_CODES.includes(row.dayCode)) return;

      const clock = resolveClockTimes(row, lookups);
      if (!clock) return;

      const position = getBlockPosition(
        clock.startMinutes,
        clock.endMinutes,
        timeAxis.startMinutes,
      );

      if (!grouped[row.room]) grouped[row.room] = [];
      grouped[row.room].push({
        ...row,
        startMinutes: clock.startMinutes,
        endMinutes: clock.endMinutes,
        top: position.top,
        height: position.height,
      });
    });

    return grouped;
  }, [rows, lookups, timeAxis]);

  if (timeSlots.length === 0 || timeAxis.gridHeight <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">
          No system time slots have been loaded.
        </p>
        <p className="mt-1 text-xs text-gray-400">Please refresh the page.</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">
          No assigned rooms match the current filters.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Only timetable items with assigned rooms are shown in grid mode.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"
      style={{ maxHeight: "70vh" }}
    >
      {rooms.map((room) => (
        <RoomCalendarGrid
          key={room}
          room={room}
          items={itemsByRoom[room] || []}
          timeAxis={timeAxis}
          onCellClick={onCellClick}
        />
      ))}
    </div>
  );
};

export { RoomTimetableGridView, DAY_CODES, DAY_LABELS, getPrepBadge };
