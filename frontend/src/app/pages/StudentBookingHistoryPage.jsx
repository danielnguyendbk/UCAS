import { useState } from "react";
import { Clock3, CheckCircle, XCircle, Search, Calendar } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

const studentBookingHistoryData = [
  { id: "YC-STU-041", room: "A-101", slot: "Tiết 1-3", date: "22/04/2026", reason: "Họp nhóm đồ án Java", status: "pending", response: "-" },
  { id: "YC-STU-042", room: "B-205", slot: "Tiết 4-6", date: "23/04/2026", reason: "Sinh hoạt CLB Tin học", status: "approved", response: "Đã duyệt, phòng B-205 sẵn sàng" },
  { id: "YC-STU-038", room: "C-102", slot: "Tiết 7-9", date: "20/04/2026", reason: "Tự học nhóm", status: "rejected", response: "Phòng bận dạy bù đột xuất" }
];

const statusCfg = {
  approved: { label: "Đã duyệt", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Từ chối", cls: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700", icon: Clock3 }
};

const StudentBookingHistoryPage = () => {
  const [history] = useState(studentBookingHistoryData);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter(h => 
    h.room.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lịch sử mượn phòng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi trạng thái các yêu cầu mượn phòng học của bạn</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Tìm mã YC, phòng..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock3 className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-400">Không tìm thấy yêu cầu nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-bold text-gray-600">Mã yêu cầu</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Phòng học</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Thời gian</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Lý do / Mục đích</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Phản hồi từ quản lý</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((h) => {
                  const cfg = statusCfg[h.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <TableRow key={h.id} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                      <TableCell className="font-mono text-[11px] font-bold text-blue-700">{h.id}</TableCell>
                      <TableCell className="text-xs font-bold text-gray-800">{h.room}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">{h.date}</span>
                          <span className="text-[10px] text-gray-400">{h.slot}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[200px]">
                        <div className="truncate" title={h.reason}>{h.reason}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${cfg.cls} gap-1 text-[10px] px-2 py-0.5 shadow-none border-0`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-gray-500 italic max-w-[200px]">
                        <div className="truncate" title={h.response}>{h.response}</div>
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

export { StudentBookingHistoryPage };
export default StudentBookingHistoryPage;
