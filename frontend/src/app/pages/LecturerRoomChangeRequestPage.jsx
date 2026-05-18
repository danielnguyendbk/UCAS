import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle, Search } from "lucide-react";
import { useNavigate } from "react-router";
import RoomSearchModal from "../components/booking/RoomSearchModal";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { APP_ROUTES } from "@/constants/routes";
import { httpClient } from "@/services/httpClient";

const weekOptions = Array.from({ length: 20 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `Tuần ${value}` };
});

const dayCodeToJsDay = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const normalizeText = (value) => (value || "").toString().trim().toLowerCase();
const normalizeCode = (value) => normalizeText(value).replace(/\s+/g, "");

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

const getSemesterId = (semester) =>
  semester?.id ?? semester?.ID ?? semester?.semesterId ?? semester?.SEMESTER_ID;

const getSemesterName = (semester) =>
  semester?.name ??
  semester?.NAME ??
  semester?.semesterName ??
  semester?.SEMESTER_NAME;

const getSemesterStatus = (semester) =>
  semester?.status ??
  semester?.STATUS ??
  semester?.semesterStatus ??
  semester?.SEMESTER_STATUS;

const getActiveSemesterId = (semesters) => {
  const activeSemester = semesters.find(
    (semester) => String(getSemesterStatus(semester) || "").toUpperCase() === "ACTIVE",
  );
  return String(getSemesterId(activeSemester || semesters[0]) || "");
};

const getResponseList = (response) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const initialForm = {
  semesterId: "",
  sectionCode: "",
  scope: "SESSION",
  targetDate: "",
  fromWeek: "",
  toWeek: "",
  roomId: "",
  roomCode: "",
  reason: "",
};

const LecturerRoomChangeRequestPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [semesters, setSemesters] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);

  const applySemesters = (list) => {
    setSemesters(list);
    const activeSemesterId = getActiveSemesterId(list);
    if (activeSemesterId) {
      setForm((prev) => ({ ...prev, semesterId: activeSemesterId }));
    }
  };

  const matchedSchedules = useMemo(() => {
    const code = normalizeCode(form.sectionCode);
    if (!code) return [];

    return schedules.filter((schedule) =>
      normalizeCode(schedule.classCode).includes(code),
    );
  }, [form.sectionCode, schedules]);

  const selectedSchedule = useMemo(() => {
    const code = normalizeCode(form.sectionCode);
    if (!code) return null;

    const exactCodeMatch = matchedSchedules.find(
      (schedule) => normalizeCode(schedule.classCode) === code,
    );
    if (exactCodeMatch) return exactCodeMatch;

    return matchedSchedules.length === 1 ? matchedSchedules[0] : null;
  }, [form.sectionCode, matchedSchedules]);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await httpClient.get("/api/categories/semesters");
        applySemesters(getResponseList(response));
      } catch (error) {
        console.error("Không tải được danh sách học kỳ:", error);
      }
    };

    fetchSemesters();
  }, []);

  useEffect(() => {
    if (form.semesterId || semesters.length === 0) return;

    const activeSemesterId = getActiveSemesterId(semesters);
    if (activeSemesterId) {
      setForm((prev) => ({ ...prev, semesterId: activeSemesterId }));
    }
  }, [form.semesterId, semesters]);

  useEffect(() => {
    if (!form.semesterId) {
      setSchedules([]);
      return;
    }

    const fetchSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const response = await httpClient.get(
          "/api/lecturer/room-change-requests/schedules",
          { params: { semesterId: form.semesterId } },
        );
        setSchedules(getResponseList(response));
      } catch (error) {
        setSchedules([]);
        console.error("Không tải được lịch lớp của giảng viên:", error);
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [form.semesterId]);

  useEffect(() => {
    if (!selectedSchedule || form.scope !== "SESSION") return;

    if (!isDateMatchingDayCode(form.targetDate, selectedSchedule.dayOfWeekCode)) {
      setForm((prev) => ({
        ...prev,
        targetDate: getNextDateForDay(selectedSchedule.dayOfWeekCode),
        roomId: "",
        roomCode: "",
      }));
    }
  }, [selectedSchedule?.scheduleId, form.scope]);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmittedRequest(null);
  };

  const resetRoom = (patch) => {
    updateForm({
      ...patch,
      roomId: "",
      roomCode: "",
    });
  };

  const handleRoomSelect = (classroomId, roomCode) => {
    setForm((prev) => ({
      ...prev,
      roomId: String(classroomId),
      roomCode,
    }));
    setIsRoomSearchOpen(false);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.semesterId) nextErrors.semesterId = "Vui lòng chọn học kỳ.";

    if (!form.sectionCode.trim()) {
      nextErrors.sectionInfo = "Vui lòng nhập mã lớp học phần.";
    } else if (!selectedSchedule) {
      nextErrors.sectionInfo =
        matchedSchedules.length > 1
          ? "Có nhiều lớp phù hợp, vui lòng nhập mã lớp chính xác hơn."
          : "Không tìm thấy lớp học phần đã phân phòng trong học kỳ này.";
    }

    if (form.scope === "SESSION" && !form.targetDate) {
      nextErrors.targetDate = "Vui lòng chọn ngày đổi phòng.";
    } else if (
      form.scope === "SESSION" &&
      selectedSchedule &&
      !isDateMatchingDayCode(form.targetDate, selectedSchedule.dayOfWeekCode)
    ) {
      nextErrors.targetDate = `Ngày đổi phòng phải trùng ${selectedSchedule.dayOfWeekText}.`;
    }

    if (form.scope === "WEEK_RANGE") {
      if (!form.fromWeek) nextErrors.fromWeek = "Vui lòng chọn tuần bắt đầu.";
      if (!form.toWeek) nextErrors.toWeek = "Vui lòng chọn tuần kết thúc.";
      if (
        form.fromWeek &&
        form.toWeek &&
        Number(form.toWeek) < Number(form.fromWeek)
      ) {
        nextErrors.toWeek = "Tuần kết thúc phải sau tuần bắt đầu.";
      }
    }

    if (form.scope === "REST_OF_SEMESTER" && !form.fromWeek) {
      nextErrors.fromWeek = "Vui lòng chọn tuần bắt đầu.";
    }

    if (!form.roomId) nextErrors.roomId = "Vui lòng chọn phòng mới.";
    if (!form.reason.trim()) nextErrors.reason = "Vui lòng nhập lý do đổi phòng.";

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        semesterId: Number(form.semesterId),
        sectionScheduleId: Number(selectedSchedule.scheduleId),
        changeScope: form.scope,
        targetDate: form.scope === "SESSION" ? form.targetDate : null,
        fromWeek: form.scope !== "SESSION" ? Number(form.fromWeek) : null,
        toWeek: form.scope === "WEEK_RANGE" ? Number(form.toWeek) : null,
        newClassroomId: Number(form.roomId),
        reason: form.reason.trim(),
      };

      const response = await httpClient.post(
        "/api/lecturer/room-change-requests",
        payload,
      );
      setSubmittedRequest(response.data);
      setForm({
        ...initialForm,
        semesterId: form.semesterId,
      });
      setErrors({});
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu đổi phòng.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSessionDateValid =
    form.scope !== "SESSION" ||
    (selectedSchedule &&
      isDateMatchingDayCode(form.targetDate, selectedSchedule.dayOfWeekCode));

  const canOpenRoomSearch =
    form.semesterId &&
    selectedSchedule &&
    ((form.scope === "SESSION" && form.targetDate && isSessionDateValid) ||
      (form.scope === "WEEK_RANGE" && form.fromWeek && form.toWeek) ||
      (form.scope === "REST_OF_SEMESTER" && form.fromWeek));

  const showNoMatch =
    form.sectionCode.trim() &&
    !loadingSchedules &&
    matchedSchedules.length === 0;

  const showMultipleMatches =
    form.sectionCode.trim() &&
    !loadingSchedules &&
    matchedSchedules.length > 1 &&
    !selectedSchedule;

  return (
    <div className="p-5 md:p-6 space-y-5">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-50">
                <ArrowLeftRight className="w-4 h-4 text-orange-500" />
              </span>
              Yêu cầu đổi phòng
            </CardTitle>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(APP_ROUTES.lecturerRoomChangeList)}
            >
              DS yêu cầu đổi phòng
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {submittedRequest && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Gửi yêu cầu đổi phòng thành công.
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Mã yêu cầu #{submittedRequest.id} đang chờ giáo vụ duyệt.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Học kỳ <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={form.semesterId || "empty-semester"}
                  value={form.semesterId}
                  onValueChange={(value) =>
                    resetRoom({
                      semesterId: value,
                      sectionCode: "",
                      targetDate: "",
                      fromWeek: "",
                      toWeek: "",
                    })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Chọn học kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem
                        key={String(getSemesterId(semester))}
                        value={String(getSemesterId(semester))}
                      >
                        {getSemesterName(semester)}
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
                    value={form.sectionCode}
                    onChange={(event) =>
                      resetRoom({ sectionCode: event.target.value })
                    }
                    placeholder="Mã lớp"
                    className="h-10"
                  />
                  <Input
                    readOnly
                    value={selectedSchedule?.courseName || ""}
                    placeholder="Tên môn học"
                    className="h-10 col-span-2 bg-gray-50"
                  />
                </div>
                {loadingSchedules && (
                  <p className="text-xs text-gray-500">
                    Đang tải danh sách lớp học phần...
                  </p>
                )}
                {showNoMatch && (
                  <p className="text-xs text-red-600">
                    Không tìm thấy lớp học phần đã phân phòng trong học kỳ này.
                  </p>
                )}
                {showMultipleMatches && (
                  <p className="text-xs text-amber-700">
                    Có {matchedSchedules.length} lớp phù hợp, hãy nhập mã lớp
                    chính xác hơn.
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
                  value={selectedSchedule?.currentRoomCode || ""}
                  placeholder="Phòng hiện tại"
                  className="h-10 bg-gray-50 font-semibold text-gray-800"
                />
              </div>

              {selectedSchedule && (
                <div className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <p>
                      <span className="font-semibold">Lớp:</span>{" "}
                      {selectedSchedule.classCode}
                    </p>
                    <p>
                      <span className="font-semibold">Giảng viên:</span>{" "}
                      {selectedSchedule.lecturerName}
                    </p>
                    <p>
                      <span className="font-semibold">Lịch:</span>{" "}
                      {selectedSchedule.dayOfWeekText}, ca{" "}
                      {selectedSchedule.slotNumber}
                    </p>
                    <p>
                      <span className="font-semibold">Sức chứa tối đa:</span>{" "}
                      {selectedSchedule.maxCapacity}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Phạm vi đổi phòng</Label>
                <Select
                  value={form.scope}
                  onValueChange={(value) =>
                    resetRoom({
                      scope: value,
                      targetDate:
                        value === "SESSION" && selectedSchedule
                          ? getNextDateForDay(selectedSchedule.dayOfWeekCode)
                          : "",
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

              {form.scope === "SESSION" && (
                <div className="space-y-2">
                  <Label>
                    Ngày đổi phòng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.targetDate}
                    onChange={(event) =>
                      resetRoom({ targetDate: event.target.value })
                    }
                    className="h-10"
                  />
                  {errors.targetDate && (
                    <p className="text-xs text-red-600">{errors.targetDate}</p>
                  )}
                  {!errors.targetDate && selectedSchedule && (
                    <p className="text-xs text-gray-500">
                      Chỉ chọn ngày trùng {selectedSchedule.dayOfWeekText}.
                    </p>
                  )}
                </div>
              )}

              {form.scope !== "SESSION" && (
                <div className="space-y-2">
                  <Label>
                    Từ tuần <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.fromWeek}
                    onValueChange={(value) => resetRoom({ fromWeek: value })}
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

              {form.scope === "WEEK_RANGE" && (
                <div className="space-y-2">
                  <Label>
                    Đến tuần <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.toWeek}
                    onValueChange={(value) => resetRoom({ toWeek: value })}
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
                    disabled={!canOpenRoomSearch}
                    onClick={() => setIsRoomSearchOpen(true)}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Tìm phòng
                  </Button>
                </Label>
                <Input
                  readOnly
                  value={form.roomCode}
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
                  value={form.reason}
                  onChange={(event) => updateForm({ reason: event.target.value })}
                  rows={3}
                  placeholder="Mô tả lý do cần đổi phòng"
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
              {submitting ? "Đang gửi..." : "Gửi yêu cầu chờ duyệt"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={handleRoomSelect}
        semesterId={form.semesterId}
        expectedAttendees={selectedSchedule?.maxCapacity || ""}
        isEmergencyChangeMode
        isLecturerChangeMode
        scheduleId={selectedSchedule?.scheduleId}
        changeScope={form.scope}
        targetDate={form.targetDate}
        fromWeek={form.fromWeek}
        toWeek={form.toWeek}
      />
    </div>
  );
};

export { LecturerRoomChangeRequestPage };
export default LecturerRoomChangeRequestPage;
