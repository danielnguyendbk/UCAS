import { useMemo, useState } from "react";
import { Copy, Download, Eye, FileWarning, RefreshCw } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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

const severityClass = (severity) => {
  if (severity === "HIGH") return "bg-red-100 text-red-700";
  if (severity === "LOW") return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
};

const valueOrDash = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export const ConflictActionTable = ({
  conflicts,
  reportConflicts = conflicts,
  allocations,
  isLoading,
  error,
  onRetry,
  onManualAssign,
  readOnly = false,
}) => {
  const [detailConflict, setDetailConflict] = useState(null);
  const [reportConflict, setReportConflict] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

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

  const reportText = useMemo(() => {
    if (!reportConflict) return "";
    const allocation = findAllocation(reportConflict);
    return [
      "BÁO CÁO XUNG ĐỘT THỜI KHÓA BIỂU",
      `Học phần: ${getCourseCode(allocation || reportConflict)} — ${valueOrDash(reportConflict.courseName)}`,
      `Nhóm/Tổ: ${valueOrDash(reportConflict.sectionCode)}`,
      `Lớp hành chính: ${valueOrDash(allocation?.administrativeClass || reportConflict.administrativeClass || reportConflict.sectionCode)}`,
      `Giảng viên: ${valueOrDash(reportConflict.lecturerName || allocation?.lecturerName)}`,
      `Thời gian: ${formatSchedule({ ...allocation, ...reportConflict })}`,
      `Phòng hiện tại: ${valueOrDash(reportConflict.roomCode || allocation?.assignedRoom)}`,
      `Loại xung đột: ${CONFLICT_TYPE_LABELS[reportConflict.conflictType] || valueOrDash(reportConflict.conflictType)}`,
      `Lý do: ${valueOrDash(reportConflict.description || allocation?.conflictReason)}`,
      `Gợi ý xử lý: ${getConflictSuggestion(reportConflict.conflictType)}`,
      "",
      "Admin xử lý bằng màn Import thời khóa biểu hoặc chỉnh dữ liệu học phần.",
    ].join("\n");
  }, [reportConflict, allocations]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyStatus("Đã sao chép nội dung báo cáo.");
    } catch {
      setCopyStatus("Không thể sao chép tự động. Vui lòng chọn và sao chép nội dung.");
    }
  };

  const downloadCsv = () => {
    const header = [
      "Mã học phần",
      "Tên môn học",
      "Nhóm/Tổ",
      "Thời gian",
      "Phòng hiện tại",
      "Loại xung đột",
      "Lý do",
      "Gợi ý xử lý",
    ];
    const rows = (reportConflicts || []).map((conflict) => {
      const allocation = findAllocation(conflict);
      return [
        getCourseCode(allocation || conflict),
        conflict.courseName,
        conflict.sectionCode,
        formatSchedule({ ...allocation, ...conflict }),
        conflict.roomCode || allocation?.assignedRoom,
        CONFLICT_TYPE_LABELS[conflict.conflictType] || conflict.conflictType,
        conflict.description || allocation?.conflictReason,
        getConflictSuggestion(conflict.conflictType),
      ].map(csvCell).join(",");
    });
    const blob = new Blob([`\uFEFF${[header.map(csvCell).join(","), ...rows].join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bao-cao-xung-dot-thoi-khoa-bieu.csv";
    link.click();
    URL.revokeObjectURL(url);
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600">Mã HP</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Tên môn học</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Nhóm/Tổ</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Lớp hành chính</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Giảng viên</TableHead>
                <TableHead className="text-center text-xs font-semibold text-gray-600">SV</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Lịch học</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Lý do xung đột</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Mức độ</TableHead>
                <TableHead className="text-center text-xs font-semibold text-gray-600">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts?.map((conflict, index) => {
                const allocation = findAllocation(conflict);
                const canAssign = Boolean(allocation && onManualAssign && !readOnly);
                return (
                  <TableRow
                    key={`${conflict.scheduleId || conflict.sectionCode}-${conflict.conflictType}-${index}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="text-xs font-bold text-blue-700">
                      {getCourseCode(allocation || conflict)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-800">
                      {valueOrDash(conflict.courseName)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {valueOrDash(conflict.sectionCode)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {valueOrDash(allocation?.administrativeClass || conflict.administrativeClass || conflict.sectionCode)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {valueOrDash(conflict.lecturerName || allocation?.lecturerName)}
                    </TableCell>
                    <TableCell className="text-center text-xs text-gray-700">
                      {valueOrDash(conflict.enrolledCount ?? allocation?.enrolledCount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-600">
                      {formatSchedule({ ...allocation, ...conflict })}
                    </TableCell>
                    <TableCell className="max-w-[240px] text-xs text-gray-700">
                      <p className="font-semibold text-gray-800">
                        {CONFLICT_TYPE_LABELS[conflict.conflictType] || valueOrDash(conflict.conflictType)}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                        {valueOrDash(conflict.description)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${severityClass(conflict.severity)} text-[11px]`}>
                        {SEVERITY_LABELS[conflict.severity] || valueOrDash(conflict.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[210px] flex-wrap items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={() => setDetailConflict(conflict)}>
                          <Eye className="mr-1 h-3 w-3" />Chi tiết
                        </Button>
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
                        <span title="Chưa hỗ trợ tách lớp trực tiếp. Vui lòng xử lý bằng file import.">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled>
                            Tách lớp
                          </Button>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setCopyStatus("");
                            setReportConflict(conflict);
                          }}
                        >
                          Báo cáo Admin
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
                  ["Nhóm/Tổ", detailConflict.sectionCode],
                  ["Lớp hành chính", detailAllocation?.administrativeClass || detailConflict.administrativeClass || detailConflict.sectionCode],
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
                <p className="mt-1">{valueOrDash(detailConflict.description || detailAllocation?.conflictReason)}</p>
                {detailConflict.conflictingWith && <p className="mt-1 text-gray-500">Xung đột với: {detailConflict.conflictingWith}</p>}
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                <p className="text-xs font-semibold uppercase tracking-wide">Gợi ý xử lý</p>
                <p className="mt-1">{getConflictSuggestion(detailConflict.conflictType)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reportConflict)} onOpenChange={(open) => !open && setReportConflict(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Báo cáo gửi Admin</DialogTitle>
            <DialogDescription>
              Hệ thống chưa lưu hoặc gửi request tự động. Hãy sao chép nội dung hoặc tải CSV để chuyển cho Admin.
            </DialogDescription>
          </DialogHeader>
          <textarea
            aria-label="Nội dung báo cáo xung đột"
            className="min-h-64 w-full resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs leading-5 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            readOnly
            value={reportText}
          />
          <p className="text-xs text-amber-700">
            Admin xử lý bằng màn Import thời khóa biểu hoặc chỉnh dữ liệu học phần. Thao tác này không có nghĩa là báo cáo đã được gửi.
          </p>
          {copyStatus && <p className="text-xs text-gray-600">{copyStatus}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={downloadCsv} disabled={!reportConflicts?.length}>
              <Download className="mr-2 h-4 w-4" />Tải CSV theo bộ lọc
            </Button>
            <Button onClick={copyReport}>
              <Copy className="mr-2 h-4 w-4" />Sao chép báo cáo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
