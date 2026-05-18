import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  PlusSquare,
  Search,
  Send,
  Users,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import RoomSearchModal from "../components/booking/RoomSearchModal";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { httpClient } from "@/services/httpClient";

const REQUEST_TYPE_OPTIONS = [
  { value: "CLUB_ACTIVITY", label: "Hoạt động CLB" },
  { value: "MAKEUP_CLASS", label: "Học bù" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "MEETING", label: "Họp chuyên môn" },
  { value: "EVENT", label: "Sự kiện" },
  { value: "OTHER", label: "Khác" },
];

const SLOT_OPTIONS = [
  { value: "1", label: "Ca 1 (07:00 - 09:00)" },
  { value: "2", label: "Ca 2 (09:10 - 11:10)" },
  { value: "3", label: "Ca 3 (13:00 - 15:00)" },
  { value: "4", label: "Ca 4 (15:10 - 17:10)" },
  { value: "5", label: "Ca 5 (17:30 - 19:30)" },
];

const emptyForm = {
  semesterId: "",
  requestType: "MAKEUP_CLASS",
  clubCode: "",
  clubName: "",
  sectionCode: "",
  sectionId: "",
  sectionName: "",
  sectionMaxCapacity: "",
  bookingDate: "",
  slot: "",
  expectedAttendees: "",
  preferredClassroomId: "",
  preferredRoomCode: "",
  purposeNote: "",
};

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

const LecturerBookingPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [semesters, setSemesters] = useState([]);
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

  const isClubRequest = form.requestType === "CLUB_ACTIVITY";
  const isMakeupClass = form.requestType === "MAKEUP_CLASS";
  const selectedSemester = useMemo(
    () => semesters.find((semester) => String(getSemesterId(semester)) === form.semesterId),
    [semesters, form.semesterId],
  );

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await httpClient.get("/api/categories/semesters");
        const list = res.data?.data || [];
        setSemesters(list);
        const activeSemesterId = getActiveSemesterId(list);
        if (activeSemesterId) {
          setForm((prev) => ({ ...prev, semesterId: activeSemesterId }));
        }
      } catch (error) {
        console.error("Lỗi lấy học kỳ:", error);
      }
    };

    fetchSemesters();
  }, []);

  useEffect(() => {
    if (!isClubRequest) {
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
          `/api/lecturer/room-borrow-requests/clubs/${encodeURIComponent(clubCode)}`,
        );
        const club = res.data;
        setClubLookup({
          loading: false,
          data: club,
          error: club.advisor
            ? ""
            : "Bạn không phải cố vấn của CLB này.",
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
  }, [form.clubCode, isClubRequest]);

  useEffect(() => {
    if (!isMakeupClass) {
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
      setForm((prev) => ({
        ...prev,
        sectionId: "",
        sectionName: "",
        sectionMaxCapacity: "",
      }));
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSectionLookup({ loading: true, data: null, error: "" });
      try {
        const res = await httpClient.get(
          "/api/lecturer/room-borrow-requests/sections/lookup",
          { params: { semesterId: form.semesterId, sectionCode } },
        );
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
  }, [form.sectionCode, form.semesterId, isMakeupClass]);

  const canSearchRooms =
    form.semesterId &&
    form.bookingDate &&
    form.slot &&
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

  const handleTypeChange = (requestType) => {
    updateForm({
      requestType,
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
    if (!form.semesterId) errs.semesterId = "Vui lòng chọn học kỳ.";
    if (!form.requestType) errs.requestType = "Vui lòng chọn loại yêu cầu.";
    if (!form.bookingDate) errs.bookingDate = "Vui lòng chọn ngày mượn.";
    if (!form.slot) errs.slot = "Vui lòng chọn ca mượn.";
    if (isClubRequest) {
      if (!form.clubCode.trim()) {
        errs.clubCode = "Vui lòng nhập mã CLB.";
      } else if (clubLookup.error) {
        errs.clubCode = clubLookup.error;
      } else if (!clubLookup.data?.advisor) {
        errs.clubCode = "Bạn cần là cố vấn CLB để gửi yêu cầu này.";
      }
    }
    if (isMakeupClass) {
      if (!form.sectionCode.trim()) {
        errs.sectionCode = "Vui lòng nhập mã lớp học phần.";
      } else if (sectionLookup.error) {
        errs.sectionCode = sectionLookup.error;
      } else if (!form.sectionId) {
        errs.sectionCode = "Vui lòng chờ hệ thống xác nhận lớp học phần.";
      }
    }
    if (!form.expectedAttendees || Number(form.expectedAttendees) <= 0) {
      errs.expectedAttendees = "Số người dự kiến phải lớn hơn 0.";
    }
    if (!form.preferredClassroomId) {
      errs.preferredClassroomId = "Vui lòng chọn phòng mong muốn.";
    }
    if (!form.purposeNote.trim() || form.purposeNote.trim().length < 5) {
      errs.purposeNote = "Vui lòng nhập mục đích sử dụng rõ ràng hơn.";
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
      const payload = {
        semesterId: Number(form.semesterId),
        requestType: form.requestType,
        clubCode: isClubRequest ? form.clubCode.trim().toUpperCase() : null,
        sectionId: isMakeupClass ? Number(form.sectionId) : null,
        bookingDate: form.bookingDate,
        slot: Number(form.slot),
        expectedAttendees: Number(form.expectedAttendees),
        preferredClassroomId: Number(form.preferredClassroomId),
        purposeNote: form.purposeNote.trim(),
      };

      const res = await httpClient.post("/api/lecturer/room-borrow-requests", payload);
      setSubmittedRequest(res.data);
      setForm((prev) => ({
        ...emptyForm,
        semesterId: prev.semesterId,
      }));
      setFormErrors({});
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu đặt phòng.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Yêu cầu đặt phòng học
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gửi yêu cầu đặt phòng cho hoạt động CLB, học bù, seminar, workshop, họp chuyên môn hoặc sự kiện.
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 w-fit">
          {getSemesterName(selectedSemester) || "Chưa chọn học kỳ"}
        </Badge>
      </div>

      {submittedRequest && (
        <Card className="border-green-200 bg-green-50 shadow-sm">
          <CardContent className="p-5 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-green-900">
                Gửi yêu cầu thành công
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Mã yêu cầu #{submittedRequest.id} đang ở trạng thái {submittedRequest.status}.
                Bộ phận quản lý sẽ phê duyệt và thông báo kết quả sau.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <PlusSquare className="w-5 h-5 text-blue-600" />
              Phiếu đăng ký đặt phòng
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Học kỳ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.semesterId}
                    onValueChange={(value) =>
                      resetSelectedRoom({
                        semesterId: value,
                        sectionId: "",
                        sectionName: "",
                        sectionMaxCapacity: "",
                        expectedAttendees: isMakeupClass ? "" : form.expectedAttendees,
                      })
                    }
                  >
                    <SelectTrigger className={`h-11 ${formErrors.semesterId ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="Chọn học kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem key={getSemesterId(semester)} value={String(getSemesterId(semester))}>
                          {getSemesterName(semester)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.semesterId && (
                    <p className="text-[11px] text-red-500">{formErrors.semesterId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Loại yêu cầu <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.requestType} onValueChange={handleTypeChange}>
                    <SelectTrigger className={`h-11 ${formErrors.requestType ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="Chọn loại yêu cầu" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.requestType && (
                    <p className="text-[11px] text-red-500">{formErrors.requestType}</p>
                  )}
                </div>

                {isClubRequest && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Mã CLB <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.clubCode}
                        onChange={(event) =>
                          updateForm({
                            clubCode: event.target.value.toUpperCase(),
                            clubName: "",
                          })
                        }
                        placeholder="Ví dụ: ITC, ENGC"
                        className={`h-11 uppercase ${formErrors.clubCode ? "border-red-400" : ""}`}
                      />
                      {(formErrors.clubCode || clubLookup.error) && (
                        <p className="text-[11px] text-red-500">
                          {formErrors.clubCode || clubLookup.error}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Tên CLB
                      </Label>
                      <Input
                        readOnly
                        value={clubLookup.loading ? "Đang tìm CLB..." : form.clubName}
                        placeholder="Tên CLB sẽ tự hiển thị"
                        className="h-11 bg-gray-50 text-blue-700 font-semibold"
                      />
                    </div>
                  </>
                )}

                {isMakeupClass && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Mã lớp học phần <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.sectionCode}
                        onChange={(event) =>
                          resetSelectedRoom({
                            sectionCode: event.target.value.toUpperCase(),
                            sectionId: "",
                            sectionName: "",
                            sectionMaxCapacity: "",
                            expectedAttendees: "",
                          })
                        }
                        placeholder="Ví dụ: CS101.01"
                        className={`h-11 uppercase ${formErrors.sectionCode ? "border-red-400" : ""}`}
                      />
                      {(formErrors.sectionCode || sectionLookup.error) && (
                        <p className="text-[11px] text-red-500">
                          {formErrors.sectionCode || sectionLookup.error}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Lớp học phần
                      </Label>
                      <Input
                        readOnly
                        value={sectionLookup.loading ? "Đang tìm lớp..." : form.sectionName}
                        placeholder="Tên lớp học phần sẽ tự hiển thị"
                        className="h-11 bg-gray-50 text-blue-700 font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Max capacity
                      </Label>
                      <Input
                        readOnly
                        value={form.sectionMaxCapacity}
                        placeholder="Tự lấy từ lớp học phần"
                        className="h-11 bg-gray-50 text-blue-700 font-semibold"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ngày mượn phòng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.bookingDate}
                    onChange={(event) => resetSelectedRoom({ bookingDate: event.target.value })}
                    className={`h-11 ${formErrors.bookingDate ? "border-red-400" : ""}`}
                  />
                  {formErrors.bookingDate && (
                    <p className="text-[11px] text-red-500">{formErrors.bookingDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ca mượn <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.slot}
                    onValueChange={(value) => resetSelectedRoom({ slot: value })}
                  >
                    <SelectTrigger className={`h-11 ${formErrors.slot ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="Chọn ca học" />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_OPTIONS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.slot && (
                    <p className="text-[11px] text-red-500">{formErrors.slot}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Số người dự kiến <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      readOnly={isMakeupClass}
                      value={form.expectedAttendees}
                      onChange={(event) =>
                        resetSelectedRoom({ expectedAttendees: event.target.value })
                      }
                      placeholder={isMakeupClass ? "Tự lấy theo max_capacity" : "Ví dụ: 45"}
                      className={`h-11 pl-10 ${
                        isMakeupClass ? "bg-gray-50 text-blue-700 font-semibold" : ""
                      } ${formErrors.expectedAttendees ? "border-red-400" : ""}`}
                    />
                  </div>
                  {formErrors.expectedAttendees && (
                    <p className="text-[11px] text-red-500">{formErrors.expectedAttendees}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Phòng mong muốn <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 px-3 rounded-full border border-blue-100"
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
                      className={`h-11 pl-10 bg-gray-50 text-blue-700 font-semibold ${
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

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Mục đích sử dụng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.purposeNote}
                    onChange={(event) => updateForm({ purposeNote: event.target.value })}
                    placeholder="Ví dụ: dạy bù lớp CS101.01, tổ chức seminar, sinh hoạt CLB..."
                    className={`h-11 ${formErrors.purposeNote ? "border-red-400" : ""}`}
                  />
                  {formErrors.purposeNote && (
                    <p className="text-[11px] text-red-500">{formErrors.purposeNote}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-sm font-bold gap-2 shadow-md shadow-blue-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gửi yêu cầu đặt phòng
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-8 text-sm font-semibold"
                  onClick={() =>
                    setForm((prev) => ({
                      ...emptyForm,
                      semesterId: prev.semesterId,
                    }))
                  }
                >
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
                <AlertCircle className="w-4 h-4" />
                Quy định đặt phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Học bù cần nhập đúng mã lớp học phần thuộc giảng viên trong học kỳ đã chọn.",
                "Yêu cầu CLB chỉ hợp lệ khi giảng viên là cố vấn của CLB đang hoạt động.",
                "Phòng được chọn là phòng mong muốn, kết quả cuối cùng phụ thuộc phê duyệt của giáo vụ.",
                "Nếu cần xử lý gấp trong ngày, vui lòng liên hệ trực tiếp phòng Đào tạo sau khi gửi yêu cầu.",
              ].map((note) => (
                <div key={note} className="flex gap-2 items-start">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    {note}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-sm font-bold text-gray-800">
                Thời gian hỗ trợ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Xử lý yêu cầu
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Trong vòng 24h làm việc
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Liên hệ trực tiếp
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Phòng Đào tạo hoặc bộ phận giáo vụ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RoomSearchModal
        open={isRoomSearchOpen}
        onOpenChange={setIsRoomSearchOpen}
        onSelect={handleRoomSelect}
        date={form.bookingDate}
        slot={form.slot}
        semesterId={form.semesterId}
        expectedAttendees={form.expectedAttendees}
        isLecturerBorrowMode
      />
    </div>
  );
};

export { LecturerBookingPage };
export default LecturerBookingPage;
