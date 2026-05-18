import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { authService } from "@/features/auth/services/authService";
import { httpClient } from "@/services/httpClient";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const REQUEST_TYPE_LABELS = {
  CLUB_ACTIVITY: "Hoạt động CLB",
  MAKEUP_CLASS: "Học bù",
  SEMINAR: "Seminar",
  WORKSHOP: "Workshop",
  MEETING: "Họp",
  EVENT: "Sự kiện",
  OTHER: "Khác",
};

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
    icon: Clock3,
  },
};

const normalize = (value) => String(value || "").trim().toUpperCase();

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
  if (!value) return "";
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

const getPeriodLabel = (request) => {
  if (!request?.slot && !request?.periodText) return "Chưa có";
  if (request.periodText) {
    return `Ca ${request.slot || "-"} (tiết ${request.periodText})`;
  }
  return `Ca ${request.slot}`;
};

const getRoomText = (request) =>
  request?.approvedRoomCode ||
  request?.preferredRoomCode ||
  "Chưa chọn phòng";

const getRelatedText = (request) =>
  [request.sectionCode, request.courseName, request.clubName]
    .filter(Boolean)
    .join(" - ");

const getFeedbackText = (request) => {
  const status = normalize(request.status);
  if (request.rejectReason) return request.rejectReason;
  if (request.processingNote) return request.processingNote;
  if (status === "APPROVED" && request.approvedRoomCode) {
    return `Đã duyệt phòng ${request.approvedRoomCode}`;
  }
  if (status === "PENDING") {
    return "Đang chờ giáo vụ xử lý";
  }
  return "";
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  "Không tải được danh sách yêu cầu đặt phòng.";

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[normalize(status)] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1 text-[11px]`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const RoomBorrowRequestHistory = ({
  endpoint,
  title,
  description,
  emptyTitle,
}) => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = useMemo(() => {
    const user = authService.getPersistedUser();
    return user?.id ? Number(user.id) : null;
  }, []);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await httpClient.get(endpoint);
      const payload = Array.isArray(response.data) ? response.data : response.data?.data;
      const list = Array.isArray(payload) ? payload : [];
      const ownRequests = currentUserId
        ? list.filter((request) => Number(request.requestedBy) === currentUserId)
        : list;

      setRequests(ownRequests);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, endpoint]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((request) =>
      [
        request.id,
        request.requestTitle,
        request.requestType,
        request.preferredRoomCode,
        request.approvedRoomCode,
        request.purposeNote,
        request.clubName,
        request.sectionCode,
        request.courseName,
        request.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [requests, searchTerm]);

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchRequests}
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

      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm mã yêu cầu, phòng, nội dung, CLB hoặc lớp..."
            className="h-10 pl-9 text-sm"
          />
        </div>
        <div className="flex h-10 items-center rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600">
          <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />
          {filteredRequests.length} yêu cầu
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading && requests.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải danh sách yêu cầu...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock3 className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">{emptyTitle}</p>
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
                    Loại yêu cầu
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Phòng
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Thời gian mượn
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Nội dung
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">
                    Phản hồi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const relatedText = getRelatedText(request);
                  const feedback = getFeedbackText(request);

                  return (
                    <TableRow
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-blue-700">
                        #{request.id}
                        {request.createdAt && (
                          <div className="mt-0.5 text-[11px] font-normal text-gray-400">
                            {formatDateTime(request.createdAt)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-900">
                        {REQUEST_TYPE_LABELS[normalize(request.requestType)] ||
                          request.requestType ||
                          "Yêu cầu"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-900">
                        {getRoomText(request)}
                      </TableCell>
                      <TableCell className="min-w-[140px] text-xs text-gray-700">
                        <div>{formatDate(request.bookingDate)}</div>
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {getPeriodLabel(request)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px] text-xs text-gray-700">
                        <div className="truncate" title={request.purposeNote || ""}>
                          {request.purposeNote || request.requestTitle || "Không có nội dung"}
                        </div>
                        {relatedText && (
                          <div className="mt-0.5 truncate text-[11px] text-gray-500" title={relatedText}>
                            {relatedText}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="max-w-[260px] text-xs text-gray-600">
                        <div className="truncate" title={feedback}>
                          {feedback || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export { RoomBorrowRequestHistory };
