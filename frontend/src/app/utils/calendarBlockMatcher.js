const DAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const normalizeText = (value) => String(value ?? "").trim().toUpperCase();

const toNumber = (value) => {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (value) => {
  const date = toDate(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfMonday = (value) => {
  const date = startOfDay(value);
  if (!date) return null;
  const offset = date.getDay() === 0 ? -6 : 1 - date.getDay();
  return addDays(date, offset);
};

const getDayIndex = (dayCode) => {
  const code = normalizeText(dayCode);
  if (code === "MON" || code.includes("2")) return 0;
  if (code === "TUE" || code.includes("3")) return 1;
  if (code === "WED" || code.includes("4")) return 2;
  if (code === "THU" || code.includes("5")) return 3;
  if (code === "FRI" || code.includes("6")) return 4;
  if (code === "SAT" || code.includes("7")) return 5;
  if (code === "SUN" || code.includes("CN") || code.includes("CHU")) return 6;
  return null;
};

const normalizeDayCode = (value) => {
  const code = normalizeText(value);
  if (DAY_CODES.includes(code)) return code;
  const index = getDayIndex(code);
  if (index == null) return "";
  return DAY_CODES[index];
};

const normalizeSemester = (semester) => {
  if (!semester) return null;
  return {
    id: toNumber(semester.id ?? semester.semesterId ?? semester.semester_id),
    startDate: toDate(semester.startDate ?? semester.start_date),
    endDate: toDate(semester.endDate ?? semester.end_date),
    raw: semester,
  };
};

const normalizeCalendarBlock = (block) => {
  if (!block) return null;
  const teachingAllowed = block.teachingAllowed ?? block.teaching_allowed;
  return {
    id: toNumber(block.id ?? block.calendarBlockId ?? block.calendar_block_id),
    semesterId: toNumber(block.semesterId ?? block.semester_id),
    title: String(block.title ?? block.reason ?? block.note ?? block.notes ?? "").trim(),
    notes: String(block.notes ?? block.note ?? "").trim(),
    type: normalizeText(block.type ?? block.blockType ?? block.block_type),
    teachingAllowed: teachingAllowed === true || teachingAllowed === 1 || teachingAllowed === "1",
    startDate: startOfDay(block.startDate ?? block.start_date),
    endDate: startOfDay(block.endDate ?? block.end_date),
    dayCode: normalizeDayCode(block.dayCode ?? block.dayOfWeek ?? block.day_of_week),
    slotStart: toNumber(block.slotStart ?? block.slot_start ?? block.slotStartNo ?? block.slot_start_no),
    slotEnd: toNumber(block.slotEnd ?? block.slot_end ?? block.slotEndNo ?? block.slot_end_no),
    raw: block,
  };
};

const isBlockingCalendarBlock = (block) => {
  if (!block) return false;
  if (block.teachingAllowed === false) return true;
  return ["HOLIDAY", "BREAK", "EXAM_WEEK"].includes(block.type);
};

const rangesOverlap = (startA, endA, startB, endB) => {
  if (startA == null || endA == null || startB == null || endB == null) return false;
  return Number(startA) <= Number(endB) && Number(startB) <= Number(endA);
};

const resolveLessonDayCode = (lesson) =>
  normalizeDayCode(
    lesson?.dayCode ??
    lesson?.day_code ??
    lesson?.day ??
    lesson?.dayOfWeek ??
    lesson?.day_of_week,
  );

const resolveLessonSlotRange = (lesson) => {
  const start = toNumber(
    lesson?.slotStart ??
    lesson?.slot_start ??
    lesson?.slotStartNo ??
    lesson?.slot_start_no ??
    lesson?.slotStartId ??
    lesson?.slot_start_id,
  );
  const end = toNumber(
    lesson?.slotEnd ??
    lesson?.slot_end ??
    lesson?.slotEndNo ??
    lesson?.slot_end_no ??
    lesson?.slotEndId ??
    lesson?.slot_end_id ??
    start,
  );

  if (start == null || end == null) return null;
  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
};

const resolveLessonWeekRange = (lesson, fallbackWeekNo) => {
  const fromWeek = toNumber(
    lesson?.fromWeekNo ??
    lesson?.from_week_no ??
    lesson?.weekNo ??
    lesson?.week_no ??
    fallbackWeekNo,
  );
  const toWeek = toNumber(lesson?.toWeekNo ?? lesson?.to_week_no ?? fromWeek);

  if (fromWeek == null || toWeek == null) return null;
  return {
    fromWeek: Math.min(fromWeek, toWeek),
    toWeek: Math.max(fromWeek, toWeek),
  };
};

const getLessonDateForWeek = (semester, weekNo, dayCode) => {
  const normalizedSemester = normalizeSemester(semester);
  const dayIndex = getDayIndex(dayCode);
  if (!normalizedSemester?.startDate || !Number.isFinite(Number(weekNo)) || dayIndex == null) {
    return null;
  }

  const weekStart = startOfMonday(normalizedSemester.startDate);
  if (!weekStart) return null;

  return addDays(weekStart, (Number(weekNo) - 1) * 7 + dayIndex);
};

const findCalendarBlockForLesson = (lesson, calendarBlocks = [], context = {}) => {
  const lessonDayCode = resolveLessonDayCode(lesson);
  const lessonSlots = resolveLessonSlotRange(lesson);
  const semester = normalizeSemester(context.semester);
  const selectedWeekNo = toNumber(context.weekNo);
  const lessonSemesterId = toNumber(lesson?.semesterId ?? lesson?.semester_id);

  for (const rawBlock of calendarBlocks) {
    const block = normalizeCalendarBlock(rawBlock);
    if (!block || !isBlockingCalendarBlock(block)) continue;
    if (lessonSemesterId != null && block.semesterId != null && lessonSemesterId !== block.semesterId) {
      continue;
    }

    if (block.dayCode && lessonDayCode && block.dayCode !== lessonDayCode) {
      continue;
    }

    if (block.slotStart != null || block.slotEnd != null) {
      if (!lessonSlots || !rangesOverlap(lessonSlots.start, lessonSlots.end, block.slotStart, block.slotEnd)) {
        continue;
      }
    }

    if (block.startDate || block.endDate) {
      const lessonDate = getLessonDateForWeek(semester, selectedWeekNo, lessonDayCode);
      if (!lessonDate) continue;
      const normalizedLessonDate = startOfDay(lessonDate);
      if (block.startDate && normalizedLessonDate < block.startDate) continue;
      if (block.endDate && normalizedLessonDate > block.endDate) continue;
    }

    return block;
  }

  return null;
};

const decorateItemsWithCalendarBlocks = (items = [], calendarBlocks = [], context = {}) =>
  items.map((item) => ({
    ...item,
    calendarBlock: findCalendarBlockForLesson(item, calendarBlocks, context),
  }));

export {
  DAY_CODES,
  addDays,
  decorateItemsWithCalendarBlocks,
  findCalendarBlockForLesson,
  getLessonDateForWeek,
  isBlockingCalendarBlock,
  normalizeCalendarBlock,
  normalizeDayCode,
  normalizeSemester,
  rangesOverlap,
  resolveLessonDayCode,
  resolveLessonSlotRange,
  resolveLessonWeekRange,
  startOfMonday,
};
