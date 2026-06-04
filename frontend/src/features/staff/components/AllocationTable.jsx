import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

export const AllocationTable = ({ items, isLoading, onOpenRoomSearch }) => {
  if (isLoading)
    return (
      <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">
                Mã lớp HP
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Tên môn
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                SV
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Yêu cầu phòng
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Lịch học
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">
                Phòng phân
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                Sức chứa
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                Kết quả
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items &&
              items.map((row) => (
                <TableRow
                  key={row.scheduleId ?? row.sectionId ?? row.sectionCode}
                  className={`hover:bg-gray-50 border-b border-gray-100 ${row.status === "CONFLICT" ? "bg-red-50/40" : ""}`}
                >
                  <TableCell className="font-mono text-xs font-bold text-blue-700">
                    {row.classCode ?? row.sectionCode}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-800">
                    {row.courseName}
                  </TableCell>

                  {/* ĐÃ SỬA: Hiển thị SV đăng ký / Sức chứa tối đa (maxCapacity) */}
                  <TableCell className="text-xs text-center">
                    {row.enrolledCount} /{" "}
                    <span className="font-semibold text-blue-600">
                      {row.maxCapacity}
                    </span>
                  </TableCell>

                  {/* ĐÃ SỬA: Hiển thị chi tiết yêu cầu phòng */}
                  <TableCell className="text-[11px] text-gray-500">
                    Loại: {row.requiredRoomType} <br />
                    Yêu cầu: ≥ {row.maxCapacity} chỗ
                  </TableCell>

                  <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                    {row.dayOfWeek} · Ca {row.slotNumber}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-gray-900">
                    {row.assignedRoom || (
                      <span className="text-gray-300 italic font-normal">
                        Chưa phân
                      </span>
                    )}
                  </TableCell>

                  {/* ĐÃ SỬA: So sánh màu đỏ/xanh dựa trên maxCapacity thay vì enrolledCount */}
                  <TableCell className="text-xs text-center text-gray-600">
                    {row.roomCapacity > 0 ? (
                      <span
                        className={
                          row.roomCapacity < row.maxCapacity
                            ? "text-red-600 font-semibold"
                            : "text-green-600"
                        }
                      >
                        {row.roomCapacity}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    {row.status === "VALID" && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[11px]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Hợp lệ
                      </Badge>
                    )}
                    {row.status === "UNASSIGNED" && (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[11px]">
                        Chưa phân
                      </Badge>
                    )}
                    {row.status === "CONFLICT" && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[11px]">
                        <XCircle className="w-3 h-3 mr-1" />
                        Xung đột
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                      onClick={() => onOpenRoomSearch(row)}
                    >
                      {row.assignedRoom ? "Đổi phòng" : "Phân phòng"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  Chưa có dữ liệu phân phòng cho học kỳ này.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
