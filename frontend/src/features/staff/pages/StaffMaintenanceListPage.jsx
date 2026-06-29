import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Flame,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { categoryLabel } from "@/app/components/maintenance/maintenanceConstants";
import { apiBaseUrl, httpClient } from "@/services/httpClient";

const API_PATH = "/api/staff/maintenance-requests";
const PAGE_SIZE = 10;

const STATUS_TABS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã hoàn tất" },
  { value: "REJECTED", label: "Từ chối" },
];

const STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã hoàn tất",
  COMPLETED: "Đã hoàn tất",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

const STATUS_BADGE = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-800 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_LABELS = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

const PRIORITY_BADGE = {
  LOW: "bg-gray-50 text-gray-700 border-gray-200",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  URGENT: "bg-red-50 text-red-700 border-red-200",
};

const ROLE_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả vai trò" },
  { value: "STUDENT", label: "Sinh viên" },
  { value: "LECTURER", label: "Giảng viên" },
  { value: "FACILITY", label: "Nhân viên CSVC" },
];

const getResponseList = (response) => {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getResponseData = (response) => response.data?.data ?? response.data;

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const display = (value) => {
  if (value == null || String(value).trim() === "") return "—";
  return String(value).trim();
};

const statusLabel = (status) =>
  STATUS_LABELS[status] ?? status ?? "—";

const priorityLabel = (level) =>
  PRIORITY_LABELS[level] ?? level ?? "—";

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiBaseUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

const isCompletedStatus = (status) =>
  status === "RESOLVED" || status === "COMPLETED";

const StaffMaintenanceListPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [buildingFilter, setBuildingFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [reporterFilter, setReporterFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [semesters, setSemesters] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [placeholderDialog, setPlaceholderDialog] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setApiError("");
    setApiUnavailable(false);
    try {
      const response = await httpClient.get(API_PATH);
      setRequests(getResponseList(response));
    } catch (error) {
      setRequests([]);
      const status = error?.response?.status;
      if (!status || status === 404 || status === 501) {
        setApiUnavailable(true);
      } else {
        setApiError(
          error?.response?.data?.message ||
            "Không tải được danh sách yêu cầu sửa chữa.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [semRes, bldRes] = await Promise.all([
          httpClient.get("/api/categories/semesters"),
          httpClient.get("/api/categories/buildings"),
        ]);
        setSemesters(getResponseList(semRes));
        setBuildings(getResponseList(bldRes));
      } catch {
        setSemesters([]);
        setBuildings([]);
      }
    };
    void loadCategories();
  }, []);

  const reporterOptions = useMemo(() => {
    const names = [
      ...new Set(requests.map((r) => r.reporterName).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "vi"));
    return names;
  }, [requests]);

  const roomOptions = useMemo(() => {
    const rooms = [
      ...new Set(requests.map((r) => r.roomCode).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "vi"));
    return rooms;
  }, [requests]);

  const buildingOptions = useMemo(() => {
    const fromData = [
      ...new Set(requests.map((r) => r.buildingName).filter(Boolean)),
    ];
    const fromCategories = buildings
      .map((b) => b.name ?? b.code)
      .filter(Boolean);
    return [...new Set([...fromData, ...fromCategories])].sort((a, b) =>
      a.localeCompare(b, "vi"),
    );
  }, [requests, buildings]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING").length,
      inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
      completed: requests.filter((r) => isCompletedStatus(r.status)).length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
      urgent: requests.filter((r) => r.severityLevel === "URGENT").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      if (activeTab !== "ALL" && request.status !== activeTab) return false;
      if (statusFilter !== "ALL" && request.status !== statusFilter) return false;
      if (buildingFilter !== "ALL" && request.buildingName !== buildingFilter) {
        return false;
      }
      if (roomFilter !== "ALL" && request.roomCode !== roomFilter) return false;
      if (reporterFilter !== "ALL" && request.reporterName !== reporterFilter) {
        return false;
      }
      if (priorityFilter !== "ALL" && request.severityLevel !== priorityFilter) {
        return false;
      }
      if (roleFilter !== "ALL") {
        const role = request.reporterRole ?? request.requesterRole;
        if (role && role !== roleFilter) return false;
      }
      if (semesterFilter !== "ALL") {
        // Học kỳ chưa có trên API — giữ bộ lọc sẵn sàng cho tương lai
      }
      if (!keyword) return true;

      return [
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
        .some((value) => value.toString().toLowerCase().includes(keyword));
    });
  }, [
    requests,
    activeTab,
    statusFilter,
    buildingFilter,
    roomFilter,
    reporterFilter,
    priorityFilter,
    roleFilter,
    semesterFilter,
    searchTerm,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = filteredRequests.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    searchTerm,
    semesterFilter,
    buildingFilter,
    roomFilter,
    reporterFilter,
    roleFilter,
    priorityFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const replaceRequest = (updatedRequest) => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === updatedRequest.id ? updatedRequest : item,
      ),
    );
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
    } catch (error) {
      setActionError(
        error?.response?.data?.message ||
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
          : "Vui lòng nhập ghi chú xử lý.",
      );
      return;
    }
    const backendStatus =
      actionDialog.status === "COMPLETED" ? "RESOLVED" : actionDialog.status;
    updateStatus(actionDialog.request, backendStatus, actionNote);
  };

  const handleAccept = (request) => {
    updateStatus(request, "IN_PROGRESS");
  };

  const actionDialogTitle =
    actionDialog?.status === "REJECTED"
      ? "Từ chối yêu cầu sửa chữa"
      : "Hoàn tất yêu cầu sửa chữa";

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            <Wrench className="h-6 w-6 text-blue-600" />
            Danh sách yêu cầu sửa chữa
          </h1>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
            Theo dõi và xử lý các yêu cầu sửa chữa phòng học, thiết bị và cơ sở
            vật chất
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={fetchRequests}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Làm mới
        </Button>
      </div>

      {apiUnavailable && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p>
            <span className="font-semibold">
              Backend chưa hỗ trợ API danh sách yêu cầu sửa chữa cho Staff.
            </span>{" "}
            Endpoint{" "}
            <code className="rounded bg-amber-100/80 px-1 text-xs font-mono">
              {API_PATH}
            </code>{" "}
            chưa khả dụng.
          </p>
        </div>
      )}

      {apiError && !apiUnavailable && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Tổng yêu cầu" value={stats.total} icon={Wrench} tone="blue" />
        <SummaryCard label="Chờ xử lý" value={stats.pending} icon={Clock3} tone="amber" />
        <SummaryCard label="Đang xử lý" value={stats.inProgress} icon={Zap} tone="sky" />
        <SummaryCard label="Đã hoàn tất" value={stats.completed} icon={CheckCircle} tone="green" />
        <SummaryCard label="Từ chối" value={stats.rejected} icon={Ban} tone="red" />
        <SummaryCard label="Khẩn cấp" value={stats.urgent} icon={Flame} tone="orange" />
      </div>

      <Card className="rounded-xl border-gray-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 h-auto flex-wrap">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs data-[state=active]:bg-white"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã yêu cầu, phòng, tiêu đề, người gửi..."
              className="h-10 pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <FilterSelect
              label="Học kỳ"
              value={semesterFilter}
              onChange={setSemesterFilter}
              options={[
                { value: "ALL", label: "Tất cả học kỳ" },
                ...semesters.map((s) => ({
                  value: String(s.id ?? s.name),
                  label: s.name ?? s.label ?? `HK ${s.id}`,
                })),
              ]}
            />
            <FilterSelect
              label="Tòa nhà"
              value={buildingFilter}
              onChange={setBuildingFilter}
              options={[
                { value: "ALL", label: "Tất cả tòa nhà" },
                ...buildingOptions.map((name) => ({ value: name, label: name })),
              ]}
            />
            <FilterSelect
              label="Phòng"
              value={roomFilter}
              onChange={setRoomFilter}
              options={[
                { value: "ALL", label: "Tất cả phòng" },
                ...roomOptions.map((code) => ({ value: code, label: code })),
              ]}
            />
            <FilterSelect
              label="Người gửi"
              value={reporterFilter}
              onChange={setReporterFilter}
              options={[
                { value: "ALL", label: "Tất cả người gửi" },
                ...reporterOptions.map((name) => ({ value: name, label: name })),
              ]}
            />
            <FilterSelect
              label="Vai trò người gửi"
              value={roleFilter}
              onChange={setRoleFilter}
              options={ROLE_FILTER_OPTIONS}
            />
            <FilterSelect
              label="Mức độ ưu tiên"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "ALL", label: "Tất cả mức độ" },
                ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <FilterSelect
              label="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                ...STATUS_TABS.filter((t) => t.value !== "ALL").map((t) => ({
                  value: t.value,
                  label: t.label,
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Đang tải danh sách yêu cầu sửa chữa...
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="rounded-xl border-2 border-dashed border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Wrench className="mb-3 h-12 w-12 text-gray-200" />
            <p className="text-base font-semibold text-gray-700">
              Chưa có yêu cầu sửa chữa nào.
            </p>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
              Các yêu cầu từ sinh viên, giảng viên hoặc nhân viên CSVC sẽ hiển
              thị tại đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs font-bold text-gray-600">
                    Mã yêu cầu
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">
                    Tiêu đề
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">
                    Phòng
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">
                    Tòa nhà
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">
                    Người gửi
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">
                    Vai trò
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-gray-600">
                    Mức độ
                  </TableHead>
                  <TableHead className="text-xs font-bold text-gray-600">
                    Ngày gửi
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-gray-600">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold text-gray-600">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50/80">
                    <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                      {display(request.requestCode)}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-xs font-medium text-gray-900 truncate">
                      {display(request.issueTitle)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {display(request.roomCode)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[120px] truncate">
                      {display(request.buildingName)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700 whitespace-nowrap">
                      {display(request.reporterName)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {display(
                        request.reporterRole ??
                          request.requesterRole ??
                          null,
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${PRIORITY_BADGE[request.severityLevel] ?? PRIORITY_BADGE.MEDIUM}`}
                      >
                        {priorityLabel(request.severityLevel)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${STATUS_BADGE[request.status] ?? "bg-gray-50 text-gray-700"}`}
                      >
                        {statusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        request={request}
                        updating={updating}
                        onDetail={() => setSelectedRequest(request)}
                        onAccept={() => handleAccept(request)}
                        onComplete={() => openActionDialog(request, "RESOLVED")}
                        onReject={() => openActionDialog(request, "REJECTED")}
                        onUpdate={() => setPlaceholderDialog(true)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-xs text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRequests.length)} / {filteredRequests.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-gray-600">Trang {page}/{totalPages}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <DetailDialog
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onAccept={handleAccept}
        onComplete={(req) => openActionDialog(req, "RESOLVED")}
        onReject={(req) => openActionDialog(req, "REJECTED")}
        onUpdate={() => setPlaceholderDialog(true)}
        updating={updating}
      />

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
            <DialogTitle>{actionDialogTitle}</DialogTitle>
            <DialogDescription>
              {actionDialog?.request?.requestCode} — {actionDialog?.request?.roomCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Ghi chú xử lý</Label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
                placeholder={
                  actionDialog?.status === "REJECTED"
                    ? "Nhập lý do từ chối"
                    : "Nhập kết quả xử lý, linh kiện đã thay..."
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {actionError && (
              <p className="text-sm text-red-600">{actionError}</p>
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
              {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={placeholderDialog} onOpenChange={setPlaceholderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Chức năng đang phát triển
            </DialogTitle>
            <DialogDescription>
              Tính năng cập nhật chi tiết yêu cầu sẽ được bổ sung trong phiên bản
              tiếp theo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setPlaceholderDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const RowActions = ({
  request,
  updating,
  onDetail,
  onAccept,
  onComplete,
  onReject,
  onUpdate,
}) => (
  <div className="flex flex-wrap justify-end gap-1">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 text-xs text-blue-600"
      onClick={onDetail}
    >
      <Eye className="h-3.5 w-3.5 mr-1" />
      Chi tiết
    </Button>
    {request.status === "PENDING" && (
      <Button
        type="button"
        size="sm"
        className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
        disabled={updating}
        onClick={onAccept}
      >
        Tiếp nhận
      </Button>
    )}
    {request.status === "IN_PROGRESS" && (
      <>
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs bg-green-600 hover:bg-green-700"
          disabled={updating}
          onClick={onComplete}
        >
          Hoàn tất
        </Button>
      </>
    )}
    {(request.status === "PENDING" || request.status === "IN_PROGRESS") && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
        disabled={updating}
        onClick={onReject}
      >
        Từ chối
      </Button>
    )}
  </div>
);

const DetailDialog = ({
  request,
  onClose,
  onAccept,
  onComplete,
  onReject,
  onUpdate,
  updating,
}) => (
  <Dialog open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      {request && (
        <>
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu {request.requestCode}</DialogTitle>
            <DialogDescription>Thông tin yêu cầu sửa chữa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={STATUS_BADGE[request.status]}>
                {statusLabel(request.status)}
              </Badge>
              <Badge
                variant="outline"
                className={PRIORITY_BADGE[request.severityLevel]}
              >
                Mức độ: {priorityLabel(request.severityLevel)}
              </Badge>
              <Badge variant="outline">{categoryLabel(request.issueCategory)}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Phòng" value={request.roomCode} />
              <DetailField label="Tên phòng" value={request.roomName} />
              <DetailField label="Tòa nhà" value={request.buildingName} />
              <DetailField label="Người gửi" value={request.reporterName} />
              <DetailField
                label="Vai trò người gửi"
                value={request.reporterRole ?? request.requesterRole}
              />
              <DetailField label="Ngày gửi" value={formatDateTime(request.createdAt)} />
              <DetailField label="Người xử lý" value={request.handledByName} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Mô tả sự cố
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {display(request.issueTitle)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {display(request.description)}
              </p>
              {request.imageUrl && (
                <a
                  href={resolveImageUrl(request.imageUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block"
                >
                  <img
                    src={resolveImageUrl(request.imageUrl)}
                    alt="Ảnh minh chứng"
                    className="max-h-48 rounded-lg border border-gray-200 object-contain"
                  />
                </a>
              )}
            </div>

            {request.resolutionNote && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <p className="text-xs font-semibold uppercase text-green-700">
                  Ghi chú xử lý
                </p>
                <p className="mt-2 whitespace-pre-wrap">{request.resolutionNote}</p>
                {request.handledAt && (
                  <p className="mt-2 text-xs text-green-700">
                    Cập nhật: {formatDateTime(request.handledAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
              {request.status === "PENDING" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => onReject(request)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={updating}
                    onClick={() => onAccept(request)}
                  >
                    Tiếp nhận
                  </Button>
                </>
              )}
              {request.status === "IN_PROGRESS" && (
                <>
                  <Button type="button" variant="outline" onClick={onUpdate}>
                    Cập nhật
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => onReject(request)}
                  >
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onComplete(request)}
                  >
                    Hoàn tất
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

const SummaryCard = ({ label, value, icon: Icon, tone }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${tones[tone] ?? tones.blue}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-gray-500">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3">
    <p className="text-[11px] font-semibold uppercase text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{display(value)}</p>
  </div>
);

export default StaffMaintenanceListPage;
