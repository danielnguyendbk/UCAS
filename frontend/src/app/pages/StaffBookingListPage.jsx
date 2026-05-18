import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { httpClient } from "@/services/httpClient";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

const STATUS_CONFIG = {
  APPROVED: {
    label: "Đã duyệt",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  PENDING: {
    label: "Chờ duyệt",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
};

const AVAILABILITY_CONFIG = {
  AVAILABLE: {
    label: "Phòng còn trống",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
  CLASS_CONFLICT: {
    label: "Trùng lịch lớp học",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
  BOOKING_CONFLICT: {
    label: "Trùng yêu cầu đã duyệt",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
  CAPACITY_LOW: {
    label: "Không đủ sức chứa",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: AlertTriangle,
  },
  ROOM_INACTIVE: {
    label: "Phòng ngừng hoạt động",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: AlertTriangle,
  },
  NO_ROOM: {
    label: "Chưa chọn phòng",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: AlertCircle,
  },
};

const REQUEST_TYPE_LABELS = {
  CLUB_ACTIVITY: "Hoạt động CLB",
  MAKEUP_CLASS: "Học bù",
  SEMINAR: "Seminar",
  WORKSHOP: "Workshop",
  MEETING: "Họp",
  EVENT: "Sự kiện",
  OTHER: "Khác",
};

const BOOKING_SCOPE_LABELS = {
  STUDENT: "Sinh viên",
  LECTURER: "Giảng viên",
  STAFF: "Nhân viên",
};

const ROOM_TYPE_LABELS = {
  THEORY: "Lý thuyết",
  PRACTICE: "Thực hành",
  LAB: "Phòng lab",
  HALL: "Hội trường",
};

const normalize = (value) => String(value || "").trim().toUpperCase();

const getStatusConfig = (status) =>
  STATUS_CONFIG[normalize(status)] || STATUS_CONFIG.PENDING;

const getAvailabilityConfig = (availabilityStatus, status) => {
  const requestStatus = normalize(status);
  if (requestStatus === "APPROVED") {
    return STATUS_CONFIG.APPROVED;
  }
  if (requestStatus === "REJECTED") {
    return STATUS_CONFIG.REJECTED;
  }
  return (
    AVAILABILITY_CONFIG[normalize(availabilityStatus)] ||
    AVAILABILITY_CONFIG.NO_ROOM
  );
};

const formatDate = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getPeriodLabel = (booking) => {
  if (!booking?.slot && !booking?.periodText) return "Chưa có";
  if (booking.periodText) {
    return `Ca ${booking.slot || "-"} (tiết ${booking.periodText})`;
  }
  return `Ca ${booking.slot}`;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

const getRoomText = (booking) =>
  booking?.approvedRoomCode ||
  booking?.preferredRoomCode ||
  "Chưa chọn phòng";

const getRequestTitle = (booking) =>
  booking?.requestTitle ||
  REQUEST_TYPE_LABELS[normalize(booking?.requestType)] ||
  "Yêu cầu đặt phòng";

const hasValue = (value) => {
  if (Array.isArray(value)) return value.some(hasValue);
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const joinNonEmpty = (...values) => values.filter(hasValue).join(" - ");

const DetailItem = ({
  icon: Icon,
  label,
  value,
  accent = "text-gray-900",
  hideWhenEmpty = false,
}) => {
  if (hideWhenEmpty && !hasValue(value)) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className={`mt-1 text-sm font-medium ${accent}`}>{value || "Chưa có"}</div>
    </div>
  );
};

const StatusBadge = ({ config }) => {
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1 text-[11px]`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const StaffBookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const response = await httpClient.get("/api/staff/room-borrow-requests");
      const payload = Array.isArray(response.data) ? response.data : response.data?.data;
      setBookings(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          "Không tải được danh sách đặt phòng. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: bookings.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    bookings.forEach((booking) => {
      const status = normalize(booking.status);
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return counts;
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "ALL" || normalize(booking.status) === statusFilter;
      if (!matchesStatus) return false;
      if (!keyword) return true;

      return [
        booking.id,
        booking.requestTitle,
        booking.requesterName,
        booking.requesterUsername,
        booking.clubName,
        booking.sectionCode,
        booking.courseName,
        booking.preferredRoomCode,
        booking.approvedRoomCode,
        booking.purposeNote,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [bookings, searchTerm, statusFilter]);

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
    setIsRejecting(false);
    setRejectReason("");
    setRejectError("");
    setActionError("");
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedBooking(null);
    setIsRejecting(false);
    setRejectReason("");
    setRejectError("");
    setActionError("");
    setActionLoading("");
  };

  const mergeUpdatedBooking = (updatedBooking) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id ? updatedBooking : booking,
      ),
    );
    setSelectedBooking(updatedBooking);
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    setActionLoading("approve");
    setActionError("");
    setRejectError("");

    try {
      const response = await httpClient.patch(
        `/api/staff/room-borrow-requests/${selectedBooking.id}/approve`,
      );
      mergeUpdatedBooking(response.data);
      setIsRejecting(false);
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Không thể duyệt yêu cầu này."),
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setActionLoading("reject");
    setActionError("");
    setRejectError("");

    try {
      const response = await httpClient.patch(
        `/api/staff/room-borrow-requests/${selectedBooking.id}/reject`,
        { rejectReason: reason },
      );
      mergeUpdatedBooking(response.data);
      setIsRejecting(false);
      setRejectReason("");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Không thể từ chối yêu cầu này."),
      );
    } finally {
      setActionLoading("");
    }
  };

  const selectedStatus = normalize(selectedBooking?.status);
  const selectedAvailability = normalize(selectedBooking?.availabilityStatus);
  const isPendingDetail = selectedStatus === "PENDING";
  const canApproveDetail =
    isPendingDetail && selectedAvailability === "AVAILABLE";
  const selectedStatusConfig = selectedBooking
    ? getStatusConfig(selectedBooking.status)
    : STATUS_CONFIG.PENDING;
  const selectedAvailabilityConfig = selectedBooking
    ? getAvailabilityConfig(selectedBooking.availabilityStatus, selectedBooking.status)
    : AVAILABILITY_CONFIG.NO_ROOM;

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Danh sách đặt phòng
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Theo dõi yêu cầu đặt phòng và xử lý duyệt/từ chối ngay trong popup chi tiết.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchBookings}
          disabled={isLoading}
          className="w-fit border-gray-200"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Làm mới
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 bg-white">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({statusCounts[option.value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo mã, người yêu cầu, phòng, lớp, CLB hoặc nội dung..."
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {pageError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{pageError}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && bookings.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải danh sách đặt phòng...
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">
              Không có yêu cầu đặt phòng phù hợp
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Thử đổi bộ lọc hoặc bấm làm mới để lấy dữ liệu mới nhất.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Mã yêu cầu
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Người yêu cầu
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Phòng
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Thời gian
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Nội dung
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Kiểm tra
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleBookings.map((booking) => {
                  const statusConfig = getStatusConfig(booking.status);
                  const availabilityConfig = getAvailabilityConfig(
                    booking.availabilityStatus,
                    booking.status,
                  );

                  return (
                    <TableRow
                      key={booking.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-900">
                        #{booking.id}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <div className="text-xs font-semibold text-gray-900">
                          {booking.requesterName || "Chưa có tên"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {BOOKING_SCOPE_LABELS[normalize(booking.bookingScope)] ||
                            booking.requesterRole ||
                            "Người dùng"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-900">
                        {getRoomText(booking)}
                      </TableCell>
                      <TableCell className="min-w-[140px] text-xs text-gray-700">
                        <div>{formatDate(booking.bookingDate)}</div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {getPeriodLabel(booking)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[260px] text-xs text-gray-700">
                        <div className="font-semibold text-gray-900">
                          {REQUEST_TYPE_LABELS[normalize(booking.requestType)] ||
                            "Yêu cầu đặt phòng"}
                        </div>
                        <div className="mt-1 truncate" title={booking.purposeNote || ""}>
                          {booking.purposeNote || getRequestTitle(booking)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge config={availabilityConfig} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge config={statusConfig} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetails(booking)}
                          className="mx-auto h-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={isDetailOpen && Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) closeDetails();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Chi tiết yêu cầu #{selectedBooking.id}
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  {getRequestTitle(selectedBooking)}
                </p>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge config={selectedStatusConfig} />
                  <StatusBadge config={selectedAvailabilityConfig} />
                  <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                    {REQUEST_TYPE_LABELS[normalize(selectedBooking.requestType)] ||
                      selectedBooking.requestType ||
                      "Yêu cầu"}
                  </Badge>
                  <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                    {BOOKING_SCOPE_LABELS[normalize(selectedBooking.bookingScope)] ||
                      selectedBooking.bookingScope ||
                      "Không rõ vai trò"}
                  </Badge>
                </div>

                {actionError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <DetailItem
                    icon={UserRound}
                    label="Người yêu cầu"
                    value={[
                      selectedBooking.requesterName,
                      selectedBooking.requesterUsername
                        ? `(${selectedBooking.requesterUsername})`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <DetailItem
                    icon={CalendarDays}
                    label="Thời gian mượn"
                    value={`${formatDate(selectedBooking.bookingDate)} - ${getPeriodLabel(
                      selectedBooking,
                    )}`}
                  />
                  <DetailItem
                    icon={ShieldCheck}
                    label="Phòng mong muốn"
                    value={joinNonEmpty(
                      selectedBooking.preferredRoomCode || "Chưa chọn phòng",
                      selectedBooking.preferredRoomCapacity
                        ? `Sức chứa ${selectedBooking.preferredRoomCapacity}`
                        : "",
                    )}
                  />
                  {selectedBooking.approvedRoomCode && (
                    <DetailItem
                      icon={CheckCircle}
                      label="Phòng được duyệt"
                      value={selectedBooking.approvedRoomCode}
                    />
                  )}
                  <DetailItem
                    icon={Users}
                    label="Số người dự kiến"
                    value={
                      selectedBooking.expectedAttendees
                        ? `${selectedBooking.expectedAttendees} người`
                        : "Chưa có"
                    }
                  />
                  <DetailItem
                    icon={Clock}
                    label="Thời điểm tạo"
                    value={formatDateTime(selectedBooking.createdAt)}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <DetailItem
                    label="Học kỳ"
                    value={selectedBooking.semesterName}
                    hideWhenEmpty
                  />
                  {selectedBooking.requestedRoomType && (
                    <DetailItem
                      label="Loại phòng yêu cầu"
                      value={
                        ROOM_TYPE_LABELS[normalize(selectedBooking.requestedRoomType)] ||
                        selectedBooking.requestedRoomType
                      }
                    />
                  )}
                  {(selectedBooking.sectionCode || selectedBooking.courseName) && (
                    <DetailItem
                      label="Lớp học phần"
                      value={joinNonEmpty(
                        selectedBooking.sectionCode,
                        selectedBooking.courseName,
                      )}
                    />
                  )}
                  {selectedBooking.clubName && (
                    <DetailItem
                      label="Câu lạc bộ"
                      value={selectedBooking.clubName}
                    />
                  )}
                </div>

                {selectedBooking.purposeNote && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Nội dung / mục đích sử dụng
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                      {selectedBooking.purposeNote}
                    </p>
                  </div>
                )}

                {(selectedBooking.processingNote ||
                  selectedBooking.rejectReason ||
                  selectedBooking.approvedByName ||
                  selectedBooking.approvedAt) && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Thông tin xử lý
                    </p>
                    <div className="mt-2 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                      {selectedBooking.approvedByName && (
                        <div>
                          <span className="font-semibold">Người duyệt: </span>
                          {selectedBooking.approvedByName}
                        </div>
                      )}
                      {selectedBooking.approvedAt && (
                        <div>
                          <span className="font-semibold">Thời điểm duyệt: </span>
                          {formatDateTime(selectedBooking.approvedAt)}
                        </div>
                      )}
                      {selectedBooking.processingNote && (
                        <div className="md:col-span-2">
                          <span className="font-semibold">Ghi chú: </span>
                          {selectedBooking.processingNote}
                        </div>
                      )}
                      {selectedBooking.rejectReason && (
                        <div className="md:col-span-2 text-red-700">
                          <span className="font-semibold">Lý do từ chối: </span>
                          {selectedBooking.rejectReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isPendingDetail && !canApproveDetail && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <span>
                      Yêu cầu này chưa thể duyệt vì trạng thái kiểm tra phòng là
                      {" "}
                      <strong>{selectedAvailabilityConfig.label}</strong>.
                    </span>
                  </div>
                )}

                {isPendingDetail && isRejecting && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <Label
                      htmlFor="rejectReason"
                      className="text-sm font-semibold text-red-900"
                    >
                      Lý do từ chối <span className="text-red-600">*</span>
                    </Label>
                    <textarea
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(event) => {
                        setRejectReason(event.target.value);
                        if (rejectError) setRejectError("");
                      }}
                      placeholder="Nhập lý do để người gửi hiểu yêu cầu cần điều chỉnh gì..."
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                    {rejectError && (
                      <p className="mt-1 text-xs text-red-700">{rejectError}</p>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsRejecting(false);
                          setRejectError("");
                        }}
                        disabled={Boolean(actionLoading)}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={actionLoading === "reject"}
                      >
                        {actionLoading === "reject" && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Xác nhận từ chối
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t pt-4">
                <Button variant="outline" onClick={closeDetails}>
                  Đóng
                </Button>
                {isPendingDetail && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsRejecting(true);
                        setActionError("");
                      }}
                      disabled={Boolean(actionLoading)}
                    >
                      <XCircle className="h-4 w-4" />
                      Từ chối
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={!canApproveDetail || actionLoading === "approve"}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {actionLoading === "approve" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Duyệt
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { StaffBookingListPage };
