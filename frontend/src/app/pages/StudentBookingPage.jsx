import { useState } from "react";
import { CheckCircle, Send, PlusSquare, Search, AlertCircle, Users, Clock, Calendar, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import RoomSearchModal from "../components/booking/RoomSearchModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const StudentBookingPage = () => {
  const [form, setForm] = useState({ 
    room: "", 
    applyDate: "", 
    slot: "", 
    purpose: "", 
    attendees: "", 
    classCode: "",
    notes: "" 
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);

  const handleRoomSelect = (roomId) => {
    setForm(prev => ({ ...prev, room: roomId }));
    setIsRoomSearchOpen(false);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.room) errs.room = "Vui lòng chọn phòng học";
    if (!form.applyDate) errs.applyDate = "Vui lòng chọn ngày mượn";
    if (!form.slot) errs.slot = "Vui lòng chọn ca mượn";
    if (!form.purpose.trim() || form.purpose.trim().length < 5) errs.purpose = "Vui lòng nhập mục đích sử dụng";
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
      setForm({ room: "", applyDate: "", slot: "", purpose: "", attendees: "", classCode: "", notes: "" });
    }, 1200);
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Yêu cầu mượn phòng (Sinh viên)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Đặt phòng cho sinh hoạt CLB, họp nhóm hoặc tự học ngoài giờ</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
          Học kỳ 1, 2024-2025
        </Badge>
      </div>

      {submitted ? (
        <Card className="border-green-200 bg-green-50 shadow-sm animate-in zoom-in-95 duration-300">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-900">Gửi yêu cầu thành công!</h3>
            <p className="text-sm text-green-700 mt-2 max-w-md mx-auto">
              Yêu cầu mượn phòng của bạn đã được gửi. Kết quả sẽ được thông báo sau khi bộ phận quản lý phê duyệt.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => setSubmitted(false)} className="bg-green-600 hover:bg-green-700">Tạo yêu cầu mới</Button>
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">Xem lịch sử mượn</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <PlusSquare className="w-5 h-5 text-green-600" />
                Phiếu đăng ký mượn phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày mượn phòng <span className="text-red-500">*</span></Label>
                    <Input 
                      type="date" 
                      value={form.applyDate} 
                      onChange={(e) => setForm(f => ({ ...f, applyDate: e.target.value }))} 
                      className={`h-11 ${formErrors.applyDate ? "border-red-400" : ""}`} 
                    />
                    {formErrors.applyDate && <p className="text-[11px] text-red-500">{formErrors.applyDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ca mượn / Tiết <span className="text-red-500">*</span></Label>
                    <Select value={form.slot} onValueChange={(v) => setForm(f => ({ ...f, slot: v }))}>
                      <SelectTrigger className={`h-11 ${formErrors.slot ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn ca học" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tiết 1-3">Tiết 1-3 (07:00 - 09:25)</SelectItem>
                        <SelectItem value="Tiết 4-6">Tiết 4-6 (09:35 - 12:00)</SelectItem>
                        <SelectItem value="Tiết 7-9">Tiết 7-9 (13:00 - 15:25)</SelectItem>
                        <SelectItem value="Tiết 10-12">Tiết 10-12 (15:35 - 18:00)</SelectItem>
                        <SelectItem value="Tiết 13-15">Tiết 13-15 (18:15 - 20:40)</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.slot && <p className="text-[11px] text-red-500">{formErrors.slot}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Phòng học mong muốn <span className="text-red-500">*</span></Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 gap-1.5 px-3 rounded-full border border-green-100"
                        onClick={() => setIsRoomSearchOpen(true)}
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Tìm phòng trống</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <Input 
                        value={form.room} 
                        onChange={(e) => setForm(f => ({ ...f, room: e.target.value }))} 
                        placeholder="Nhập mã phòng (VD: A-301)" 
                        className={`h-11 pl-10 ${formErrors.room ? "border-red-400" : ""}`} 
                      />
                    </div>
                    {formErrors.room && <p className="text-[11px] text-red-500">{formErrors.room}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Lý do mượn / Mục đích <span className="text-red-500">*</span></Label>
                    <Input 
                      value={form.purpose} 
                      onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} 
                      placeholder="VD: Họp CLB Tin học, Họp nhóm làm đồ án..." 
                      className={`h-11 ${formErrors.purpose ? "border-red-400" : ""}`} 
                    />
                    {formErrors.purpose && <p className="text-[11px] text-red-500">{formErrors.purpose}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ghi chú bổ sung</Label>
                    <textarea 
                      value={form.notes} 
                      onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} 
                      placeholder="Các yêu cầu khác về thiết bị..." 
                      rows={3} 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 h-11 px-8 text-sm font-bold gap-2 shadow-md shadow-green-100" disabled={submitting}>
                    {submitting ? "Đang xử lý..." : <><Send className="w-4 h-4" /> Gửi yêu cầu mượn phòng</>}
                  </Button>
                  <Button type="button" variant="outline" className="h-11 px-8 text-sm font-semibold" onClick={() => setForm({ room: "", applyDate: "", slot: "", purpose: "", attendees: "", classCode: "", notes: "" })}>
                    Làm mới
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-amber-100 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Quy định mượn phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Sinh viên mượn phòng phải có mục đích học tập/ngoại khóa rõ ràng.",
                  "Yêu cầu gửi trước ít nhất 1 ngày làm việc.",
                  "Giữ gìn vệ sinh và tài sản của phòng học sau khi sử dụng.",
                  "Tắt hết thiết bị điện trước khi bàn giao lại chìa khóa."
                ].map((note, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">{note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-sm font-bold text-gray-800">Thời gian hỗ trợ</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Xử lý yêu cầu</p>
                    <p className="text-[10px] text-gray-500">Trong vòng 24h làm việc</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Liên hệ mượn trực tiếp</p>
                    <p className="text-[10px] text-gray-500">P. Đào tạo (Tòa A)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <RoomSearchModal 
        open={isRoomSearchOpen} 
        onOpenChange={setIsRoomSearchOpen} 
        onSelect={handleRoomSelect}
        date={form.applyDate}
        slot={form.slot}
      />
    </div>
  );
};

export { StudentBookingPage };
export default StudentBookingPage;
