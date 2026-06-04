import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Search, RefreshCw, Eye, Building2, Calendar, Info, Clock, CheckCircle, Clock3, XCircle, Send, Users, MapPin
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import ScheduleToolbar from "../components/ScheduleToolbar";

const roomUsageData = [
  { id: "CS101.L11", course: "Lập trình hướng đối tượng", room: "A-301", building: "Tòa A", type: "Phòng thường", day: "Thứ 2", slot: "Tiết 1-3", time: "07:00-09:30", lecturer: "TS. Nguyễn Văn An", students: 45, prepStatus: "ready", floor: 3, capacity: 50, section: "D21CNTT01" },
  { id: "NET301.L05", course: "Mạng máy tính", room: "A-101", building: "Tòa A", type: "Phòng thường", day: "Thứ 2", slot: "Tiết 7-9", time: "13:00-15:30", lecturer: "ThS. Lê Minh Tú", students: 38, prepStatus: "not-ready", floor: 1, capacity: 40, section: "D21CNTT02" },
  { id: "DB202.L08", course: "Cơ sở dữ liệu", room: "B-203", building: "Tòa B", type: "Phòng máy", day: "Thứ 3", slot: "Tiết 4-6", time: "09:45-12:15", lecturer: "TS. Phân Quang Hưng", students: 28, prepStatus: "ready", floor: 2, capacity: 30, section: "D21CNTT03" },
  { id: "MATH201.L02", course: "Toán cao cấp 2", room: "C-301", building: "Tòa C", type: "Phòng thường", day: "Thứ 4", slot: "Tiết 1-3", time: "07:00-09:30", lecturer: "GS.TS. Trần Thị Bình", students: 58, prepStatus: "ready", floor: 3, capacity: 60, section: "D21TOAN01" },
  { id: "AI401.L01", course: "Trí tuệ nhân tạo", room: "A-301", building: "Tòa A", type: "Phòng thường", day: "Thứ 5", slot: "Tiết 1-3", time: "07:00-09:30", lecturer: "PGS.TS. Hoàng Văn Nam", students: 35, prepStatus: "not-ready", floor: 3, capacity: 50, section: "D20CNTT01" }
];

const requestHistoryData = [
  { id: "YC-2025-010", type: "Sửa chữa CSVC", detail: "Phòng A-101", date: "11/04/2025", reason: "Điều hòa không mát", status: "processing", response: "Đang chờ bộ phận bảo trì" },
  { id: "YC-2025-008", type: "Sửa chữa CSVC", detail: "Phòng C-301", date: "09/04/2025", reason: "Đèn trần bị cháy 2 bóng", status: "approved", response: "Đã thay mới" }
];

const prepConfig = {
  ready: { label: "Đã chuẩn bị", cls: "bg-green-100 text-green-700" },
  "not-ready": { label: "Chưa chuẩn bị", cls: "bg-orange-100 text-orange-700" }
};

const roomTypeColors = {
  "Phòng thường": "bg-blue-50 text-blue-600",
  "Phòng máy": "bg-purple-50 text-purple-600",
  "Phòng thí nghiệm": "bg-teal-50 text-teal-600",
  "Hội trường nhỏ": "bg-amber-50 text-amber-600"
};

const statusConfigReq = {
  approved: { label: "Hoàn tất", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700", icon: Clock3 },
  rejected: { label: "Từ chối", cls: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700", icon: Clock3 }
};

const timeSlots = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00"];
const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const EmployeePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24"
  });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [modal, setModal] = useState({ item: null });

  // Form states
  const [form, setForm] = useState({ room: "", issue: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestHistory, setRequestHistory] = useState(requestHistoryData);

  const roomsList = ["A-101", "A-301", "A-302", "B-105", "B-203", "C-301", "D-102", "E-101"];

  const filtered = roomUsageData.filter((r) => {
    const matchBuilding = filters.building === "all" || r.building === filters.building || r.room.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || r.room === filters.room;
    return matchBuilding && matchRoom;
  });

  const filteredRooms = roomsList.filter(r => {
    const matchBuilding = filters.building === "all" || r.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || r === filters.room;
    return matchBuilding && matchRoom;
  });

  const gridData = {};
  filtered.forEach(s => {
    if (!gridData[s.room]) gridData[s.room] = {};
    gridData[s.room][`${s.day}-${s.slot}`] = s;
  });

  const validateForm = () => {
    const errs = {};
    if (!form.room) errs.room = "Vui lòng nhập phòng cần sửa chữa";
    if (!form.issue.trim() || form.issue.trim().length < 10) errs.issue = "Mô tả sự cố tối thiểu 10 ký tự";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      const newReq = {
        id: `YC-2025-0${10 + requestHistory.length + 1}`,
        type: "Sửa chữa CSVC",
        detail: `Phòng ${form.room}`,
        date: new Date().toLocaleDateString("vi-VN"),
        reason: form.issue,
        status: "pending",
        response: "-"
      };
      setRequestHistory([newReq, ...requestHistory]);
      setForm({ room: "", issue: "" });
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cổng thông tin Nhân viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} · {user?.code} · {user?.department}
          </p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-1">
          Nhân viên Quản trị CSVC
        </Badge>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { key: "schedule", label: "Lịch sử dụng phòng học" },
          { key: "request", label: "Báo hỏng / Sửa chữa" },
          { key: "history", label: `Lịch sử yêu cầu (${requestHistory.length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSubmitted(false);
            }}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Phòng có lịch", value: new Set(roomUsageData.map(r => r.room)).size, color: "text-blue-600 bg-blue-50" },
              { label: "Tổng ca sử dụng", value: roomUsageData.length, color: "text-purple-600 bg-purple-50" },
              { label: "Đã chuẩn bị", value: roomUsageData.filter(r => r.prepStatus === "ready").length, color: "text-green-600 bg-green-50" },
              { label: "Chưa chuẩn bị", value: roomUsageData.filter(r => r.prepStatus === "not-ready").length, color: "text-orange-600 bg-orange-50" }
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className={`text-2xl font-bold ${stat.color.split(' ')[0]}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          <ScheduleToolbar 
            filters={filters}
            onBuildingChange={(v) => setFilters(f => ({ ...f, building: v }))}
            onRoomChange={(v) => setFilters(f => ({ ...f, room: v }))}
            onWeekChange={(v) => setFilters(f => ({ ...f, week: v }))}
            onDateChange={(v) => setFilters(f => ({ ...f, date: v }))}
            onSearch={() => console.log("Employee searching with filters:", filters)} 
            onRefresh={() => window.location.reload()} 
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              Hiển thị <span className="font-bold text-gray-800">{filtered.length}</span> ca sử dụng · Tuần {filters.week}
            </p>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>Danh sách</button>
              <button onClick={() => setViewMode("grid")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>Dạng lưới</button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[70vh]">
              <div className="min-w-[1200px]">
                {/* Table Header */}
                <div className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm">
                  <div className="p-4 font-bold text-gray-700 border-r border-gray-200 bg-gray-50 sticky left-0 z-30">Phòng / Thứ</div>
                  {days.map(day => (
                    <div key={day} className="p-4 font-bold text-gray-700 text-center border-r border-gray-200 last:border-r-0">{day}</div>
                  ))}
                </div>

                {/* Rows */}
                {filteredRooms.map(room => (
                  <div key={room}>
                    {/* Room Sticky Header */}
                    <div className="grid grid-cols-[150px_repeat(6,1fr)] bg-blue-50/50 border-b border-gray-200 sticky z-10" style={{ top: "53px" }}>
                      <div className="p-3 font-bold text-blue-900 border-r border-gray-200 flex items-center bg-blue-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-blue-400" />
                        {room}
                      </div>
                      <div className="col-span-6 bg-blue-50/30"></div>
                    </div>

                    {/* Time Slots */}
                    {timeSlots.map((timeSlot, idx) => {
                      const slotKey = `Tiết ${idx*3 + 1}-${idx*3 + 3}`; // Map to data slot
                      return (
                        <div key={timeSlot} className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                          <div className="p-3 text-xs font-semibold text-gray-500 border-r border-gray-200 flex items-center bg-gray-50/80 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            {timeSlot}
                          </div>
                          {days.map(day => {
                            const item = gridData[room]?.[`${day}-${slotKey}`];
                            const cellKey = `${room}-${day}-${timeSlot}`;
                            const isHovered = hoveredCell === cellKey;
                            
                            return (
                              <div 
                                key={day}
                                className={`p-2 border-r border-gray-100 last:border-r-0 min-h-[90px] relative transition-all ${
                                  item 
                                    ? item.prepStatus === 'ready' 
                                      ? "bg-green-50 hover:bg-green-100 cursor-pointer" 
                                      : "bg-orange-50 hover:bg-orange-100 cursor-pointer" 
                                    : "hover:bg-gray-50"
                                }`}
                                onMouseEnter={() => setHoveredCell(cellKey)}
                                onMouseLeave={() => setHoveredCell(null)}
                                onClick={() => item && setModal({ item })}
                              >
                                {item && (
                                  <div className="text-xs space-y-1 h-full flex flex-col justify-between">
                                    <div>
                                      <p className="font-bold text-gray-900 leading-tight mb-1">{item.course}</p>
                                      <p className="text-[10px] text-gray-600 truncate">{item.lecturer}</p>
                                    </div>
                                    <Badge className={`${prepConfig[item.prepStatus].cls} text-[9px] h-4 px-1 w-fit mt-2`}>
                                      {prepConfig[item.prepStatus].label}
                                    </Badge>
                                  </div>
                                )}
                                {isHovered && item && (
                                  <div className="absolute z-40 top-full left-0 mt-1 bg-gray-900 text-white p-3 rounded-lg shadow-xl text-[11px] w-52 animate-in fade-in zoom-in duration-200">
                                    <div className="font-bold border-b border-gray-700 pb-1.5 mb-1.5">{item.course}</div>
                                    <div className="space-y-1 text-gray-300">
                                      <div className="flex justify-between">
                                        <span>Giảng viên:</span>
                                        <span className="font-semibold text-white">{item.lecturer}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Phòng:</span>
                                        <span className="font-semibold text-white">{room}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Mã lớp:</span>
                                        <span className="font-semibold text-white">{item.section}</span>
                                      </div>
                                      <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                        <span>Thời gian:</span>
                                        <span className="font-semibold text-blue-300">{timeSlot}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-600">Phòng học</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Ca học / Giờ</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Môn học</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Giảng viên</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-center">Tình trạng</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-center">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell>
                          <p className="text-xs font-bold text-blue-700">{item.room}</p>
                          <p className="text-[11px] text-gray-400">{item.building}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-800">{item.slot}</div>
                          <p className="text-[11px] text-gray-400">{item.time}</p>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-700">{item.course}</TableCell>
                        <TableCell className="text-xs text-gray-600">{item.lecturer}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${prepConfig[item.prepStatus].cls} text-[11px]`}>{prepConfig[item.prepStatus].label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <button onClick={() => setModal({ item })} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">Xem</button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "request" && (
        <div className="max-w-xl">
          {submitted && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Báo lỗi thành công!</p>
                <p className="text-xs text-green-700 mt-0.5">Yêu cầu đã được gửi đến bộ phận quản trị thiết bị.</p>
              </div>
            </div>
          )}

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-4 border-b bg-gray-50/50">
              <CardTitle className="text-base font-bold text-gray-800">Báo hỏng / Yêu cầu sửa chữa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Phòng bị sự cố <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.room}
                    onChange={(e) => setForm(f => ({ ...f, room: e.target.value }))}
                    placeholder="VD: A-301"
                    className={`h-11 ${formErrors.room ? "border-red-400" : ""}`}
                  />
                  {formErrors.room && <p className="text-xs text-red-500">{formErrors.room}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Mô tả sự cố <span className="text-red-500">*</span></Label>
                  <textarea
                    value={form.issue}
                    onChange={(e) => setForm(f => ({ ...f, issue: e.target.value }))}
                    placeholder="Mô tả chi tiết thiết bị hỏng (máy chiếu, đèn, điều hòa...)"
                    rows={4}
                    className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${formErrors.issue ? "border-red-400" : "border-gray-200"}`}
                  />
                  {formErrors.issue && <p className="text-xs text-red-500">{formErrors.issue}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-sm font-bold gap-2" disabled={submitting}>
                    {submitting ? "Đang gửi..." : <><Send className="w-4 h-4" /> Gửi báo lỗi</>}
                  </Button>
                  <Button type="button" variant="outline" className="h-11 px-8 text-sm font-semibold" onClick={() => setForm({ room: "", issue: "" })}>Hủy</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Mã báo lỗi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Chi tiết</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ngày gửi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Mô tả</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phản hồi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestHistory.map((r) => {
                  const cfg = statusConfigReq[r.status];
                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50 border-b border-gray-100 text-xs">
                      <TableCell className="font-mono font-bold text-blue-700">{r.id}</TableCell>
                      <TableCell className="font-medium text-gray-700">{r.detail}</TableCell>
                      <TableCell className="text-gray-500">{r.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${cfg.cls} gap-1 text-[10px]`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 italic">{r.response}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {modal.item && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModal({ item: null })}>
          <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-600 px-5 py-4">
              <h3 className="text-sm font-bold text-white">Chi tiết ca sử dụng phòng</h3>
              <p className="text-xs text-blue-200 mt-0.5">{modal.item.room} · {modal.item.day}</p>
            </div>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-1 font-medium">Môn học</p>
                  <p className="font-bold text-gray-900 leading-tight">{modal.item.course}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1 font-medium">Giảng viên</p>
                  <p className="font-bold text-gray-900">{modal.item.lecturer}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1 font-medium">Thời gian</p>
                  <p className="font-bold text-gray-900">{modal.item.slot} ({modal.item.time})</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1 font-medium">Trạng thái phòng</p>
                  <Badge className={`${prepConfig[modal.item.prepStatus].cls} h-5 text-[10px]`}>{prepConfig[modal.item.prepStatus].label}</Badge>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setModal({ item: null })}>Đóng</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { EmployeePage };
export default EmployeePage;
