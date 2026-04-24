import { useState } from "react";
import { Plus, CheckCircle, Clock, XCircle, Eye, Search, Wrench, Zap, Droplets, Home, AlertTriangle, AlertCircle, X, Upload, Calendar, GraduationCap, Send, PlusSquare } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Input } from "../../../app/components/ui/input";
import { Label } from "../../../app/components/ui/label";
import { Badge } from "../../../app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../app/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../app/components/ui/dialog";
import RoomSearchModal from "../../../app/components/booking/RoomSearchModal";
import ScheduleToolbar from "../../../app/components/ScheduleToolbar";

const scheduleData = [
  { id: 1, code: "SE101", subject: "Lập trình Java", lecturer: "TS. Nguyễn Văn A", room: "A-201", building: "A", day: "Thứ 2", slot: "Tiết 1-3", time: "07:00-09:30", credits: 3, status: "ongoing" },
  { id: 2, code: "SE102", subject: "Cấu trúc dữ liệu", lecturer: "PGS. Trần Thị B", room: "B-301", building: "B", day: "Thứ 3", slot: "Tiết 4-6", time: "09:45-12:15", credits: 3, status: "upcoming" },
  { id: 3, code: "SE201", subject: "Web Development", lecturer: "TS. Phạm Văn C", room: "C-105", building: "C", day: "Thứ 5", slot: "Tiết 7-9", time: "13:00-15:30", credits: 3, status: "upcoming" }
];

const maintenanceConfig = {
  pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  processing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-700", icon: Zap },
  completed: { label: "Hoàn thành", className: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Hủy", className: "bg-gray-100 text-gray-700", icon: XCircle }
};

const StudentPage = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [displayMode, setDisplayMode] = useState("grid");
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24"
  });

  const filteredSchedule = scheduleData.filter(s => {
    const matchBuilding = filters.building === "all" || s.building === filters.building || s.room.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || s.room === filters.room;
    return matchBuilding && matchRoom;
  });
  
  // Maintenance request state
  const [maintenanceForm, setMaintenanceForm] = useState({ type: "", location: "", description: "", urgency: "normal" });
  const [attachments, setAttachments] = useState([]);
  const [maintenanceErrors, setMaintenanceErrors] = useState({});
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [maintenanceSubmitted, setMaintenanceSubmitted] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([
    { id: "YC-STU-001", type: "electrical", location: "A-201", description: "Quạt trần không hoạt động", urgency: "normal", date: "10/04/2025", status: "completed" },
    { id: "YC-STU-002", type: "furniture", location: "B-301", description: "Bàn học bị hỏng", urgency: "normal", date: "11/04/2025", status: "processing" }
  ]);

  // Booking state
  const [bookingForm, setBookingForm] = useState({ room: "", date: "", slot: "", reason: "" });
  const [bookingErrors, setBookingErrors] = useState({});
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);

  const handleRoomSelect = (roomId) => {
    setBookingForm(prev => ({ ...prev, room: roomId }));
    setIsRoomSearchOpen(false);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.room || !bookingForm.date || !bookingForm.slot || !bookingForm.reason) {
      setBookingErrors({ 
        room: !bookingForm.room ? "Bắt buộc" : "", 
        date: !bookingForm.date ? "Bắt buộc" : "",
        slot: !bookingForm.slot ? "Bắt buộc" : "",
        reason: !bookingForm.reason ? "Bắt buộc" : ""
      });
      return;
    }
    setBookingSubmitting(true);
    setTimeout(() => {
      setBookingSubmitting(false);
      setBookingSubmitted(true);
      setBookingForm({ room: "", date: "", slot: "", reason: "" });
    }, 1200);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files.map(f => ({ file: f, id: Math.random().toString(36).substr(2, 9) }))]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    if (!maintenanceForm.location || !maintenanceForm.description) {
      setMaintenanceErrors({ location: !maintenanceForm.location ? "Bắt buộc" : "", description: !maintenanceForm.description ? "Bắt buộc" : "" });
      return;
    }
    setMaintenanceSubmitting(true);
    setTimeout(() => {
      setMaintenanceSubmitting(false);
      setMaintenanceSubmitted(true);
      setAttachments([]);
      setMaintenanceForm({ type: "", location: "", description: "", urgency: "normal" });
    }, 1200);
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cổng thông tin Sinh viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">Xem lịch học và gửi yêu cầu hỗ trợ</p>
        </div>
        <Badge className="bg-blue-50 text-blue-700 border-blue-100">Học kỳ 1 (2024-2025)</Badge>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        {[
          { key: "schedule", label: "Lịch học của tôi", icon: Calendar },
          { key: "booking", label: "Đăng ký mượn phòng", icon: PlusSquare },
          { key: "maintenance-create", label: "Yêu cầu sửa chữa", icon: Wrench },
          { key: "maintenance-status", label: "Lịch sử yêu cầu", icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setMaintenanceSubmitted(false);
                setBookingSubmitted(false);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "schedule" && (
        <div className="space-y-4">
          <ScheduleToolbar 
            filters={filters}
            onBuildingChange={(v) => setFilters(f => ({ ...f, building: v }))}
            onRoomChange={(v) => setFilters(f => ({ ...f, room: v }))}
            onWeekChange={(v) => setFilters(f => ({ ...f, week: v }))}
            onDateChange={(v) => setFilters(f => ({ ...f, date: v }))}
            onSearch={() => console.log("Searching student schedule with filters:", filters)} 
            onRefresh={() => window.location.reload()} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedule.map((item) => (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">{item.subject}</CardTitle>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.code} • {item.credits} tín chỉ</p>
                    </div>
                    <Badge variant={item.status === 'ongoing' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                      {item.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp tới'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Phòng học</p>
                      <p className="text-sm font-bold text-gray-700">{item.room} (Tòa {item.building})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Thời gian</p>
                      <p className="text-sm font-bold text-gray-700">{item.day} • {item.slot}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Giảng viên</p>
                      <p className="text-sm font-bold text-gray-700">{item.lecturer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "booking" && (
        <div className="max-w-2xl mx-auto py-4">
          {bookingSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-green-900">Yêu cầu đã được gửi!</h2>
              <p className="text-gray-600 mt-2">Vui lòng chờ xác nhận từ Phòng Đào tạo trong 24h tới.</p>
              <Button className="mt-6 bg-green-600 hover:bg-green-700" onClick={() => setBookingSubmitted(false)}>Tạo yêu cầu khác</Button>
            </div>
          ) : (
            <Card className="shadow-lg border-0 ring-1 ring-gray-200">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <PlusSquare className="w-5 h-5 text-blue-600" />
                  Đăng ký mượn phòng học
                </CardTitle>
                <p className="text-xs text-gray-500">Sử dụng cho mục đích họp nhóm, CLB hoặc tự học.</p>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                      <span>Phòng đề xuất <span className="text-red-500">*</span></span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 px-2"
                        onClick={() => setIsRoomSearchOpen(true)}
                      >
                        <Search className="w-3 h-3" />
                        Tìm phòng trống
                      </Button>
                    </Label>
                    <Input 
                      placeholder="VD: A-201" 
                      className={`h-11 text-sm ${bookingErrors.room ? "border-red-500" : ""}`}
                      value={bookingForm.room}
                      onChange={(e) => setBookingForm(f => ({...f, room: e.target.value}))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-700">Ngày sử dụng <span className="text-red-500">*</span></Label>
                      <input 
                        type="date"
                        className={`w-full h-11 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${bookingErrors.date ? "border-red-500" : "border-gray-200"}`}
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm(f => ({...f, date: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-700">Ca học / Tiết <span className="text-red-500">*</span></Label>
                      <Select value={bookingForm.slot} onValueChange={(v) => setBookingForm(f => ({...f, slot: v}))}>
                        <SelectTrigger className={`h-11 ${bookingErrors.slot ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Chọn ca" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tiết 1-3">Tiết 1-3 (07:00 - 09:25)</SelectItem>
                          <SelectItem value="Tiết 4-6">Tiết 4-6 (09:35 - 12:00)</SelectItem>
                          <SelectItem value="Tiết 7-9">Tiết 7-9 (13:00 - 15:25)</SelectItem>
                          <SelectItem value="Tiết 10-12">Tiết 10-12 (15:35 - 18:00)</SelectItem>
                          <SelectItem value="Tiết 13-15">Tiết 13-15 (18:15 - 20:40)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">Lý do mượn phòng <span className="text-red-500">*</span></Label>
                    <textarea 
                      className={`w-full min-h-[100px] p-4 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${bookingErrors.reason ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Mô tả chi tiết mục đích sử dụng..."
                      value={bookingForm.reason}
                      onChange={(e) => setBookingForm(f => ({...f, reason: e.target.value}))}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" className="h-11 px-6" onClick={() => setBookingForm({ room: "", date: "", slot: "", reason: "" })}>Hủy</Button>
                    <Button type="submit" className="h-11 px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100" disabled={bookingSubmitting}>
                      {bookingSubmitting ? "Đang xử lý..." : "Gửi yêu cầu đặt phòng"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "maintenance-create" && (
        <div className="max-w-2xl mx-auto py-4">
          {maintenanceSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-green-900">Đã gửi yêu cầu sửa chữa!</h2>
              <p className="text-gray-600 mt-2">Chúng tôi sẽ tiếp nhận và xử lý sự cố này sớm nhất có thể.</p>
              <Button className="mt-6 bg-green-600 hover:bg-green-700" onClick={() => setMaintenanceSubmitted(false)}>Tạo yêu cầu mới</Button>
            </div>
          ) : (
            <Card className="shadow-lg border-0 ring-1 ring-gray-200">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  Báo cáo sự cố thiết bị
                </CardTitle>
                <p className="text-xs text-gray-500">Giúp nhà trường cải thiện cơ sở vật chất bằng cách báo cáo hư hỏng.</p>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleMaintenanceSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700">Loại sự cố</Label>
                      <Select value={maintenanceForm.type} onValueChange={(v) => setMaintenanceForm(f => ({...f, type: v}))}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electrical">Điện (Quạt, Đèn, Điều hòa)</SelectItem>
                          <SelectItem value="furniture">Nội thất (Bàn, Ghế, Cửa)</SelectItem>
                          <SelectItem value="plumbing">Nước (Vòi nước, Nhà vệ sinh)</SelectItem>
                          <SelectItem value="equipment">Thiết bị (Máy chiếu, Loa)</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700">Vị trí / Phòng</Label>
                      <Input 
                        placeholder="VD: A-301" 
                        className={`h-10 text-sm ${maintenanceErrors.location ? "border-red-500" : ""}`}
                        value={maintenanceForm.location}
                        onChange={(e) => setMaintenanceForm(f => ({...f, location: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700">Mô tả chi tiết</Label>
                    <textarea 
                      className={`w-full min-h-[100px] p-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${maintenanceErrors.description ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Mô tả cụ thể sự cố cần sửa chữa..."
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm(f => ({...f, description: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-700">Minh chứng hình ảnh/video</Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">Tải lên hình ảnh sự cố</p>
                        </div>
                        <input type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,video/*" />
                      </label>
                    </div>
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {attachments.map(a => (
                          <div key={a.id} className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium border border-blue-100">
                            <span className="truncate max-w-[150px]">{a.file.name}</span>
                            <button type="button" onClick={() => removeAttachment(a.id)} className="text-blue-400 hover:text-blue-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" className="h-10 text-sm" onClick={() => setMaintenanceForm({ type: "", location: "", description: "", urgency: "normal" })}>Xóa form</Button>
                    <Button type="submit" className="h-10 text-sm bg-blue-600 hover:bg-blue-700 px-6" disabled={maintenanceSubmitting}>
                      {maintenanceSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "maintenance-status" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">Mã YC</TableHead>
                <TableHead className="text-xs font-semibold">Vị trí</TableHead>
                <TableHead className="text-xs font-semibold">Mô tả</TableHead>
                <TableHead className="text-xs font-semibold">Ngày gửi</TableHead>
                <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceRequests.map((req) => (
                <TableRow key={req.id} className="hover:bg-gray-50 border-b border-gray-100">
                  <TableCell className="text-xs font-bold text-blue-700">{req.id}</TableCell>
                  <TableCell className="text-xs font-medium">{req.location}</TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-xs truncate">{req.description}</TableCell>
                  <TableCell className="text-xs text-gray-500">{req.date}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${maintenanceConfig[req.status].className} text-[10px] px-2 py-0.5`}>
                      {maintenanceConfig[req.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RoomSearchModal 
        open={isRoomSearchOpen} 
        onOpenChange={setIsRoomSearchOpen} 
        onSelect={handleRoomSelect}
        date={bookingForm.date}
        slot={bookingForm.slot}
      />
    </div>
  );
};

export default StudentPage;
