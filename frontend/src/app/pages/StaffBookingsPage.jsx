import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  PlusSquare,
  Search,
  Zap,
} from "lucide-react";
import RoomSearchModal from "../components/booking/RoomSearchModal";
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

const slotOptions = [
  { value: "1", label: "Ca 1 (07:00 - 09:00)" },
  { value: "2", label: "Ca 2 (09:10 - 11:10)" },
  { value: "3", label: "Ca 3 (13:00 - 15:00)" },
  { value: "4", label: "Ca 4 (15:10 - 17:10)" },
  { value: "5", label: "Ca 5 (17:30 - 19:30)" },
];

const weekOptions = Array.from({ length: 20 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `Tuần ${value}` };
});

const normalizeText = (value) =>
  (value || "").toString().trim().toLowerCase();

const dayCodeToJsDay = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const toDateInputValue = (date) => {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000,
  );
  return localDate.toISOString().slice(0, 10);
};

const getNextDateForDay = (dayCode) => {
  const targetDay = dayCodeToJsDay[dayCode];
  if (targetDay === undefined) return "";

  const date = new Date();
  const offset = (targetDay - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + offset);
  return toDateInputValue(date);
};

const isDateMatchingDayCode = (dateValue, dayCode) => {
  const targetDay = dayCodeToJsDay[dayCode];
  if (!dateValue || targetDay === undefined) return false;

  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay() === targetDay;
};

const getActiveSemesterId = (semesters) => {
  const activeSemester = semesters.find(
    (semester) => semester.status?.toUpperCase() === "ACTIVE",
  );
  return (activeSemester || semesters[0])?.id?.toString() || "";
};

const initialBookingForm = {
  semesterId: "",
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
};

const initialChangeForm = {
  semesterId: "",
  sectionCode: "",
  courseName: "",
  scope: "SESSION",
  targetDate: "",
  fromWeek: "",
  toWeek: "",
  roomId: "",
  roomCode: "",
  reason: "",
};

const StaffBookingsPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState("booking");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [semestersList, setSemestersList] = useState([]);
  const [changeSchedules, setChangeSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [changeForm, setChangeForm] = useState(initialChangeForm);

  const matchedChangeSchedules = useMemo(() => {
    const code = normalizeText(changeForm.sectionCode);
    const course = normalizeText(changeForm.courseName);

    if (!code && !course) return [];

    return changeSchedules.filter((item) => {
      const itemCode = normalizeText(item.classCode);
      const itemCourse = normalizeText(item.courseName);
      const codeMatches = !code || itemCode.includes(code);
      const courseMatches = !course || itemCourse.includes(course);
      return codeMatches && courseMatches;
    });
  }, [changeSchedules, changeForm.sectionCode, changeForm.courseName]);

  const selectedChangeSchedule = useMemo(() => {
    const code = normalizeText(changeForm.sectionCode);
    const course = normalizeText(changeForm.courseName);

    if (!code && !course) return null;

    const exactCodeMatch = matchedChangeSchedules.find(
      (item) => normalizeText(item.classCode) === code,
    );

    if (
      exactCodeMatch &&
      (!course || normalizeText(exactCodeMatch.courseName).includes(course))
    ) {
      return exactCodeMatch;
    }

    return matchedChangeSchedules.length === 1 ? matchedChangeSchedules[0] : null;
  }, [matchedChangeSchedules, changeForm.sectionCode, changeForm.courseName]);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await httpClient.get("/api/categories/semesters");
        const list = res.data.data || [];
        setSemestersList(list);

        const activeSemesterId = getActiveSemesterId(list);
        if (activeSemesterId) {
          setBookingForm((prev) => ({ ...prev, semesterId: activeSemesterId }));
          setChangeForm((prev) => ({ ...prev, semesterId: activeSemesterId }));
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách học kỳ:", error);
      }
    };

    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!changeForm.semesterId) {
      setChangeSchedules([]);
      return;
    }

    const fetchSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const res = await httpClient.get(
          "/api/staff/emergency-room-changes/schedules",
          { params: { semesterId: changeForm.semesterId } },
        );
        setChangeSchedules(res.data?.data || res.data || []);
      } catch (error) {
        setChangeSchedules([]);
        console.error("Lỗi lấy lớp học phần đã phân phòng:", error);
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [changeForm.semesterId]);

  useEffect(() => {
    if (!selectedChangeSchedule || changeForm.scope !== "SESSION") return;

    if (
      !isDateMatchingDayCode(
        changeForm.targetDate,
        selectedChangeSchedule.dayOfWeekCode,
      )
    ) {
      setChangeForm((prev) => ({
        ...prev,
        targetDate: getNextDateForDay(selectedChangeSchedule.dayOfWeekCode),
        roomId: "",
        roomCode: "",
      }));
    }
  }, [selectedChangeSchedule?.scheduleId, changeForm.scope]);

  const resetTransientState = () => {
    setErrors({});
    setSuccessMessage("");
    setIsRoomSearchOpen(false);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    resetTransientState();
  };

  const handleBookingRoomSelect = (classroomId, roomCode) => {
    setBookingForm((prev) => ({
      ...prev,
      roomId: String(classroomId),
      roomCode,
    }));
    setIsRoomSearchOpen(false);
  };

  const handleChangeRoomSelect = (classroomId, roomCode) => {
    setChangeForm((prev) => ({
      ...prev,
      roomId: String(classroomId),
      roomCode,
    }));
    setIsRoomSearchOpen(false);
  };

  const validateBooking = () => {
    const nextErrors = {};
    if (!bookingForm.semesterId) nextErrors.semesterId = "Vui lòng chọn học kỳ";
    if (!bookingForm.date) nextErrors.date = "Vui lòng chọn ngày";
    if (!bookingForm.slot) nextErrors.slot = "Vui lòng chọn ca học";
    if (!bookingForm.attendees || Number(bookingForm.attendees) <= 0) {
      nextErrors.attendees = "Số người phải lớn hơn 0";
    }
    if (!bookingForm.roomId) nextErrors.roomId = "Vui lòng chọn phòng";
    if (!bookingForm.usedForName.trim()) {
      nextErrors.usedForName = "Vui lòng nhập người hoặc đơn vị sử dụng";
    }
    if (!bookingForm.purpose.trim()) {
      nextErrors.purpose = "Vui lòng nhập mục đích sử dụng";
    }
    if (!bookingForm.emergencyReason.trim()) {
      nextErrors.emergencyReason = "Vui lòng nhập lý do khẩn cấp";
    }
    return nextErrors;
  };

  const validateChange = () => {
    const nextErrors = {};
    if (!changeForm.semesterId) nextErrors.semesterId = "Vui lòng chọn học kỳ";
    if (!changeForm.sectionCode.trim() && !changeForm.courseName.trim()) {
      nextErrors.sectionInfo = "Vui lòng nhập mã lớp hoặc tên môn";
    } else if (!selectedChangeSchedule) {
      nextErrors.sectionInfo =
        matchedChangeSchedules.length > 1
          ? "Có nhiều lớp phù hợp, vui lòng nhập mã lớp chính xác hơn"
          : "Không tìm thấy lớp học phần đã phân phòng";
    }
    if (changeForm.scope === "SESSION" && !changeForm.targetDate) {
      nextErrors.targetDate = "Vui lòng chọn ngày đổi phòng";
    } else if (
      changeForm.scope === "SESSION" &&
      selectedChangeSchedule &&
      !isDateMatchingDayCode(
        changeForm.targetDate,
        selectedChangeSchedule.dayOfWeekCode,
      )
    ) {
      nextErrors.targetDate = `Ngày đổi phòng phải trùng ${selectedChangeSchedule.dayOfWeekText}.`;
    }
    if (changeForm.scope === "WEEK_RANGE") {
      if (!changeForm.fromWeek) nextErrors.fromWeek = "Vui lòng chọn tuần bắt đầu";
      if (!changeForm.toWeek) nextErrors.toWeek = "Vui lòng chọn tuần kết thúc";
      if (
        changeForm.fromWeek &&
        changeForm.toWeek &&
        Number(changeForm.toWeek) < Number(changeForm.fromWeek)
      ) {
        nextErrors.toWeek = "Tuần kết thúc phải sau tuần bắt đầu";
      }
    }
    if (changeForm.scope === "REST_OF_SEMESTER" && !changeForm.fromWeek) {
      nextErrors.fromWeek = "Vui lòng chọn tuần bắt đầu";
    }
    if (!changeForm.roomId) nextErrors.roomId = "Vui lòng chọn phòng mới";
    if (!changeForm.reason.trim()) nextErrors.reason = "Vui lòng nhập lý do đổi phòng";
    return nextErrors;
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateBooking();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await httpClient.post("/api/staff/emergency-room-bookings", {
        semesterId: Number(bookingForm.semesterId),
        targetType: bookingForm.usedForType,
        recipientName: bookingForm.usedForName,
        recipientCode: bookingForm.usedForCode || "",
        expectedAttendees: Number(bookingForm.attendees),
        classroomId: Number(bookingForm.roomId),
        bookingDate: bookingForm.date,
        slot: Number(bookingForm.slot),
        purpose: bookingForm.purpose,
        emergencyReason: bookingForm.emergencyReason,
        staffUserId: user?.id || 2,
      });

      setSuccessMessage("Đặt phòng khẩn cấp đã được ghi nhận và duyệt tự động.");
      setBookingForm({
        ...initialBookingForm,
        semesterId: bookingForm.semesterId,
      });
      setErrors({});
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt phòng khẩn cấp.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateChange();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await httpClient.post("/api/staff/emergency-room-changes", {
        semesterId: Number(changeForm.semesterId),
        sectionScheduleId: Number(selectedChangeSchedule.scheduleId),
        changeScope: changeForm.scope,
        targetDate:
          changeForm.scope === "SESSION" ? changeForm.targetDate : null,
        fromWeek:
          changeForm.scope !== "SESSION" ? Number(changeForm.fromWeek) : null,
        toWeek:
          changeForm.scope === "WEEK_RANGE" ? Number(changeForm.toWeek) : null,
        newClassroomId: Number(changeForm.roomId),
        reason: changeForm.reason,
        staffUserId: user?.id || 2,
      });

      setSuccessMessage("Đổi phòng khẩn cấp đã được áp dụng ngay.");
      setChangeForm({
        ...initialChangeForm,
        semesterId: changeForm.semesterId,
      });
      setErrors({});
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đổi phòng khẩn cấp.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetBookingRoom = (patch) => {
    setBookingForm((prev) => ({
      ...prev,
      ...patch,
      roomId: "",
      roomCode: "",
    }));
  };

  const resetChangeRoom = (patch) => {
    setChangeForm((prev) => ({
      ...prev,
      ...patch,
      roomId: "",
      roomCode: "",
    }));
  };

  const canOpenBookingRoomSearch =
    bookingForm.semesterId &&
    bookingForm.date &&
    bookingForm.slot &&
    bookingForm.attendees;

  const isChangeSessionDateValid =
    changeForm.scope !== "SESSION" ||
    (selectedChangeSchedule &&
      isDateMatchingDayCode(
        changeForm.targetDate,
        selectedChangeSchedule.dayOfWeekCode,
      ));

  const canOpenChangeRoomSearch =
    changeForm.semesterId &&
    selectedChangeSchedule &&
    ((changeForm.scope === "SESSION" &&
      changeForm.targetDate &&
      isChangeSessionDateValid) ||
      (changeForm.scope === "WEEK_RANGE" &&
        changeForm.fromWeek &&
        changeForm.toWeek) ||
      (changeForm.scope === "REST_OF_SEMESTER" && changeForm.fromWeek));

  return (
    <div className="p-5 md:p-6 space-y-5">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50">
                <Zap className="w-4 h-4 text-red-500" />
              </span>
              Đặt/Đổi phòng khẩn cấp
            </CardTitle>

            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
              <button
                type="button"
                onClick={() => handleModeChange("booking")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  mode === "booking"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <PlusSquare className="w-4 h-4" />
                Đặt phòng
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("change")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  mode === "change"
                    ? "bg-white text-orange-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Đổi phòng
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Hoàn tất
                  </p>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {mode === "booking" ? (
            <form onSubmit={handleBookingSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Học kỳ áp dụng <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={bookingForm.semesterId}
                    onValueChange={(value) =>
                      resetBookingRoom({ semesterId: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn học kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      {semestersList.map((semester) => (
                        <SelectItem key={semester.id} value={String(semester.id)}>
                          {semester.name}
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
                    value={bookingForm.date}
                    onChange={(event) =>
                      resetBookingRoom({ date: event.target.value })
                    }
                    className="h-10"
                  />
                  {errors.date && (
                    <p className="text-xs text-red-600">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Ca học <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={bookingForm.slot}
                    onValueChange={(value) => resetBookingRoom({ slot: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn ca học" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotOptions.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
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
                    value={bookingForm.attendees}
                    onChange={(event) =>
                      resetBookingRoom({ attendees: event.target.value })
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
                      disabled={!canOpenBookingRoomSearch}
                      onClick={() => setIsRoomSearchOpen(true)}
                    >
                      <Search className="w-3.5 h-3.5" />
                      Tìm phòng
                    </Button>
                  </Label>
                  <Input
                    readOnly
                    value={bookingForm.roomCode}
                    placeholder="Chọn phòng khả dụng"
                    className="h-10 bg-gray-50 text-blue-700 font-semibold"
                  />
                  {errors.roomId && (
                    <p className="text-xs text-red-600">{errors.roomId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Đối tượng được cấp phòng</Label>
                  <Select
                    value={bookingForm.usedForType}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        usedForType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn đối tượng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LECTURER">Giảng viên</SelectItem>
                      <SelectItem value="STUDENT">Sinh viên</SelectItem>
                      <SelectItem value="CLASS">Đại diện lớp</SelectItem>
                      <SelectItem value="DEPARTMENT">Bộ môn</SelectItem>
                      <SelectItem value="CLUB">CLB / đơn vị</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Người / đơn vị sử dụng{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={bookingForm.usedForName}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        usedForName: event.target.value,
                      }))
                    }
                    placeholder="VD: Lớp D21CQCN01"
                    className="h-10"
                  />
                  {errors.usedForName && (
                    <p className="text-xs text-red-600">{errors.usedForName}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Mã sinh viên / giảng viên / lớp</Label>
                  <Input
                    value={bookingForm.usedForCode}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        usedForCode: event.target.value,
                      }))
                    }
                    placeholder="VD: D21CQCN01"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Mục đích sử dụng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={bookingForm.purpose}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        purpose: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Dạy bù, bảo vệ đồ án..."
                    className="h-10"
                  />
                  {errors.purpose && (
                    <p className="text-xs text-red-600">{errors.purpose}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Lý do khẩn cấp <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={bookingForm.emergencyReason}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        emergencyReason: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Mô tả lý do cần cấp phòng gấp"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.emergencyReason && (
                    <p className="text-xs text-red-600">
                      {errors.emergencyReason}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                {submitting ? "Đang xử lý..." : "Tạo đặt phòng khẩn cấp"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangeSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Học kỳ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={changeForm.semesterId}
                    onValueChange={(value) =>
                      resetChangeRoom({
                        semesterId: value,
                        sectionCode: "",
                        courseName: "",
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn học kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      {semestersList.map((semester) => (
                        <SelectItem key={semester.id} value={String(semester.id)}>
                          {semester.name}
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
                    Mã lớp học phần & tên môn{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={changeForm.sectionCode}
                      onChange={(event) =>
                        resetChangeRoom({ sectionCode: event.target.value })
                      }
                      placeholder="Mã lớp"
                      className="h-10"
                    />
                    <Input
                      value={changeForm.courseName}
                      onChange={(event) =>
                        resetChangeRoom({ courseName: event.target.value })
                      }
                      placeholder="Tên môn học"
                      className="h-10 col-span-2"
                    />
                  </div>
                  {loadingSchedules && (
                    <p className="text-xs text-gray-500">
                      Đang tải danh sách lớp học phần...
                    </p>
                  )}
                  {errors.sectionInfo && (
                    <p className="text-xs text-red-600">{errors.sectionInfo}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Phòng hiện tại</Label>
                  <Input
                    readOnly
                    value={selectedChangeSchedule?.currentRoomCode || ""}
                    placeholder="VD: A-201"
                    className="h-10 bg-gray-50 font-semibold text-gray-800"
                  />
                </div>

                {selectedChangeSchedule && (
                  <div className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <p>
                        <span className="font-semibold">Lớp:</span>{" "}
                        {selectedChangeSchedule.classCode}
                      </p>
                      <p>
                        <span className="font-semibold">Giảng viên:</span>{" "}
                        {selectedChangeSchedule.lecturerName}
                      </p>
                      <p>
                        <span className="font-semibold">Lịch:</span>{" "}
                        {selectedChangeSchedule.dayOfWeekText}, ca{" "}
                        {selectedChangeSchedule.slotNumber}
                      </p>
                      <p>
                        <span className="font-semibold">Sức chứa cần:</span>{" "}
                        {selectedChangeSchedule.maxCapacity}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Phạm vi đổi phòng</Label>
                  <Select
                    value={changeForm.scope}
                    onValueChange={(value) =>
                      resetChangeRoom({
                        scope: value,
                        targetDate: "",
                        fromWeek: "",
                        toWeek: "",
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Chọn phạm vi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SESSION">Một buổi</SelectItem>
                      <SelectItem value="WEEK_RANGE">Khoảng tuần</SelectItem>
                      <SelectItem value="REST_OF_SEMESTER">
                        Từ tuần đến hết kỳ
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {changeForm.scope === "SESSION" && (
                  <div className="space-y-2">
                    <Label>
                      Ngày đổi phòng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={changeForm.targetDate}
                      onChange={(event) =>
                        resetChangeRoom({ targetDate: event.target.value })
                      }
                      className="h-10"
                    />
                    {errors.targetDate && (
                      <p className="text-xs text-red-600">{errors.targetDate}</p>
                    )}
                    {!errors.targetDate && selectedChangeSchedule && (
                      <p className="text-xs text-gray-500">
                        Chỉ chọn ngày trùng {selectedChangeSchedule.dayOfWeekText}.
                      </p>
                    )}
                  </div>
                )}

                {changeForm.scope !== "SESSION" && (
                  <div className="space-y-2">
                    <Label>
                      Từ tuần <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={changeForm.fromWeek}
                      onValueChange={(value) =>
                        resetChangeRoom({ fromWeek: value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn tuần" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekOptions.map((week) => (
                          <SelectItem key={week.value} value={week.value}>
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.fromWeek && (
                      <p className="text-xs text-red-600">{errors.fromWeek}</p>
                    )}
                  </div>
                )}

                {changeForm.scope === "WEEK_RANGE" && (
                  <div className="space-y-2">
                    <Label>
                      Đến tuần <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={changeForm.toWeek}
                      onValueChange={(value) =>
                        resetChangeRoom({ toWeek: value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn tuần" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekOptions.map((week) => (
                          <SelectItem key={week.value} value={week.value}>
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.toWeek && (
                      <p className="text-xs text-red-600">{errors.toWeek}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label className="flex justify-between items-center mb-1">
                    <span>
                      Phòng mới <span className="text-red-500">*</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 bg-orange-50 text-orange-600 hover:text-orange-700 border border-orange-200 gap-1 px-3"
                      disabled={!canOpenChangeRoomSearch}
                      onClick={() => setIsRoomSearchOpen(true)}
                    >
                      <Search className="w-3.5 h-3.5" />
                      Tìm phòng
                    </Button>
                  </Label>
                  <Input
                    readOnly
                    value={changeForm.roomCode}
                    placeholder="Chọn phòng mới khả dụng"
                    className="h-10 bg-gray-50 text-orange-700 font-semibold"
                  />
                  {errors.roomId && (
                    <p className="text-xs text-red-600">{errors.roomId}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Lý do đổi phòng <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={changeForm.reason}
                    onChange={(event) =>
                      setChangeForm((prev) => ({
                        ...prev,
                        reason: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Mô tả sự cố cần đổi phòng ngay"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  {errors.reason && (
                    <p className="text-xs text-red-600">{errors.reason}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 text-sm"
              >
                {submitting ? "Đang xử lý..." : "Áp dụng đổi phòng ngay"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={
          mode === "booking" ? handleBookingRoomSelect : handleChangeRoomSelect
        }
        date={mode === "booking" ? bookingForm.date : changeForm.targetDate}
        slot={
          mode === "booking"
            ? bookingForm.slot
            : selectedChangeSchedule?.slotNumber
        }
        semesterId={
          mode === "booking" ? bookingForm.semesterId : changeForm.semesterId
        }
        expectedAttendees={
          mode === "booking"
            ? bookingForm.attendees
            : selectedChangeSchedule?.maxCapacity
        }
        isEmergencyChangeMode={mode === "change"}
        scheduleId={selectedChangeSchedule?.scheduleId}
        changeScope={changeForm.scope}
        targetDate={changeForm.targetDate}
        fromWeek={changeForm.fromWeek}
        toWeek={changeForm.toWeek}
      />
    </div>
  );
};

export { StaffBookingsPage };
