import { Fragment, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Calendar, Clock, MapPin, Users, CheckCircle, Clock3, XCircle, Send, Eye, BookOpen, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ScheduleGridView } from "../components/ScheduleGridView";
import { Input } from "../components/ui/input";

const mySchedule = [
  { id: 1, section: "CS101.L11", name: "Lập trình hướng đối tượng", credits: 3, class: "D21CNTT01", students: 45, day: "Thứ 2", slot: "Tiết 1-3", time: "07:00 - 09:30", room: "A-301", building: "Toà A", status: "active", week: "Tuần 15" },
  { id: 2, section: "CS201.L03", name: "Cấu trúc dữ liệu & GT", credits: 3, class: "D21CNTT02", students: 42, day: "Thứ 3", slot: "Tiết 4-6", time: "09:45 - 12:15", room: "A-205", building: "Toà A", status: "active", week: "Tuần 15" },
  { id: 3, section: "AI401.L01", name: "Trí tuệ nhân tạo", credits: 3, class: "D20CNTT01", students: 35, day: "Thứ 5", slot: "Tiết 1-3", time: "07:00 - 09:30", room: "A-301", building: "Toà A", status: "conflict", week: "Tuần 15" },
  { id: 4, section: "CS101.L12", name: "Lập trình hướng đối tượng", credits: 3, class: "D21CNTT03", students: 48, day: "Thứ 6", slot: "Tiết 7-9", time: "13:00 - 15:30", room: "B-102", building: "Toà B", status: "active", week: "Tuần 15" }
];

const requestHistoryData = [
  { id: "YC-2025-041", type: "Đổi phòng", detail: "AI401.L01", date: "08/04/2025", reason: "Phòng A-301 thiếu điều hoà", status: "approved", response: "Đã chuyển sang phòng A-302" },
  { id: "YC-2025-042", type: "Đặt phòng", detail: "Bù giờ CS101.L11, Phòng A-101", date: "09/04/2025", reason: "Dạy bù cho sinh viên", status: "pending", response: "-" },
  { id: "YC-2025-028", type: "Sửa chữa CSVC", detail: "Phòng A-301", date: "01/04/2025", reason: "Máy chiếu phòng A-301 bị lỗi", status: "processing", response: "Đội kỹ thuật đang xử lý" }
];

const statusConfigSchedule = {
  active: { label: "Đang dạy", cls: "bg-green-100 text-green-700" },
  conflict: { label: "Xung đột", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" }
};

const statusConfigReq = {
  approved: { label: "Đã duyệt", cls: "bg-green-100 text-green-700", icon: CheckCircle },
  processing: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700", icon: Clock3 },
  rejected: { label: "Từ chối", cls: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700", icon: Clock3 }
};

const LecturerPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedSession, setSelectedSession] = useState(null);
  const [week, setWeek] = useState("15");
  const [viewMode, setViewMode] = useState("grid");
  
  // Form states
  const [form, setForm] = useState({ type: "", section: "", applyDate: "", reason: "", room: "", slot: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestHistory, setRequestHistory] = useState(requestHistoryData);

  const validateForm = () => {
    const errs = {};
    if (!form.type) errs.type = "Vui lòng chọn loại yêu cầu";
    if (form.type === "room-change" || form.type === "schedule-change") {
      if (!form.section) errs.section = "Vui lòng chọn lớp học phần";
    }
    if (form.type === "booking") {
      if (!form.room) errs.room = "Vui lòng nhập phòng muốn đặt";
      if (!form.applyDate) errs.applyDate = "Vui lòng chọn ngày";
      if (!form.slot) errs.slot = "Vui lòng nhập ca học";
    }
    if (form.type === "repair") {
      if (!form.room) errs.room = "Vui lòng nhập phòng cần sửa chữa";
    }
    if (!form.reason.trim() || form.reason.trim().length < 10) errs.reason = "Lý do phải tối thiểu 10 ký tự";
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
      
      let typeLabel = "Khác";
      let detail = "-";
      if (form.type === "room-change") { typeLabel = "Đổi phòng"; detail = form.section; }
      if (form.type === "booking") { typeLabel = "Đặt phòng"; detail = `Phòng ${form.room}`; }
      if (form.type === "repair") { typeLabel = "Sửa chữa CSVC"; detail = `Phòng ${form.room}`; }
      if (form.type === "schedule-change") { typeLabel = "Đổi lịch"; detail = form.section; }

      const newReq = {
        id: `YC-2025-0${50 + requestHistory.length}`,
        type: typeLabel,
        detail: detail,
        date: new Date().toLocaleDateString("vi-VN"),
        reason: form.reason,
        status: "pending",
        response: "-"
      };

      setRequestHistory([newReq, ...requestHistory]);
      setForm({ type: "", section: "", applyDate: "", reason: "", room: "", slot: "" });
    }, 1200);
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cổng thông tin Giảng viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} · {user?.code} · {user?.department}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Học kỳ 1, 2024-2025</p>
          <p className="text-xs font-semibold text-blue-700 mt-0.5">{mySchedule.length} lớp đang phụ trách</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Số lớp HK1", value: mySchedule.length, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Tổng tiết/tuần", value: mySchedule.length * 3, icon: Clock, color: "text-purple-600 bg-purple-50" },
          { label: "Tổng sinh viên", value: mySchedule.reduce((a, s) => a + s.students, 0), icon: Users, color: "text-green-600 bg-green-50" },
          { label: "Xung đột lịch", value: mySchedule.filter(s => s.status === "conflict").length, icon: XCircle, color: "text-red-600 bg-red-50" }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { key: "schedule", label: "Lịch dạy của tôi" },
          { key: "request", label: "Tạo yêu cầu" },
          { key: "history", label: `Lịch sử yêu cầu (${requestHistory.length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSubmitted(false);
            }}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setWeek(w => String(Math.max(1, Number(w) - 1)))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-semibold text-gray-700">Tuần {week}</span>
                <button onClick={() => setWeek(w => String(Math.min(20, Number(w) + 1)))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                  >Danh sách</button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                  >Lịch tuần</button>
                </div>
                <Select value={week} onValueChange={setWeek}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                      <SelectItem key={w} value={String(w)}>Tuần {w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {viewMode === "list" ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs font-semibold text-gray-600">Môn học / Lớp HP</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Lớp SV</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 text-center">SV</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Thứ / Ca</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Giờ học</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 text-center">Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mySchedule.map((s) => {
                        const sCfg = statusConfigSchedule[s.status];
                        return (
                          <TableRow
                            key={s.id}
                            onClick={() => setSelectedSession(s)}
                            className={`hover:bg-blue-50/40 border-b border-gray-100 cursor-pointer transition-colors ${selectedSession?.id === s.id ? "bg-blue-50" : ""} ${s.status === "conflict" ? "bg-red-50/30" : ""}`}
                          >
                            <TableCell>
                              <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                              <p className="text-[11px] font-mono text-blue-600 mt-0.5">{s.section}</p>
                            </TableCell>
                            <TableCell className="text-xs text-gray-700">{s.class}</TableCell>
                            <TableCell className="text-xs text-center">{s.students}</TableCell>
                            <TableCell className="text-xs text-gray-700 whitespace-nowrap">{s.day} · {s.slot}</TableCell>
                            <TableCell className="text-xs text-gray-600 whitespace-nowrap">{s.time}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-900">{s.room}</span>
                              </div>
                              <p className="text-[11px] text-gray-400 ml-4">{s.building}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`${sCfg.cls} hover:${sCfg.cls} text-[11px]`}>{sCfg.label}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <ScheduleGridView
                items={mySchedule.map(s => ({
                  id: s.id,
                  name: s.name,
                  subLabel: s.section,
                  detail1: `${s.class} · ${s.students} SV`,
                  detail2: `${s.room} (${s.building})`,
                  day: s.day,
                  slot: s.slot,
                  time: s.time,
                  color: s.status === 'conflict' ? 'red' : 'blue',
                  badge: statusConfigSchedule[s.status].label
                }))}
                onItemClick={(item) => {
                  const session = mySchedule.find(s => s.id === item.id);
                  if (session) setSelectedSession(session);
                }}
                compactDays={true}
              />
            )}
          </div>

          <div>
            {selectedSession ? (
              <Card className="shadow-sm border-0 ring-1 ring-blue-200 sticky top-4">
                <CardHeader className="pb-3 bg-blue-600 rounded-t-xl">
                  <CardTitle className="text-sm font-bold text-white">{selectedSession.name}</CardTitle>
                  <p className="text-xs text-blue-200 mt-0.5 font-mono">{selectedSession.section}</p>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {[
                    { icon: Users, label: "Lớp sinh viên", value: selectedSession.class },
                    { icon: Users, label: "Số sinh viên", value: `${selectedSession.students} SV` },
                    { icon: BookOpen, label: "Số tín chỉ", value: `${selectedSession.credits} TC` },
                    { icon: Calendar, label: "Lịch học", value: `${selectedSession.day} · ${selectedSession.slot}` },
                    { icon: Clock, label: "Giờ học", value: selectedSession.time },
                    { icon: MapPin, label: "Phòng học", value: `${selectedSession.room} (${selectedSession.building})` }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400">{item.label}</p>
                          <p className="text-xs font-semibold text-gray-900">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}

                  {selectedSession.status === "conflict" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-700">⚠️ Xung đột lịch phát hiện</p>
                      <p className="text-[11px] text-red-600 mt-1">Phòng {selectedSession.room} có thể bị trùng lịch. Vui lòng gửi yêu cầu đổi phòng.</p>
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 mt-2"
                    onClick={() => {
                      setActiveTab("request");
                      setForm(f => ({ ...f, type: "room-change", section: selectedSession.section }));
                    }}
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi yêu cầu cho lớp này
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center p-6">
                <Calendar className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400 font-medium">Chọn một buổi học</p>
                <p className="text-xs text-gray-300 mt-1">để xem thông tin chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "request" && (
        <div className="max-w-xl">
          {submitted && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Yêu cầu đã được gửi thành công!</p>
                <p className="text-xs text-green-700 mt-0.5">Phòng Đào tạo / Kỹ thuật sẽ xử lý trong 1-2 ngày làm việc</p>
              </div>
            </div>
          )}

          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Mẫu gửi yêu cầu / Phản hồi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Loại yêu cầu <span className="text-red-500">*</span></Label>
                  <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className={`h-9 text-sm ${formErrors.type ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="Chọn loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Đặt phòng học (dạy bù, kiểm tra)</SelectItem>
                      <SelectItem value="repair">Yêu cầu sửa chữa CSVC</SelectItem>
                      <SelectItem value="room-change">Đổi phòng học</SelectItem>
                      <SelectItem value="schedule-change">Đổi lịch dạy</SelectItem>
                      <SelectItem value="feedback">Phản hồi khác</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.type && <p className="text-xs text-red-500">{formErrors.type}</p>}
                </div>

                {(form.type === "room-change" || form.type === "schedule-change") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Lớp học phần liên quan <span className="text-red-500">*</span></Label>
                    <Select value={form.section} onValueChange={(v) => setForm(f => ({ ...f, section: v }))}>
                      <SelectTrigger className={`h-9 text-sm ${formErrors.section ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn lớp học phần" />
                      </SelectTrigger>
                      <SelectContent>
                        {mySchedule.map(s => (
                          <SelectItem key={s.section} value={s.section}>{s.section} — {s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.section && <p className="text-xs text-red-500">{formErrors.section}</p>}
                  </div>
                )}

                {(form.type === "booking" || form.type === "repair") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Phòng <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.room}
                      onChange={(e) => setForm(f => ({ ...f, room: e.target.value }))}
                      placeholder={form.type === "booking" ? "VD: A-101 (Phòng muốn đặt)" : "VD: A-101 (Phòng cần sửa chữa)"}
                      className={`h-9 text-sm ${formErrors.room ? "border-red-400" : ""}`}
                    />
                    {formErrors.room && <p className="text-xs text-red-500">{formErrors.room}</p>}
                  </div>
                )}

                {(form.type === "room-change" || form.type === "schedule-change" || form.type === "booking") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Ngày áp dụng/mượn <span className="text-red-500">*</span></Label>
                      <input
                        type="date"
                        value={form.applyDate}
                        onChange={(e) => setForm(f => ({ ...f, applyDate: e.target.value }))}
                        className={`w-full h-9 px-3 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.applyDate ? "border-red-400" : "border-gray-200"}`}
                      />
                      {formErrors.applyDate && <p className="text-xs text-red-500">{formErrors.applyDate}</p>}
                    </div>
                    {form.type === "booking" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-700">Ca học / Tiết <span className="text-red-500">*</span></Label>
                        <Input
                          value={form.slot}
                          onChange={(e) => setForm(f => ({ ...f, slot: e.target.value }))}
                          placeholder="VD: Tiết 1-3"
                          className={`h-9 text-sm ${formErrors.slot ? "border-red-400" : ""}`}
                        />
                        {formErrors.slot && <p className="text-xs text-red-500">{formErrors.slot}</p>}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Lý do / Nội dung chi tiết <span className="text-red-500">*</span></Label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Mô tả chi tiết..."
                    rows={4}
                    className={`w-full px-3 py-2 text-sm border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${formErrors.reason ? "border-red-400" : "border-gray-200"}`}
                  />
                  <div className="flex justify-between">
                    {formErrors.reason ? (
                      <p className="text-xs text-red-500">{formErrors.reason}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Tối thiểu 10 ký tự</p>
                    )}
                    <p className="text-xs text-gray-400">{form.reason.length} ký tự</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-sm gap-2" disabled={submitting}>
                    {submitting ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang gửi...</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Gửi yêu cầu</>
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="text-sm" onClick={() => setForm({ type: "", section: "", applyDate: "", reason: "", room: "", slot: "" })}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {requestHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
              <Clock3 className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu nào</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-600">Mã yêu cầu</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Loại</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Chi tiết / Phòng</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Ngày gửi</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Nội dung</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Phản hồi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestHistory.map((r) => {
                      const cfg = statusConfigReq[r.status];
                      const StatusIcon = cfg.icon;

                      return (
                        <TableRow key={r.id} className="hover:bg-gray-50 border-b border-gray-100">
                          <TableCell className="font-mono text-xs font-bold text-blue-700">{r.id}</TableCell>
                          <TableCell><Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-[11px]">{r.type}</Badge></TableCell>
                          <TableCell className="text-xs text-gray-700 font-medium">{r.detail}</TableCell>
                          <TableCell className="text-xs text-gray-500">{r.date}</TableCell>
                          <TableCell className="text-xs text-gray-700 max-w-[180px]">
                            <div className="truncate" title={r.reason}>{r.reason}</div>
                          </TableCell>
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
      )}
    </div>
  );
};

export { LecturerPage };
