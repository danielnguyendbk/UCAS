import { useState } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  getCourseCode,
  SEVERITY_LABELS,
} from "@/features/staff/utils/allocationHelpers";

const severityClass = (severity) => {
  if (severity === "HIGH") return "bg-red-100 text-red-700";
  if (severity === "LOW") return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
};

export const ConflictActionTable = ({
  conflicts,
  allocations,
  isLoading,
  onManualAssign,
}) => {
  const [detailConflict, setDetailConflict] = useState(null);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);

  const findAllocation = (conflict) =>
    allocations.find(
      (row) =>
        (conflict.scheduleId && Number(row.scheduleId) === Number(conflict.scheduleId)) ||
        (row.sectionCode === conflict.sectionCode &&
          row.dayOfWeek === conflict.dayOfWeek &&
          Number(row.slotNumber) === Number(conflict.slotNumber)),
    );

  const openPlaceholder = () => setPlaceholderOpen(true);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">
                  Mã MH
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Tên môn học
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Nhóm/Tổ
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Lớp hành chính
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Giảng viên
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">
                  SV
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Lịch học
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Lý do xung đột
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">
                  Mức độ
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-center">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts?.map((conflict, index) => {
                const allocation = findAllocation(conflict);
                return (
                  <TableRow
                    key={`${conflict.sectionCode}-${conflict.slotNumber}-${index}`}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <TableCell className="text-xs font-mono font-bold text-blue-700">
                      {getCourseCode(allocation || conflict)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-800">
                      {conflict.courseName}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {conflict.sectionCode || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">—</TableCell>
                    <TableCell className="text-xs text-gray-500">—</TableCell>
                    <TableCell className="text-xs text-center text-gray-700">
                      {allocation?.enrolledCount ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                      {formatSchedule(conflict)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700 max-w-[220px]">
                      <p className="font-semibold text-gray-800">
                        {CONFLICT_TYPE_LABELS[conflict.conflictType] || conflict.conflictType || "—"}
                      </p>
                      {conflict.description && (
                        <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                          {conflict.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${severityClass(conflict.severity)} hover:${severityClass(conflict.severity)} text-[11px]`}
                      >
                        {SEVERITY_LABELS[conflict.severity] || conflict.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600"
                          onClick={() => setDetailConflict(conflict)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Chi tiết
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            if (allocation && onManualAssign) {
                              onManualAssign(allocation);
                            } else {
                              openPlaceholder();
                            }
                          }}
                        >
                          Chọn phòng
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={openPlaceholder}
                        >
                          Tách lớp
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={openPlaceholder}
                        >
                          Gửi Admin
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!conflicts || conflicts.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-gray-500"
                  >
                    Không phát hiện xung đột.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={Boolean(detailConflict)}
        onOpenChange={(open) => !open && setDetailConflict(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết xung đột</DialogTitle>
          </DialogHeader>
          {detailConflict && (
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Lớp học phần:</span>{" "}
                {detailConflict.sectionCode} — {detailConflict.courseName}
              </p>
              <p>
                <span className="font-semibold">Lịch học:</span>{" "}
                {formatSchedule(detailConflict)}
              </p>
              <p>
                <span className="font-semibold">Loại xung đột:</span>{" "}
                {CONFLICT_TYPE_LABELS[detailConflict.conflictType] ||
                  detailConflict.conflictType}
              </p>
              <p>
                <span className="font-semibold">Mức độ:</span>{" "}
                {SEVERITY_LABELS[detailConflict.severity] ||
                  detailConflict.severity}
              </p>
              <p>
                <span className="font-semibold">Mô tả:</span>{" "}
                {detailConflict.description}
              </p>
              {detailConflict.conflictingWith && (
                <p>
                  <span className="font-semibold">Xung đột với:</span>{" "}
                  {detailConflict.conflictingWith}
                </p>
              )}
              {detailConflict.roomCode && (
                <p>
                  <span className="font-semibold">Phòng:</span>{" "}
                  {detailConflict.roomCode}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={placeholderOpen} onOpenChange={setPlaceholderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông báo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Chức năng đang phát triển
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
