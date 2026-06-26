import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  SquarePen,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { httpClient } from "@/services/httpClient";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const SOURCE_TYPE_LABELS = {
  CLASS_SESSION: "Lịch học",
  BORROW_REQUEST: "Mượn phòng",
  EXAM: "Lịch thi",
};

const STATUS_LABELS = {
  PENDING: "Chưa mở",
  OPENED: "Đã mở",
  LATE: "Trễ",
  CLOSED: "Đã đóng",
  MISSED: "Bỏ sót",
  CANCELLED: "Đã hủy",
};

const STATUS_BADGES = {
  PENDING: "bg-gray-100 text-gray-700",
  OPENED: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  CLOSED: "bg-blue-100 text-blue-700",
  MISSED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const ACTION_LABELS = {
  OPEN_ROOM: "Mở cửa",
  CLOSE_ROOM: "Đóng cửa",
};

const ACTION_BADGES = {
  OPEN_ROOM: "bg-green-100 text-green-700",
  CLOSE_ROOM: "bg-blue-100 text-blue-700",
};

const EMPTY_ISSUE_FORM = {
  classroomId: "",
  issueTitle: "",
  issueCategory: "DOOR",
  severityLevel: "MEDIUM",
  description: "",
};

const normalize = (value) => String(value ?? "").trim();
const getTodayLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const getResponseData = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return payload?.data ?? payload ?? [];
};

const getPageData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};
  if (Array.isArray(payload?.items)) {
    return payload;
  }
  return { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 };
};

const getActiveSemester = (semesters) =>
  semesters.find((semester) => String(semester.status ?? semester.statusLabel ?? "").toUpperCase() === "ACTIVE") ??
  semesters[0] ??
  null;

const formatTimeRange = (item) => {
  const start = item.startTime ? String(item.startTime).slice(0, 5) : "--:--";
  const end = item.endTime ? String(item.endTime).slice(0, 5) : "--:--";
  return `${start} - ${end}`;
};

const formatDateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatClock = (value) => {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) {
    return text.slice(11, 16);
  }
  return text.slice(0, 5);
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

const normalizeItem = (item) => ({
  sourceType: item.sourceType ?? item.source_type ?? "CLASS_SESSION",
  sourceId: item.sourceId ?? item.source_id,
  semesterId: item.semesterId ?? item.semester_id,
  buildingId: item.buildingId ?? item.building_id,
  buildingCode: item.buildingCode ?? item.building_code ?? "",
  classroomId: item.classroomId ?? item.classroom_id,
  classroomCode: item.classroomCode ?? item.classroom_code ?? "",
  title: item.title ?? "",
  subtitle: item.subtitle ?? "",
  accessDate: item.accessDate ?? item.access_date,
  startTime: item.startTime ?? item.start_time,
  endTime: item.endTime ?? item.end_time,
  expectedOpenTime: item.expectedOpenTime ?? item.expected_open_time,
  status: String(item.status ?? "PENDING").toUpperCase(),
  openedAt: item.openedAt ?? item.opened_at ?? null,
  closedAt: item.closedAt ?? item.closed_at ?? null,
  canOpen: Boolean(item.canOpen ?? item.can_open),
  canClose: Boolean(item.canClose ?? item.can_close),
});

const normalizeSemester = (item) => ({
  id: item.id ?? item.semester_id,
  code: item.code ?? item.semester_code ?? "",
  name: item.name ?? item.semester_name ?? "",
  status: item.status ?? "",
});

const normalizeAssignment = (response) => {
  const payload = response?.data?.data ?? response?.data ?? null;
  return payload || null;
};

export const FacilityOpeningSchedulePage = () => {
  const [semesters, setSemesters] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [error, setError] = useState("");

  const [semesterId, setSemesterId] = useState("");
  const [date, setDate] = useState(getTodayLocal);
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [actionTarget, setActionTarget] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [issueTarget, setIssueTarget] = useState(null);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE_FORM);

  // History tab state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAction, setHistoryAction] = useState("ALL");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(0);
  const [historySize, setHistorySize] = useState(10);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState("schedule");

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    if (!semesterId && semesters.length > 0) {
      const active = getActiveSemester(semesters);
      if (active) {
        setSemesterId(String(active.id));
      }
    }
  }, [semesters, semesterId]);

  useEffect(() => {
    if (!semesterId) return;
    void loadAssignment();
  }, [semesterId]);

  useEffect(() => {
    if (!semesterId || !assignment) return;
    void loadItems();
  }, [semesterId, assignment, page, size, date, search, sourceType, status]);

  useEffect(() => {
    if (activeTab !== "history") return;
    void loadHistory();
  }, [activeTab, historyPage, historySize, historyAction, historyStartDate, historyEndDate, historySearch]);

  const semesterOptions = useMemo(() => semesters, [semesters]);

  const currentSemester = useMemo(
    () => semesterOptions.find((item) => String(item.id) === String(semesterId)),
    [semesterOptions, semesterId],
  );

  const currentBuildingLabel = assignment
    ? `${assignment.buildingName || assignment.buildingCode || "Tòa nhà"}${assignment.buildingCode ? ` (${assignment.buildingCode})` : ""}`
    : "";

  const loadInitial = async () => {
    setLoading(true);
    setError("");
    try {
      const semestersResponse = await httpClient.get("/api/categories/semesters");
      const semestersData = getResponseData(semestersResponse).map(normalizeSemester);
      setSemesters(semestersData);
      const active = getActiveSemester(semestersData);
      const nextSemesterId = semesterId || (active ? String(active.id) : "");
      if (nextSemesterId) {
        setSemesterId(nextSemesterId);
      }
    } catch (exception) {
      console.error("Failed to load semesters", exception);
      setError("Không tải được danh sách học kỳ.");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignment = async () => {
    try {
      const response = await httpClient.get("/api/facility/my-assignment", {
        params: semesterId ? { semesterId: Number(semesterId) } : undefined,
      });
      setAssignment(normalizeAssignment(response));
    } catch (exception) {
      if (exception?.response?.status === 404) {
        setAssignment(null);
        return;
      }
      console.error("Failed to load assignment", exception);
      setError("Không tải được thông tin phân công.");
      setAssignment(null);
    }
  };

  const loadItems = async () => {
    if (!semesterId || !assignment) {
      setItems([]);
      setTotalItems(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    try {
      const response = await httpClient.get("/api/facility/opening-schedule", {
        params: {
          semesterId: Number(semesterId),
          date,
          page,
          size,
          search: normalize(search) || undefined,
          sourceType: sourceType === "ALL" ? undefined : sourceType,
          status: status === "ALL" ? undefined : status,
        },
      });
      const pageData = getPageData(response);
      setItems((pageData.items || []).map(normalizeItem));
      setTotalItems(pageData.totalItems ?? 0);
      setTotalPages(pageData.totalPages ?? 0);
    } catch (exception) {
      console.error("Failed to load opening schedule", exception);
      const apiError = exception?.response?.data;
      setError(apiError?.message || "Không tải được lịch mở cửa.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await httpClient.get("/api/facility/room-access-history", {
        params: {
          action: historyAction === "ALL" ? undefined : historyAction,
          startDate: historyStartDate || undefined,
          endDate: historyEndDate || undefined,
          search: normalize(historySearch) || undefined,
          page: historyPage,
          size: historySize,
        },
      });
      const pageData = getPageData(response);
      setHistoryItems(pageData.items || []);
      setHistoryTotalItems(pageData.totalItems ?? 0);
      setHistoryTotalPages(pageData.totalPages ?? 0);
    } catch (exception) {
      console.error("Failed to load room access history", exception);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refresh = async () => {
    await loadItems();
  };

  const openActionDialog = (item, mode) => {
    setActionTarget(item);
    setActionMode(mode);
  };

  const performAction = async () => {
    if (!actionTarget || !actionMode) return;
    setSavingAction(true);
    setError("");
    try {
      const payload = {
        semesterId: Number(semesterId),
        sourceType: actionTarget.sourceType,
        sourceId: Number(actionTarget.sourceId),
        classroomId: Number(actionTarget.classroomId),
      };
      const endpoint = actionMode === "open" ? "/api/facility/open-room" : "/api/facility/close-room";
      await httpClient.post(endpoint, payload);
      toast.success(actionMode === "open" ? "Đã mở cửa phòng." : "Đã đóng cửa phòng.");
      setActionTarget(null);
      setActionMode(null);
      await loadItems();
    } catch (exception) {
      console.error("Failed to update room state", exception);
      const apiError = exception?.response?.data;
      setError(apiError?.message || "Không thực hiện được thao tác.");
      toast.error(apiError?.message || "Không thực hiện được thao tác.");
    } finally {
      setSavingAction(false);
    }
  };

  const openIssueDialog = (item) => {
    setIssueTarget(item);
    setIssueForm({
      classroomId: String(item.classroomId ?? ""),
      issueTitle: item.title ? `Báo sự cố phòng ${item.classroomCode}` : "Báo sự cố phòng",
      issueCategory: "DOOR",
      severityLevel: "MEDIUM",
      description: "",
    });
  };

  const submitIssue = async () => {
    if (!issueTarget) return;
    if (!issueForm.classroomId || !issueForm.issueTitle || !issueForm.description) {
      setError("Vui lòng nhập đầy đủ thông tin sự cố.");
      return;
    }

    setSavingAction(true);
    setError("");
    try {
      await httpClient.post("/api/facility/issue-reports", {
        classroomId: Number(issueForm.classroomId),
        issueTitle: issueForm.issueTitle.trim(),
        issueCategory: issueForm.issueCategory,
        severityLevel: issueForm.severityLevel,
        description: issueForm.description.trim(),
        semesterId: semesterId ? Number(semesterId) : undefined,
      });
      toast.success("Đã ghi nhận báo cáo sự cố.");
      setIssueTarget(null);
      setIssueForm(EMPTY_ISSUE_FORM);
    } catch (exception) {
      console.error("Failed to create issue report", exception);
      const apiError = exception?.response?.data;
      setError(apiError?.message || "Không tạo được báo cáo sự cố.");
      toast.error(apiError?.message || "Không tạo được báo cáo sự cố.");
    } finally {
      setSavingAction(false);
    }
  };

  const activeSemesterLabel = currentSemester ? `${currentSemester.name || currentSemester.code}` : "Chưa chọn học kỳ";

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mở/đóng cửa phòng học</h1>
          <p className="mt-1 text-sm text-gray-600">
            {assignment
              ? `Học kỳ ${activeSemesterLabel} - ${currentBuildingLabel}`
              : "Bạn chưa được phân công tòa nhà trong học kỳ này."}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <span>{formatDateLabel(date)}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="mb-2">
          <TabsTrigger value="schedule">
            <LockKeyhole className="mr-2 h-4 w-4" />
            Lịch hôm nay
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Lịch sử mở/đóng
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Lịch hôm nay ── */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Học kỳ</Label>
              <select
                value={semesterId}
                onChange={(event) => {
                  setSemesterId(event.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {semesterOptions.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name || semester.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Ngày</Label>
              <Input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setPage(0);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Loại lịch</Label>
              <select
                value={sourceType}
                onChange={(event) => {
                  setSourceType(event.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Tất cả</option>
                <option value="CLASS_SESSION">Lịch học</option>
                <option value="BORROW_REQUEST">Mượn phòng</option>
                <option value="EXAM">Lịch thi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Tất cả</option>
                {Object.keys(STATUS_LABELS).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setPage(0);
                    }
                  }}
                  className="pl-9"
                  placeholder="Phòng, môn, nội dung..."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!assignment ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
              <ShieldAlert className="mx-auto h-12 w-12 text-gray-300" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Bạn chưa được phân công tòa nhà trong học kỳ này.</h2>
              <p className="mt-2 text-sm text-gray-500">Liên hệ quản trị viên để được phân công trước khi thao tác mở/đóng phòng.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-blue-600" />
                  <span>{activeSemesterLabel}</span>
                  <span className="text-gray-400">•</span>
                  <span>{currentBuildingLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Tổng {totalItems} bản ghi</span>
                  <Button variant="outline" size="sm" onClick={refresh} disabled={loading || savingAction}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tải lại
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Giờ</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Loại lịch</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải lịch mở cửa...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-14 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="h-10 w-10 text-gray-300" />
                          <div>
                            <p className="font-semibold text-gray-700">Không có lịch phù hợp.</p>
                            <p className="mt-1 text-xs text-gray-400">Hãy đổi bộ lọc hoặc ngày tra cứu.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={`${item.sourceType}-${item.sourceId}-${item.classroomId}`} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{formatTimeRange(item)}</div>
                              <div className="text-xs text-gray-400">Mở trước {formatClock(item.expectedOpenTime)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-blue-700">{item.classroomCode}</div>
                          <div className="text-xs text-gray-400">{formatDateLabel(item.accessDate)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.subtitle}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGES[item.status] || "bg-gray-100 text-gray-700"}>
                            {STATUS_LABELS[item.status] || item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionDialog(item, "open")}
                              disabled={!item.canOpen || savingAction}
                            >
                              <Unlock className="mr-1 h-4 w-4" />
                              Mở cửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-700 hover:bg-blue-50"
                              onClick={() => openActionDialog(item, "close")}
                              disabled={!item.canClose || savingAction}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Đóng cửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-700 hover:bg-amber-50"
                              onClick={() => openIssueDialog(item)}
                              disabled={savingAction}
                            >
                              <SquarePen className="mr-1 h-4 w-4" />
                              Báo sự cố
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                <div>
                  Hiển thị {items.length} / {totalItems} lịch
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={size}
                    onChange={(event) => {
                      setSize(Number(event.target.value));
                      setPage(0);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} dòng
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((previous) => Math.max(0, previous - 1))}
                      disabled={page === 0 || loading}
                    >
                      Trước
                    </Button>
                    <span className="min-w-20 text-center text-xs text-gray-500">
                      {totalPages === 0 ? 0 : page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((previous) => previous + 1)}
                      disabled={page + 1 >= totalPages || loading}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Lịch sử mở/đóng ── */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Loại thao tác</Label>
              <select
                value={historyAction}
                onChange={(event) => {
                  setHistoryAction(event.target.value);
                  setHistoryPage(0);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Tất cả</option>
                <option value="OPEN_ROOM">Mở cửa</option>
                <option value="CLOSE_ROOM">Đóng cửa</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Từ ngày</Label>
              <Input
                type="date"
                value={historyStartDate}
                onChange={(event) => {
                  setHistoryStartDate(event.target.value);
                  setHistoryPage(0);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Đến ngày</Label>
              <Input
                type="date"
                value={historyEndDate}
                onChange={(event) => {
                  setHistoryEndDate(event.target.value);
                  setHistoryPage(0);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setHistoryPage(0);
                  }}
                  className="pl-9"
                  placeholder="Tên phòng, mô tả..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                <span>Tổng {historyTotalItems} bản ghi</span>
              </div>
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={historyLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tải lại
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Thao tác</TableHead>
                  <TableHead>Loại lịch</TableHead>
                  <TableHead>Mô tả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải lịch sử...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : historyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-14 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle className="h-10 w-10 text-gray-300" />
                        <div>
                          <p className="font-semibold text-gray-700">Không có lịch sử phù hợp.</p>
                          <p className="mt-1 text-xs text-gray-400">Hãy đổi bộ lọc hoặc khoảng thời gian tra cứu.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  historyItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{formatDateTime(item.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-blue-700">{item.classroomCode || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_BADGES[item.action] || "bg-gray-100 text-gray-700"}>
                          {ACTION_LABELS[item.action] || item.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.sourceType ? (
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{item.description || "—"}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
              <div>
                Hiển thị {historyItems.length} / {historyTotalItems} bản ghi
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={historySize}
                  onChange={(event) => {
                    setHistorySize(Number(event.target.value));
                    setHistoryPage(0);
                  }}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} dòng
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((previous) => Math.max(0, previous - 1))}
                    disabled={historyPage === 0 || historyLoading}
                  >
                    Trước
                  </Button>
                  <span className="min-w-20 text-center text-xs text-gray-500">
                    {historyTotalPages === 0 ? 0 : historyPage + 1} / {historyTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((previous) => previous + 1)}
                    disabled={historyPage + 1 >= historyTotalPages || historyLoading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(actionTarget)} onOpenChange={() => setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionMode === "open" ? "Xác nhận mở cửa" : "Xác nhận đóng cửa"}</DialogTitle>
            <DialogDescription>
              {actionTarget
                ? `${actionMode === "open" ? "Mở" : "Đóng"} phòng ${actionTarget.classroomCode} cho ${actionTarget.title}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)} disabled={savingAction}>
              Hủy
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void performAction()} disabled={savingAction}>
              {savingAction ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(issueTarget)} onOpenChange={() => setIssueTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Báo sự cố phòng</DialogTitle>
            <DialogDescription>
              Ghi nhận nhanh sự cố cho phòng {issueTarget?.classroomCode || ""} và chuyển sang danh sách xử lý.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phòng</Label>
              <Input value={issueTarget?.classroomCode || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Loại sự cố</Label>
              <select
                value={issueForm.issueCategory}
                onChange={(event) => setIssueForm((previous) => ({ ...previous, issueCategory: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="DOOR">DOOR</option>
                <option value="PROJECTOR">PROJECTOR</option>
                <option value="AIR_CONDITIONER">AIR_CONDITIONER</option>
                <option value="LIGHT">LIGHT</option>
                <option value="FAN">FAN</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="NETWORK">NETWORK</option>
                <option value="CLEANLINESS">CLEANLINESS</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mức độ</Label>
              <select
                value={issueForm.severityLevel}
                onChange={(event) => setIssueForm((previous) => ({ ...previous, severityLevel: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input
                value={issueForm.issueTitle}
                onChange={(event) => setIssueForm((previous) => ({ ...previous, issueTitle: event.target.value }))}
                placeholder="Khóa cửa bị hỏng"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mô tả</Label>
              <Textarea
                rows={4}
                value={issueForm.description}
                onChange={(event) => setIssueForm((previous) => ({ ...previous, description: event.target.value }))}
                placeholder="Mô tả chi tiết tình trạng phòng..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueTarget(null)} disabled={savingAction}>
              Hủy
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => void submitIssue()} disabled={savingAction}>
              {savingAction ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilityOpeningSchedulePage;
