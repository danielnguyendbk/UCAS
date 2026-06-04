import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search, Wrench } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { apiBaseUrl, httpClient } from "@/services/httpClient";
import {
  categoryLabel,
  severityLabel,
  statusConfig,
} from "./maintenanceConstants";

const getResponseList = (response) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

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

const MaintenanceHistoryPage = ({
  apiBasePath,
  title = "Lịch sử sửa chữa",
  subtitle = "Theo dõi tiến độ xử lý các yêu cầu sửa chữa đã gửi",
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await httpClient.get(apiBasePath);
      setRequests(getResponseList(response));
    } catch (requestError) {
      setRequests([]);
      setError(
        requestError.response?.data?.message ||
          "Không tải được lịch sử sửa chữa.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [apiBasePath]);

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((request) =>
      [
        request.requestCode,
        request.roomCode,
        request.issueTitle,
        request.description,
        categoryLabel(request.issueCategory),
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(keyword)),
    );
  }, [requests, searchTerm]);

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm mã YC, phòng, mô tả..."
            className="h-10 pl-9 text-sm"
          />
        </div>
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
            Đang tải lịch sử sửa chữa...
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wrench className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">
              Chưa có yêu cầu sửa chữa nào
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
                  <TableHead className="text-xs font-bold text-gray-600">Loại</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Tiêu đề / mô tả</TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">Ngày gửi</TableHead>
                  <TableHead className="text-center text-xs font-bold text-gray-600">Trạng thái</TableHead>
                  <TableHead className="text-center text-xs font-bold text-gray-600">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs font-bold text-blue-700">
                      {request.requestCode}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-gray-800">
                      {request.roomCode}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {categoryLabel(request.issueCategory)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-xs text-gray-700">
                      <div className="font-semibold text-gray-900 truncate">
                        {request.issueTitle}
                      </div>
                      <div className="mt-0.5 truncate text-gray-500">
                        {request.description}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">
                      {formatDateTime(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-center">
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
                  <Badge variant="outline">
                    Mức độ: {severityLabel(selectedRequest.severityLevel)}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Detail label="Phòng" value={selectedRequest.roomCode} />
                  <Detail label="Tên phòng" value={selectedRequest.roomName} />
                  <Detail label="Người gửi" value={selectedRequest.reporterName} />
                  <Detail label="Ngày gửi" value={formatDateTime(selectedRequest.createdAt)} />
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

                {(selectedRequest.handledByName ||
                  selectedRequest.resolutionNote ||
                  selectedRequest.handledAt) && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    <p className="text-xs font-semibold uppercase text-green-700">Thông tin xử lý</p>
                    {selectedRequest.handledByName && (
                      <p className="mt-2">Người xử lý: {selectedRequest.handledByName}</p>
                    )}
                    {selectedRequest.handledAt && (
                      <p className="mt-1">Thời gian: {formatDateTime(selectedRequest.handledAt)}</p>
                    )}
                    {selectedRequest.resolutionNote && (
                      <p className="mt-1 whitespace-pre-wrap">
                        Ghi chú: {selectedRequest.resolutionNote}
                      </p>
                    )}
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

const Detail = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3">
    <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{value || "-"}</p>
  </div>
);

export default MaintenanceHistoryPage;
