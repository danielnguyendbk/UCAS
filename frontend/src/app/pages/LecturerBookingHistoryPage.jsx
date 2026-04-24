import { useState } from "react";
import { Clock3, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const requestHistoryData = [
  { id: "YC-2025-041", type: "Đặt phòng", detail: "Phòng A-101, Tiết 1-3", date: "09/04/2025", reason: "Dạy bù cho sinh viên", status: "pending", response: "-" },
  { id: "YC-2025-042", type: "Đặt phòng", detail: "Phòng B-201, Tiết 4-6", date: "15/04/2025", reason: "Kiểm tra giữa kỳ CS101.L11", status: "approved", response: "Đã duyệt, phòng B-201 sẵn sàng" },
  { id: "YC-2025-038", type: "Đặt phòng", detail: "Phòng C-102, Tiết 7-9", date: "01/04/2025", reason: "Hội thảo khoa học bộ môn", status: "rejected", response: "Phòng đã được đặt trước bởi đơn vị khác" }
];

const statusCfg = {
  approved: { label: "Đã duyệt", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700", icon: Clock },
  rejected: { label: "Từ chối", cls: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700", icon: Clock3 }
};

const LecturerBookingHistoryPage = () => {
  const [history] = useState(requestHistoryData);

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Danh sách yêu cầu đặt phòng</h1>
        <p className="text-sm text-gray-500 mt-0.5">Lịch sử các yêu cầu đặt phòng của bạn</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <Clock3 className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu đặt phòng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Mã yêu cầu</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Chi tiết</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ngày gửi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Nội dung</TableHead>
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
                      <TableCell className="text-xs text-gray-700 font-medium">{r.detail}</TableCell>
                      <TableCell className="text-xs text-gray-500">{r.date}</TableCell>
                      <TableCell className="text-xs text-gray-700 max-w-[180px]"><div className="truncate" title={r.reason}>{r.reason}</div></TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${cfg.cls} hover:${cfg.cls} gap-1 text-[11px]`}><StatusIcon className="w-3 h-3" /> {cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[200px]"><div className="truncate" title={r.response}>{r.response}</div></TableCell>
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

export { LecturerBookingHistoryPage };
