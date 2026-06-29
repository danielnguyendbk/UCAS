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
import { toast } from "sonner";

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
    (semester) =>
      String(getSemesterStatus(semester) || "").toUpperCase() === "ACTIVE",
  );
  return String(getSemesterId(activeSemester || semesters[0]) || "");
};

const getResponseList = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const getScheduleId = (schedule) =>
  schedule?.scheduleId ??
  schedule?.schedule_id ??
  schedule?.sectionScheduleId ??
  schedule?.section_schedule_id;

const getScheduleClassCode = (schedule) =>
  schedule?.classCode ?? schedule?.class_code ?? "";

const getScheduleCourseName = (schedule) =>
  schedule?.courseName ?? schedule?.course_name ?? "";

const getScheduleLecturerName = (schedule) =>
  schedule?.lecturerName ?? schedule?.lecturer_name ?? "";

const getScheduleDayCode = (schedule) =>
  schedule?.dayOfWeekCode ?? schedule?.day_of_week_code ?? "";

const getScheduleDayText = (schedule) =>
  schedule?.dayOfWeekText ?? schedule?.day_of_week_text ?? "";

const getSchedulePeriod = (schedule) =>
  schedule?.periodText ??
  schedule?.period_text ??
  schedule?.slotLabel ??
  schedule?.slot_label ??
  String(schedule?.slotNumber ?? schedule?.slot_number ?? "");

const getScheduleRoomCode = (schedule) =>
  schedule?.currentRoomCode ??
  schedule?.current_room_code ??
  schedule?.oldRoomCode ??
  schedule?.old_room_code ??
  schedule?.roomCode ??
  schedule?.room_code ??
  "";

const getScheduleRoomDisplay = (schedule) => {
  const roomCode = getScheduleRoomCode(schedule);
  return roomCode || "Chưa phân phòng";
};

const getScheduleMaxCapacity = (schedule) =>
  schedule?.maxCapacity ?? schedule?.max_capacity ?? "";

const getScheduleRequiredRoomType = (schedule) =>
  schedule?.requiredRoomType ?? schedule?.required_room_type ?? "all";

const initialForm = {
  semesterId: "",
  sectionScheduleId: "",
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

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => String(getScheduleId(schedule)) === form.sectionScheduleId,
      ) || null,
    [form.sectionScheduleId, schedules],
  );

  const applySemesters = (list) => {
    setSemesters(list);
    const activeSemesterId = getActiveSemesterId(list);
    if (activeSemesterId) {
      setForm((prev) => ({ ...prev, semesterId: activeSemesterId }));
    }
  };

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await httpClient.get("/api/categories/semesters");
        applySemesters(getResponseList(response));
      } catch (error) {
        console.error("Không tải được danh sách học kỳ:", error);
        toast.error("Không tải được danh sách học kỳ.");
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
      setErrors((prev) => ({ ...prev, sectionInfo: undefined }));

      try {
        const response = await httpClient.get(
          "/api/lecturer/room-change-requests/schedules",
          { params: { semesterId: form.semesterId } },
        );
        setSchedules(getResponseList(response));
      } catch (error) {
        setSchedules([]);
        console.error("Không tải được lịch lớp của giảng viên:", error);
        toast.error(
          error?.response?.data?.message ||
            "Không tải được danh sách học phần được phân công.",
        );
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [form.semesterId]);

  useEffect(() => {
    if (!selectedSchedule || form.scope !== "SESSION") return;

    const dayCode = getScheduleDayCode(selectedSchedule);
    if (!isDateMatchingDayCode(form.targetDate, dayCode)) {
      setForm((prev) => ({
        ...prev,
        targetDate: getNextDateForDay(dayCode),
        roomId: "",
        roomCode: "",
      }));
    }
  }, [selectedSchedule, form.scope]);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmittedRequest(null);
    setErrors((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])),
    }));
  };

  const resetRoom = (patch) => {
    updateForm({
      ...patch,
      roomId: "",
      roomCode: "",
    });
  };

  const handleScheduleChange = (value) => {
    const schedule = schedules.find(
      (item) => String(getScheduleId(item)) === value,
    );
    const nextTargetDate =
      form.scope === "SESSION" && schedule
        ? getNextDateForDay(getScheduleDayCode(schedule))
        : "";

    resetRoom({
      sectionScheduleId: value,
      targetDate: nextTargetDate,
      fromWeek: "",
      toWeek: "",
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

    if (!form.sectionScheduleId || !selectedSchedule) {
      nextErrors.sectionInfo = "Vui lòng chọn lớp học phần được phân công.";
    }

    if (form.scope === "SESSION" && !form.targetDate) {
      nextErrors.targetDate = "Vui lòng chọn ngày đổi phòng.";
    } else if (
      form.scope === "SESSION" &&
      selectedSchedule &&
      !isDateMatchingDayCode(
        form.targetDate,
        getScheduleDayCode(selectedSchedule),
      )
    ) {
      nextErrors.targetDate = `Ngày đổi phòng phải trùng ${getScheduleDayText(
        selectedSchedule,
      )}.`;
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
    if (!form.reason.trim()) {
      nextErrors.reason = "Vui lòng nhập lý do đổi phòng.";
    } else if (form.reason.trim().length < 10) {
      nextErrors.reason = "Lý do đổi phòng phải có ít nhất 10 ký tự.";
    }

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
        sectionScheduleId: Number(form.sectionScheduleId),
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

      setSubmittedRequest(response?.data?.data ?? response?.data);
      setForm({
        ...initialForm,
        semesterId: form.semesterId,
      });
      setErrors({});
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu đổi phòng.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSessionDateValid =
    form.scope !== "SESSION" ||
    (selectedSchedule &&
      isDateMatchingDayCode(
        form.targetDate,
        getScheduleDayCode(selectedSchedule),
      ));

  const canOpenRoomSearch =
    form.semesterId &&
    selectedSchedule &&
    ((form.scope === "SESSION" && form.targetDate && isSessionDateValid) ||
      (form.scope === "WEEK_RANGE" && form.fromWeek && form.toWeek) ||
      (form.scope === "REST_OF_SEMESTER" && form.fromWeek));

  const selectedScheduleOptionLabel = selectedSchedule
    ? `${getScheduleClassCode(selectedSchedule)} · ${getScheduleCourseName(
        selectedSchedule,
      )} · Phòng hiện tại: ${getScheduleRoomDisplay(selectedSchedule)}`
    : "";

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
                      sectionScheduleId: "",
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
                  Lớp học phần được phân công{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.sectionScheduleId}
                  onValueChange={handleScheduleChange}
                  disabled={loadingSchedules || !form.semesterId}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue
                      placeholder={
                        loadingSchedules
                          ? "Đang tải học phần..."
                          : "Chọn lớp học phần"
                      }
                    >
                      {selectedScheduleOptionLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.length === 0 ? (
                      <SelectItem value="__EMPTY_SCHEDULES__" disabled>
                        Không có học phần được phân công trong học kỳ này
                      </SelectItem>
                    ) : (
                      schedules.map((schedule) => {
                        const id = String(getScheduleId(schedule));
                        return (
                          <SelectItem key={id} value={id}>
                            {getScheduleClassCode(schedule)} ·{" "}
                            {getScheduleCourseName(schedule)} ·{" "}
                            {getScheduleDayText(schedule)}, tiết{" "}
                            {getSchedulePeriod(schedule)} · Phòng hiện tại:{" "}
                            {getScheduleRoomDisplay(schedule)}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {loadingSchedules && (
                  <p className="text-xs text-gray-500">
                    Đang tải danh sách lớp học phần...
                  </p>
                )}
                {!loadingSchedules && form.semesterId && schedules.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Không có học phần được phân công trong học kỳ này.
                  </p>
                )}
                {errors.sectionInfo && (
                  <p className="text-xs text-red-600">{errors.sectionInfo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tên môn học</Label>
                <Input
                  readOnly
                  value={
                    selectedSchedule ? getScheduleCourseName(selectedSchedule) : ""
                  }
                  placeholder="Tên môn học"
                  className="h-10 bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Phòng hiện tại</Label>
                <Input
                  readOnly
                  value={
                    selectedSchedule ? getScheduleRoomCode(selectedSchedule) : ""
                  }
                  placeholder="Phòng hiện tại"
                  className="h-10 bg-gray-50 font-semibold text-gray-800"
                />
              </div>

              {selectedSchedule && (
                <div className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <p>
                      <span className="font-semibold">Lớp:</span>{" "}
                      {getScheduleClassCode(selectedSchedule)}
                    </p>
                    <p>
                      <span className="font-semibold">Giảng viên:</span>{" "}
                      {getScheduleLecturerName(selectedSchedule)}
                    </p>
                    <p>
                      <span className="font-semibold">Lịch:</span>{" "}
                      {getScheduleDayText(selectedSchedule)}, tiết{" "}
                      {getSchedulePeriod(selectedSchedule)}
                    </p>
                    <p>
                      <span className="font-semibold">Phòng hiện tại:</span>{" "}
                      {getScheduleRoomDisplay(selectedSchedule)}
                    </p>
                    <p>
                      <span className="font-semibold">Sức chứa tối đa:</span>{" "}
                      {getScheduleMaxCapacity(selectedSchedule)}
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
                          ? getNextDateForDay(getScheduleDayCode(selectedSchedule))
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
                    disabled={!selectedSchedule}
                  />
                  {errors.targetDate && (
                    <p className="text-xs text-red-600">{errors.targetDate}</p>
                  )}
                  {!errors.targetDate && selectedSchedule && (
                    <p className="text-xs text-gray-500">
                      Chỉ chọn ngày trùng{" "}
                      {getScheduleDayText(selectedSchedule)}.
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
        expectedAttendees={
          selectedSchedule ? getScheduleMaxCapacity(selectedSchedule) : ""
        }
        initialRoomType={
          selectedSchedule ? getScheduleRequiredRoomType(selectedSchedule) : "all"
        }
        isEmergencyChangeMode
        isLecturerChangeMode
        scheduleId={selectedSchedule ? getScheduleId(selectedSchedule) : undefined}
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
