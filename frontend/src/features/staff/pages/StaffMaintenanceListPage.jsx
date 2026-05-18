import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock3,
  Eye,
  Loader2,
  Search,
  Wrench,
  XCircle,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { apiBaseUrl, httpClient } from "@/services/httpClient";
import {
  categoryLabel,
  severityLabel,
  statusConfig,
} from "@/app/components/maintenance/maintenanceConstants";

const API_PATH = "/api/staff/maintenance-requests";

const getResponseList = (response) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getResponseData = (response) => response.data?.data || response.data;

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiBaseUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

const StatusBadge = ({ status }) => {
  const config = statusConfig(status);
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1 text-[11px] shadow-none`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const severityClassName = (value) => {
  if (value === "URGENT") return "border-red-200 bg-red-50 text-red-700";
  if (value === "HIGH") return "border-orange-200 bg-orange-50 text-orange-700";
  if (value === "MEDIUM") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
};

const StaffMaintenanceListPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await httpClient.get(API_PATH, {
        params: statusFilter === "ALL" ? {} : { status: statusFilter },
      });
      setRequests(getResponseList(response));
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.message ||
          "Không tải được danh sách yêu cầu sửa chữa.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === "PENDING").length,
      inProgress: requests.filter((item) => item.status === "IN_PROGRESS").length,
      resolved: requests.filter((item) => item.status === "RESOLVED").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((request) =>
      [
        request.requestCode,
        request.roomCode,
        request.roomName,
        request.buildingName,
        request.reporterName,
        request.issueTitle,
        request.description,
        categoryLabel(request.issueCategory),
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(keyword)),
    );
  }, [requests, searchTerm]);

  const replaceRequest = (updatedRequest) => {
    setRequests((prev) => {
      const matchesCurrentFilter =
        statusFilter === "ALL" || updatedRequest.status === statusFilter;
      if (!matchesCurrentFilter) {
        return prev.filter((request) => request.id !== updatedRequest.id);
      }
      return prev.map((request) =>
        request.id === updatedRequest.id ? updatedRequest : request,
      );
    });
    setSelectedRequest((prev) =>
      prev?.id === updatedRequest.id ? updatedRequest : prev,
    );
  };

  const updateStatus = async (request, status, note = "") => {
    setUpdating(true);
    setActionError("");
    try {
      const response = await httpClient.patch(`${API_PATH}/${request.id}/status`, {
        status,
        resolutionNote: note.trim() || null,
      });
      replaceRequest(getResponseData(response));
      setActionDialog(null);
      setActionNote("");
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Không cập nhật được trạng thái yêu cầu.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const openActionDialog = (request, status) => {
    setActionDialog({ request, status });
    setActionNote("");
    setActionError("");
  };

  const submitActionDialog = () => {
    if (!actionDialog) return;
    if (!actionNote.trim()) {
      setActionError(
        actionDialog.status === "REJECTED"
          ? "Vui lòng nhập lý do từ chối."
          : "Vui lòng nhập ghi chú hoàn thành.",
      );
      return;
    }
    updateStatus(actionDialog.request, actionDialog.status, actionNote);
  };

  const actionTitle =
    actionDialog?.status === "REJECTED"
      ? "Từ chối yêu cầu sửa chữa"
      : "Hoàn thành yêu cầu sửa chữa";

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Wrench className="h-5 w-5 text-blue-600" />
            Quản lý sửa chữa
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Tiếp nhận và cập nhật tiến độ xử lý các yêu cầu sửa chữa phòng học.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={fetchRequests} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Làm mới
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Tổng yêu cầu" value={stats.total} icon={Wrench} />
        <StatCard label="Chờ tiếp nhận" value={stats.pending} icon={Clock3} />
        <StatCard label="Đang xử lý" value={stats.inProgress} icon={Loader2} />
        <StatCard label="Đã hoàn thành" value={stats.resolved} icon={CheckCircle} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm mã YC, phòng, người gửi, mô tả..."
            className="h-10 pl-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full md:w-56">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="PENDING">Chờ tiếp nhận</SelectItem>
            <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
            <SelectItem value="RESOLVED">Đã hoàn thành</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách sửa chữa...
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wrench className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">
              Không có yêu cầu sửa chữa phù hợp
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-bold text-gray-600">Mã YC</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Phòng</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Người gửi</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Sự cố</TableHead>
                  <TableHead className="text-center text-xs font-bold text-gray-600">Mức độ</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Ngày gửi</TableHead>
                  <TableHead className="text-center text-xs font-bold text-gray-600">Trạng thái</TableHead>
                  <TableHead className="text-right text-xs font-bold text-gray-600">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs font-bold text-blue-700">
                      {request.requestCode}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-gray-900">
                        {request.roomCode}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {request.buildingName}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-700">
                      {request.reporterName}
                    </TableCell>
                    <TableCell className="max-w-[280px] text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabel(request.issueCategory)}
                        </Badge>
                        <span className="font-semibold text-gray-900 truncate">
                          {request.issueTitle}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-gray-500">
                        {request.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`${severityClassName(request.severityLevel)} text-[10px]`}
                      >
                        {severityLabel(request.severityLevel)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">
                      {formatDateTime(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </Button>
                        {request.status === "PENDING" && (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-blue-600 text-xs hover:bg-blue-700"
                            disabled={updating}
                            onClick={() => updateStatus(request, "IN_PROGRESS")}
                          >
                            Tiếp nhận
                          </Button>
                        )}
                        {request.status === "IN_PROGRESS" && (
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-green-600 text-xs hover:bg-green-700"
                            onClick={() => openActionDialog(request, "RESOLVED")}
                          >
                            Hoàn thành
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết yêu cầu {selectedRequest.requestCode}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedRequest.status} />
                  <Badge variant="outline">
                    {categoryLabel(selectedRequest.issueCategory)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={severityClassName(selectedRequest.severityLevel)}
                  >
                    Mức độ: {severityLabel(selectedRequest.severityLevel)}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Detail label="Phòng" value={selectedRequest.roomCode} />
                  <Detail label="Tên phòng" value={selectedRequest.roomName} />
                  <Detail label="Tòa nhà" value={selectedRequest.buildingName} />
                  <Detail label="Người gửi" value={selectedRequest.reporterName} />
                  <Detail label="Ngày gửi" value={formatDateTime(selectedRequest.createdAt)} />
                  <Detail label="Người xử lý" value={selectedRequest.handledByName} />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">Tiêu đề</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {selectedRequest.issueTitle}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Mô tả</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {selectedRequest.description}
                  </p>
                  {selectedRequest.imageUrl && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                        Ảnh minh chứng
                      </p>
                      <a
                        href={resolveImageUrl(selectedRequest.imageUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-fit"
                      >
                        <img
                          src={resolveImageUrl(selectedRequest.imageUrl)}
                          alt="Ảnh minh chứng"
                          className="max-h-64 rounded-lg border border-gray-200 object-contain"
                        />
                      </a>
                    </div>
                  )}
                </div>

                {(selectedRequest.resolutionNote || selectedRequest.handledAt) && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    <p className="text-xs font-semibold uppercase text-green-700">
                      Thông tin xử lý
                    </p>
                    {selectedRequest.handledAt && (
                      <p className="mt-2">
                        Thời gian cập nhật: {formatDateTime(selectedRequest.handledAt)}
                      </p>
                    )}
                    {selectedRequest.resolutionNote && (
                      <p className="mt-1 whitespace-pre-wrap">
                        Ghi chú: {selectedRequest.resolutionNote}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                  {selectedRequest.status === "PENDING" && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => openActionDialog(selectedRequest, "REJECTED")}
                      >
                        <XCircle className="h-4 w-4" />
                        Từ chối
                      </Button>
                      <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={updating}
                        onClick={() => updateStatus(selectedRequest, "IN_PROGRESS")}
                      >
                        <Clock3 className="h-4 w-4" />
                        Tiếp nhận
                      </Button>
                    </>
                  )}
                  {selectedRequest.status === "IN_PROGRESS" && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => openActionDialog(selectedRequest, "REJECTED")}
                      >
                        <XCircle className="h-4 w-4" />
                        Từ chối
                      </Button>
                      <Button
                        type="button"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openActionDialog(selectedRequest, "RESOLVED")}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Hoàn thành
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(actionDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setActionNote("");
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{actionTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {actionDialog?.request?.requestCode} - {actionDialog?.request?.roomCode}
            </p>
            <textarea
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              rows={5}
              placeholder={
                actionDialog?.status === "REJECTED"
                  ? "Nhập lý do từ chối yêu cầu"
                  : "Nhập ghi chú xử lý, linh kiện đã thay hoặc kết quả kiểm tra"
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setActionNote("");
                setActionError("");
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={updating}
              className={
                actionDialog?.status === "REJECTED"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
              onClick={submitActionDialog}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

const Detail = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3">
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{value || "-"}</p>
  </div>
);

export default StaffMaintenanceListPage;
