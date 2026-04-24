import { useEffect, useState } from "react";
import { Plus, CheckCircle, Clock, XCircle, Eye, AlertCircle, X, Search } from "lucide-react";
import RoomSearchModal from "../components/booking/RoomSearchModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";



const StaffBookingsPage = () => {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);

  const handleRoomSelect = (roomId) => {
    setForm(prev => ({ ...prev, room: roomId }));
    setIsRoomSearchOpen(false);
  };
  const [form, setForm] = useState({
    usedForType: "",
    usedForName: "",
    usedForCode: "",
    room: "",
    date: "",
    slot: "",
    purpose: "",
    emergencyReason: "",
    attendees: "",
    notes: ""
  });


  // Form validation function
  const validate = () => {
    const errs = {};
    if (!form.usedForName.trim()) errs.usedForName = "Vui lòng nhập người/đơn vị sử dụng phòng";
    if (!form.room) errs.room = "Vui lòng chọn phòng";
    if (!form.date) errs.date = "Vui lòng chọn ngày";
    if (!form.slot) errs.slot = "Vui lòng chọn ca học";
    if (!form.purpose.trim()) errs.purpose = "Vui lòng nhập mục đích sử dụng";
    if (!form.emergencyReason.trim()) errs.emergencyReason = "Vui lòng nhập lý do khẩn cấp";
  return errs;
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  const errs = validate();
  setErrors(errs);
  if (Object.keys(errs).length > 0) return;

  setSubmitting(true);

  setTimeout(() => {
    const newBooking = {
      id: `DPK-2026-${String(bookings.length + 1).padStart(3, "0")}`,
      room: form.room,
      purpose: form.purpose,
      date: form.date,
      slot: form.slot,
      requester: "Staff",
      created: new Date().toLocaleDateString("vi-VN"),
      status: "pending",
      notes: form.notes,
      attendees: form.attendees,
      emergencyReason: form.emergencyReason,
      usedForType: form.usedForType,
      usedForName: form.usedForName,
      usedForCode: form.usedForCode,
      requestCategory: "emergency"
    };

    setSubmitting(false);
    setSubmitted(true);
    setErrors({});

    setForm({
          usedForType: "",
          usedForName: "",
          usedForCode: "",
          room: "",
          date: "",
          slot: "",
          purpose: "",
          emergencyReason: "",
          attendees: "",
          notes: ""
        });
      }, 1200);
    };

  


  return (
    <div className="p-5 md:p-6 space-y-5 ">

      <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </span>
              Tạo yêu cầu đặt phòng khẩn cấp
            </CardTitle>
            <p className="text-sm text-gray-500">
              Staff tạo yêu cầu cấp phòng khẩn cho giảng viên, sinh viên hoặc đơn vị liên quan. Yêu cầu này vẫn cần được duyệt theo quy trình.
            </p>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Tạo yêu cầu thành công
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Yêu cầu đặt phòng khẩn cấp đã được ghi nhận và chuyển vào danh sách xử lý.
                    </p>
                    <div className="mt-4 flex gap-2">
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                        }}
                        className="text-sm"
                      >
                        Tạo yêu cầu khác
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Lưu ý khi tạo yêu cầu khẩn cấp
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Staff phải nhập rõ lý do khẩn cấp, người/đơn vị được cấp phòng và các thông tin liên quan để phục vụ bước duyệt tiếp theo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Đối tượng được cấp phòng</Label>
                    <Select
                      value={form.usedForType}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, usedForType: value }))
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn đối tượng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecturer">Giảng viên</SelectItem>
                        <SelectItem value="student">Sinh viên / Đại diện lớp</SelectItem>
                        <SelectItem value="club">CLB / Đơn vị</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestForName">
                      Người / đơn vị được cấp phòng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="requestForName"
                      value={form.usedForName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, usedForName: e.target.value }))
                      }
                      placeholder="Ví dụ: Nguyễn Quốc Thái / Lớp D21CQCN01-N"
                      className="h-10"
                    />
                    {errors.usedForName && (
                      <p className="text-xs text-red-600">{errors.usedForName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requestForCode">Mã sinh viên / giảng viên / lớp / đơn vị</Label>
                    <Input
                      id="requestForCode"
                      value={form.usedForCode}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, usedForCode: e.target.value }))
                      }
                      placeholder="Nhập mã nếu có"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendees">Số người dự kiến</Label>
                    <Input
                      id="attendees"
                      type="number"
                      min="1"
                      value={form.attendees}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, attendees: e.target.value }))
                      }
                      placeholder="Ví dụ: 45"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex justify-between items-center">
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
                    <Select
                      value={form.room}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, room: value }))
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A-201">A-201</SelectItem>
                        <SelectItem value="A-301">A-301</SelectItem>
                        <SelectItem value="B-105">B-105</SelectItem>
                        <SelectItem value="C-201">C-201</SelectItem>
                        <SelectItem value="D-102">D-102</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.room && (
                      <p className="text-xs text-red-600">{errors.room}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Ngày sử dụng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="h-10"
                    />
                    {errors.date && (
                      <p className="text-xs text-red-600">{errors.date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Ca học / khung giờ <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.slot}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, slot: value }))
                      }
                    >
                      <SelectTrigger className="h-10">
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
                    {errors.slot && (
                      <p className="text-xs text-red-600">{errors.slot}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="purpose">
                      Mục đích sử dụng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="purpose"
                      value={form.purpose}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, purpose: e.target.value }))
                      }
                      placeholder="Ví dụ: Dạy bù lớp SE302, họp khẩn bộ môn, hỗ trợ lớp học phát sinh..."
                      className="h-10"
                    />
                    {errors.purpose && (
                      <p className="text-xs text-red-600">{errors.purpose}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2 ">
                    <Label htmlFor="emergencyReason">
                      Lý do khẩn cấp <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="emergencyReason"
                      value={form.emergencyReason}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, emergencyReason: e.target.value }))
                      }
                      rows={4}
                      placeholder="Mô tả vì sao cần xử lý khẩn cấp, ví dụ: phòng hiện tại gặp sự cố, lớp phát sinh đột xuất, cần đổi phòng ngay để kịp buổi học..."
                      className="w-full min-h-[100px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.emergencyReason && (
                      <p className="text-xs text-red-600">{errors.emergencyReason}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Ghi chú bổ sung</Label>
                    <textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      rows={3}
                      placeholder="Thông tin bổ sung như thiết bị cần có, ưu tiên tầng, yêu cầu bố trí bàn ghế..."
                      className="w-full min-h-[100px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    {submitting ? "Đang gửi yêu cầu..." : "Tạo yêu cầu khẩn cấp"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="text-sm"
                    onClick={() => {
                      setForm({
                        usedForType: "lecturer",
                        usedForName: "",
                        usedForCode: "",
                        room: "",
                        date: "",
                        slot: "",
                        purpose: "",
                        emergencyReason: "",
                        attendees: "",
                        notes: ""
                      });
                      setErrors({});
                    }}
                  >
                    Làm mới
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm"
                    onClick={() => {
                      setErrors({});
                      setSubmitted(false);
                    }}
                  >
                    Huỷ
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

      <RoomSearchModal 
        open={isRoomSearchOpen} 
        onOpenChange={setIsRoomSearchOpen} 
        onSelect={handleRoomSelect}
        date={form.date}
        slot={form.slot}
      />
    </div>
  );
};
export {
  StaffBookingsPage
};