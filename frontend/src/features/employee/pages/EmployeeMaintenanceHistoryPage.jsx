import { useState } from "react";
import { CheckCircle, Clock, Zap, X, Eye, Wrench } from "lucide-react";
import { Card, CardContent } from "../../../app/components/ui/card";
import { Badge } from "../../../app/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";

const maintenanceRequests = [
  { id: "YC-EMP-001", type: "electrical", location: "A-201", description: "Bóng đèn phòng A-201 không sáng", urgency: "normal", date: "10/04/2025", status: "completed", notes: "Thay bóng đèn LED" },
  { id: "YC-EMP-002", type: "furniture", location: "B-105", description: "Bàn ghế phòng B-105 cần sửa chữa", urgency: "urgent", date: "11/04/2025", status: "processing", notes: "Đang sửa chữa" },
  { id: "YC-EMP-003", type: "plumbing", location: "C-102", description: "Vòi nước phòng C-102 bị rò", urgency: "urgent", date: "12/04/2025", status: "pending", notes: "" },
  { id: "YC-EMP-004", type: "equipment", location: "A-301", description: "Máy chiếu phòng A-301 không hoạt động", urgency: "normal", date: "13/04/2025", status: "processing", notes: "Đang kiểm tra" }
];

const maintenanceConfig = {
  pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-700", icon: Zap },
  completed: { label: "Hoàn thành", className: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Hủy", className: "bg-gray-100 text-gray-700", icon: X }
};

const maintenanceTypeLabels = {
  electrical: "Điện",
  plumbing: "Nước",
  furniture: "Nội thất",
  equipment: "Thiết bị",
  other: "Khác"
};

const EmployeeMaintenanceHistoryPage = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Lịch sử sửa chữa</h1>
        <p className="text-sm text-gray-500 mt-0.5">Theo dõi tiến độ xử lý các yêu cầu sửa chữa đã gửi</p>
      </div>

      <div className="space-y-4">
        {maintenanceRequests.map((req) => {
          const cfg = maintenanceConfig[req.status];
          const StatusIcon = cfg.icon;
          return (
            <Card key={req.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-900">{req.id}</p>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tight px-2">{maintenanceTypeLabels[req.type]}</Badge>
                        <Badge className={`${cfg.className} gap-1 text-[11px] shadow-none border-0`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                        {req.urgency !== "normal" && (
                          <Badge variant="destructive" className="text-[10px] uppercase font-bold">{req.urgency === "urgent" ? "Khẩn" : "Khẩn cấp"}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{req.description}</p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Vị trí: {req.location}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {req.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showDetailModal && selectedRequest && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Chi tiết yêu cầu {selectedRequest.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 border-t border-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loại sự cố</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{maintenanceTypeLabels[selectedRequest.type]}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vị trí</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedRequest.location}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày gửi</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedRequest.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</p>
                  <Badge className={`${maintenanceConfig[selectedRequest.status].className} gap-1 text-xs mt-1 shadow-none border-0`}>
                    {maintenanceConfig[selectedRequest.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả sự cố</p>
                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedRequest.description}</p>
              </div>
              {selectedRequest.notes && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-green-600">Phản hồi từ kỹ thuật</p>
                  <p className="text-sm text-green-700 mt-1 bg-green-50 p-3 rounded-lg border border-green-100">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowDetailModal(false)} variant="outline">Đóng</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EmployeeMaintenanceHistoryPage;
