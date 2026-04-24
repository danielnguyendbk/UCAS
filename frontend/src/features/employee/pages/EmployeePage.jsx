import { useState } from "react";
import { Plus, CheckCircle, Clock, Eye, Wrench, Zap, Droplets, Home, AlertTriangle, AlertCircle, X, Filter } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Input } from "../../../app/components/ui/input";
import { Label } from "../../../app/components/ui/label";
import { Badge } from "../../../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../app/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";

const roomUsageData = [
  { id: 1, room: "A-201", building: "A", date: "22/04/2025", morning: "CS101", afternoon: "SE102", evening: "MATH201", status: "ready" },
  { id: 2, room: "A-301", building: "A", date: "22/04/2025", morning: "CS202", afternoon: "CS101", evening: "", status: "ready" },
  { id: 3, room: "B-105", building: "B", date: "22/04/2025", morning: "SE201", afternoon: "", evening: "MATH102", status: "not-ready" },
  { id: 4, room: "C-102", building: "C", date: "22/04/2025", morning: "", afternoon: "CS301", evening: "CS101", status: "ready" }
];

const prepConfig = {
  ready: { label: "Sẵn sàng", className: "bg-green-100 text-green-700", icon: CheckCircle },
  "not-ready": { label: "Chưa chuẩn bị", className: "bg-orange-100 text-orange-700", icon: AlertTriangle }
};

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

const EmployeePage = () => {
  const [activeTab, setActiveTab] = useState("room-usage");
  
  // Room usage filters
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [displayMode, setDisplayMode] = useState("grid");

  // Maintenance request state
  const [maintenanceForm, setMaintenanceForm] = useState({ type: "", location: "", description: "", urgency: "normal" });
  const [maintenanceErrors, setMaintenanceErrors] = useState({});
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([
    { id: "YC-EMP-001", type: "electrical", location: "A-201", description: "Bóng đèn phòng A-201 không sáng", urgency: "normal", date: "10/04/2025", status: "completed", notes: "Thay bóng đèn LED" },
    { id: "YC-EMP-002", type: "furniture", location: "B-105", description: "Bàn ghế phòng B-105 cần sửa chữa", urgency: "urgent", date: "11/04/2025", status: "processing", notes: "Đang sửa chữa" },
    { id: "YC-EMP-003", type: "plumbing", location: "C-102", description: "Vòi nước phòng C-102 bị rò", urgency: "urgent", date: "12/04/2025", status: "pending", notes: "" },
    { id: "YC-EMP-004", type: "equipment", location: "A-301", description: "Máy chiếu phòng A-301 không hoạt động", urgency: "normal", date: "13/04/2025", status: "processing", notes: "Đang kiểm tra" }
  ]);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Maintenance validation and submit
  const validateMaintenance = () => {
    const errs = {};
    if (!maintenanceForm.type) errs.type = "Vui lòng chọn loại";
    if (!maintenanceForm.location.trim()) errs.location = "Vui lòng nhập vị trí";
    if (!maintenanceForm.description.trim()) errs.description = "Vui lòng nhập mô tả";
    return errs;
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    const errs = validateMaintenance();
    setMaintenanceErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setMaintenanceSubmitting(true);
    setTimeout(() => {
      setMaintenanceSubmitting(false);
      setMaintenanceSubmitted(true);
      setMaintenanceForm({ type: "", location: "", description: "", urgency: "normal" });
    }, 1200);
  };

  const stats = {
    totalRooms: roomUsageData.length,
    totalClasses: roomUsageData.reduce((acc, r) => acc + (r.morning ? 1 : 0) + (r.afternoon ? 1 : 0) + (r.evening ? 1 : 0), 0),
    prepared: roomUsageData.filter(r => r.status === "ready").length,
    unprepared: roomUsageData.filter(r => r.status === "not-ready").length
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nhân viên</h1>
        <p className="text-sm text-gray-500 mt-0.5">Xem lịch sử dụng phòng và quản lý yêu cầu sửa chữa</p>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { key: "room-usage", label: "Lịch sử dụng phòng" },
          { key: "maintenance-create", label: "Yêu cầu sửa chữa" },
          { key: "maintenance-status", label: "Lịch sử sửa chữa" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Room Usage Tab */}
      {activeTab === "room-usage" && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.totalRooms}</p>
                  <p className="text-xs text-gray-500 mt-1">Tổng phòng có lịch</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.totalClasses}</p>
                  <p className="text-xs text-gray-500 mt-1">Tổng lớp học</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.prepared}</p>
                  <p className="text-xs text-gray-500 mt-1">Sẵn sàng</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{stats.unprepared}</p>
                  <p className="text-xs text-gray-500 mt-1">Chưa chuẩn bị</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Toà nhà</Label>
                  <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="A">Toà A</SelectItem>
                      <SelectItem value="B">Toà B</SelectItem>
                      <SelectItem value="C">Toà C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Phòng</Label>
                  <Input placeholder="Tìm phòng..." value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Tuần</Label>
                  <Input type="number" placeholder="Tuần" value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} className="h-9 text-sm" min="1" max="17" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Ngày</Label>
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg" />
                </div>
              </div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 gap-2 w-full md:w-auto text-sm">
                <Filter className="w-4 h-4" />
                Lọc
              </Button>
            </CardContent>
          </Card>

          {/* Display Mode */}
          <div className="flex justify-end gap-2">
            <Button variant={displayMode === "grid" ? "default" : "outline"} onClick={() => setDisplayMode("grid")} className="text-sm">Lưới</Button>
            <Button variant={displayMode === "list" ? "default" : "outline"} onClick={() => setDisplayMode("list")} className="text-sm">Danh sách</Button>
          </div>

          {/* Grid View */}
          {displayMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roomUsageData.map((room) => {
                const cfg = prepConfig[room.status];
                const StatusIcon = cfg.icon;
                return (
                  <Card key={room.id} className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{room.room}</p>
                          <p className="text-xs text-gray-500">Tòa {room.building} • {room.date}</p>
                        </div>
                        <Badge className={`${cfg.className} gap-1 text-[10px]`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="font-semibold text-gray-600">Sáng: </span>
                          <span className="text-gray-700">{room.morning || "—"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">Chiều: </span>
                          <span className="text-gray-700">{room.afternoon || "—"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">Tối: </span>
                          <span className="text-gray-700">{room.evening || "—"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* List View */}
          {displayMode === "list" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold">Phòng</TableHead>
                    <TableHead className="text-xs font-semibold">Tòa</TableHead>
                    <TableHead className="text-xs font-semibold">Ngày</TableHead>
                    <TableHead className="text-xs font-semibold">Sáng</TableHead>
                    <TableHead className="text-xs font-semibold">Chiều</TableHead>
                    <TableHead className="text-xs font-semibold">Tối</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomUsageData.map((room) => {
                    const cfg = prepConfig[room.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <TableRow key={room.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="font-bold text-blue-700 text-xs">{room.room}</TableCell>
                        <TableCell className="text-xs">{room.building}</TableCell>
                        <TableCell className="text-xs">{room.date}</TableCell>
                        <TableCell className="text-xs">{room.morning || "—"}</TableCell>
                        <TableCell className="text-xs">{room.afternoon || "—"}</TableCell>
                        <TableCell className="text-xs">{room.evening || "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${cfg.className} gap-1 text-[11px]`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Maintenance Request Creation Tab */}
      {activeTab === "maintenance-create" && (
        <div className="max-w-2xl">
          {maintenanceSubmitted && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Yêu cầu sửa chữa đã được gửi!</p>
                <p className="text-xs text-green-700 mt-0.5">Mã yêu cầu: YC-EMP-501 · Đang chờ xử lý</p>
              </div>
            </div>
          )}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                Yêu cầu sửa chữa cơ sở vật chất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMaintenanceSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Loại <span className="text-red-500">*</span></Label>
                    <Select value={maintenanceForm.type} onValueChange={(v) => setMaintenanceForm((f) => ({ ...f, type: v }))}>
                      <SelectTrigger className={`h-9 text-sm ${maintenanceErrors.type ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electrical">Điện</SelectItem>
                        <SelectItem value="plumbing">Nước</SelectItem>
                        <SelectItem value="furniture">Nội thất</SelectItem>
                        <SelectItem value="equipment">Thiết bị</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    {maintenanceErrors.type && <p className="text-xs text-red-500">{maintenanceErrors.type}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Độ ưu tiên</Label>
                    <Select value={maintenanceForm.urgency} onValueChange={(v) => setMaintenanceForm((f) => ({ ...f, urgency: v }))}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                        <SelectItem value="emergency">Cấp cứu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-gray-700">Vị trí <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="VD: A-201, B-105..."
                      value={maintenanceForm.location}
                      onChange={(e) => setMaintenanceForm((f) => ({ ...f, location: e.target.value }))}
                      className={`h-9 text-sm ${maintenanceErrors.location ? "border-red-400" : ""}`}
                    />
                    {maintenanceErrors.location && <p className="text-xs text-red-500">{maintenanceErrors.location}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Mô tả <span className="text-red-500">*</span></Label>
                  <textarea
                    placeholder="Mô tả chi tiết vấn đề..."
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${maintenanceErrors.description ? "border-red-400" : "border-gray-200"}`}
                  />
                  {maintenanceErrors.description && <p className="text-xs text-red-500">{maintenanceErrors.description}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-sm" disabled={maintenanceSubmitting}>
                    {maintenanceSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                  </Button>
                  <Button type="button" variant="outline" className="text-sm" onClick={() => setMaintenanceForm({ type: "", location: "", description: "", urgency: "normal" })}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Maintenance Status Tab */}
      {activeTab === "maintenance-status" && (
        <div className="space-y-4">
          {maintenanceRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
              <Wrench className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceRequests.map((req) => {
                const typeCfg = maintenanceConfig[req.status];
                const StatusIcon = typeCfg.icon;
                return (
                  <Card key={req.id} className="shadow-sm cursor-pointer hover:shadow-md" onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-orange-100 rounded-lg"><Wrench className="w-5 h-5 text-orange-600" /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900">{req.id}</p>
                              <Badge variant="outline" className="text-xs">{maintenanceTypeLabels[req.type]}</Badge>
                              <Badge className={`${typeCfg.className} gap-1 text-[11px]`}>
                                <StatusIcon className="w-3 h-3" />
                                {typeCfg.label}
                              </Badge>
                              {req.urgency !== "normal" && (
                                <Badge variant="destructive" className="text-xs">{req.urgency === "urgent" ? "Khẩn cấp" : "Cấp cứu"}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{req.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>Vị trí: {req.location}</span>
                              <span>Ngày: {req.date}</span>
                              {req.notes && <span className="font-semibold">Ghi chú: {req.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedRequest.id}</DialogTitle>
              <button onClick={() => setShowDetailModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Loại</p>
                <p className="text-sm text-gray-700">{maintenanceTypeLabels[selectedRequest.type]}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Vị trí</p>
                <p className="text-sm text-gray-700">{selectedRequest.location}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Mô tả</p>
                <p className="text-sm text-gray-700">{selectedRequest.description}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Độ ưu tiên</p>
                <p className="text-sm text-gray-700 capitalize">{selectedRequest.urgency === "normal" ? "Bình thường" : selectedRequest.urgency === "urgent" ? "Khẩn cấp" : "Cấp cứu"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Trạng thái</p>
                <Badge className={`${maintenanceConfig[selectedRequest.status].className} gap-1 text-xs mt-1`}>
                  {maintenanceConfig[selectedRequest.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ngày gửi</p>
                <p className="text-sm text-gray-700">{selectedRequest.date}</p>
              </div>
              {selectedRequest.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Ghi chú</p>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EmployeePage;
