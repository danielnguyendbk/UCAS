import { useState } from "react";
import { Wrench, Clock, CheckCircle, AlertCircle, Eye, Search, Filter, MessageSquare, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

// Mock Data for all requests in system
const initialRequests = [
  { id: "REQ001", requester: "TS. Lê Văn Minh", role: "Lecturer", type: "Thiết bị điện", location: "Phòng A-201", urgency: "Cao", description: "Điều hòa không mát, kêu to", date: "2026-04-23", status: "pending", image: "https://picsum.photos/seed/req1/200/200" },
  { id: "REQ002", requester: "Phạm Thị Lan", role: "Employee", type: "Bàn ghế", location: "Phòng B-105", urgency: "Trung bình", description: "Bàn giáo viên bị gãy chân", date: "2026-04-23", status: "processing", image: null },
  { id: "REQ003", requester: "Nguyễn Văn A", role: "Lecturer", type: "Máy chiếu", location: "Phòng C-302", urgency: "Rất cao", description: "Máy chiếu không lên nguồn", date: "2026-04-22", status: "pending", image: "https://picsum.photos/seed/req3/200/200" },
  { id: "REQ004", requester: "Trần Thị B", role: "Lecturer", type: "Thiết bị điện", location: "Phòng A-101", urgency: "Thấp", description: "Bóng đèn nhấp nháy", date: "2026-04-21", status: "fixed", dateFixed: "2026-04-22" },
];

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", className: "bg-orange-100 text-orange-700 border-orange-200" },
  processing: { label: "Đang sửa chữa", className: "bg-blue-100 text-blue-700 border-blue-200" },
  fixed: { label: "Đã hoàn thành", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-600 border-gray-200" }
};

const StaffMaintenanceListPage = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Detail Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.requester.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id, newStatus) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus, dateFixed: newStatus === "fixed" ? new Date().toISOString().split('T')[0] : req.dateFixed } : req
    ));
    
    if (newStatus === "fixed") {
      alert("Thông báo đã được gửi tới người yêu cầu: Sửa chữa hoàn thành!");
    }
  };

  const openDetail = (req) => {
    setSelectedReq(req);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            Quản lý sửa chữa cơ sở vật chất
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tiếp nhận và điều phối xử lý các sự cố thiết bị tại các phòng học.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="border-b border-gray-50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Tìm theo người yêu cầu, vị trí hoặc mã..." 
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ tiếp nhận</SelectItem>
                  <SelectItem value="processing">Đang sửa chữa</SelectItem>
                  <SelectItem value="fixed">Đã hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="w-[120px]">Mã yêu cầu</TableHead>
                <TableHead>Người yêu cầu</TableHead>
                <TableHead>Vị trí & Loại</TableHead>
                <TableHead className="text-center">Độ ưu tiên</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                <TableRow key={req.id} className="hover:bg-gray-50/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-gray-600">{req.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{req.requester}</span>
                      <span className="text-[10px] text-gray-500 bg-gray-100 w-fit px-1 rounded">{req.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-700">{req.location}</span>
                      <span className="text-xs text-gray-500">{req.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`
                      ${req.urgency === 'Rất cao' ? 'bg-red-50 text-red-700 border-red-200' : 
                        req.urgency === 'Cao' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                        'bg-gray-50 text-gray-600 border-gray-200'}
                      text-[10px] px-2
                    `}>
                      {req.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${statusConfig[req.status].className} text-[10px] px-2`} variant="outline">
                      {statusConfig[req.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(req)} title="Xem chi tiết">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                      {req.status === "pending" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateStatus(req.id, "processing")}
                        >
                          Tiếp nhận
                        </Button>
                      )}
                      {req.status === "processing" && (
                        <Button 
                          size="sm" 
                          className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => updateStatus(req.id, "fixed")}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Hoàn thành
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">Không tìm thấy yêu cầu nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết yêu cầu {selectedReq?.id}
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về sự cố và quá trình xử lý.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReq && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Người yêu cầu</p>
                  <p className="text-sm font-semibold">{selectedReq.requester} ({selectedReq.role})</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Ngày gửi</p>
                  <p className="text-sm font-semibold">{selectedReq.date}</p>
                </div>
              </div>

              <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400">Mô tả sự cố</p>
                <p className="text-sm text-gray-700">{selectedReq.description}</p>
              </div>

              {selectedReq.image && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Ảnh minh chứng</p>
                  <img src={selectedReq.image} alt="Minh chứng" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Cập nhật nhanh trạng thái</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs"
                    disabled={selectedReq.status === 'pending'}
                    onClick={() => updateStatus(selectedReq.id, 'pending')}
                  >
                    Chờ tiếp nhận
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    disabled={selectedReq.status === 'processing'}
                    onClick={() => updateStatus(selectedReq.id, 'processing')}
                  >
                    Đang sửa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs text-green-600 border-green-200 hover:bg-green-50"
                    disabled={selectedReq.status === 'fixed'}
                    onClick={() => updateStatus(selectedReq.id, 'fixed')}
                  >
                    Đã hoàn thành
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffMaintenanceListPage;
