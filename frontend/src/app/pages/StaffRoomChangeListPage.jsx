import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

const StaffRoomChangeListPage = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const response = await httpClient.get("/api/staff/emergency-room-changes");
      const payload = Array.isArray(response.data) ? response.data : response.data?.data;
      setRequests(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được danh sách đổi phòng."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const counts = useMemo(() => {
    const next = { ALL: requests.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    requests.forEach((request) => {
      const status = normalize(request.status);
      if (next[status] !== undefined) next[status] += 1;
    });
    return next;
  }, [requests]);

  const visibleRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" || normalize(request.status) === statusFilter;
      if (!matchesStatus) return false;
      if (!keyword) return true;
      return [
        request.id,
        request.requesterName,
        request.requesterUsername,
        request.classCode,
        request.courseName,
        request.oldRoomCode,
        request.requestedRoomCode,
        request.newRoomCode,
        request.reason,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [requests, searchTerm, statusFilter]);

  const openDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
    setIsRejecting(false);
    setRejectReason("");
    setRejectError("");
    setActionError("");
  };

  const closeDetails = () => {
    setSelectedRequest(null);
    setIsDetailOpen(false);
    setIsRejecting(false);
    setRejectReason("");
    setRejectError("");
    setActionError("");
    setActionLoading("");
  };

  const mergeUpdatedRequest = (updated) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === updated.id ? updated : request)),
    );
    setSelectedRequest(updated);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading("approve");
    setActionError("");
    try {
      const response = await httpClient.patch(
        `/api/staff/emergency-room-changes/${selectedRequest.id}/approve`,
      );
      mergeUpdatedRequest(response.data);
      setIsRejecting(false);
    } catch (error) {
      setActionError(getErrorMessage(error, "Không thể duyệt yêu cầu đổi phòng."));
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setActionLoading("reject");
    setActionError("");
    try {
      const response = await httpClient.patch(
        `/api/staff/emergency-room-changes/${selectedRequest.id}/reject`,
        { rejectReason: reason },
      );
      mergeUpdatedRequest(response.data);
      setIsRejecting(false);
      setRejectReason("");
    } catch (error) {
      setActionError(getErrorMessage(error, "Không thể từ chối yêu cầu đổi phòng."));
    } finally {
      setActionLoading("");
    }
  };

  const isPending = normalize(selectedRequest?.status) === "PENDING";

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Danh sách đổi phòng
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý và phê duyệt yêu cầu đổi phòng do giảng viên gửi.
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

      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 bg-white">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label} ({counts[option.value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo giảng viên, lớp, môn, phòng hoặc lý do..."
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
        {isLoading && requests.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải danh sách đổi phòng...
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">
              Không có yêu cầu đổi phòng phù hợp
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-600">Mã</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Người gửi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Lớp học phần</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Đổi phòng</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Phạm vi</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Ca</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">Trạng thái</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-gray-600">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.map((request) => (
                  <TableRow key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-xs font-bold text-blue-700">#{request.id}</TableCell>
                    <TableCell className="min-w-[150px]">
                      <div className="text-xs font-semibold text-gray-900">
                        {request.requesterName || request.lecturerName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {request.requesterUsername}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="text-xs font-semibold text-gray-900">{request.classCode}</div>
                      <div className="mt-0.5 text-[11px] text-gray-500">{request.courseName}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-800">
                      {request.oldRoomCode} {"->"} {request.newRoomCode || request.requestedRoomCode}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-700">
                      {SCOPE_LABELS[normalize(request.changeScope)] || request.changeScope}
                      <div className="mt-0.5 text-[11px] text-gray-500">{scopeText(request)}</div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {request.dayOfWeek} - Ca {request.slot}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDetails(request)}
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
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết yêu cầu #{selectedRequest.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedRequest.status} />
                  <Badge variant="outline">
                    {SCOPE_LABELS[normalize(selectedRequest.changeScope)] || selectedRequest.changeScope}
                  </Badge>
                </div>

                {actionError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <Detail label="Người gửi" value={`${selectedRequest.requesterName || selectedRequest.lecturerName} (${selectedRequest.requesterUsername || "-"})`} />
                  <Detail label="Lớp học phần" value={`${selectedRequest.classCode} - ${selectedRequest.courseName}`} />
                  <Detail label="Đổi phòng" value={`${selectedRequest.oldRoomCode} -> ${selectedRequest.newRoomCode || selectedRequest.requestedRoomCode}`} />
                  <Detail label="Thời gian" value={`${selectedRequest.dayOfWeek} - Ca ${selectedRequest.slot} - ${scopeText(selectedRequest)}`} />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">Lý do</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.reviewedAt && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
                    <p className="text-xs font-semibold uppercase text-gray-500">Thông tin xử lý</p>
                    <p className="mt-2">
                      {selectedRequest.reviewedByName || "Giáo vụ"} - {formatDateTime(selectedRequest.reviewedAt)}
                    </p>
                    {selectedRequest.rejectReason && (
                      <p className="mt-1 text-red-700">Lý do từ chối: {selectedRequest.rejectReason}</p>
                    )}
                    {selectedRequest.reviewNote && !selectedRequest.rejectReason && (
                      <p className="mt-1">Ghi chú: {selectedRequest.reviewNote}</p>
                    )}
                  </div>
                )}

                {isPending && isRejecting && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-900">Lý do từ chối</p>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => {
                        setRejectReason(event.target.value);
                        if (rejectError) setRejectError("");
                      }}
                      rows={4}
                      placeholder="Nhập lý do từ chối yêu cầu này..."
                      className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                    {rejectError && (
                      <p className="mt-1 text-xs text-red-700">{rejectError}</p>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        disabled={Boolean(actionLoading)}
                        onClick={() => {
                          setIsRejecting(false);
                          setRejectError("");
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={actionLoading === "reject"}
                        onClick={handleReject}
                      >
                        {actionLoading === "reject" && <Loader2 className="h-4 w-4 animate-spin" />}
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
                {isPending && (
                  <>
                    <Button
                      variant="destructive"
                      disabled={Boolean(actionLoading)}
                      onClick={() => {
                        setIsRejecting(true);
                        setActionError("");
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Từ chối
                    </Button>
                    <Button
                      disabled={actionLoading === "approve"}
                      onClick={handleApprove}
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

const Detail = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3">
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{value || "-"}</p>
  </div>
);

export { StaffRoomChangeListPage };
export default StaffRoomChangeListPage;
