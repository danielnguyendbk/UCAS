import { useState } from "react";
import {
  Zap,
  Search,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  Calendar,
  Layers,
  Building2,
  Users,
  Monitor,
  ArrowRight,
  Info,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

const mockRooms = [
  {
    id: "A-101",
    capacity: 40,
    type: "Phòng học",
    equipment: "Máy chiếu, Điều hòa",
    status: "Khả dụng",
  },
  {
    id: "B-201",
    capacity: 60,
    type: "Phòng học",
    equipment: "Tivi, Điều hòa",
    status: "Khả dụng",
  },
  {
    id: "C-105",
    capacity: 30,
    type: "Phòng máy",
    equipment: "30 Máy tính, Điều hòa",
    status: "Khả dụng",
  },
  {
    id: "D-302",
    capacity: 45,
    type: "Phòng học",
    equipment: "Máy chiếu, Quạt",
    status: "Khả dụng",
  },
];

const StaffEmergencyRoomChangePage = () => {
  const [form, setForm] = useState({
    sectionCode: "",
    courseName: "",
    currentRoom: "",
    reason: "",
    scope: "session", // session, weeks, semester
    date: new Date().toISOString().split("T")[0],
    startSlot: "",
    endSlot: "",
    fromWeek: "",
    toWeek: "",
    requestedRoom: null, // room object
  });

  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 800);
  };

  const handleSelectRoom = (room) => {
    setForm((prev) => ({ ...prev, requestedRoom: room }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const isSearchDisabled =
    !form.sectionCode ||
    !form.currentRoom ||
    (form.scope === "session" &&
      (!form.date || !form.startSlot || !form.endSlot)) ||
    (form.scope === "weeks" && (!form.fromWeek || !form.toWeek)) ||
    (form.scope === "semester" && !form.fromWeek);

  return (
    <div className="p-5 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500 fill-orange-500" />
            Đổi phòng khẩn cấp (Giáo vụ)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Giáo vụ thực hiện đổi phòng ngay lập tức cho giảng viên do sự cố đột
            xuất.
          </p>
        </div>
        <Badge className="bg-red-100 text-red-700 border-red-200 uppercase text-[10px] font-bold tracking-widest">
          Kênh ưu tiên Giáo vụ
        </Badge>
      </div>

      {submitted ? (
        <Card className="rounded-xl border border-green-200 bg-green-50 p-10 text-center shadow-lg animate-in zoom-in-95">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-xl font-bold text-green-900">
              Hoàn tất đổi phòng khẩn cấp!
            </h2>
            <p className="text-green-700 mt-2 max-w-md mx-auto">
              Hệ thống đã cập nhật lịch và gửi thông báo SMS/Email đến Giảng
              viên và Sinh viên bị ảnh hưởng.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                onClick={() => setSubmitted(false)}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              >
                Tiếp tục tác nghiệp
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-800">
                1. Thông tin lớp học và lý do
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 uppercase">
                    Mã lớp học phần & Tên môn
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Mã lớp"
                      className="col-span-1"
                      value={form.sectionCode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sectionCode: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Tên môn học"
                      className="col-span-2"
                      value={form.courseName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, courseName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 uppercase">
                    Phòng hiện tại
                  </Label>
                  <Input
                    placeholder="VD: A-201"
                    value={form.currentRoom}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currentRoom: e.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-gray-700 uppercase">
                    Lý do khẩn cấp
                  </Label>
                  <textarea
                    placeholder="Mô tả sự cố cần đổi phòng ngay lập tức..."
                    className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reason: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-800">
                2. Phạm vi áp dụng đổi phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "session", label: "1 buổi", icon: Clock },
                  { id: "weeks", label: "Khoảng tuần", icon: Calendar },
                  {
                    id: "semester",
                    label: "Phần còn lại học kỳ",
                    icon: Layers,
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, scope: opt.id }));
                      setShowResults(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-semibold text-sm ${
                      form.scope === opt.id
                        ? "border-orange-600 bg-orange-50 text-orange-700"
                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {form.scope === "session" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-600">
                        Ngày học
                      </Label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={form.date}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, date: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-600">
                        Tiết bắt đầu
                      </Label>
                      <Select
                        value={form.startSlot}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, startSlot: v }))
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Chọn tiết" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                            <SelectItem key={s} value={s.toString()}>
                              Tiết {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-600">
                        Tiết kết thúc
                      </Label>
                      <Select
                        value={form.endSlot}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, endSlot: v }))
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Chọn tiết" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                            <SelectItem key={s} value={s.toString()}>
                              Tiết {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {form.scope === "weeks" && (
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-600">
                        Từ tuần
                      </Label>
                      <Select
                        value={form.fromWeek}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, fromWeek: v }))
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Tuần" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(20)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Tuần {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-600">
                        Đến tuần
                      </Label>
                      <Select
                        value={form.toWeek}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, toWeek: v }))
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Tuần" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(20)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Tuần {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {form.scope === "semester" && (
                  <div className="flex items-center gap-6">
                    <div className="space-y-1.5 w-40">
                      <Label className="text-xs font-bold text-gray-600">
                        Từ tuần
                      </Label>
                      <Select
                        value={form.fromWeek}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, fromWeek: v }))
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Tuần" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(20)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              Tuần {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 mt-5">
                      <Info className="w-4 h-4" />
                      <p className="text-xs font-bold">
                        Lưu ý: Thay đổi sẽ áp dụng cho tất cả các buổi học từ
                        tuần được chọn đến hết học kỳ.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleSearch}
                  disabled={isSearchDisabled || isSearching}
                  className="bg-orange-600 hover:bg-orange-700 h-11 px-10 gap-2 shadow-lg shadow-orange-100"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Tra cứu phòng trống
                </Button>
              </div>
            </CardContent>
          </Card>

          {showResults && (
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base font-bold text-gray-800">
                  3. Danh sách phòng phù hợp
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Tìm thấy {mockRooms.length} phương án khả dụng
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/30">
                        <TableHead className="font-bold text-xs uppercase tracking-wider">
                          Mã phòng
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-center">
                          Sức chứa
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">
                          Loại phòng
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">
                          Thiết bị
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-center">
                          Trạng thái
                        </TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wider">
                          Chọn
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockRooms.map((room) => (
                        <TableRow
                          key={room.id}
                          className={`hover:bg-orange-50/20 transition-colors cursor-pointer ${form.requestedRoom?.id === room.id ? "bg-orange-50/50" : ""}`}
                          onClick={() => handleSelectRoom(room)}
                        >
                          <TableCell className="font-bold text-orange-700 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-orange-400" />
                            {room.id}
                          </TableCell>
                          <TableCell className="text-center font-medium text-gray-600">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {room.capacity}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {room.type}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Monitor className="w-3 h-3" />
                              {room.equipment}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-50 text-green-700 border-green-100 text-[10px] px-2 py-0.5 shadow-none font-bold">
                              Khả dụng toàn thời gian
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                                form.requestedRoom?.id === room.id
                                  ? "bg-orange-600 border-orange-600 text-white"
                                  : "border-gray-200"
                              }`}
                            >
                              {form.requestedRoom?.id === room.id && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t border-gray-50 space-y-4">
                  <div className="flex items-start gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed italic">
                      Hành động "Xác nhận đổi ngay" sẽ thực thi việc cập nhật
                      lịch học tức thì. Mọi thông báo sẽ được tự động gửi đi.
                    </p>
                  </div>

                  {form.requestedRoom && (
                    <div className="flex items-center justify-between p-4 bg-orange-600 text-white rounded-xl shadow-xl shadow-orange-100 animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                          <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-orange-100 uppercase tracking-widest">
                            Thực hiện đổi phòng ngay
                          </p>
                          <p className="text-lg font-bold flex items-center gap-2">
                            {form.currentRoom}{" "}
                            <ArrowRight className="w-4 h-4 opacity-60" />{" "}
                            {form.requestedRoom.id}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-white text-orange-600 hover:bg-orange-50 h-11 px-8 font-bold shadow-lg border-0"
                      >
                        {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi ngay"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffEmergencyRoomChangePage;
