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

const PAGE_SIZE = 10;

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

const getPeriodText = (item) => item?.periodText || item?.slot || "-";

const PaginationBar = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) startPage = Math.max(1, endPage - maxButtons + 1);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">
        Trang {page} / {totalPages}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="h-7 px-2 text-xs"
        >
          ‹
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className="h-7 w-7 p-0 text-xs"
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="h-7 px-2 text-xs"
        >
          ›
        </Button>
      </div>
    </div>
  );
};

const LecturerRoomChangeListPage = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await httpClient.get("/api/lecturer/room-change-requests");
      const payload = Array.isArray(response.data) ? response.data : response.data?.data;
      setRequests(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Không tải được danh sách yêu cầu đổi phòng.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const next = { ALL: requests.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    requests.forEach((item) => {
      const s = normalize(item.status);
      if (next[s] !== undefined) next[s] += 1;
    });
    return next;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || normalize(item.status) === statusFilter;
      if (!matchesStatus) return false;
      if (!keyword) return true;
      return [
        item.id,
        item.classCode,
        item.courseName,
        item.oldRoomCode,
        item.requestedRoomCode,
        item.newRoomCode,
        item.reason,
        item.dayOfWeek,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword));
    });
  }, [requests, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = filteredRequests.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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
            Yêu cầu đổi phòng của tôi
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Danh sách các yêu cầu đổi phòng bạn đã gửi và trạng thái xử lý.
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

      <div className="grid gap-3 md:grid-cols-[200px_1fr]">
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
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo lớp, môn, phòng hoặc lý do..."
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
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
            Đang tải yêu cầu đổi phòng...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">
              {requests.length === 0
                ? "Bạn chưa có yêu cầu đổi phòng nào"
                : "Không có yêu cầu nào phù hợp với bộ lọc"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-2">
              <p className="text-xs text-gray-500">
                Hiển thị{" "}
                <span className="font-semibold text-gray-700">
                  {paginatedRequests.length}
                </span>{" "}
                / {filteredRequests.length} yêu cầu
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Mã</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Lớp học phần</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Đổi phòng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phạm vi</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Tiết học</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Ngày tạo</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600">Xem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((item) => (
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
                        {item.dayOfWeek} - Tiết {getPeriodText(item)}
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
            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
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
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedRequest.status} />
                  <Badge variant="outline">
                    {SCOPE_LABELS[normalize(selectedRequest.changeScope)] || selectedRequest.changeScope}
                  </Badge>
                </div>
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
                  <p className="text-xs font-semibold uppercase text-gray-500">Thời gian học</p>
                  <p className="text-gray-700">
                    {selectedRequest.dayOfWeek} - Tiết {getPeriodText(selectedRequest)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Phạm vi áp dụng</p>
                  <p className="text-gray-700">{scopeText(selectedRequest)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Lý do</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.rejectReason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold uppercase text-red-600">Lý do từ chối</p>
                    <p className="mt-1 text-sm text-red-700">{selectedRequest.rejectReason}</p>
                  </div>
                )}
                {selectedRequest.reviewedAt && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Xử lý bởi</p>
                    <p className="text-gray-700">
                      {selectedRequest.reviewedByName || "Giáo vụ"} —{" "}
                      {formatDateTime(selectedRequest.reviewedAt)}
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
