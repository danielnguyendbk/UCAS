import { useState } from "react";
import { Clock3, CheckCircle, Clock, XCircle, Wrench } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const maintenanceHistoryData = [
  { id: "SC-2025-001", room: "A-301", description: "Máy chiếu phòng A-301 bị lỗi, không hiển thị hình ảnh", date: "01/04/2025", status: "completed", response: "Đã thay bóng đèn máy chiếu mới" },
  { id: "SC-2025-002", room: "B-102", description: "Điều hoà phòng B-102 không hoạt động, phòng quá nóng", date: "05/04/2025", status: "processing", response: "Đội kỹ thuật đang kiểm tra" },
  { id: "SC-2025-003", room: "A-205", description: "Bảng trắng bị hỏng, không viết được", date: "10/04/2025", status: "pending", response: "-" }
];

const statusCfg = {
  completed: { label: "Đã xử lý", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700", icon: Clock },
  pending: { label: "Chờ xử lý", cls: "bg-yellow-100 text-yellow-700", icon: Clock3 },
  rejected: { label: "Từ chối", cls: "bg-red-100 text-red-700", icon: XCircle }
};

const LecturerMaintenanceHistoryPage = () => {
  const [history] = useState(maintenanceHistoryData);

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Lịch sử sửa chữa</h1>
        <p className="text-sm text-gray-500 mt-0.5">Theo dõi trạng thái các yêu cầu sửa chữa CSVC</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Wrench className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu sửa chữa nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Mã yêu cầu</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Mô tả sự cố</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ngày gửi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phản hồi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r) => {
                  const cfg = statusCfg[r.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <TableCell className="font-mono text-xs font-bold text-blue-700">{r.id}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900">{r.room}</TableCell>
                      <TableCell className="text-xs text-gray-700 max-w-[220px]">
                        <div className="truncate" title={r.description}>{r.description}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{r.date}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${cfg.cls} hover:${cfg.cls} gap-1 text-[11px]`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[200px]">
                        <div className="truncate" title={r.response}>{r.response}</div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export { LecturerMaintenanceHistoryPage };
