import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  DoorOpen,
  Loader2,
  Search,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import RoomSearchModal from "@/app/components/booking/RoomSearchModal";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { httpClient } from "@/services/httpClient";

const PURPOSE_OPTIONS = [
  { value: "MAKEUP_CLASS", label: "Học bù" },
  { value: "CLUB_ACTIVITY", label: "Hoạt động CLB" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "MEETING", label: "Họp chuyên môn" },
  { value: "EVENT", label: "Sự kiện" },
  { value: "OTHER", label: "Khác" },
];

const DEFAULT_FORM = {
  semesterId: "",
  requestTitle: "",
  requestType: "MAKEUP_CLASS",
  bookingDate: "",
  slotStartId: "",
  slotEndId: "",
  expectedAttendees: "",
  preferredBuildingId: "",
  requestedRoomType: "",
  classroomId: "",
  roomCode: "",
  sectionId: "",
  sectionCode: "",
  courseName: "",
  purposeNote: "",
};

const unwrapList = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

const getErrorMessage = (error, fallback = "Thao tác thất bại.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getSemesterId = (semester) =>
  semester?.semesterId ?? semester?.semester_id ?? semester?.id;

const getSemesterName = (semester) =>
  semester?.semesterName ??
  semester?.semester_name ??
  semester?.name ??
  semester?.semesterCode ??
  semester?.semester_code ??
  "—";

const getSemesterStatus = (semester) =>
  String(
    semester?.status ??
      semester?.semesterStatus ??
      semester?.semester_status ??
      "",
  ).toUpperCase();

const getSlotId = (slot) =>
  slot?.timeSlotId ??
  slot?.time_slot_id ??
  slot?.slotId ??
  slot?.slot_id ??
  slot?.id;

const getSlotNo = (slot) =>
  slot?.slotNo ?? slot?.slot_no ?? slot?.slotNumber ?? slot?.slot_number;

const getSlotStartTime = (slot) => slot?.startTime ?? slot?.start_time ?? "";
const getSlotEndTime = (slot) => slot?.endTime ?? slot?.end_time ?? "";

const getSlotLabel = (slot) => {
  const no = getSlotNo(slot);
  const start = String(getSlotStartTime(slot)).slice(0, 5);
  const end = String(getSlotEndTime(slot)).slice(0, 5);

  return [`Tiết ${no ?? getSlotId(slot)}`, start && end ? `${start}-${end}` : ""]
    .filter(Boolean)
    .join(" · ");
};

const getSectionId = (section) =>
  section?.sectionId ?? section?.section_id ?? section?.id;

const getSectionCode = (section) =>
  section?.sectionCode ??
  section?.section_code ??
  section?.classCode ??
  section?.class_code ??
  "";

const getSectionCourseCode = (section) =>
  section?.courseCode ?? section?.course_code ?? "";

const getSectionCourseName = (section) =>
  section?.courseName ?? section?.course_name ?? "";

const getSectionStudentCount = (section) =>
  section?.studentCount ??
  section?.student_count ??
  section?.enrolledCount ??
  section?.enrolled_count ??
  section?.maxCapacity ??
  section?.max_capacity ??
  "";

const getSectionRequiredRoomType = (section) =>
  section?.requiredRoomType ?? section?.required_room_type ?? "";

const isMakeupType = (value) =>
  ["MAKEUP_CLASS", "MAKEUP", "HOC_BU"].includes(
    String(value || "").toUpperCase(),
  );

const isClubType = (value) =>
  ["CLUB_ACTIVITY", "CLUB"].includes(String(value || "").toUpperCase());

const pickDefaultSemesterId = (items) => {
  const active = items.find((item) => getSemesterStatus(item) === "ACTIVE");
  return String(getSemesterId(active || items[0]) || "");
};

const bySlotNo = (a, b) => Number(getSlotNo(a) ?? 0) - Number(getSlotNo(b) ?? 0);

const FieldError = ({ children }) =>
  children ? (
    <p className="text-xs font-medium text-red-600">{children}</p>
  ) : null;

const SectionTitle = ({ icon: Icon, title, description }) => (
  <div className="mb-4 flex items-start gap-3">
    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <Icon className="h-4 w-4" />
    </span>
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      )}
    </div>
  </div>
);

const RoomBookingRequestForm = ({
  role = "lecturer",
  title = "Yêu cầu đặt phòng",
  subtitle = "",
  submitEndpoint,
  sectionLookupEndpoint,
  accent = "blue",
  guidelines = [],
}) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [semesters, setSemesters] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);

  const isMakeupClass = isMakeupType(form.requestType);
  const isClubRequest = isClubType(form.requestType);

  const accentClasses = {
    blue: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600",
    orange: "bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-600",
    emerald: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600",
  };

  const orderedSlots = useMemo(() => [...timeSlots].sort(bySlotNo), [timeSlots]);

  const startSlot = useMemo(
    () =>
      orderedSlots.find(
        (slot) => String(getSlotId(slot)) === String(form.slotStartId),
      ),
    [orderedSlots, form.slotStartId],
  );

  const endSlot = useMemo(
    () =>
      orderedSlots.find(
        (slot) => String(getSlotId(slot)) === String(form.slotEndId),
      ),
    [orderedSlots, form.slotEndId],
  );

  const slotRangeValid =
    startSlot &&
    endSlot &&
    Number(getSlotNo(endSlot) ?? 0) >= Number(getSlotNo(startSlot) ?? 0);

  const bookingTimeText =
    startSlot && endSlot && slotRangeValid
      ? `${String(getSlotStartTime(startSlot)).slice(0, 5)} – ${String(
          getSlotEndTime(endSlot),
        ).slice(0, 5)}`
      : "Chưa chọn đủ tiết";

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])),
    }));
  };

  const resetRoom = (patch = {}) => {
    updateForm({
      ...patch,
      classroomId: "",
      roomCode: "",
    });
  };

  useEffect(() => {
    const loadSemesters = async () => {
      setLoadingSemesters(true);

      try {
        const response = await httpClient.get("/api/categories/semesters");
        const items = unwrapList(response);
        setSemesters(items);

        const defaultSemesterId = pickDefaultSemesterId(items);
        if (defaultSemesterId) {
          setForm((prev) => ({ ...prev, semesterId: defaultSemesterId }));
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Không tải được danh sách học kỳ."));
      } finally {
        setLoadingSemesters(false);
      }
    };

    const loadTimeSlots = async () => {
      setLoadingSlots(true);

      try {
        const response = await httpClient.get("/api/categories/time-slots");
        setTimeSlots(unwrapList(response));
      } catch (error) {
        toast.error(getErrorMessage(error, "Không tải được danh sách tiết học."));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSemesters();
    loadTimeSlots();
  }, []);

  useEffect(() => {
    setSelectedSection(null);

    if (!sectionLookupEndpoint || !form.semesterId || !isMakeupClass) {
      setSections([]);
      return;
    }

    const loadSections = async () => {
      setLoadingSections(true);

      try {
        const response = await httpClient.get(sectionLookupEndpoint, {
          params: { semesterId: form.semesterId },
        });
        setSections(unwrapList(response));
      } catch (error) {
        setSections([]);
        toast.error(
          getErrorMessage(error, "Không tải được học phần được phân công."),
        );
      } finally {
        setLoadingSections(false);
      }
    };

    loadSections();
  }, [sectionLookupEndpoint, form.semesterId, isMakeupClass]);

  const handleRequestTypeChange = (value) => {
    setSelectedSection(null);

    resetRoom({
      requestType: value,
      sectionId: "",
      sectionCode: "",
      courseName: "",
      expectedAttendees: "",
      requestedRoomType: "",
    });
  };

  const handleSectionChange = (value) => {
    const section = sections.find((item) => String(getSectionId(item)) === value);
    setSelectedSection(section || null);

    resetRoom({
      sectionId: value,
      sectionCode: section ? getSectionCode(section) : "",
      courseName: section ? getSectionCourseName(section) : "",
      expectedAttendees: section ? String(getSectionStudentCount(section) || "") : "",
      requestedRoomType: section ? getSectionRequiredRoomType(section) || "" : "",
      requestTitle: section
        ? `Học bù ${getSectionCourseCode(section) || getSectionCourseName(section)} - ${getSectionCode(section)}`
        : form.requestTitle,
    });
  };

  const handleRoomSelect = (classroomId, roomCode) => {
    setForm((prev) => ({
      ...prev,
      classroomId: String(classroomId),
      roomCode,
    }));
    setIsRoomSearchOpen(false);
  };

  const validate = () => {
    const nextErrors = {};

    if (!submitEndpoint) nextErrors.submitEndpoint = "Thiếu endpoint gửi yêu cầu.";
    if (!form.semesterId) nextErrors.semesterId = "Vui lòng chọn học kỳ.";
    if (!form.requestTitle.trim()) {
      nextErrors.requestTitle = "Vui lòng nhập tiêu đề đặt phòng.";
    }
    if (!form.requestType) nextErrors.requestType = "Vui lòng chọn mục đích.";
    if (!form.bookingDate) nextErrors.bookingDate = "Vui lòng chọn ngày sử dụng.";
    if (!form.slotStartId) nextErrors.slotStartId = "Vui lòng chọn tiết bắt đầu.";
    if (!form.slotEndId) nextErrors.slotEndId = "Vui lòng chọn tiết kết thúc.";
    if (form.slotStartId && form.slotEndId && !slotRangeValid) {
      nextErrors.slotEndId = "Khoảng tiết học không hợp lệ.";
    }
    if (!form.expectedAttendees || Number(form.expectedAttendees) <= 0) {
      nextErrors.expectedAttendees = "Số người dự kiến phải lớn hơn 0.";
    }
    if (isMakeupClass && !form.sectionId) {
      nextErrors.sectionId = "Vui lòng chọn học phần được phân công.";
    }
    if (!form.classroomId) {
      nextErrors.classroomId = "Vui lòng chọn phòng mong muốn.";
    }
    if (!form.purposeNote.trim()) {
      nextErrors.purposeNote = isClubRequest
        ? "Vui lòng nhập tên CLB hoặc nhu cầu sử dụng."
        : "Vui lòng nhập thiết bị hoặc mô tả nhu cầu.";
    } else if (form.purposeNote.trim().length < 10) {
      nextErrors.purposeNote = "Mô tả nhu cầu phải có ít nhất 10 ký tự.";
    }

    return nextErrors;
  };

  const getRoomSearchMissingReasons = () => {
    const missing = [];

    if (!form.semesterId) missing.push("chọn học kỳ");
    if (isMakeupClass && !form.sectionId) missing.push("chọn học phần");
    if (!form.bookingDate) missing.push("chọn ngày sử dụng");
    if (!form.slotStartId) missing.push("chọn tiết bắt đầu");
    if (!form.slotEndId) missing.push("chọn tiết kết thúc");
    if (form.slotStartId && form.slotEndId && !slotRangeValid) {
      missing.push("chọn khoảng tiết hợp lệ");
    }
    if (!form.expectedAttendees || Number(form.expectedAttendees) <= 0) {
      missing.push("nhập số người dự kiến");
    }

    return missing;
  };

  const handleOpenRoomSearch = () => {
    const missing = getRoomSearchMissingReasons();

    if (missing.length > 0) {
      toast.error(`Vui lòng ${missing.join(", ")} trước khi tìm phòng.`);
      return;
    }

    setIsRoomSearchOpen(true);
  };

  const buildPayload = () => ({
    requestTitle: form.requestTitle.trim(),
    requestType: form.requestType,
    bookingScope: isMakeupClass ? "CLASS_SECTION" : "PERSONAL",
    semesterId: Number(form.semesterId),
    bookingDate: form.bookingDate,
    slotStartId: Number(form.slotStartId),
    slotEndId: Number(form.slotEndId),
    expectedAttendees: Number(form.expectedAttendees),
    preferredBuildingId: form.preferredBuildingId
      ? Number(form.preferredBuildingId)
      : null,
    preferredClassroomId: form.classroomId ? Number(form.classroomId) : null,
    requestedRoomType: form.requestedRoomType || null,
    sectionId: form.sectionId ? Number(form.sectionId) : null,
    sectionCode: form.sectionCode || null,
    purposeNote: form.purposeNote.trim(),
    role,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      const response = await httpClient.post(submitEndpoint, buildPayload());
      const saved = unwrapData(response);

      toast.success(
        saved?.message || "Đã gửi yêu cầu đặt phòng, vui lòng chờ giáo vụ duyệt.",
      );

      setForm((prev) => ({
        ...DEFAULT_FORM,
        semesterId: prev.semesterId,
      }));
      setSelectedSection(null);
      setErrors({});
    } catch (error) {
      toast.error(getErrorMessage(error, "Không gửi được yêu cầu đặt phòng."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-white px-6 py-5">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-950">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>{title}</span>
          </CardTitle>
          {subtitle && <p className="mt-2 max-w-3xl text-sm text-gray-600">{subtitle}</p>}
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submitEndpoint && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.submitEndpoint}
              </p>
            )}

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={BookOpen}
                title="Thông tin yêu cầu"
                description="Chọn mục đích, học kỳ và học phần liên quan."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Tiêu đề đặt phòng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.requestTitle}
                    onChange={(event) =>
                      updateForm({ requestTitle: event.target.value })
                    }
                    placeholder="VD: Học bù môn Cơ sở dữ liệu"
                    className="h-11 rounded-xl bg-gray-50"
                  />
                  <FieldError>{errors.requestTitle}</FieldError>
                </div>

                <div className="space-y-2">
                  <Label>
                    Mục đích <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.requestType}
                    onValueChange={handleRequestTypeChange}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-gray-50">
                      <SelectValue placeholder="Chọn mục đích" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.requestType}</FieldError>
                </div>

                <div className="space-y-2">
                  <Label>
                    Học kỳ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.semesterId}
                    onValueChange={(value) => {
                      setSelectedSection(null);
                      resetRoom({
                        semesterId: value,
                        sectionId: "",
                        sectionCode: "",
                        courseName: "",
                      });
                    }}
                    disabled={loadingSemesters}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-gray-50">
                      <SelectValue
                        placeholder={
                          loadingSemesters ? "Đang tải học kỳ..." : "Chọn học kỳ"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => {
                        const id = String(getSemesterId(semester));
                        return (
                          <SelectItem key={id} value={id}>
                            {getSemesterName(semester)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.semesterId}</FieldError>
                </div>

                {isMakeupClass && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        Học phần được phân công{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.sectionId}
                        onValueChange={handleSectionChange}
                        disabled={loadingSections || !form.semesterId}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50">
                          <SelectValue
                            placeholder={
                              loadingSections
                                ? "Đang tải học phần..."
                                : "Chọn học phần"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.length === 0 ? (
                            <SelectItem value="__EMPTY_SECTIONS__" disabled>
                              Không có học phần được phân công trong học kỳ này
                            </SelectItem>
                          ) : (
                            sections.map((section) => {
                              const id = String(getSectionId(section));
                              const code = getSectionCode(section);
                              const courseCode = getSectionCourseCode(section);
                              const courseName = getSectionCourseName(section);

                              return (
                                <SelectItem key={id} value={id}>
                                  {[code, courseCode, courseName]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                      {!loadingSections && form.semesterId && sections.length === 0 && (
                        <p className="text-xs text-gray-500">
                          Không có học phần được phân công trong học kỳ này.
                        </p>
                      )}
                      <FieldError>{errors.sectionId}</FieldError>
                    </div>

                    <div className="space-y-2">
                      <Label>Tên môn học</Label>
                      <Input
                        readOnly
                        value={form.courseName}
                        placeholder="Tên môn học"
                        className="h-11 rounded-xl bg-gray-50 font-medium text-gray-800"
                      />
                    </div>
                  </>
                )}

                {selectedSection && (
                  <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                    <div className="grid gap-3 text-sm text-blue-950 md:grid-cols-3">
                      <p>
                        <span className="font-semibold">Lớp:</span>{" "}
                        {getSectionCode(selectedSection)}
                      </p>
                      <p>
                        <span className="font-semibold">Môn:</span>{" "}
                        {getSectionCourseName(selectedSection)}
                      </p>
                      <p>
                        <span className="font-semibold">Sĩ số:</span>{" "}
                        {getSectionStudentCount(selectedSection) || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={Clock3}
                title="Thời gian và quy mô"
                description="Chọn ngày, tiết học và số người dự kiến."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Ngày sử dụng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.bookingDate}
                    onChange={(event) =>
                      resetRoom({ bookingDate: event.target.value })
                    }
                    className="h-11 rounded-xl bg-gray-50"
                  />
                  <FieldError>{errors.bookingDate}</FieldError>
                </div>

                <div className="space-y-2">
                  <Label>
                    Số người dự kiến <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      value={form.expectedAttendees}
                      onChange={(event) =>
                        resetRoom({ expectedAttendees: event.target.value })
                      }
                      placeholder="VD: 60"
                      className="h-11 rounded-xl bg-gray-50 pl-9"
                    />
                  </div>
                  <FieldError>{errors.expectedAttendees}</FieldError>
                </div>

                <div className="space-y-2">
                  <Label>
                    Tiết bắt đầu <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.slotStartId}
                    onValueChange={(value) => resetRoom({ slotStartId: value })}
                    disabled={loadingSlots}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-gray-50">
                      <SelectValue placeholder="Chọn tiết bắt đầu" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderedSlots.map((slot) => {
                        const id = String(getSlotId(slot));
                        return (
                          <SelectItem key={id} value={id}>
                            {getSlotLabel(slot)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.slotStartId}</FieldError>
                </div>

                <div className="space-y-2">
                  <Label>
                    Tiết kết thúc <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.slotEndId}
                    onValueChange={(value) => resetRoom({ slotEndId: value })}
                    disabled={loadingSlots}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-gray-50">
                      <SelectValue placeholder="Chọn tiết kết thúc" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderedSlots.map((slot) => {
                        const id = String(getSlotId(slot));
                        return (
                          <SelectItem key={id} value={id}>
                            {getSlotLabel(slot)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.slotEndId}</FieldError>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Thời gian đặt</Label>
                  <Input
                    readOnly
                    value={bookingTimeText}
                    className="h-11 rounded-xl bg-blue-50 font-semibold text-blue-700"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <SectionTitle
                icon={DoorOpen}
                title="Phòng mong muốn"
                description="Tìm phòng trống phù hợp với ngày, tiết và số người dự kiến."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Phòng mong muốn <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={form.roomCode}
                      placeholder="Chưa chọn phòng"
                      className="h-11 rounded-xl bg-gray-50 font-semibold text-blue-700"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 shrink-0 rounded-xl"
                      onClick={handleOpenRoomSearch}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Tìm phòng
                    </Button>
                  </div>
                  <FieldError>{errors.classroomId}</FieldError>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    {isClubRequest
                      ? "Ghi chú / Tên CLB / nhu cầu"
                      : "Thiết bị & mô tả"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={form.purposeNote}
                    onChange={(event) =>
                      updateForm({ purposeNote: event.target.value })
                    }
                    rows={4}
                    placeholder={
                      isClubRequest
                        ? "VD: CLB Tin học - cần phòng sinh hoạt chuyên đề, máy chiếu, micro..."
                        : "Mô tả nhu cầu sử dụng phòng, thiết bị cần hỗ trợ..."
                    }
                    className="rounded-xl bg-gray-50"
                  />
                  <FieldError>{errors.purposeNote}</FieldError>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end border-t border-gray-100 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className={`h-11 rounded-xl px-6 text-white ${
                  accentClasses[accent] || accentClasses.blue
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi yêu cầu
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit border border-gray-200 shadow-sm xl:sticky xl:top-5">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            Quy định đặt phòng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="space-y-4 text-sm leading-6 text-gray-600">
            {guidelines.map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={handleRoomSelect}
        semesterId={form.semesterId}
        date={form.bookingDate}
        slotStartId={form.slotStartId}
        slotEndId={form.slotEndId}
        expectedAttendees={form.expectedAttendees}
        initialRoomType={form.requestedRoomType || "all"}
        isLecturerBorrowMode={role === "lecturer"}
        isStudentBorrowMode={role === "student"}
      />
    </div>
  );
};

export { RoomBookingRequestForm };
export default RoomBookingRequestForm;
