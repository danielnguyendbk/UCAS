import { useState } from "react";
import { Plus, CheckCircle, Clock, XCircle, Eye, AlertCircle, Wrench, Zap, Droplets, Home, AlertTriangle, X } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Input } from "../../../app/components/ui/input";
import { Label } from "../../../app/components/ui/label";
import { Badge } from "../../../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../app/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";

const scheduleData = [
  { id: 1, day: "Thứ 2", date: "22/04/2025", timeSlot: "Tiết 1-3 (07:00-09:30)", subject: "Lập trình Java", code: "SE101", room: "A-201", building: "A", students: 45 },
  { id: 2, day: "Thứ 3", date: "23/04/2025", timeSlot: "Tiết 4-6 (09:45-12:15)", subject: "Cấu trúc dữ liệu", code: "SE102", room: "B-301", building: "B", students: 50 },
  { id: 3, day: "Thứ 5", date: "25/04/2025", timeSlot: "Tiết 7-9 (13:00-15:30)", subject: "Web Development", code: "SE201", room: "C-105", building: "C", students: 48 }
];

const bookingRequestConfig = {
  approved: { label: "Đã duyệt", className: "bg-green-100 text-green-700", icon: CheckCircle },
  pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  rejected: { label: "Từ chối", className: "bg-red-100 text-red-700", icon: XCircle }
};

const maintenanceConfig = {
  pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-700", icon: Zap },
  completed: { label: "Hoàn thành", className: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Hủy", className: "bg-gray-100 text-gray-700", icon: XCircle }
};

const maintenanceTypeIcons = {
  electrical: Zap,
  plumbing: Droplets,
  furniture: Home,
  equipment: AlertTriangle,
  other: AlertCircle
};

const maintenanceTypeLabels = {
  electrical: "Điện",
  plumbing: "Nước",
  furniture: "Nội thất",
  equipment: "Thiết bị",
  other: "Khác"
};

const LecturerPage = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Booking request state
  const [bookingForm, setBookingForm] = useState({ room: "", date: "", slot: "", purpose: "", notes: "", attendees: "" });
  const [bookingErrors, setBookingErrors] = useState({});
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [myBookings, setMyBookings] = useState([
    { id: "DPK-2025-101", room: "A-301", purpose: "Thi cuối kỳ — SE101", date: "20/04/2025", slot: "Tiết 1-4", created: "10/04/2025", status: "approved" },
    { id: "DPK-2025-102", room: "C-201", purpose: "Hội thảo khoa học CNTT", date: "25/04/2025", slot: "Tiết 7-10", created: "11/04/2025", status: "pending" }
  ]);

  // Maintenance request state
  const [maintenanceForm, setMaintenanceForm] = useState({ type: "", location: "", description: "", urgency: "normal" });
  const [maintenanceErrors, setMaintenanceErrors] = useState({});
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([
    { id: "YC-2025-001", type: "electrical", location: "A-201", description: "Bóng đèn không sáng", urgency: "normal", date: "10/04/2025", status: "completed" },
    { id: "YC-2025-002", type: "furniture", location: "B-301", description: "Ghế cần sửa chữa", urgency: "normal", date: "11/04/2025", status: "processing" }
  ]);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Booking validation and submit
  const validateBooking = () => {
    const errs = {};
    if (!bookingForm.room) errs.room = "Vui lòng chọn phòng";
    if (!bookingForm.date) errs.date = "Vui lòng chọn ngày";
    if (!bookingForm.slot) errs.slot = "Vui lòng chọn ca học";
    if (!bookingForm.purpose.trim()) errs.purpose = "Vui lòng nhập mục đích";
    return errs;
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const errs = validateBooking();
    setBookingErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setBookingSubmitting(true);
    setTimeout(() => {
      setBookingSubmitting(false);
      setBookingSubmitted(true);
      setBookingForm({ room: "", date: "", slot: "", purpose: "", notes: "", attendees: "" });
    }, 1200);
  };

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

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Giảng viên</h1>
        <p className="text-sm text-gray-500 mt-0.5">Lịch dạy, yêu cầu đặt phòng và yêu cầu sửa chữa cơ sở vật chất</p>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { key: "schedule", label: "Lịch dạy của tôi" },
          { key: "booking-create", label: "Yêu cầu đặt phòng" },
          { key: "booking-status", label: "Danh sách yêu cầu của tôi" },
          { key: "maintenance-create", label: "Yêu cầu sửa chữa" },
          { key: "maintenance-status", label: "Lịch sử sửa chữa" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {scheduleData.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Ngày</p>
                    <p className="text-sm font-bold text-gray-900">{item.day} ({item.date})</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Thời gian</p>
                    <p className="text-sm text-gray-700">{item.timeSlot}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Phòng học</p>
                    <p className="text-sm text-gray-700">{item.room} ({item.building})</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Số SV</p>
                    <p className="text-sm text-gray-700">{item.students} sinh viên</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Môn học</p>
                    <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                    <p className="text-xs text-gray-500">{item.code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Request Creation Tab */}
      {activeTab === "booking-create" && (
        <div className="max-w-2xl">
          {bookingSubmitted && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Yêu cầu đặt phòng đã được gửi!</p>
                <p className="text-xs text-green-700 mt-0.5">Mã yêu cầu: DPK-2025-201 · Đang chờ phê duyệt từ Ban Quản trị</p>
              </div>
            </div>
          )}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Tạo yêu cầu đặt phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Phòng học <span className="text-red-500">*</span></Label>
                    <Select value={bookingForm.room} onValueChange={(v) => setBookingForm((f) => ({ ...f, room: v }))}>
                      <SelectTrigger className={`h-9 text-sm ${bookingErrors.room ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A-201">A-201 (SC: 45)</SelectItem>
                        <SelectItem value="A-301">A-301 (SC: 50)</SelectItem>
                        <SelectItem value="B-105">B-105 (SC: 65)</SelectItem>
                        <SelectItem value="D-201">D-201 Hội trường (SC: 100)</SelectItem>
                      </SelectContent>
                    </Select>
                    {bookingErrors.room && <p className="text-xs text-red-500">{bookingErrors.room}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Ngày <span className="text-red-500">*</span></Label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm((f) => ({ ...f, date: e.target.value }))}
                      className={`w-full h-9 px-3 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${bookingErrors.date ? "border-red-400" : "border-gray-200"}`}
                    />
                    {bookingErrors.date && <p className="text-xs text-red-500">{bookingErrors.date}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Ca học <span className="text-red-500">*</span></Label>
                    <Select value={bookingForm.slot} onValueChange={(v) => setBookingForm((f) => ({ ...f, slot: v }))}>
                      <SelectTrigger className={`h-9 text-sm ${bookingErrors.slot ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn ca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiet1-3">Tiết 1-3 (07:00 - 09:30)</SelectItem>
                        <SelectItem value="tiet4-6">Tiết 4-6 (09:45 - 12:15)</SelectItem>
                        <SelectItem value="tiet7-9">Tiết 7-9 (13:00 - 15:30)</SelectItem>
                      </SelectContent>
                    </Select>
                    {bookingErrors.slot && <p className="text-xs text-red-500">{bookingErrors.slot}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Số người</Label>
                    <Input
                      type="number"
                      placeholder="Nhập số"
                      value={bookingForm.attendees}
                      onChange={(e) => setBookingForm((f) => ({ ...f, attendees: e.target.value }))}
                      className="h-9 text-sm"
                      min="1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Mục đích <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="VD: Thi cuối kỳ, Hội thảo..."
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm((f) => ({ ...f, purpose: e.target.value }))}
                    className={`h-9 text-sm ${bookingErrors.purpose ? "border-red-400" : ""}`}
                  />
                  {bookingErrors.purpose && <p className="text-xs text-red-500">{bookingErrors.purpose}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Ghi chú</Label>
                  <textarea
                    placeholder="Yêu cầu đặc biệt..."
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-sm" disabled={bookingSubmitting}>
                    {bookingSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                  </Button>
                  <Button type="button" variant="outline" className="text-sm" onClick={() => setBookingForm({ room: "", date: "", slot: "", purpose: "", notes: "", attendees: "" })}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Status Tab */}
      {activeTab === "booking-status" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {myBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu đặt phòng</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Mã yêu cầu</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Mục đích</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ngày</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBookings.map((b) => {
                    const cfg = bookingRequestConfig[b.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <TableRow key={b.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="font-mono text-xs font-bold text-blue-700">{b.id}</TableCell>
                        <TableCell className="text-xs font-semibold text-gray-900">{b.room}</TableCell>
                        <TableCell className="text-xs text-gray-700">{b.purpose}</TableCell>
                        <TableCell className="text-xs text-gray-700">{b.date}</TableCell>
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
                <p className="text-xs text-green-700 mt-0.5">Mã yêu cầu: YC-2025-201 · Đang chờ xử lý từ Ban Bảo trì</p>
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
              <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu sửa chữa</p>
            </div>
          ) : (
            maintenanceRequests.map((req) => {
              const typeCfg = maintenanceConfig[req.status];
              const TypeIcon = maintenanceTypeIcons[req.type];
              const StatusIcon = typeCfg.icon;
              return (
                <Card key={req.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Wrench className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{req.id}</p>
                            <Badge variant="outline" className="text-xs">{maintenanceTypeLabels[req.type]}</Badge>
                            <Badge className={`${typeCfg.className} gap-1 text-[11px]`}>
                              <StatusIcon className="w-3 h-3" />
                              {typeCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{req.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Vị trí: {req.location}</span>
                            <span>Ngày: {req.date}</span>
                          </div>
                        </div>
                      </div>
                      <Eye className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
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
                <p className="text-xs font-semibold text-gray-500 uppercase">Trạng thái</p>
                <Badge className={`${maintenanceConfig[selectedRequest.status].className} gap-1 text-xs mt-1`}>
                  {maintenanceConfig[selectedRequest.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Ngày gửi</p>
                <p className="text-sm text-gray-700">{selectedRequest.date}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LecturerPage;
