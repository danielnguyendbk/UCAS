import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  extractBuilding,
  formatDayOfWeek,
  formatSlot,
  getCourseCode,
} from "@/features/staff/utils/allocationHelpers";

const statusBadge = (status) => {
  if (status === "VALID" || status === "ASSIGNED") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[11px]">
        Đã phân phòng
      </Badge>
    );
  }
  if (status === "UNASSIGNED") {
    return (
      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[11px]">
        Chưa phân phòng
      </Badge>
    );
  }
  if (status === "CONFLICT") {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[11px]">
        Xung đột
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-[11px]">
      {status || "—"}
    </Badge>
  );
};

export const UnassignedScheduleTable = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
    );
  }

  return (
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
                Thứ
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tiết
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tuần học
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Loại phòng yêu cầu
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((row) => (
              <TableRow
                key={row.scheduleId ?? row.sectionId ?? row.sectionCode}
                className="hover:bg-gray-50 border-b border-gray-100"
              >
                <TableCell className="text-xs font-mono font-bold text-blue-700">
                  {getCourseCode(row)}
                </TableCell>
                <TableCell className="text-xs font-medium text-gray-800">
                  {row.courseName}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {row.sectionCode || "—"}
                </TableCell>
                <TableCell className="text-xs text-gray-500">—</TableCell>
                <TableCell className="text-xs text-gray-500">—</TableCell>
                <TableCell className="text-xs text-center text-gray-700">
                  {row.enrolledCount ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                  {formatDayOfWeek(row.dayOfWeek)}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {formatSlot(row.slotNumber)}
                </TableCell>
                <TableCell className="text-xs text-gray-500">—</TableCell>
                <TableCell className="text-xs text-gray-600">
                  {row.requiredRoomType || "—"}
                </TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-8 text-gray-500"
                >
                  Không có lịch chờ phân phòng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export const AssignedScheduleTable = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
    );
  }

  return (
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
                Thứ
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tiết
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tuần học
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Phòng
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tòa nhà
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((row) => (
              <TableRow
                key={row.scheduleId ?? row.sectionId ?? row.sectionCode}
                className="hover:bg-gray-50 border-b border-gray-100"
              >
                <TableCell className="text-xs font-mono font-bold text-blue-700">
                  {getCourseCode(row)}
                </TableCell>
                <TableCell className="text-xs font-medium text-gray-800">
                  {row.courseName}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {row.sectionCode || "—"}
                </TableCell>
                <TableCell className="text-xs text-gray-500">—</TableCell>
                <TableCell className="text-xs text-gray-500">—</TableCell>
                <TableCell className="text-xs text-center text-gray-700">
                  {row.enrolledCount ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                  {formatDayOfWeek(row.dayOfWeek)}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {formatSlot(row.slotNumber)}
                </TableCell>
                <TableCell className="text-xs text-gray-500">—</TableCell>
                <TableCell className="text-xs font-semibold text-gray-900">
                  {row.assignedRoom}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {extractBuilding(row.assignedRoom)}
                </TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center py-8 text-gray-500"
                >
                  Chưa có lịch đã phân phòng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
