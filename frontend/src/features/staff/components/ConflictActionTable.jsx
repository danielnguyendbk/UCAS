import { useState } from "react";
import { Eye, FileWarning, MessageSquareText, RefreshCw } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  CONFLICT_TYPE_LABELS,
  formatSchedule,
  getConflictSuggestion,
  getCourseCode,
  SEVERITY_LABELS,
} from "@/features/staff/utils/allocationHelpers";
import { getDisplayClassCodes, getDisplaySectionCode } from "@/utils/sectionDisplay";

const ADMIN_NOTE_MAX_LENGTH = 255;

const severityClass = (severity) => {
  if (severity === "HIGH") return "bg-red-100 text-red-700";
  if (severity === "LOW") return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
};

const valueOrDash = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const getAdministrativeClass = (allocation, conflict) =>
  getDisplayClassCodes({ ...conflict, ...allocation }, "");

const buildAdminNoteTemplate = (conflict, allocation) => {
  const merged = { ...allocation, ...conflict };
  const conflictType =
    CONFLICT_TYPE_LABELS[conflict.conflictType] || valueOrDash(conflict.conflictType);
  const reason = valueOrDash(conflict.description || allocation?.conflictReason);
  const suggestion = getConflictSuggestion(conflict.conflictType);

  const note = [
    `[STAFF_SUGGESTION] ${getCourseCode(allocation || conflict)} - ${valueOrDash(conflict.courseName)}`,
    `Lich: ${formatSchedule(merged)}. Phong: ${valueOrDash(conflict.roomCode || allocation?.assignedRoom)}.`,
    `Loi: ${conflictType}. ${reason}`,
    `De xuat: ${suggestion}`,
  ].join("\n");

  return note.length > ADMIN_NOTE_MAX_LENGTH
    ? `${note.slice(0, ADMIN_NOTE_MAX_LENGTH - 3)}...`
    : note;
};

export const ConflictActionTable = ({
  conflicts,
  allocations,
  isLoading,
  error,
  onRetry,
  onManualAssign,
  onSaveNote,
  readOnly = false,
}) => {
  const [detailConflict, setDetailConflict] = useState(null);
  const [noteConflict, setNoteConflict] = useState(null);
  const [noteValue, setNoteValue] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const staffRoomConflictTypes = new Set([
    "UNASSIGNED",
    "ROOM_TIME_CONFLICT",
    "ROOM_TYPE_MISMATCH",
    "ROOM_INACTIVE_OR_DELETED",
    "CAPACITY_EXCEEDED",
    "ROOM_CONFLICT",
  ]);

  const findAllocation = (conflict) =>
    allocations.find(
      (row) =>
        (conflict.scheduleId && Number(row.scheduleId) === Number(conflict.scheduleId)) ||
        (row.sectionCode === conflict.sectionCode &&
          row.dayOfWeek === conflict.dayOfWeek &&
          Number(row.slotNumber) === Number(conflict.slotNumber)),
    );

  const detailAllocation = detailConflict
    ? findAllocation(detailConflict)
    : null;

  const openAdminNote = (conflict, allocation) => {
    const existingNote = allocation?.note || conflict.note || conflict.adminNote || conflict.staffNote || "";
    setNoteConflict({ conflict, allocation });
    setNoteValue(existingNote || buildAdminNoteTemplate(conflict, allocation));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center">
        <FileWarning className="mb-2 h-7 w-7 text-red-500" />
        <p className="text-sm font-semibold text-red-800">Không thể tải danh sách xung đột</p>
        <p className="mt-1 text-xs text-red-600">{error.message || error}</p>
        {onRetry && (
          <Button className="mt-4" size="sm" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[1120px] table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Mã HP</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Tên môn học</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-gray-600">Nhóm/Tổ</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Lớp hành chính</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Giảng viên</TableHead>
                <TableHead className="w-[60px] text-center text-xs font-semibold text-gray-600">SV</TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-gray-600">Lịch học</TableHead>
                <TableHead className="w-[260px] text-xs font-semibold text-gray-600">Lý do xung đột</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-gray-600">Mức độ</TableHead>
                <TableHead className="w-[190px] text-center text-xs font-semibold text-gray-600">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts?.map((conflict, index) => {
                const allocation = findAllocation(conflict);
                const isStaffRoomConflict = staffRoomConflictTypes.has(conflict.conflictType);
                const canAssign = Boolean(isStaffRoomConflict && allocation && onManualAssign && !readOnly);
                const reason = valueOrDash(conflict.description || allocation?.conflictReason);

                return (
                  <TableRow
                    key={`${conflict.scheduleId || conflict.sectionCode}-${conflict.conflictType}-${index}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="break-words text-xs font-bold text-blue-700">
                      {getCourseCode(allocation || conflict)}
                    </TableCell>
                    <TableCell className="break-words text-xs font-medium text-gray-800">
                      {valueOrDash(conflict.courseName)}
                    </TableCell>
                    <TableCell className="break-words text-xs text-gray-600">
                      {getDisplaySectionCode(conflict)}
                    </TableCell>
                    <TableCell className="break-words text-xs text-gray-500">
                      {valueOrDash(getAdministrativeClass(allocation, conflict))}
                    </TableCell>
                    <TableCell className="break-words text-xs text-gray-600">
                      {valueOrDash(conflict.lecturerName || allocation?.lecturerName)}
                    </TableCell>
                    <TableCell className="text-center text-xs text-gray-700">
                      {valueOrDash(conflict.enrolledCount ?? allocation?.enrolledCount)}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words text-xs text-gray-600">
                      {formatSchedule({ ...allocation, ...conflict })}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      <div className="max-w-[250px] whitespace-normal break-words">
                        <p className="font-semibold text-gray-800">
                          {CONFLICT_TYPE_LABELS[conflict.conflictType] || valueOrDash(conflict.conflictType)}
                        </p>
                        <p
                          className="mt-0.5 max-h-[52px] overflow-hidden text-[11px] leading-4 text-gray-500"
                          title={reason}
                        >
                          {reason}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${severityClass(conflict.severity)} text-[11px]`}>
                        {SEVERITY_LABELS[conflict.severity] || valueOrDash(conflict.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[170px] flex-wrap items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600"
                          onClick={() => setDetailConflict(conflict)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Chi tiết
                        </Button>

                        {isStaffRoomConflict ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={!canAssign}
                            title={readOnly ? "Thời khóa biểu đang ở chế độ chỉ xem" : !allocation ? "Không tìm thấy lịch tương ứng" : undefined}
                            onClick={() => onManualAssign(allocation)}
                          >
                            Chọn phòng
                          </Button>
                        ) : (
                          <Badge className="border-0 bg-amber-100 text-amber-800">Cần Admin xử lý</Badge>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={!onSaveNote || !allocation?.scheduleId || readOnly}
                          title={
                            readOnly
                              ? "Thời khóa biểu đang ở chế độ chỉ xem"
                              : !allocation?.scheduleId
                                ? "Không tìm thấy lịch tương ứng để lưu ghi chú"
                                : undefined
                          }
                          onClick={() => openAdminNote(conflict, allocation)}
                        >
                          <MessageSquareText className="mr-1 h-3 w-3" />
                          Ghi chú Admin
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {(!conflicts || conflicts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-gray-500">
                    Không phát hiện xung đột phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(detailConflict)} onOpenChange={(open) => !open && setDetailConflict(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết xung đột</DialogTitle>
            <DialogDescription>Thông tin dùng để xác định hướng xử lý phù hợp.</DialogDescription>
          </DialogHeader>
          {detailConflict && (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                {[
                  ["Mã học phần", getCourseCode(detailAllocation || detailConflict)],
                  ["Tên môn", detailConflict.courseName],
                  ["Nhóm/Tổ", getDisplaySectionCode(detailConflict)],
                  ["Lớp hành chính", getAdministrativeClass(detailAllocation, detailConflict)],
                  ["Giảng viên", detailConflict.lecturerName || detailAllocation?.lecturerName],
                  ["Sĩ số", detailConflict.enrolledCount ?? detailAllocation?.enrolledCount],
                  ["Thời gian học", formatSchedule({ ...detailAllocation, ...detailConflict })],
                  ["Phòng hiện tại", detailConflict.roomCode || detailAllocation?.assignedRoom],
                  ["Loại xung đột", CONFLICT_TYPE_LABELS[detailConflict.conflictType] || detailConflict.conflictType],
                  ["Mức độ", SEVERITY_LABELS[detailConflict.severity] || detailConflict.severity],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="mt-0.5 font-medium text-gray-900">{valueOrDash(value)}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lý do</p>
                <p className="mt-1 whitespace-pre-wrap break-words">
                  {valueOrDash(detailConflict.description || detailAllocation?.conflictReason)}
                </p>
                {detailConflict.conflictingWith && (
                  <p className="mt-1 text-gray-500">Xung đột với: {detailConflict.conflictingWith}</p>
                )}
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <p className="text-xs font-semibold uppercase tracking-wide">Gợi ý xử lý</p>
                <p className="mt-1">{getConflictSuggestion(detailConflict.conflictType)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noteConflict)} onOpenChange={(open) => !open && setNoteConflict(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ghi chú cho Admin</DialogTitle>
            <DialogDescription>
              Nội dung đã được soạn sẵn từ xung đột hiện tại. Staff có thể chỉnh sửa trước khi lưu.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
            className="min-h-[260px] font-mono text-xs leading-5"
            maxLength={ADMIN_NOTE_MAX_LENGTH}
            placeholder="Nhập ghi chú cho Admin..."
          />
          <p className="text-right text-xs text-gray-500">
            {noteValue.length}/{ADMIN_NOTE_MAX_LENGTH}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={isSavingNote} onClick={() => setNoteConflict(null)}>
              Hủy
            </Button>
            <Button
              disabled={isSavingNote || !noteValue.trim() || noteValue.length > ADMIN_NOTE_MAX_LENGTH}
              onClick={async () => {
                if (!noteConflict?.allocation?.scheduleId || !onSaveNote) return;

                setIsSavingNote(true);
                const saved = await onSaveNote(noteConflict.allocation.scheduleId, noteValue.trim());
                setIsSavingNote(false);

                if (saved) setNoteConflict(null);
              }}
            >
              {isSavingNote && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Lưu ghi chú
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
