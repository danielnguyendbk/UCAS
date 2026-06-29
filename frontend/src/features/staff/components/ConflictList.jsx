import { useMemo, useState } from "react";
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle,
  RefreshCw,
  PencilLine,
  X,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";

const severityConfig = {
  HIGH: {
    label: "Nghiêm trọng",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  MEDIUM: {
    label: "Trung bình",
    className: "bg-orange-100 text-orange-700",
    icon: AlertTriangle,
  },
  LOW: {
    label: "Thấp",
    className: "bg-yellow-100 text-yellow-700",
    icon: Info,
  },
};

const typeConfig = {
  ROOM_TIME_CONFLICT: {
    label: "Trùng phòng",
    color: "bg-red-50 text-red-600 border-red-200",
  },
  ROOM_CONFLICT: {
    label: "Trùng phòng",
    color: "bg-red-50 text-red-600 border-red-200",
  },
  LECTURER_TIME_CONFLICT: {
    label: "Trùng giảng viên",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  LECTURER_CONFLICT: {
    label: "Trùng giảng viên",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  CAPACITY_EXCEEDED: {
    label: "Quá sức chứa",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  ROOM_TYPE_MISMATCH: {
    label: "Sai loại phòng",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  ROOM_INACTIVE_OR_DELETED: {
    label: "Phòng không hoạt động",
    color: "bg-gray-100 text-gray-600 border-gray-300",
  },
  INVALID_WEEK_RANGE: {
    label: "Sai khoảng tuần",
    color: "bg-red-50 text-red-600 border-red-200",
  },
  INVALID_TIME_RANGE: {
    label: "Sai khoảng tiết",
    color: "bg-red-50 text-red-600 border-red-200",
  },
  CALENDAR_BLOCK_CONFLICT: {
    label: "Trùng lịch nghỉ",
    color: "bg-rose-50 text-rose-600 border-rose-200",
  },
  UNASSIGNED: {
    label: "Chưa phân phòng",
    color: "bg-gray-100 text-gray-600 border-gray-300",
  },
};

const valueOf = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
};

const normalizeConflictType = (conflict) => {
  const rawType = valueOf(
    conflict?.conflictType,
    conflict?.type,
    conflict?.conflictReason,
    conflict?.reasonCode,
    conflict?.conflict_reason,
    "UNASSIGNED",
  );

  if (rawType === "ROOM_CONFLICT") return "ROOM_TIME_CONFLICT";
  if (rawType === "LECTURER_CONFLICT") return "LECTURER_TIME_CONFLICT";

  return rawType;
};

const inferSeverity = (conflict) => {
  const explicitSeverity = valueOf(conflict?.severity);

  if (severityConfig[explicitSeverity]) {
    return explicitSeverity;
  }

  const type = normalizeConflictType(conflict);

  if (
    [
      "ROOM_TIME_CONFLICT",
      "LECTURER_TIME_CONFLICT",
      "INVALID_WEEK_RANGE",
      "INVALID_TIME_RANGE",
      "CALENDAR_BLOCK_CONFLICT",
    ].includes(type)
  ) {
    return "HIGH";
  }

  if (
    [
      "CAPACITY_EXCEEDED",
      "ROOM_TYPE_MISMATCH",
      "ROOM_INACTIVE_OR_DELETED",
    ].includes(type)
  ) {
    return "MEDIUM";
  }

  return "LOW";
};

const getConflictTypeLabel = (conflict) => {
  const type = normalizeConflictType(conflict);

  return typeConfig[type]?.label || type;
};

const getConflictKey = (conflict, index) =>
  valueOf(
    conflict?.conflictId,
    conflict?.id,
    conflict?.scheduleId,
    conflict?.schedule_id,
    conflict?.sectionId,
    conflict?.section_id,
    `${conflict?.sectionCode || "section"}-${
      conflict?.slotNumber || conflict?.slotStartId || "slot"
    }-${index}`,
  );

const formatDay = (value) => {
  const day = valueOf(value);

  const dayMap = {
    MON: "Thứ 2",
    MONDAY: "Thứ 2",
    TUE: "Thứ 3",
    TUESDAY: "Thứ 3",
    WED: "Thứ 4",
    WEDNESDAY: "Thứ 4",
    THU: "Thứ 5",
    THURSDAY: "Thứ 5",
    FRI: "Thứ 6",
    FRIDAY: "Thứ 6",
    SAT: "Thứ 7",
    SATURDAY: "Thứ 7",
    SUN: "Chủ nhật",
    SUNDAY: "Chủ nhật",
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật",
  };

  return dayMap[day] || day || "—";
};

const formatSlot = (conflict) =>
  valueOf(
    conflict?.periodText,
    conflict?.slotText,
    conflict?.slotRange,
    conflict?.timeText,
    conflict?.slotNumber && `Ca ${conflict.slotNumber}`,
    conflict?.slotStartId &&
      conflict?.slotEndId &&
      `Tiết ${conflict.slotStartId}-${conflict.slotEndId}`,
    conflict?.startSlot &&
      conflict?.endSlot &&
      `Tiết ${conflict.startSlot}-${conflict.endSlot}`,
    "—",
  );

const getExistingNote = (conflict, localNotes, noteKey) =>
  valueOf(
    conflict?.staffNote,
    conflict?.adminNote,
    conflict?.note,
    conflict?.staff_note,
    conflict?.admin_note,
    localNotes[noteKey],
  );

const buildAdminNoteTemplate = (conflict) => {
  const courseCode = valueOf(
    conflict?.courseCode,
    conflict?.subjectCode,
    conflict?.courseId,
    "—",
  );
  const courseName = valueOf(
    conflict?.courseName,
    conflict?.subjectName,
    "—",
  );
  const sectionCode = valueOf(
    conflict?.sectionCode,
    conflict?.classCode,
    conflict?.className,
    "—",
  );
  const lecturerName = valueOf(
    conflict?.lecturerName,
    conflict?.teacherName,
    conflict?.proctorName,
    conflict?.instructorName,
    "—",
  );
  const currentRoom = valueOf(
    conflict?.roomCode,
    conflict?.classroomCode,
    conflict?.roomName,
    "Chưa phân",
  );
  const reason = valueOf(
    conflict?.description,
    conflict?.reason,
    conflict?.conflictReason,
    conflict?.conflict_reason,
    "—",
  );
  const conflictingWith = valueOf(
    conflict?.conflictingWith,
    conflict?.conflictWith,
    "",
  );

  return `[STAFF_SUGGESTION] Đề xuất xử lý xung đột thời khóa biểu

Học phần: ${courseCode} - ${courseName}
Lớp/Nhóm: ${sectionCode}
Giảng viên: ${lecturerName}
Thời gian: ${formatDay(conflict?.dayOfWeek || conflict?.day)} · ${formatSlot(conflict)}
Phòng hiện tại: ${currentRoom}

Loại xung đột: ${getConflictTypeLabel(conflict)}
Lý do: ${reason}${conflictingWith ? `\nXung đột với: ${conflictingWith}` : ""}

Đề xuất xử lý:
- Admin kiểm tra lại dữ liệu học phần/lịch học trong file import.
- Nếu do sức chứa, xem xét tách lớp hoặc điều chỉnh sĩ số/phòng yêu cầu.
- Nếu do lịch/giảng viên, điều chỉnh lịch học trước khi Staff phân phòng lại.
- Sau khi dữ liệu hợp lệ, Staff sẽ chọn phòng phù hợp hoặc chạy phân phòng tự động.`;
};

export const ConflictList = ({ conflicts = [], isLoading, onSaveAdminNote }) => {
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [localNotes, setLocalNotes] = useState({});
  const [isSavingNote, setIsSavingNote] = useState(false);

  const conflictItems = useMemo(() => {
    if (Array.isArray(conflicts)) return conflicts;
    if (Array.isArray(conflicts?.items)) return conflicts.items;
    if (Array.isArray(conflicts?.data)) return conflicts.data;

    return [];
  }, [conflicts]);

  const openAdminNoteModal = (conflict, index) => {
    const noteKey = getConflictKey(conflict, index);
    const existingNote = getExistingNote(conflict, localNotes, noteKey);

    setSelectedConflict({
      ...conflict,
      __noteKey: noteKey,
    });

    setNoteText(existingNote || buildAdminNoteTemplate(conflict));
    setNoteModalOpen(true);
  };

  const closeAdminNoteModal = () => {
    if (isSavingNote) return;

    setNoteModalOpen(false);
    setSelectedConflict(null);
    setNoteText("");
  };

  const handleSaveNote = async () => {
    if (!selectedConflict || !noteText.trim()) return;

    const finalNote = noteText.trim();

    setIsSavingNote(true);

    try {
      if (typeof onSaveAdminNote === "function") {
        await onSaveAdminNote(selectedConflict, finalNote);
      }

      setLocalNotes((current) => ({
        ...current,
        [selectedConflict.__noteKey]: finalNote,
      }));

      setNoteModalOpen(false);
      setSelectedConflict(null);
      setNoteText("");
    } catch (error) {
      window.alert(error?.message || "Không lưu được ghi chú cho Admin.");
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (conflictItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
        <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
        <p className="font-semibold text-gray-700">Không phát hiện xung đột</p>
        <p className="mt-1 text-sm text-gray-400">
          Toàn bộ lịch phân phòng hợp lệ hoặc chưa được phân.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {conflictItems.map((conflict, index) => {
          const severityKey = inferSeverity(conflict);
          const severity = severityConfig[severityKey] || severityConfig.MEDIUM;
          const SeverityIcon = severity.icon;
          const conflictType = normalizeConflictType(conflict);
          const typeInfo = typeConfig[conflictType] || {
            label: conflictType,
            color: "bg-gray-100 text-gray-600 border-gray-300",
          };
          const reason = valueOf(
            conflict?.description,
            conflict?.reason,
            conflict?.conflictReason,
            conflict?.conflict_reason,
            "—",
          );
          const noteKey = getConflictKey(conflict, index);
          const hasNote = Boolean(getExistingNote(conflict, localNotes, noteKey));

          return (
            <Card
              key={noteKey}
              className={`border shadow-sm ring-1 ${
                severityKey === "HIGH" ? "ring-red-200" : "ring-orange-200"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      severityKey === "HIGH" ? "bg-red-100" : "bg-orange-100"
                    }`}
                  >
                    <SeverityIcon
                      className={`h-5 w-5 ${
                        severityKey === "HIGH"
                          ? "text-red-600"
                          : "text-orange-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={`${severity.className} text-xs`}>
                        {severity.label}
                      </Badge>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </span>

                      <span className="text-xs text-gray-500">
                        {formatDay(conflict?.dayOfWeek || conflict?.day)} ·{" "}
                        {formatSlot(conflict)}
                      </span>

                      {valueOf(conflict?.roomCode, conflict?.classroomCode) && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Phòng{" "}
                          {valueOf(conflict?.roomCode, conflict?.classroomCode)}
                        </span>
                      )}

                      {hasNote && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Đã có ghi chú
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
                      <div className="space-y-2">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">
                            Lớp bị ảnh hưởng:
                          </span>{" "}
                          {valueOf(
                            conflict?.sectionCode,
                            conflict?.classCode,
                            "—",
                          )}{" "}
                          -{" "}
                          {valueOf(
                            conflict?.courseName,
                            conflict?.subjectName,
                            "—",
                          )}
                        </div>

                        {valueOf(
                          conflict?.conflictingWith,
                          conflict?.conflictWith,
                        ) && (
                          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            <span className="font-semibold text-gray-800">
                              Xung đột với:
                            </span>{" "}
                            {valueOf(
                              conflict?.conflictingWith,
                              conflict?.conflictWith,
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          Lý do xung đột
                        </p>
                        <p
                          className="max-h-[64px] overflow-hidden break-words text-xs leading-5 text-amber-900"
                          title={reason}
                        >
                          {reason}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => openAdminNoteModal(conflict, index)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Ghi chú Admin
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ghi chú cho Admin
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Nội dung báo cáo xung đột đã được tự động tạo sẵn. Staff có
                  thể chỉnh sửa trước khi lưu ghi chú.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAdminNoteModal}
                disabled={isSavingNote}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedConflict && (
              <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
                  {valueOf(selectedConflict?.courseCode, "—")} ·{" "}
                  {valueOf(selectedConflict?.courseName, "—")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {valueOf(selectedConflict?.sectionCode, "—")} ·{" "}
                  {getConflictTypeLabel(selectedConflict)}
                </p>
              </div>
            )}

            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              className="min-h-[280px] w-full resize-y rounded-md border border-gray-300 px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Nhập ghi chú cho Admin..."
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSavingNote}
                onClick={closeAdminNoteModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={isSavingNote || !noteText.trim()}
                onClick={handleSaveNote}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingNote && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConflictList;
