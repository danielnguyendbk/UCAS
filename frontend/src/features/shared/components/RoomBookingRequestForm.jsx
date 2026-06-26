import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  MapPin,
  PlusSquare,
  Search,
  Send,
} from "lucide-react";
import RoomSearchModal from "@/app/components/booking/RoomSearchModal";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  EQUIPMENT_OPTIONS,
  PURPOSE_OPTIONS,
  ROOM_TYPE_OPTIONS,
} from "@/features/shared/constants/bookingFormConstants";
import {
  buildLecturerPayload,
  buildStudentPayload,
  getPurposeConfig,
  getTimeSlotNo,
  resolveSlotIds,
} from "@/features/shared/utils/roomBookingAdapter";
import { httpClient } from "@/services/httpClient";

const getSemesterId = (semester) => semester?.id ?? semester?.ID;
const getSemesterName = (semester) =>
  semester?.name ?? semester?.NAME ?? semester?.semesterName ?? semester?.SEMESTER_NAME;

const getSemesterStatus = (semester) =>
  String(
    semester?.status ??
      semester?.STATUS ??
      semester?.semesterStatus ??
      semester?.SEMESTER_STATUS ??
      "",
  )
    .trim()
    .toUpperCase();

const getActiveSemesterId = (semesters) => {
  const activeSemester = semesters.find((semester) => {
    const status = getSemesterStatus(semester);
    return (
      status === "ACTIVE" ||
      semester?.active === true ||
      semester?.isActive === true
    );
  });
  return String(getSemesterId(activeSemester || semesters[0]) || "");
};

const createEmptyForm = (role) => ({
  semesterId: "",
  title: "",
  purpose: role === "lecturer" ? "MAKEUP_CLASS" : "GROUP_STUDY",
  customPurpose: "",
  buildingId: "",
  roomType: "LECTURE",
  customRoomType: "",
  expectedAttendees: "",
  bookingDate: "",
  startTime: "",
  endTime: "",
  equipment: [],
  customEquipment: "",
  description: "",
  preferredClassroomId: "",
  preferredRoomCode: "",
  clubCode: "",
  clubName: "",
  sectionCode: "",
  sectionId: "",
  sectionName: "",
  sectionMaxCapacity: "",
});

const RoomBookingRequestForm = ({
  role,
  title: pageTitle,
  subtitle,
  submitEndpoint,
  clubLookupEndpoint,
  sectionLookupEndpoint,
  accent = "green",
  guidelines = [],
}) => {
  const [form, setForm] = useState(() => createEmptyForm(role));
  const [semesters, setSemesters] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [isRoomSearchOpen, setIsRoomSearchOpen] = useState(false);
  const [clubLookup, setClubLookup] = useState({
    loading: false,
    data: null,
    error: "",
  });
  const [sectionLookup, setSectionLookup] = useState({
    loading: false,
    data: null,
    error: "",
  });

  const purposeOptions = PURPOSE_OPTIONS[role] || [];
  const purposeConfig = getPurposeConfig(role, form.purpose);
  const requestType = purposeConfig?.requestType || "OTHER";
  const isClubRequest = requestType === "CLUB_ACTIVITY";
  const isMakeupClass = role === "lecturer" && requestType === "MAKEUP_CLASS";

  const selectedSemester = useMemo(
    () =>
      semesters.find(
        (semester) => String(getSemesterId(semester)) === form.semesterId,
      ),
    [semesters, form.semesterId],
  );

  const slotPreview = useMemo(
    () => resolveSlotIds(timeSlots, form.startTime, form.endTime),
    [timeSlots, form.startTime, form.endTime],
  );

  const accentButton =
    accent === "blue" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700";
  const accentText = accent === "blue" ? "text-blue-600" : "text-green-600";

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [semesterRes, slotRes, buildingRes] = await Promise.all([
          httpClient.get("/api/categories/semesters"),
          httpClient.get("/api/categories/time-slots"),
          httpClient.get("/api/categories/buildings"),
        ]);
        const list = semesterRes.data?.data || [];
        const slots = [...(slotRes.data?.data || [])].sort(
          (a, b) => getTimeSlotNo(a) - getTimeSlotNo(b),
        );
        setSemesters(list);
        setTimeSlots(slots);
        setBuildings(buildingRes.data?.data || []);
        setForm((prev) => ({
          ...prev,
          semesterId: getActiveSemesterId(list) || prev.semesterId,
        }));
      } catch (error) {
        console.error("Lỗi tải dữ liệu ban đầu:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!isClubRequest || !clubLookupEndpoint) {
      setClubLookup({ loading: false, data: null, error: "" });
      setForm((prev) => ({ ...prev, clubCode: "", clubName: "" }));
      return;
    }

    const clubCode = form.clubCode.trim().toUpperCase();
    if (!clubCode) {
      setClubLookup({ loading: false, data: null, error: "" });
      setForm((prev) => ({ ...prev, clubName: "" }));
      return;
    }

    const timeout = window.setTimeout(async () => {
      setClubLookup({ loading: true, data: null, error: "" });
      try {
        const res = await httpClient.get(
          `${clubLookupEndpoint}/${encodeURIComponent(clubCode)}`,
        );
        const club = res.data;
        const valid =
          role === "lecturer" ? Boolean(club.advisor) : Boolean(club.representative);
        setClubLookup({
          loading: false,
          data: club,
          error: valid
            ? ""
            : role === "lecturer"
              ? "Bạn không phải cố vấn của CLB này."
              : "Bạn không phải đại diện đang hoạt động của CLB này.",
        });
        setForm((prev) => ({ ...prev, clubName: club.clubName || "" }));
      } catch (error) {
        setClubLookup({
          loading: false,
          data: null,
          error: error.response?.data?.message || "Không tìm thấy CLB.",
        });
        setForm((prev) => ({ ...prev, clubName: "" }));
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [form.clubCode, isClubRequest, clubLookupEndpoint, role]);

  useEffect(() => {
    if (!isMakeupClass || !sectionLookupEndpoint) {
      setSectionLookup({ loading: false, data: null, error: "" });
      setForm((prev) => ({
        ...prev,
        sectionCode: "",
        sectionId: "",
        sectionName: "",
        sectionMaxCapacity: "",
      }));
      return;
    }

    const sectionCode = form.sectionCode.trim().toUpperCase();
    if (!sectionCode || !form.semesterId) {
      setSectionLookup({ loading: false, data: null, error: "" });
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSectionLookup({ loading: true, data: null, error: "" });
      try {
        const res = await httpClient.get(sectionLookupEndpoint, {
          params: { semesterId: form.semesterId, sectionCode },
        });
        const section = res.data;
        const maxCapacity = section.maxCapacity ? String(section.maxCapacity) : "";
        setSectionLookup({ loading: false, data: section, error: "" });
        setForm((prev) => ({
          ...prev,
          sectionId: section.sectionId ? String(section.sectionId) : "",
          sectionName: section.courseName || "",
          sectionMaxCapacity: maxCapacity,
          expectedAttendees: maxCapacity,
          preferredClassroomId: "",
          preferredRoomCode: "",
        }));
      } catch (error) {
        setSectionLookup({
          loading: false,
          data: null,
          error:
            error.response?.data?.message ||
            "Không tìm thấy lớp học phần của giảng viên trong học kỳ này.",
        });
        setForm((prev) => ({
          ...prev,
          sectionId: "",
          sectionName: "",
          sectionMaxCapacity: "",
          expectedAttendees: "",
          preferredClassroomId: "",
          preferredRoomCode: "",
        }));
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [form.sectionCode, form.semesterId, isMakeupClass, sectionLookupEndpoint]);

  const canSearchRooms =
    form.semesterId &&
    form.bookingDate &&
    slotPreview.slotStartId &&
    slotPreview.slotEndId &&
    Number(form.expectedAttendees) > 0;

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmittedRequest(null);
  };

  const resetSelectedRoom = (patch) => {
    updateForm({
      ...patch,
      preferredClassroomId: "",
      preferredRoomCode: "",
    });
  };

  const handlePurposeChange = (purpose) => {
    updateForm({
      purpose,
      customPurpose: "",
      clubCode: "",
      clubName: "",
      sectionCode: "",
      sectionId: "",
      sectionName: "",
      sectionMaxCapacity: "",
      expectedAttendees: "",
      preferredClassroomId: "",
      preferredRoomCode: "",
    });
  };

  const toggleEquipment = (value, checked) => {
    setForm((prev) => ({
      ...prev,
      equipment: checked
        ? [...prev.equipment, value]
        : prev.equipment.filter((item) => item !== value),
      customEquipment: value === "OTHER" && !checked ? "" : prev.customEquipment,
    }));
    setSubmittedRequest(null);
  };

  const handleRoomSelect = (classroomId, roomCode) => {
    setForm((prev) => ({
      ...prev,
      preferredClassroomId: String(classroomId),
      preferredRoomCode: roomCode,
    }));
    setIsRoomSearchOpen(false);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Vui lòng nhập tiêu đề đặt phòng.";
    if (!form.purpose) errs.purpose = "Vui lòng chọn mục đích.";
    if (form.purpose === "OTHER" && !form.customPurpose.trim()) {
      errs.customPurpose = "Vui lòng nhập mục đích cụ thể.";
    }
    if (!form.buildingId) errs.buildingId = "Vui lòng chọn tòa nhà.";
    if (!form.roomType) errs.roomType = "Vui lòng chọn loại phòng.";
    if (form.roomType === "OTHER" && !form.customRoomType.trim()) {
      errs.customRoomType = "Vui lòng nhập loại phòng cụ thể.";
    }
    if (!form.expectedAttendees || Number(form.expectedAttendees) <= 0) {
      errs.expectedAttendees = "Số người dự kiến phải lớn hơn 0.";
    }
    if (!form.bookingDate) errs.bookingDate = "Vui lòng chọn ngày.";
    if (!form.startTime) errs.startTime = "Vui lòng chọn giờ bắt đầu.";
    if (!form.endTime) errs.endTime = "Vui lòng chọn giờ kết thúc.";
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      errs.endTime = "Giờ kết thúc phải sau giờ bắt đầu.";
    }
    if (form.startTime && form.endTime && !slotPreview.slotStartId) {
      errs.startTime = "Không tìm thấy tiết học tương ứng với giờ bắt đầu.";
    }
    if (form.startTime && form.endTime && !slotPreview.slotEndId) {
      errs.endTime = "Không tìm thấy tiết học tương ứng với giờ kết thúc.";
    }
    if (
      slotPreview.startSlot &&
      slotPreview.endSlot &&
      getTimeSlotNo(slotPreview.endSlot) < getTimeSlotNo(slotPreview.startSlot)
    ) {
      errs.endTime = "Khung giờ kết thúc phải sau khung giờ bắt đầu.";
    }
    if (!form.preferredClassroomId) {
      errs.preferredClassroomId = "Vui lòng chọn phòng.";
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      errs.description = "Mô tả/lý do phải có ít nhất 10 ký tự.";
    }
    if (form.equipment.includes("OTHER") && !form.customEquipment.trim()) {
      errs.customEquipment = "Vui lòng mô tả thiết bị khác.";
    }
    if (isClubRequest) {
      if (!form.clubCode.trim()) errs.clubCode = "Vui lòng nhập mã CLB.";
      else if (clubLookup.error) errs.clubCode = clubLookup.error;
      else if (role === "lecturer" && !clubLookup.data?.advisor) {
        errs.clubCode = "Bạn cần là cố vấn CLB để gửi yêu cầu này.";
      } else if (role === "student" && !clubLookup.data?.representative) {
        errs.clubCode = "Bạn cần là đại diện CLB để gửi yêu cầu này.";
      }
    }
    if (isMakeupClass) {
      if (!form.sectionCode.trim()) errs.sectionCode = "Vui lòng nhập Mã lớp học phần.";
      else if (sectionLookup.error) errs.sectionCode = sectionLookup.error;
      else if (!form.sectionId) {
        errs.sectionCode = "Vui lòng chờ hệ thống xác nhận lớp học phần.";
      }
    }
    return errs;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload =
        role === "lecturer"
          ? buildLecturerPayload(form, timeSlots)
          : buildStudentPayload(form, timeSlots);

      const res = await httpClient.post(submitEndpoint, payload);
      setSubmittedRequest(res.data);
      setForm((prev) => ({
        ...createEmptyForm(role),
        semesterId: prev.semesterId,
      }));
      setFormErrors({});
    } catch (error) {
      setFormErrors({
        submit:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu đặt phòng.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...createEmptyForm(role),
      semesterId: prev.semesterId,
    }));
    setFormErrors({});
    setSubmittedRequest(null);
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <Badge variant="outline" className="bg-gray-50 px-3 py-1 w-fit">
          {getSemesterName(selectedSemester) || "Chưa chọn học kỳ"}
        </Badge>
      </div>

      {submittedRequest && (
        <Card className="border-green-200 bg-green-50 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-green-900">
                Gửi yêu cầu thành công
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Mã yêu cầu #{submittedRequest.id} — trạng thái{" "}
                {submittedRequest.status}. Bộ phận quản lý sẽ phê duyệt và
                thông báo kết quả sau.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-gray-200 rounded-xl">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <PlusSquare className={`w-5 h-5 ${accentText}`} />
              Phiếu đăng ký đặt phòng
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formErrors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formErrors.submit}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Thông tin chung
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Tiêu đề đặt phòng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) => updateForm({ title: e.target.value })}
                      placeholder="VD: Họp nhóm đồ án, Seminar khoa..."
                      className={`h-11 ${formErrors.title ? "border-red-400" : ""}`}
                    />
                    {formErrors.title && (
                      <p className="text-[11px] text-red-500">{formErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Mục đích <span className="text-red-500">*</span>
                    </Label>
                    <Select value={form.purpose} onValueChange={handlePurposeChange}>
                      <SelectTrigger className={`h-11 ${formErrors.purpose ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn mục đích" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.purpose && (
                      <p className="text-[11px] text-red-500">{formErrors.purpose}</p>
                    )}
                  </div>

                  {form.purpose === "OTHER" && (
                    <div className="space-y-2">
                      <Label>
                        Mục đích cụ thể <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.customPurpose}
                        onChange={(e) =>
                          updateForm({ customPurpose: e.target.value })
                        }
                        className={`h-11 ${formErrors.customPurpose ? "border-red-400" : ""}`}
                      />
                      {formErrors.customPurpose && (
                        <p className="text-[11px] text-red-500">
                          {formErrors.customPurpose}
                        </p>
                      )}
                    </div>
                  )}

                  {isClubRequest && (
                    <>
                      <div className="space-y-2">
                        <Label>
                          Mã CLB <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={form.clubCode}
                          onChange={(e) =>
                            updateForm({
                              clubCode: e.target.value.toUpperCase(),
                              clubName: "",
                            })
                          }
                          placeholder="VD: ITC"
                          className={`h-11 uppercase ${formErrors.clubCode ? "border-red-400" : ""}`}
                        />
                        {(formErrors.clubCode || clubLookup.error) && (
                          <p className="text-[11px] text-red-500">
                            {formErrors.clubCode || clubLookup.error}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Tên CLB</Label>
                        <Input
                          readOnly
                          value={
                            clubLookup.loading ? "Đang tìm CLB..." : form.clubName
                          }
                          className="h-11 bg-gray-50 font-semibold"
                        />
                      </div>
                    </>
                  )}

                  {isMakeupClass && (
                    <>
                      <div className="space-y-2">
                        <Label>
                          Mã lớp học phần <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={form.sectionCode}
                          onChange={(e) =>
                            resetSelectedRoom({
                              sectionCode: e.target.value.toUpperCase(),
                              sectionId: "",
                              sectionName: "",
                              sectionMaxCapacity: "",
                              expectedAttendees: "",
                            })
                          }
                          placeholder="VD: CS101.01"
                          className={`h-11 uppercase ${formErrors.sectionCode ? "border-red-400" : ""}`}
                        />
                        {(formErrors.sectionCode || sectionLookup.error) && (
                          <p className="text-[11px] text-red-500">
                            {formErrors.sectionCode || sectionLookup.error}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Lớp học phần</Label>
                        <Input
                          readOnly
                          value={
                            sectionLookup.loading
                              ? "Đang tìm lớp..."
                              : form.sectionName
                          }
                          className="h-11 bg-gray-50 font-semibold"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Phòng & thời gian
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>
                      Tòa nhà <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.buildingId}
                      onValueChange={(value) =>
                        resetSelectedRoom({ buildingId: value })
                      }
                    >
                      <SelectTrigger className={`h-11 ${formErrors.buildingId ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn tòa nhà" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={String(building.id)}>
                            {building.name || building.buildingName || building.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.buildingId && (
                      <p className="text-[11px] text-red-500">{formErrors.buildingId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Loại phòng <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.roomType}
                      onValueChange={(value) =>
                        resetSelectedRoom({
                          roomType: value,
                          customRoomType: value === "OTHER" ? form.customRoomType : "",
                        })
                      }
                    >
                      <SelectTrigger className={`h-11 ${formErrors.roomType ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Chọn loại phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.roomType && (
                      <p className="text-[11px] text-red-500">{formErrors.roomType}</p>
                    )}
                  </div>

                  {form.roomType === "OTHER" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>
                        Loại phòng cụ thể <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.customRoomType}
                        onChange={(e) =>
                          updateForm({ customRoomType: e.target.value })
                        }
                        className={`h-11 ${formErrors.customRoomType ? "border-red-400" : ""}`}
                      />
                      {formErrors.customRoomType && (
                        <p className="text-[11px] text-red-500">
                          {formErrors.customRoomType}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      Số người dự kiến <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      readOnly={isMakeupClass}
                      value={form.expectedAttendees}
                      onChange={(e) =>
                        resetSelectedRoom({ expectedAttendees: e.target.value })
                      }
                      className={`h-11 ${formErrors.expectedAttendees ? "border-red-400" : ""} ${
                        isMakeupClass ? "bg-gray-50 font-semibold" : ""
                      }`}
                    />
                    {formErrors.expectedAttendees && (
                      <p className="text-[11px] text-red-500">
                        {formErrors.expectedAttendees}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Ngày <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.bookingDate}
                      onChange={(e) =>
                        resetSelectedRoom({ bookingDate: e.target.value })
                      }
                      className={`h-11 ${formErrors.bookingDate ? "border-red-400" : ""}`}
                    />
                    {formErrors.bookingDate && (
                      <p className="text-[11px] text-red-500">{formErrors.bookingDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Giờ bắt đầu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) =>
                        resetSelectedRoom({ startTime: e.target.value })
                      }
                      className={`h-11 ${formErrors.startTime ? "border-red-400" : ""}`}
                    />
                    {formErrors.startTime && (
                      <p className="text-[11px] text-red-500">{formErrors.startTime}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Giờ kết thúc <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) =>
                        resetSelectedRoom({ endTime: e.target.value })
                      }
                      className={`h-11 ${formErrors.endTime ? "border-red-400" : ""}`}
                    />
                    {formErrors.endTime && (
                      <p className="text-[11px] text-red-500">{formErrors.endTime}</p>
                    )}
                  </div>

                  {slotPreview.slotStartId && slotPreview.slotEndId && (
                    <div className="md:col-span-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      Ánh xạ tiết học: tiết {getTimeSlotNo(slotPreview.startSlot)} → tiết{" "}
                      {getTimeSlotNo(slotPreview.endSlot)}
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <Label>
                        Phòng <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`h-8 gap-1.5 px-3 rounded-full border ${accentText}`}
                        disabled={!canSearchRooms}
                        onClick={() => setIsRoomSearchOpen(true)}
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Tìm phòng trống</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <Input
                        readOnly
                        value={form.preferredRoomCode}
                        placeholder="Chọn phòng từ danh sách phòng trống"
                        className={`h-11 pl-10 bg-gray-50 font-semibold ${
                          formErrors.preferredClassroomId ? "border-red-400" : ""
                        }`}
                      />
                    </div>
                    {formErrors.preferredClassroomId && (
                      <p className="text-[11px] text-red-500">
                        {formErrors.preferredClassroomId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Thiết bị & mô tả
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Checkbox
                          checked={form.equipment.includes(option.value)}
                          onCheckedChange={(checked) =>
                            toggleEquipment(option.value, Boolean(checked))
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  {form.equipment.includes("OTHER") && (
                    <div className="space-y-2">
                      <Label>
                        Thiết bị khác <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.customEquipment}
                        onChange={(e) =>
                          updateForm({ customEquipment: e.target.value })
                        }
                        className={`h-11 ${formErrors.customEquipment ? "border-red-400" : ""}`}
                      />
                      {formErrors.customEquipment && (
                        <p className="text-[11px] text-red-500">
                          {formErrors.customEquipment}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      Mô tả / Lý do <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm({ description: e.target.value })}
                      rows={4}
                      placeholder="Mô tả chi tiết mục đích sử dụng phòng..."
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                        formErrors.description ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                    {formErrors.description && (
                      <p className="text-[11px] text-red-500">{formErrors.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  className={`${accentButton} h-11 px-8 text-sm font-bold gap-2`}
                  disabled={submitting}
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Đang xử lý..." : "Gửi yêu cầu đặt phòng"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-8 text-sm font-semibold"
                  onClick={resetForm}
                >
                  Hủy / Làm mới
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {guidelines.length > 0 && (
          <Card className="border-amber-100 bg-amber-50/30 rounded-xl h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Quy định đặt phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guidelines.map((note) => (
                <div key={note} className="flex gap-2 items-start">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    {note}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={handleRoomSelect}
        date={form.bookingDate}
        slotStartId={slotPreview.slotStartId ? String(slotPreview.slotStartId) : ""}
        slotEndId={slotPreview.slotEndId ? String(slotPreview.slotEndId) : ""}
        semesterId={form.semesterId}
        expectedAttendees={form.expectedAttendees}
        isStudentBorrowMode={role === "student"}
        isLecturerBorrowMode={role === "lecturer"}
      />
    </div>
  );
};

export default RoomBookingRequestForm;
