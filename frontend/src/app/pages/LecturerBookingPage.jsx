import { useState } from "react";
import { CheckCircle, Send, PlusSquare, Search, AlertCircle, Users, Clock, Calendar, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import RoomSearchModal from "../components/booking/RoomSearchModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const LecturerBookingPage = () => {
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
    if (!form.slot) errs.slot = "Vui lòng chọn ca học";
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
          <h1 className="text-xl font-bold text-gray-900">Yêu cầu đặt phòng học</h1>
          <p className="text-sm text-gray-500 mt-0.5">Đặt phòng cho dạy bù, kiểm tra, hội thảo hoặc sinh hoạt lớp</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
          Học kỳ 1, 2024-2025
        </Badge>
      </div>

      {submitted ? (
        <Card className="border-green-200 bg-green-50 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-900">Gửi yêu cầu thành công!</h3>
            <p className="text-sm text-green-700 mt-2 max-w-md mx-auto">
              Yêu cầu đặt phòng của bạn đã được chuyển đến Phòng Đào tạo để phê duyệt. Kết quả sẽ được thông báo qua email và mục Lịch sử.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => setSubmitted(false)} className="bg-green-600 hover:bg-green-700">Tạo yêu cầu mới</Button>
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">Xem lịch sử</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <PlusSquare className="w-5 h-5 text-blue-600" />
                Thông tin phiếu đặt phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Row 1 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày mượn phòng <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input 
                        type="date" 
                        value={form.applyDate} 
                        onChange={(e) => setForm(f => ({ ...f, applyDate: e.target.value }))} 
                        className={`h-11 ${formErrors.applyDate ? "border-red-400 focus:ring-red-100" : ""}`} 
                      />
                    </div>
                    {formErrors.applyDate && <p className="text-[11px] text-red-500 font-medium">{formErrors.applyDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ca học / Tiết <span className="text-red-500">*</span></Label>
                    <Select value={form.slot} onValueChange={(v) => setForm(f => ({ ...f, slot: v }))}>
                      <SelectTrigger className={`h-11 ${formErrors.slot ? "border-red-400 focus:ring-red-100" : ""}`}>
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
                    {formErrors.slot && <p className="text-[11px] text-red-500 font-medium">{formErrors.slot}</p>}
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Phòng học mong muốn <span className="text-red-500">*</span></Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 px-3 rounded-full border border-blue-100"
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
                        placeholder="Nhập mã phòng hoặc chọn từ danh sách (VD: A-301)" 
                        className={`h-11 pl-10 ${formErrors.room ? "border-red-400 focus:ring-red-100" : ""}`} 
                      />
                    </div>
                    {formErrors.room && <p className="text-[11px] text-red-500 font-medium">{formErrors.room}</p>}
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mã lớp học phần (nếu có)</Label>
                    <Input 
                      value={form.classCode} 
                      onChange={(e) => setForm(f => ({ ...f, classCode: e.target.value }))} 
                      placeholder="VD: CS101.L11" 
                      className="h-11" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Số người dự kiến</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <Input 
                        type="number"
                        value={form.attendees} 
                        onChange={(e) => setForm(f => ({ ...f, attendees: e.target.value }))} 
                        placeholder="VD: 45" 
                        className="h-11 pl-10" 
                      />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mục đích sử dụng <span className="text-red-500">*</span></Label>
                    <Input 
                      value={form.purpose} 
                      onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} 
                      placeholder="Dạy bù, hội thảo, sinh hoạt CLB..." 
                      className={`h-11 ${formErrors.purpose ? "border-red-400 focus:ring-red-100" : ""}`} 
                    />
                    {formErrors.purpose && <p className="text-[11px] text-red-500 font-medium">{formErrors.purpose}</p>}
                  </div>

                  {/* Row 5 */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ghi chú bổ sung</Label>
                    <textarea 
                      value={form.notes} 
                      onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} 
                      placeholder="Yêu cầu về thiết bị (máy chiếu, âm thanh, micro...) hoặc các lưu ý khác" 
                      rows={3} 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-sm font-bold gap-2 shadow-md shadow-blue-100" disabled={submitting}>
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Đang gửi yêu cầu...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Gửi yêu cầu đặt phòng</>
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="h-11 px-8 text-sm font-semibold" onClick={() => setForm({ room: "", applyDate: "", slot: "", purpose: "", attendees: "", classCode: "", notes: "" })}>
                    Làm mới form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-amber-100 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Lưu ý quan trọng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Yêu cầu cần gửi trước ít nhất 24h để được xử lý kịp thời.",
                  "Kiểm tra kỹ lịch trống trước khi đề xuất phòng.",
                  "Trong trường hợp khẩn cấp (dưới 12h), vui lòng liên hệ trực tiếp phòng Đào tạo.",
                  "Các phòng chuyên dụng (Lab, Studio) cần có sự đồng ý của bộ phận quản lý thiết bị."
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
                <CardTitle className="text-sm font-bold text-gray-800">Thông tin hỗ trợ</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Thời gian phê duyệt</p>
                    <p className="text-[10px] text-gray-500">Từ 4h - 24h làm việc</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Hạn cuối dạy bù</p>
                    <p className="text-[10px] text-gray-500">Tuần 18 của học kỳ</p>
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

export { LecturerBookingPage };
export default LecturerBookingPage;
