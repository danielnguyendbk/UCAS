import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { authService } from "@/features/auth/services/authService";
import { httpClient } from "@/services/httpClient";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

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

const SCOPE_LABELS = {
  SESSION: "Một buổi",
  WEEK_RANGE: "Khoảng tuần",
  REST_OF_SEMESTER: "Còn lại học kỳ",
};

const normalize = (value) => String(value || "").trim().toUpperCase();

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

const formatDate = (value) => {
  if (!value) return "";
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

const scopeText = (item) => {
  const scope = normalize(item.changeScope);
  if (scope === "SESSION") return formatDate(item.targetDate) || "Một buổi";
  if (scope === "WEEK_RANGE") return `Tuần ${item.fromWeek} - ${item.toWeek}`;
  if (scope === "REST_OF_SEMESTER") return `Từ tuần ${item.fromWeek} đến hết học kỳ`;
  return item.changeScope || "";
};

const LecturerRoomChangeListPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
      const response = await httpClient.get("/api/lecturer/room-change-requests");
      const payload = Array.isArray(response.data) ? response.data : response.data?.data;
      const list = Array.isArray(payload) ? payload : [];
      setRequests(
        currentUserId
          ? list.filter((item) => Number(item.requestedBy) === currentUserId)
          : list,
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Không tải được danh sách yêu cầu đổi phòng.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openDetails = (item) => {
    setSelectedRequest(item);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Trạng thái đổi phòng
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Chỉ hiển thị các yêu cầu đổi phòng do tài khoản giảng viên hiện tại gửi.
          </p>
        </div>
        <Button variant="outline" onClick={fetchRequests} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Làm mới
        </Button>
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
            Đang tải yêu cầu đổi phòng...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">
              Bạn chưa có yêu cầu đổi phòng nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Mã</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Lớp học phần</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Đổi phòng</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phạm vi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ca</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">Trạng thái</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ngày tạo</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">Xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((item) => (
                  <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-xs font-bold text-blue-700">#{item.id}</TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="text-xs font-semibold text-gray-900">{item.classCode}</div>
                      <div className="mt-0.5 text-[11px] text-gray-500">{item.courseName}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-800">
                      {item.oldRoomCode} {"->"} {item.newRoomCode || item.requestedRoomCode}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-700">
                      {SCOPE_LABELS[normalize(item.changeScope)] || item.changeScope}
                      <div className="mt-0.5 text-[11px] text-gray-500">{scopeText(item)}</div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {item.dayOfWeek} - Ca {item.slot}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDetails(item)}
                        className="h-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={isDetailOpen && Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) closeDetails();
        }}
      >
        <DialogContent className="max-w-lg">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết yêu cầu #{selectedRequest.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Lớp học phần</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.classCode} - {selectedRequest.courseName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Đổi phòng</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.oldRoomCode} {"->"} {selectedRequest.newRoomCode || selectedRequest.requestedRoomCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Phạm vi</p>
                  <p className="text-gray-700">{scopeText(selectedRequest)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Lý do</p>
                  <p className="whitespace-pre-wrap text-gray-700">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.rejectReason && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Lý do từ chối</p>
                    <p className="text-red-700">{selectedRequest.rejectReason}</p>
                  </div>
                )}
                {selectedRequest.reviewedAt && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Thông tin xử lý</p>
                    <p className="text-gray-700">
                      {selectedRequest.reviewedByName || "Giáo vụ"} - {formatDateTime(selectedRequest.reviewedAt)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { LecturerRoomChangeListPage };
export default LecturerRoomChangeListPage;
