import { useState } from "react";
import { Clock3, CheckCircle, XCircle, Search, Wrench, Zap } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

const studentMaintenanceHistoryData = [
  { id: "YC-MT-001", location: "A-101", type: "Điện", description: "Điều hòa không mát", date: "10/04/2026", status: "completed", response: "Đã nạp gas điều hòa" },
  { id: "YC-MT-002", location: "B-205", type: "Thiết bị", description: "Máy chiếu bị mờ", date: "15/04/2026", status: "processing", response: "Đang chờ thay bóng đèn máy chiếu" },
  { id: "YC-MT-003", location: "C-105", type: "Nội thất", description: "Cửa sổ bị kẹt", date: "18/04/2026", status: "pending", response: "-" }
];

const statusCfg = {
  completed: { label: "Đã hoàn thành", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700", icon: Zap },
  pending: { label: "Chờ tiếp nhận", cls: "bg-yellow-100 text-yellow-700", icon: Clock3 }
};

const StudentMaintenanceHistoryPage = () => {
  const [history] = useState(studentMaintenanceHistoryData);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter(h => 
    h.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lịch sử báo cáo sự cố</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi tiến độ xử lý các sự cố cơ sở vật chất bạn đã báo cáo</p>
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
            <Wrench className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-400">Chưa có báo cáo nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-bold text-gray-600">Mã yêu cầu</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Phòng / Vị trí</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Loại sự cố</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Mô tả chi tiết</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Ngày gửi</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600 text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((h) => {
                  const cfg = statusCfg[h.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <TableRow key={h.id} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                      <TableCell className="font-mono text-[11px] font-bold text-blue-700">{h.id}</TableCell>
                      <TableCell className="text-xs font-bold text-gray-800">{h.location}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] font-medium border-gray-200 text-gray-600 bg-gray-50">
                          {h.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="truncate" title={h.description}>{h.description}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5 truncate italic">Phản hồi: {h.response}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{h.date}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${cfg.cls} gap-1 text-[10px] px-2 py-0.5 shadow-none border-0`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </Badge>
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

export { StudentMaintenanceHistoryPage };
export default StudentMaintenanceHistoryPage;
