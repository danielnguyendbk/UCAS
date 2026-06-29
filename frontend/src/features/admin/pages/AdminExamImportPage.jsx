import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { httpClient } from "@/services/httpClient";

// ── Auth helpers ────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("csms_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function authedFetch(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || body?.error || `HTTP ${res.status}`);
  }
  return res;
}

// ── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 20, 50];

const semesterIdOf = (s) => s?.semesterId ?? s?.semester_id ?? s?.id ?? "";
const semesterNameOf = (s) =>
  s?.semesterName ?? s?.semester_name ?? s?.name ?? s?.semesterCode ?? s?.semester_code ?? "";

const semesterStatusOf = (s) =>
String(s?.status ?? s?.semesterStatus ?? s?.semester_status ?? "").toUpperCase();

const isCurrentSemester = (s) =>
Boolean(s?.isCurrent ?? s?.is_current ?? s?.current) ||
semesterStatusOf(s) === "ACTIVE";

const STATUS_META = {
  VALID: {
    label: "Hợp lệ",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: CheckCircle2,
    iconClass: "text-emerald-500",
  },
  WARNING: {
    label: "Cảnh báo",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: AlertTriangle,
    iconClass: "text-amber-500",
  },
  ERROR: {
    label: "Có lỗi",
    className: "bg-red-50 text-red-700 border-red-200",
    Icon: XCircle,
    iconClass: "text-red-500",
  },
};

const OPERATION_LABELS = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  SKIP: "Bỏ qua",
  CANCEL: "Hủy mềm",
  CANCELLED: "Hủy mềm",
  CANCEL_OUTSIDE_FILE_SCOPE: "Hủy mềm ngoài file",
  DELETE: "Hủy mềm",
  INVALID: "Không hợp lệ",
  NONE: "-",
};

const IMPORT_MODE_META = {
  MERGE: {
    label: "Cập nhật bổ sung",
    shortLabel: "MERGE",
    description:
      "File có gì thì tạo mới hoặc cập nhật lịch thi tương ứng. Lịch thi cũ ngoài file vẫn được giữ nguyên.",
  },
  SYNC_FILE_SCOPE: {
    label: "Ghi đè theo file",
    shortLabel: "SYNC_FILE_SCOPE",
    description:
      "File import được xem là nguồn dữ liệu chuẩn. Lịch thi cũ của học kỳ không còn trong file sẽ bị hủy mềm.",
    warning:
      "Chế độ này sẽ hủy mềm các lịch thi hiện có của học kỳ nhưng không xuất hiện trong file import mới.",
  },
};

const hasBlockingErrors = (preview) => {
  if (!preview?.rows) return false;
  return preview.rows.some(
    (row) =>
      row.status === "ERROR" ||
      row.messages?.some?.((m) => (m.severity ?? m.level) === "ERROR"),
  );
};

// ── Sub-components ───────────────────────────────────────────────────────────
function SummaryItem({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="min-w-[120px] border-r border-slate-200 px-5 py-3 last:border-r-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${tone}`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function RowMessages({ messages }) {
  if (!messages?.length) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckCircle2 className="h-4 w-4" /> Không phát hiện lỗi
      </span>
    );
  }

  return (
    <ul className="space-y-1.5">
      {messages.map((msg, i) => {
        const severity = msg.severity ?? msg.level ?? "INFO";
        const meta = STATUS_META[severity];
        const Icon = meta?.Icon;
        return (
          <li
            key={i}
            className={`flex max-w-[340px] items-start gap-1.5 text-xs ${
              severity === "ERROR"
                ? "text-red-700"
                : severity === "WARNING"
                  ? "text-amber-700"
                  : "text-slate-700"
            }`}
          >
            {Icon && <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${meta.iconClass}`} />}
            <span>
              {msg.code && <span className="font-mono font-semibold">{msg.code}: </span>}
              {msg.message ?? msg.text ?? String(msg)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminExamImportPage() {
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState("");
  const [importMode, setImportMode] = useState("MERGE");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load semesters
  useEffect(() => {
    let mounted = true;
    httpClient
      .get("/api/categories/semesters")
      .then((res) => {
        if (!mounted) return;
        const list = res?.data?.data ?? res?.data ?? [];
        setSemesters(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Reset preview/result when key inputs change
  const handleSemesterChange = (val) => {
    setSemesterId(val);
    setPreview(null);
    setApplyResult(null);
  };

  const handleModeChange = (val) => {
    setImportMode(val);
    setPreview(null);
    setApplyResult(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setPreview(null);
    setApplyResult(null);
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const res = await authedFetch("/api/admin/exam-import/template");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ucas-exam-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || "Không tải được file mẫu.");
    }
  };

  // Preview (check file)
  const handlePreview = async () => {
    if (!file || !semesterId) {
      toast.error("Vui lòng chọn học kỳ và file trước khi kiểm tra.");
      return;
    }
    setLoading(true);
    setPreview(null);
    setApplyResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("semesterId", semesterId);
      form.append("importMode", importMode);
      const res = await authedFetch("/api/admin/exam-import/preview", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      setPreview(json.data ?? json);
      setPage(1);
    } catch (err) {
      toast.error(err.message || "Không kiểm tra được file.");
    } finally {
      setLoading(false);
    }
  };

  // Apply import
  const handleApply = async () => {
    if (!file || !semesterId) return;
    setApplying(true);
    setConfirmOpen(false);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("semesterId", semesterId);
      form.append("importMode", importMode);
      const res = await authedFetch("/api/admin/exam-import/apply", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      setApplyResult(json.data ?? json);
      setPreview(null);
    } catch (err) {
      toast.error(err.message || "Áp dụng import thất bại.");
    } finally {
      setApplying(false);
    }
  };

  // Filtered + paginated preview rows
  const filteredRows = useMemo(() => {
    if (!preview?.rows) return [];
    const q = search.trim().toLowerCase();
    return preview.rows.filter((row) => {
      const matchStatus =
        statusFilter === "ALL" || (row.status ?? "VALID") === statusFilter;
      if (!matchStatus) return false;
      if (!q) return true;
      return [
        row.courseCode,
        row.sectionCode,
        row.classCode,
        row.classroomCode,
        row.roomCode,
        row.mainProctorCode,
        row.proctorCode,
        row.assistantProctorCode,
        row.examDate,
        row.examType,
        row.examMethod,
        row.courseName,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [preview, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const selectedSemester = semesters.find(
    (s) => String(semesterIdOf(s)) === String(semesterId),
  );

  const blocking = preview ? hasBlockingErrors(preview) : false;
  const errorCount = preview?.errorRows ?? preview?.rows?.filter((r) => r.status === "ERROR").length ?? 0;
  const cancelPreviewCount =
    preview?.cancelledExams ??
    preview?.canceledExams ??
    preview?.willCancelExams ??
    preview?.outsideFileExamCount ??
    0;

  return (
    <div className="space-y-5 p-5 md:p-6">
      {/* Header */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Import lịch thi
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Preview từng dòng trước khi áp dụng. Hỗ trợ cập nhật bổ sung hoặc ghi đè theo file giống luồng thời khóa biểu.
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="shrink-0">
          <Download className="mr-2 h-4 w-4" />
          Tải file mẫu
        </Button>
      </header>

      {/* Upload section */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              Học kỳ đối chiếu
            </label>
            <Select value={semesterId} onValueChange={handleSemesterChange}>
              <SelectTrigger className="bg-slate-50">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => {
                  const sid = String(semesterIdOf(s));
                  return (
                    <SelectItem key={sid} value={sid}>
                      {semesterNameOf(s)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              File dữ liệu (.xlsx hoặc .csv)
            </label>
            <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/20">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1 truncate text-slate-700">
                {file?.name ?? "Chọn file từ máy tính"}
              </span>
              {file && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setFile(null);
                    setPreview(null);
                    setApplyResult(null);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Bỏ chọn file"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <Button
            onClick={handlePreview}
            disabled={!file || !semesterId || loading}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Upload className="mr-2 h-4 w-4" />
            {loading ? "Đang kiểm tra..." : "Kiểm tra file"}
          </Button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-xs font-medium text-slate-700">Chế độ áp dụng</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {Object.entries(IMPORT_MODE_META).map(([value, meta]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                  importMode === value
                    ? "border-blue-300 bg-white ring-2 ring-blue-500/10"
                    : "border-slate-200 bg-white/70 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value={value}
                  checked={importMode === value}
                  onChange={() => handleModeChange(value)}
                  className="mt-1 accent-blue-700"
                />
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="block font-semibold text-slate-900">{meta.label}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                      {meta.shortLabel}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">
                    {meta.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {IMPORT_MODE_META[importMode]?.warning && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{IMPORT_MODE_META[importMode].warning}</span>
            </div>
          )}
        </div>
      </section>

      {/* Summary stats */}
      {preview && (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="flex min-w-max">
            <SummaryItem label="Tổng dòng" value={preview.totalRows} />
            <SummaryItem label="Hợp lệ" value={preview.validRows} tone="text-emerald-700" />
            <SummaryItem label="Cảnh báo" value={preview.warningRows} tone="text-amber-700" />
            <SummaryItem label="Có lỗi" value={preview.errorRows} tone="text-red-700" />
            {importMode === "SYNC_FILE_SCOPE" && cancelPreviewCount > 0 && (
              <SummaryItem label="Sẽ hủy mềm" value={cancelPreviewCount} tone="text-amber-700" />
            )}
            {preview.importBatchCode && (
              <div className="px-5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Mã preview
                </p>
                <p className="mt-2 font-mono text-sm font-semibold text-slate-700">
                  {preview.importBatchCode}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Validation result banner */}
      {preview && (
        <section
          className={`flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${
            blocking ? "border-red-200 bg-red-50/70" : "border-blue-200 bg-blue-50/60"
          }`}
        >
          <div className="flex items-start gap-3">
            {blocking ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            )}
            <div>
              <p className={`text-sm font-semibold ${blocking ? "text-red-900" : "text-blue-950"}`}>
                {blocking ? "Chưa thể áp dụng import" : "File đã qua cổng kiểm tra"}
              </p>
              <p className={`mt-1 text-xs ${blocking ? "text-red-700" : "text-blue-700"}`}>
                {blocking
                  ? `Còn ${errorCount} dòng lỗi. Hãy sửa file và preview lại.`
                  : importMode === "SYNC_FILE_SCOPE"
                  ? "Backend sẽ ghi các dòng trong file và hủy mềm lịch thi cũ không còn trong file."
                  : "Backend sẽ parse và validate lại chính file này trong transaction trước khi ghi."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={blocking || applying}
            className="shrink-0 bg-blue-700 hover:bg-blue-800 disabled:opacity-50"
          >
            {applying ? "Đang áp dụng..." : "Áp dụng import"}
          </Button>
        </section>
      )}

      {/* Apply result */}
      {applyResult && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <CheckCircle2 className="h-5 w-5" /> Import đã được commit
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                Học kỳ: <strong>{semesterNameOf(selectedSemester)}</strong>
                {applyResult.semesterCode && (
                  <>
                    {' '}· <span className="font-mono">{applyResult.semesterCode}</span>
                  </>
                )}
              </p>
              {applyResult.importBatchCode && (
                <p className="mt-1 font-mono text-[11px] text-emerald-700">
                  Batch {applyResult.importBatchCode}
                </p>
              )}
              <p className="mt-1 text-xs text-emerald-800">
                Chế độ: <strong>{IMPORT_MODE_META[applyResult.importMode ?? importMode]?.label ?? importMode}</strong>
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-emerald-800">
              {(applyResult.inserted ?? applyResult.created) != null && (
                <span>
                  Tạo mới: <strong>{applyResult.inserted ?? applyResult.created}</strong>
                </span>
              )}
              {applyResult.updated != null && applyResult.updated > 0 && (
                <span>
                  Cập nhật: <strong>{applyResult.updated}</strong>
                </span>
              )}
              {applyResult.skipped != null && (
                <span>
                  Bỏ qua: <strong>{applyResult.skipped}</strong>
                </span>
              )}
              {(applyResult.cancelledExams ?? applyResult.canceledExams ?? applyResult.cancelled ?? applyResult.canceled) != null && (
                <span>
                  Hủy mềm: <strong>{applyResult.cancelledExams ?? applyResult.canceledExams ?? applyResult.cancelled ?? applyResult.canceled}</strong>
                </span>
              )}
              {applyResult.totalImported != null && (
                <span>
                  Tổng cộng: <strong>{applyResult.totalImported}</strong> ca thi
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-emerald-800">
            Bước tiếp theo: Staff phân phòng thi, validate và gửi Admin duyệt.
          </p>
        </section>
      )}

      {/* Preview table */}
      {preview && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Table controls */}
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã môn, lớp, phòng thi, giám thị..."
                className="bg-white pl-9 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-white text-xs md:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-full bg-white text-xs md:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} dòng/trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Dòng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thao tác dự kiến</th>
                  <th className="px-4 py-3">Mã môn</th>
                  <th className="px-4 py-3">Lớp / Nhóm</th>
                  <th className="px-4 py-3">Ngày thi</th>
                  <th className="px-4 py-3">Giờ thi</th>
                  <th className="px-4 py-3">Phòng thi</th>
                  <th className="px-4 py-3">Giám thị</th>
                  <th className="px-4 py-3">Kết quả kiểm tra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-sm text-slate-500">
                      Không có dòng phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row, i) => {
                    const rowStatus = row.status ?? "VALID";
                    const meta = STATUS_META[rowStatus] ?? STATUS_META.VALID;
                    const operation = row.operation ?? row.action ?? "NONE";
                    return (
                      <tr key={row.rowNumber ?? i} className="align-top hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {row.rowNumber ?? i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={meta.className}>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">
                          {OPERATION_LABELS[operation] ?? operation ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                          {row.courseCode ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {row.sectionCode ?? row.classCode ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {row.examDate ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                          {row.startTime && row.endTime
                            ? `${String(row.startTime).slice(0, 5)} – ${String(row.endTime).slice(0, 5)}`
                            : row.startTime ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                          {row.classroomCode ?? row.roomCode ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          {row.mainProctorCode ?? row.proctorCode ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <RowMessages messages={row.messages ?? row.validationMessages ?? []} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              Hiển thị {filteredRows.length ? (page - 1) * pageSize + 1 : 0}–
              {Math.min(page * pageSize, filteredRows.length)} / {filteredRows.length} dòng
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="font-mono">
                {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận áp dụng import</DialogTitle>
            <DialogDescription>
              Thao tác này sẽ áp dụng file import theo chế độ đã chọn. Dữ liệu đã công bố hoặc đã khóa sẽ bị backend chặn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                <span className="font-medium text-slate-800">File:</span> {file?.name}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-800">Học kỳ:</span>{' '}
                {semesterNameOf(selectedSemester)}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-800">Mode:</span>{' '}
                {IMPORT_MODE_META[importMode]?.label} — {IMPORT_MODE_META[importMode]?.description}
              </p>
              {IMPORT_MODE_META[importMode]?.warning && (
                <p className="mt-1 text-amber-700">
                  <span className="font-medium">Cảnh báo:</span>{' '}
                  {IMPORT_MODE_META[importMode].warning}
                </p>
              )}
              <p className="mt-1">
                <span className="font-medium text-slate-800">Preview:</span>{' '}
                {preview?.totalRows ?? 0} dòng · {preview?.warningRows ?? 0} cảnh báo
              </p>
            </div>
            {(preview?.warningRows ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Có {preview.warningRows} dòng cảnh báo. Các dòng này vẫn được áp dụng, hãy kiểm tra lại sau.
                </p>
              </div>
            )}
            {importMode === "SYNC_FILE_SCOPE" && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Bạn đang dùng chế độ ghi đè theo file. Những lịch thi của học kỳ không có trong file mới sẽ bị hủy mềm sau khi xác nhận.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              className="bg-blue-700 hover:bg-blue-800"
            >
              {applying ? "Đang áp dụng..." : "Xác nhận áp dụng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
