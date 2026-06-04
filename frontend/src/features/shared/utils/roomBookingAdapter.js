import { EQUIPMENT_OPTIONS, PURPOSE_OPTIONS } from "../constants/bookingFormConstants";

const getTimeSlotId = (slot) => Number(slot?.slotId ?? slot?.id ?? 0);
const getTimeSlotNo = (slot) =>
  Number(slot?.slotNo ?? slot?.slot_no ?? slot?.slotNumber ?? 0);

const normalizeTime = (value) => String(value || "").slice(0, 5);

export const resolveSlotIds = (timeSlots, startTime, endTime) => {
  const sorted = [...timeSlots].sort((a, b) => getTimeSlotNo(a) - getTimeSlotNo(b));
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);

  let startSlot = sorted.find((slot) => normalizeTime(slot.startTime) === start);
  let endSlot = sorted.find((slot) => normalizeTime(slot.endTime) === end);

  if (!startSlot) {
    startSlot = sorted.find((slot) => normalizeTime(slot.startTime) >= start);
  }
  if (!endSlot) {
    endSlot = [...sorted]
      .reverse()
      .find((slot) => normalizeTime(slot.endTime) <= end);
  }

  return {
    slotStartId: startSlot ? getTimeSlotId(startSlot) : null,
    slotEndId: endSlot ? getTimeSlotId(endSlot) : null,
    startSlot,
    endSlot,
  };
};

export const getPurposeConfig = (role, purposeValue) =>
  PURPOSE_OPTIONS[role]?.find((item) => item.value === purposeValue);

export const mapRoomTypeToBackend = (roomType, customRoomType) => {
  if (roomType === "OTHER") {
    return customRoomType?.trim() ? "LECTURE" : "LECTURE";
  }
  return roomType;
};

export const buildPurposeNote = ({
  role,
  title,
  purposeValue,
  customPurpose,
  description,
  equipment,
  customEquipment,
  customRoomType,
}) => {
  const purposeConfig = getPurposeConfig(role, purposeValue);
  const purposeLabel = purposeConfig?.label || purposeValue;
  const equipmentLabels = equipment
    .filter((value) => value !== "OTHER")
    .map(
      (value) =>
        EQUIPMENT_OPTIONS.find((item) => item.value === value)?.label || value,
    );

  const lines = [
    `[${title.trim()}]`,
    `Mục đích: ${purposeLabel}${customPurpose?.trim() ? ` — ${customPurpose.trim()}` : ""}`,
    description.trim(),
  ];

  if (equipment.length > 0) {
    const equipmentText = [
      ...equipmentLabels,
      ...(equipment.includes("OTHER") && customEquipment?.trim()
        ? [`Khác: ${customEquipment.trim()}`]
        : []),
    ].join(", ");
    lines.push(`Thiết bị cần: ${equipmentText}`);
  }

  if (customRoomType?.trim()) {
    lines.push(`Loại phòng yêu cầu: ${customRoomType.trim()}`);
  }

  return lines.filter(Boolean).join("\n");
};

export const buildStudentPayload = (form, timeSlots) => {
  const purposeConfig = getPurposeConfig("student", form.purpose);
  const { slotStartId, slotEndId } = resolveSlotIds(
    timeSlots,
    form.startTime,
    form.endTime,
  );

  return {
    semesterId: Number(form.semesterId),
    requestType: purposeConfig?.requestType || "OTHER",
    clubCode:
      purposeConfig?.requestType === "CLUB_ACTIVITY"
        ? form.clubCode.trim().toUpperCase()
        : null,
    bookingDate: form.bookingDate,
    slotStartId: Number(slotStartId),
    slotEndId: Number(slotEndId),
    expectedAttendees: Number(form.expectedAttendees),
    preferredClassroomId: Number(form.preferredClassroomId),
    requestedRoomType: mapRoomTypeToBackend(form.roomType, form.customRoomType),
    purposeNote: buildPurposeNote({
      role: "student",
      title: form.title,
      purposeValue: form.purpose,
      customPurpose: form.customPurpose,
      description: form.description,
      equipment: form.equipment,
      customEquipment: form.customEquipment,
      customRoomType: form.customRoomType,
    }),
  };
};

export const buildLecturerPayload = (form, timeSlots) => {
  const purposeConfig = getPurposeConfig("lecturer", form.purpose);
  const requestType = purposeConfig?.requestType || "OTHER";
  const { slotStartId, slotEndId } = resolveSlotIds(
    timeSlots,
    form.startTime,
    form.endTime,
  );

  return {
    semesterId: Number(form.semesterId),
    requestType,
    clubCode:
      requestType === "CLUB_ACTIVITY"
        ? form.clubCode.trim().toUpperCase()
        : null,
    sectionId:
      requestType === "MAKEUP_CLASS" ? Number(form.sectionId) : null,
    bookingDate: form.bookingDate,
    slotStartId: Number(slotStartId),
    slotEndId: Number(slotEndId),
    expectedAttendees: Number(form.expectedAttendees),
    preferredClassroomId: Number(form.preferredClassroomId),
    purposeNote: buildPurposeNote({
      role: "lecturer",
      title: form.title,
      purposeValue: form.purpose,
      customPurpose: form.customPurpose,
      description: form.description,
      equipment: form.equipment,
      customEquipment: form.customEquipment,
      customRoomType: form.customRoomType,
    }),
  };
};

export { getTimeSlotId, getTimeSlotNo, normalizeTime };
