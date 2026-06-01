import { Fragment, useMemo, useState } from "react";
import { AlertCircle, Clock, MapPin, User, X } from "lucide-react";

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

const colorMap = {
  blue: {
    wrap: "bg-sky-50/95 border-sky-200 border-l-sky-500",
    title: "text-sky-950",
    sub: "text-sky-700",
    dot: "bg-sky-500",
  },
  green: {
    wrap: "bg-green-50/95 border-green-200 border-l-green-500",
    title: "text-green-900",
    sub: "text-green-700",
    dot: "bg-green-500",
  },
  red: {
    wrap: "bg-red-50/95 border-red-200 border-l-red-500",
    title: "text-red-900",
    sub: "text-red-700",
    dot: "bg-red-500",
  },
  orange: {
    wrap: "bg-orange-50/95 border-orange-200 border-l-orange-500",
    title: "text-orange-900",
    sub: "text-orange-700",
    dot: "bg-orange-500",
  },
  purple: {
    wrap: "bg-purple-50/95 border-purple-200 border-l-purple-500",
    title: "text-purple-900",
    sub: "text-purple-700",
    dot: "bg-purple-500",
  },
  teal: {
    wrap: "bg-teal-50/95 border-teal-200 border-l-teal-500",
    title: "text-teal-900",
    sub: "text-teal-700",
    dot: "bg-teal-500",
  },
  gray: {
    wrap: "bg-gray-100/95 border-gray-200 border-l-gray-400",
    title: "text-gray-700",
    sub: "text-gray-500",
    dot: "bg-gray-400",
  },
};

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

const parseSlotRange = (value) => {
  const numbers = String(value ?? "")
    .match(/\d+/g)
    ?.map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  if (!numbers?.length) return null;
  return {
    startNo: numbers[0],
    endNo: numbers[numbers.length - 1],
  };
};

const parseTimeRange = (value) => {
  const match = String(value ?? "").match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  const startMinutes = parseTimeToMinutes(match[1]);
  const endMinutes = parseTimeToMinutes(match[2]);
  if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) return null;
  return { startMinutes, endMinutes };
};

const normalizeDayCode = (item) => {
  const raw = String(item.dayCode ?? item.day ?? "").toUpperCase();
  if (DAY_CODES.includes(raw)) return raw;
  if (raw.includes("CN") || raw.includes("SUN") || raw.includes("CHU")) return "SUN";
  if (raw.match(/2/)) return "MON";
  if (raw.match(/3/)) return "TUE";
  if (raw.match(/4/)) return "WED";
  if (raw.match(/5/)) return "THU";
  if (raw.match(/6/)) return "FRI";
  if (raw.match(/7/)) return "SAT";
  return "";
};

const resolveClockTimes = (item, lookups) => {
  const { byId, byNo } = lookups;
  const raw = item._raw ?? item;
  const slotStartId = item.slotStartId ?? raw.slotStartId ?? raw.slot_start_id;
  const slotEndId = item.slotEndId ?? raw.slotEndId ?? raw.slot_end_id;

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

  const slotStartNo = item.slotStart ?? item.slotStartNo ?? raw.slotStart ?? raw.slotStartNo;
  const slotEndNo = item.slotEnd ?? item.slotEndNo ?? raw.slotEnd ?? raw.slotEndNo;
  const range = slotStartNo != null && slotEndNo != null
    ? { startNo: Number(slotStartNo), endNo: Number(slotEndNo) }
    : parseSlotRange(item.slot ?? raw.slot);

  if (range) {
    const startSlot = byNo.get(Number(range.startNo));
    const endSlot = byNo.get(Number(range.endNo));
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

  return parseTimeRange(item.time ?? item.timeLabel ?? raw.time ?? raw.schedule);
};

const buildTimeAxis = (timeSlots, items, lookups) => {
  const sourceTimes = lookups.normalized.length
    ? lookups.normalized.map((slot) => ({
      startMinutes: parseTimeToMinutes(slot.startTime),
      endMinutes: parseTimeToMinutes(slot.endTime),
    }))
    : items.map((item) => resolveClockTimes(item, lookups)).filter(Boolean);

  let minStart = Infinity;
  let maxEnd = -Infinity;

  sourceTimes.forEach((time) => {
    if (time?.startMinutes != null) minStart = Math.min(minStart, time.startMinutes);
    if (time?.endMinutes != null) maxEnd = Math.max(maxEnd, time.endMinutes);
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

const getBlockPosition = (startMinutes, endMinutes, axisStartMinutes) => {
  const top = ((startMinutes - axisStartMinutes) / STEP_MINUTES) * ROW_HEIGHT_PX;
  const height = Math.max(
    ((endMinutes - startMinutes) / STEP_MINUTES) * ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  );
  return { top, height };
};

const normalizeSlot = (slot) => {
  const range = parseSlotRange(slot);
  return range ? `Tiết ${range.startNo}-${range.endNo}` : slot;
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

const CalendarBlock = ({ item, onItemClick }) => {
  const c = colorMap[item.color ?? "blue"] ?? colorMap.blue;
  const timeLabel = `${formatMinutes(item.startMinutes)} - ${formatMinutes(item.endMinutes)}`;

  return (
    <button
      type="button"
      onClick={() => onItemClick?.(item)}
      className={`absolute z-10 flex flex-col overflow-hidden rounded-md border border-l-[3px] px-1.5 py-1 text-left shadow-sm transition-shadow hover:z-20 hover:shadow-md ${c.wrap}`}
      style={{
        top: item.top,
        height: item.height,
        left: 3,
        right: 3,
        minHeight: 30,
      }}
      title={`${item.name} - ${timeLabel}`}
    >
      <p className={`truncate text-[11px] font-bold leading-tight ${c.title}`}>{item.name}</p>
      {item.subLabel && (
        <p className={`truncate font-mono text-[9px] leading-tight ${c.sub}`}>{item.subLabel}</p>
      )}
      {item.detail1 && (
        <p className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] leading-tight text-gray-600">
          <User className="h-2.5 w-2.5 shrink-0 text-gray-400" />
          {item.detail1}
        </p>
      )}
      {item.detail2 && (
        <p className="flex items-center gap-0.5 truncate text-[9px] leading-tight text-gray-600">
          <MapPin className="h-2.5 w-2.5 shrink-0 text-gray-400" />
          {item.detail2}
        </p>
      )}
      {item.badge && (
        <span className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-semibold leading-none ${c.sub}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          {item.badge}
        </span>
      )}
    </button>
  );
};

function BlockDetailModal({ item, onClose }) {
  const c = colorMap[item.color ?? "blue"] ?? colorMap.blue;
  const timeLabel = `${formatMinutes(item.startMinutes)} - ${formatMinutes(item.endMinutes)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`${c.wrap} flex items-start justify-between gap-4 border-l-4 px-5 py-4`}>
          <div>
            <p className={`text-sm font-bold ${c.title}`}>{item.name}</p>
            {item.subLabel && <p className={`mt-0.5 font-mono text-xs ${c.sub}`}>{item.subLabel}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {[
            item.detail1 && { icon: User, label: "Thông tin", value: item.detail1 },
            item.detail2 && { icon: MapPin, label: "Địa điểm", value: item.detail2 },
            { icon: Clock, label: "Giờ học", value: timeLabel },
            item.slot && { icon: Clock, label: "Tiết", value: item.slot },
            item.day && { icon: Clock, label: "Thứ", value: item.day },
          ].filter(Boolean).map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
                  <Icon className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">{row.label}</p>
                  <p className="text-xs font-semibold text-gray-800">{row.value}</p>
                </div>
              </div>
            );
          })}

          {item.badge && (
            <div className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold ${c.title}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              {item.badge}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleGridView({ items, timeSlots = [], onItemClick, compactDays = false }) {
  const [activeItem, setActiveItem] = useState(null);
  const lookups = useMemo(() => buildSlotLookups(timeSlots), [timeSlots]);
  const timeAxis = useMemo(() => buildTimeAxis(timeSlots, items, lookups), [timeSlots, items, lookups]);

  const daysToShow = useMemo(() => {
    if (!compactDays) return DAY_CODES;
    const used = new Set(items.map(normalizeDayCode).filter(Boolean));
    return DAY_CODES.filter((dayCode) => used.has(dayCode));
  }, [items, compactDays]);

  const itemsByDay = useMemo(() => {
    const grouped = Object.fromEntries(daysToShow.map((code) => [code, []]));

    items.forEach((item) => {
      const dayCode = normalizeDayCode(item);
      if (!grouped[dayCode]) return;

      const clock = resolveClockTimes(item, lookups);
      if (!clock) return;

      const position = getBlockPosition(
        clock.startMinutes,
        clock.endMinutes,
        timeAxis.startMinutes,
      );

      grouped[dayCode].push({
        ...item,
        dayCode,
        startMinutes: clock.startMinutes,
        endMinutes: clock.endMinutes,
        top: position.top,
        height: position.height,
      });
    });

    daysToShow.forEach((dayCode) => {
      grouped[dayCode].sort((a, b) => a.startMinutes - b.startMinutes);
    });

    return grouped;
  }, [items, lookups, timeAxis, daysToShow]);

  const handleClick = (item) => {
    setActiveItem(item);
    onItemClick?.(item);
  };

  if (timeAxis.gridHeight <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">Chưa có dữ liệu khung giờ để hiển thị lịch.</p>
      </div>
    );
  }

  const minWidth = TIME_AXIS_WIDTH * 2 + Math.max(daysToShow.length, 1) * 132;

  return (
    <Fragment>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-w-full" style={{ minWidth: `${minWidth}px` }}>
          <TimeAxisColumn ticks={timeAxis.ticks} side="left" />

          <div className="min-w-0 flex-1">
            <div
              className="sticky top-0 z-20 grid border-b border-gray-200 bg-gray-50"
              style={{
                height: DAY_HEADER_HEIGHT,
                gridTemplateColumns: `repeat(${daysToShow.length}, minmax(0, 1fr))`,
              }}
            >
              {daysToShow.map((dayCode) => (
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
                gridTemplateColumns: `repeat(${daysToShow.length}, minmax(0, 1fr))`,
              }}
            >
              {daysToShow.map((dayCode, dayIndex) => (
                <div
                  key={dayCode}
                  className={`relative ${dayIndex < daysToShow.length - 1 ? "border-r border-gray-200" : ""}`}
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
                      onItemClick={handleClick}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <TimeAxisColumn ticks={timeAxis.ticks} side="right" />
        </div>
      </div>

      {activeItem && <BlockDetailModal item={activeItem} onClose={() => setActiveItem(null)} />}
    </Fragment>
  );
}

export {
  ScheduleGridView,
  DAY_CODES as WEEK_DAYS,
  normalizeSlot,
};
