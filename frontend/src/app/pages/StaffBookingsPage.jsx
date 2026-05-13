import { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import RoomSearchModal from "../components/booking/RoomSearchModal"; // Import Popup Tìm phòng
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { httpClient } from "../../services/httpClient";
import { useAuth } from "@/features/auth/hooks/useAuth";

const StaffBookingsPage = () => {
  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);

  const [semestersList, setSemestersList] = useState([]);

  const [form, setForm] = useState({
    semesterId: "",
    usedForType: "CLASS",
    usedForName: "",
    usedForCode: "",
    roomId: "", // Lưu ID (VD: 1, 2) để gửi lên API POST
    roomCode: "", // Lưu Text (VD: A-A101) để hiển thị cho đẹp
    date: "",
    slot: "",
    purpose: "",
    emergencyReason: "",
    attendees: "",
  });

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await httpClient.get("/api/categories/semesters");
        const list = res.data.data || [];
        setSemestersList(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, semesterId: list[0].id.toString() }));
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách học kỳ:", error);
      }
    };
    fetchSemesters();
  }, []);

  // Nhận dữ liệu ID và Tên phòng từ Popup Tìm Phòng
  const handleRoomSelect = (classroomId, roomCode) => {
    setForm((prev) => ({
      ...prev,
      roomId: classroomId.toString(),
      roomCode: roomCode,
    }));
    setIsRoomSearchOpen(false); // Đóng popup
  };

  const validate = () => {
    const errs = {};
    if (!form.semesterId) errs.semesterId = "Vui lòng chọn học kỳ";
    if (!form.usedForName.trim())
      errs.usedForName = "Vui lòng nhập người/đơn vị sử dụng phòng";
    if (!form.roomId) errs.roomId = "Vui lòng tìm và chọn phòng";
    if (!form.date) errs.date = "Vui lòng chọn ngày";
    if (!form.slot) errs.slot = "Vui lòng chọn ca học";
    if (!form.purpose.trim()) errs.purpose = "Vui lòng nhập mục đích sử dụng";
    if (!form.emergencyReason.trim())
      errs.emergencyReason = "Vui lòng nhập lý do khẩn cấp";
    if (!form.attendees || Number(form.attendees) <= 0)
      errs.attendees = "Số người phải lớn hơn 0";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    try {
      // Đóng gói JSON chuẩn 100% khớp với Java Backend của bạn
      const payload = {
        semesterId: Number(form.semesterId),
        targetType: form.usedForType,
        recipientName: form.usedForName,
        recipientCode: form.usedForCode || "",
        expectedAttendees: Number(form.attendees),
        classroomId: Number(form.roomId), // Gửi ID lên server
        bookingDate: form.date,
        slot: Number(form.slot),
        purpose: form.purpose,
        emergencyReason: form.emergencyReason,
        staffUserId: user?.id || 2,
      };

      // Gọi API POST tạo yêu cầu (Link chính xác!)
      await httpClient.post("/api/staff/emergency-room-bookings", payload);

      setSubmitted(true);
      setErrors({});
      setForm({
        semesterId:
          semestersList.length > 0 ? semestersList[0].id.toString() : "",
        usedForType: "CLASS",
        usedForName: "",
        usedForCode: "",
        roomId: "",
        roomCode: "",
        date: "",
        slot: "",
        purpose: "",
        emergencyReason: "",
        attendees: "",
      });
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi tạo yêu cầu!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </span>
            Tạo yêu cầu đặt phòng khẩn cấp
          </CardTitle>
          <p className="text-sm text-gray-500">
            Hệ thống sẽ kiểm tra trực tiếp Database để đảm bảo phòng không bị
            trùng lịch học hoặc lịch mượn khác.
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
                    Yêu cầu đặt phòng khẩn cấp đã được ghi nhận và tự động phê
                    duyệt vào hệ thống.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-sm bg-white"
                  >
                    Tạo yêu cầu khác
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Học kỳ áp dụng <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.semesterId}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        semesterId: v,
                        roomId: "",
                        roomCode: "",
                      }))
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn học kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      {semestersList.map((sem) => (
                        <SelectItem key={sem.id} value={sem.id.toString()}>
                          {sem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.semesterId && (
                    <p className="text-xs text-red-600">{errors.semesterId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Ngày sử dụng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                        roomId: "",
                        roomCode: "",
                      }))
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
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        slot: v,
                        roomId: "",
                        roomCode: "",
                      }))
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn ca học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        Tiết 1-3 (07:00 - 09:25)
                      </SelectItem>
                      <SelectItem value="2">
                        Tiết 4-6 (09:35 - 12:00)
                      </SelectItem>
                      <SelectItem value="3">
                        Tiết 7-9 (13:00 - 15:25)
                      </SelectItem>
                      <SelectItem value="4">
                        Tiết 10-12 (15:35 - 18:00)
                      </SelectItem>
                      <SelectItem value="5">
                        Tiết 13-15 (18:15 - 20:40)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.slot && (
                    <p className="text-xs text-red-600">{errors.slot}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Số người dự kiến <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.attendees}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        attendees: e.target.value,
                        roomId: "",
                        roomCode: "",
                      }))
                    }
                    placeholder="Ví dụ: 45"
                    className="h-10"
                  />
                  {errors.attendees && (
                    <p className="text-xs text-red-600">{errors.attendees}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="flex justify-between items-center mb-1">
                    <span>
                      Phòng cấp phát <span className="text-red-500">*</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 bg-blue-50 text-blue-600 hover:text-blue-700 border border-blue-200 gap-1 px-3"
                      onClick={() => setIsRoomSearchOpen(true)}
                    >
                      <Search className="w-3.5 h-3.5" /> Tìm phòng trống khả
                      dụng
                    </Button>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={form.roomCode}
                      placeholder="Bấm nút 'Tìm phòng trống' phía trên để chọn phòng..."
                      className="h-10 bg-gray-50 text-blue-700 font-semibold"
                    />
                  </div>
                  {errors.roomId && (
                    <p className="text-xs text-red-600">{errors.roomId}</p>
                  )}
                </div>

                <hr className="md:col-span-2 my-2 border-gray-100" />

                <div className="space-y-2">
                  <Label>Đối tượng được cấp phòng</Label>
                  <Select
                    value={form.usedForType}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, usedForType: v }))
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn đối tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LECTURER">Giảng viên</SelectItem>
                      <SelectItem value="STUDENT">Sinh viên</SelectItem>
                      <SelectItem value="CLASS">Đại diện Lớp</SelectItem>
                      <SelectItem value="DEPARTMENT">Bộ môn</SelectItem>
                      <SelectItem value="CLUB">CLB / Đơn vị</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Người / đơn vị được cấp phòng{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.usedForName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usedForName: e.target.value,
                      }))
                    }
                    placeholder="VD: Nguyễn Quốc Thái / Lớp D21CQCN01"
                    className="h-10"
                  />
                  {errors.usedForName && (
                    <p className="text-xs text-red-600">{errors.usedForName}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Mã số sinh viên / giảng viên / lớp</Label>
                  <Input
                    value={form.usedForCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usedForCode: e.target.value,
                      }))
                    }
                    placeholder="VD: D21CQCN01-N"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Mục đích sử dụng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.purpose}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, purpose: e.target.value }))
                    }
                    placeholder="Ví dụ: Dạy bù môn SE302..."
                    className="h-10"
                  />
                  {errors.purpose && (
                    <p className="text-xs text-red-600">{errors.purpose}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2 ">
                  <Label>
                    Lý do khẩn cấp <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={form.emergencyReason}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        emergencyReason: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Mô tả vì sao cần cấp phòng gấp..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.emergencyReason && (
                    <p className="text-xs text-red-600">
                      {errors.emergencyReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  {submitting ? "Đang xử lý..." : "Tạo yêu cầu khẩn cấp"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* CHUYỀN PROPS CHO POPUP TÌM PHÒNG */}
      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={handleRoomSelect}
        date={form.date}
        slot={form.slot}
        semesterId={form.semesterId}
        expectedAttendees={form.attendees}
      />
    </div>
  );
};

export { StaffBookingsPage };
