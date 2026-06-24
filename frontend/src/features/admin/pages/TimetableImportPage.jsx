import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Download, FileSpreadsheet, Search, Upload, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { APP_ROUTES } from "@/constants/routes";
import { getApiError } from "@/utils/apiError";
import {
  applyTimetableImport,
  downloadTimetableImportTemplate,
  getImportSemesters,
  previewTimetableImport,
} from "@/features/admin/services/timetableImportService";

const PAGE_SIZES = [10, 20, 50];
const semesterIdOf = (semester) => semester?.id ?? semester?.semester_id;
const semesterCodeOf = (semester) => semester?.code ?? semester?.semester_code ?? "—";
const semesterNameOf = (semester) => semester?.name ?? semester?.semester_name ?? semesterCodeOf(semester);
const academicStatusOf = (semester) => String(semester?.status ?? "").toUpperCase();
const timetableStatusOf = (semester) => String(semester?.timetable_status ?? semester?.timetableStatus ?? "DRAFT").toUpperCase();
const isEditableSemester = (semester) => !["PUBLISHED", "LOCKED"].includes(timetableStatusOf(semester));
const IMPORT_MODES = {
  MERGE_ONLY: {
    label: "Merge only",
    description: "Chỉ thêm/cập nhật, không hủy lịch cũ.",
  },
  SYNC_FILE_SCOPE: {
    label: "Sync file scope",
    description: "Hủy mềm lịch cũ của các học phần có trong file nếu lịch đó không còn trong file.",
  },
};
const STATUS_META = {
  VALID: { label: "Hợp lệ", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  WARNING: { label: "Cảnh báo", className: "bg-amber-50 text-amber-700 border-amber-200" },
  ERROR: { label: "Có lỗi", className: "bg-red-50 text-red-700 border-red-200" },
};
const OPERATION_LABELS = {
  CREATE_SECTION: "Tạo lớp học phần",
  UPDATE_SECTION: "Cập nhật lớp học phần",
  CREATE_SCHEDULE: "Tạo lịch học",
  UPDATE_SCHEDULE: "Cập nhật lịch học",
  NO_CHANGE: "Không thay đổi",
  ERROR: "Không thể xử lý",
};

const SummaryItem = ({ label, value, tone = "text-slate-900" }) => (
  <div className="min-w-[120px] border-r border-slate-200 px-5 py-3 last:border-r-0">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${tone}`}>{value ?? 0}</p>
  </div>
);

export default function TimetableImportPage() {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [importMode, setImportMode] = useState("MERGE_ONLY");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const selectedSemester = useMemo(
    () => semesters.find((item) => String(semesterIdOf(item)) === semesterId),
    [semesters, semesterId],
  );

  useEffect(() => {
    getImportSemesters()
      .then((items) => {
        setSemesters(items);
        const editableItems = items.filter(isEditableSemester);
        const active = editableItems.find((item) => academicStatusOf(item) === "ACTIVE");
        const defaultSemester = active ?? editableItems[0];
        if (defaultSemester) setSemesterId(String(semesterIdOf(defaultSemester)));
      })
      .catch(() => toast.error("Không thể tải danh sách học kỳ."));
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (preview?.rows ?? []).filter((row) => {
      const matchesStatus = status === "ALL" || row.status === status;
      const matchesSearch = !term || [row.courseCode, row.sectionCode, row.lecturerCode, row.className]
        .some((value) => String(value ?? "").toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [preview, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page, pageSize],
  );

  useEffect(() => setPage(1), [search, status, pageSize, preview]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handlePreview = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file .xlsx hoặc .csv.");
      return;
    }
    try {
      setLoading(true);
      const result = await previewTimetableImport({ file, semesterId });
      setPreview(result);
      setApplyResult(null);
      toast.success("Đã kiểm tra file. Chưa có dữ liệu nào được ghi.");
    } catch (error) {
      const apiError = getApiError(error, "Không thể kiểm tra file import.");
      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!file || !preview || preview.errorRows > 0) return;
    try {
      setApplying(true);
      const result = await applyTimetableImport({ file, semesterId, mode: importMode });
      setApplyResult(result);
      setConfirmOpen(false);
      toast.success(`Đã import vào ${result.semesterCode || semesterCodeOf(selectedSemester)} và đưa thời khóa biểu về DRAFT.`);
    } catch (error) {
      const apiError = getApiError(error, "Không thể áp dụng file import.");
      if (apiError.errorCode === "IMPORT_HAS_ERRORS") {
        setPreview(null);
        setConfirmOpen(false);
      }
      toast.error(apiError.message);
    } finally {
      setApplying(false);
    }
  };

  const handleTemplate = async () => {
    try {
      await downloadTimetableImportTemplate();
    } catch (error) {
      toast.error(getApiError(error, "Không thể tải file mẫu.").message);
    }
  };

  return (
    <div className="space-y-5 p-5 md:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Đối soát dữ liệu học vụ</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Import thời khóa biểu</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Preview từng dòng trước khi áp dụng. Backend luôn kiểm tra lại file và ghi toàn bộ trong một transaction.
          </p>
        </div>
        <Button variant="outline" onClick={handleTemplate}>
          <Download className="mr-2 h-4 w-4" /> Tải file mẫu
        </Button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">Học kỳ đối chiếu</label>
            <Select value={semesterId} onValueChange={(value) => { setSemesterId(value); setPreview(null); setApplyResult(null); }}>
              <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem
                    key={semesterIdOf(semester)}
                    value={String(semesterIdOf(semester))}
                    disabled={!isEditableSemester(semester)}
                  >
                    {semesterNameOf(semester)} · {semesterCodeOf(semester)}
                    {academicStatusOf(semester) === "ACTIVE" ? " · Đang hoạt động" : ""}
                    {!isEditableSemester(semester) ? " · Chỉ xem" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">File dữ liệu (.xlsx hoặc .csv)</label>
            <label className="flex h-10 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/20">
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              <span className="min-w-0 flex-1 truncate text-slate-700">{file?.name ?? "Chọn file từ máy tính"}</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setApplyResult(null); }}
              />
            </label>
          </div>
          <Button onClick={handlePreview} disabled={loading || !semesterId} className="bg-blue-700 hover:bg-blue-800">
            <Upload className="mr-2 h-4 w-4" /> {loading ? "Đang kiểm tra..." : "Kiểm tra file"}
          </Button>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <p className="text-xs font-medium text-slate-700">Chế độ áp dụng</p>
          <RadioGroup
            value={importMode}
            onValueChange={(value) => { setImportMode(value); setApplyResult(null); }}
            className="mt-3 grid gap-3 lg:grid-cols-2"
          >
            {Object.entries(IMPORT_MODES).map(([value, meta]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                  importMode === value ? "border-blue-300 bg-white ring-2 ring-blue-500/10" : "border-slate-200 bg-white/70 hover:border-slate-300"
                }`}
              >
                <RadioGroupItem value={value} className="mt-0.5" />
                <span>
                  <span className="block font-semibold text-slate-900">{meta.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{meta.description}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
          {importMode === "SYNC_FILE_SCOPE" && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Chế độ này có thể hủy mềm các lịch cũ của những học phần xuất hiện trong file nếu lịch đó không còn trong file.</span>
            </div>
          )}
        </div>
      </section>

      {preview && (
        <>
          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="flex min-w-max">
              <SummaryItem label="Tổng dòng" value={preview.totalRows} />
              <SummaryItem label="Hợp lệ" value={preview.validRows} tone="text-emerald-700" />
              <SummaryItem label="Cảnh báo" value={preview.warningRows} tone="text-amber-700" />
              <SummaryItem label="Có lỗi" value={preview.errorRows} tone="text-red-700" />
              <div className="px-5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Mã preview</p>
                <p className="mt-2 font-mono text-sm font-semibold text-slate-700">{preview.importBatchCode}</p>
              </div>
            </div>
          </section>

          <section className={`flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${preview.errorRows > 0 ? "border-red-200 bg-red-50/70" : "border-blue-200 bg-blue-50/60"}`}>
            <div className="flex items-start gap-3">
              {preview.errorRows > 0 ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />}
              <div>
                <p className={`text-sm font-semibold ${preview.errorRows > 0 ? "text-red-900" : "text-blue-950"}`}>
                  {preview.errorRows > 0 ? "Chưa thể áp dụng import" : "File đã qua cổng kiểm tra"}
                </p>
                <p className={`mt-1 text-xs ${preview.errorRows > 0 ? "text-red-700" : "text-blue-700"}`}>
                  {preview.errorRows > 0
                    ? `Còn ${preview.errorRows} dòng lỗi. Hãy sửa file và preview lại.`
                    : "Backend sẽ parse và validate lại chính file này trong transaction trước khi ghi."}
                </p>
              </div>
            </div>
            <Button
              disabled={preview.errorRows > 0 || applying || Boolean(applyResult)}
              onClick={() => setConfirmOpen(true)}
              className="shrink-0 bg-blue-700 hover:bg-blue-800"
            >
              {applyResult ? "Đã áp dụng" : "Áp dụng import"}
            </Button>
          </section>

          {applyResult && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="h-5 w-5" /> Import đã được commit
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    Học kỳ: <strong>{semesterNameOf(selectedSemester)}</strong> · <span className="font-mono">{applyResult.semesterCode}</span> · DRAFT
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-700">Batch {applyResult.importBatchCode}</p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-emerald-800">
                  <span>Mode: <strong>{applyResult.importMode}</strong></span>
                  <span>Tạo lớp: <strong>{applyResult.createdSections}</strong></span>
                  <span>Cập nhật lớp: <strong>{applyResult.updatedSections}</strong></span>
                  <span>Tạo lịch: <strong>{applyResult.createdSchedules}</strong></span>
                  <span>Cập nhật lịch: <strong>{applyResult.updatedSchedules}</strong></span>
                  <span>Chưa phân phòng: <strong>{applyResult.unassignedSchedules ?? 0}</strong></span>
                  <span>Hủy mềm lịch: <strong>{applyResult.cancelledSchedules ?? 0}</strong></span>
                  <span>Giữ phòng cũ: <strong>{applyResult.retainedClassroomAssignments}</strong></span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.adminSections, { state: { semesterId: String(applyResult.semesterId), refreshAfterImport: true } })}
                  className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                >
                  Xem lớp học phần <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {(applyResult.retainedClassroomAssignments ?? 0) > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Một số lịch giữ nguyên phòng cũ vì file không chỉ định phòng và natural key không thay đổi.</span>
                </div>
              )}
              <p className="mt-3 text-xs text-emerald-800">
                Bước tiếp theo: Admin kiểm tra lớp học phần; Staff xử lý các lịch chưa phân phòng, validate và gửi duyệt.
              </p>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã môn, lớp, giảng viên..." className="bg-white pl-9" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-white md:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="VALID">Hợp lệ</SelectItem>
                  <SelectItem value="WARNING">Cảnh báo</SelectItem>
                  <SelectItem value="ERROR">Có lỗi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-full bg-white md:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size} dòng/trang</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-white text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Dòng</th><th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thao tác dự kiến</th><th className="px-4 py-3">Học phần / lớp</th>
                    <th className="px-4 py-3">Giảng viên</th><th className="px-4 py-3">Lịch</th>
                    <th className="px-4 py-3">Phòng ưu tiên</th><th className="px-4 py-3">Kết quả đối soát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((row) => {
                    const meta = STATUS_META[row.status] ?? STATUS_META.ERROR;
                    return (
                      <tr key={row.rowNumber} className="align-top hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.rowNumber}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={meta.className}>{meta.label}</Badge></td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">{OPERATION_LABELS[row.operation] ?? row.operation}</td>
                        <td className="px-4 py-3"><p className="font-mono text-xs font-semibold text-slate-900">{row.courseCode} · {row.sectionCode}</p><p className="mt-1 max-w-[220px] text-xs text-slate-500">{row.className}</p></td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.lecturerCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{row.schedule}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.preferredClassroomCode || "—"}</td>
                        <td className="px-4 py-3">
                          {row.messages.length === 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Không phát hiện lỗi</span>
                          ) : (
                            <ul className="space-y-1.5">
                              {row.messages.map((message, index) => (
                                <li key={`${message.code}-${index}`} className={`flex max-w-[340px] items-start gap-1.5 text-xs ${message.severity === "ERROR" ? "text-red-700" : "text-amber-700"}`}>
                                  {message.severity === "ERROR" ? <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                                  <span><span className="font-mono font-semibold">{message.code}</span>: {message.message}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleRows.length === 0 && <div className="py-12 text-center text-sm text-slate-500">Không có dòng phù hợp bộ lọc.</div>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <span>Hiển thị {filteredRows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredRows.length)} / {filteredRows.length} dòng</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button>
                <span className="font-mono">{page}/{totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
              </div>
            </div>
          </section>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => !applying && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận áp dụng import</DialogTitle>
            <DialogDescription>
              Thao tác này sẽ cập nhật lớp học phần và lịch mẫu. Dữ liệu đã public hoặc locked sẽ bị backend chặn.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p><span className="font-medium text-slate-800">File:</span> {file?.name}</p>
            <p className="mt-1"><span className="font-medium text-slate-800">Học kỳ:</span> {semesterNameOf(selectedSemester)} · <span className="font-mono">{semesterCodeOf(selectedSemester)}</span></p>
            <p className="mt-1"><span className="font-medium text-slate-800">Mode:</span> {IMPORT_MODES[importMode]?.label} — {IMPORT_MODES[importMode]?.description}</p>
            <p className="mt-1"><span className="font-medium text-slate-800">Preview:</span> {preview?.importBatchCode} · {preview?.totalRows ?? 0} dòng · {preview?.warningRows ?? 0} cảnh báo</p>
            <p className="mt-2 text-amber-700">
              {importMode === "SYNC_FILE_SCOPE"
                ? "Sẽ hủy mềm lịch cũ của các học phần xuất hiện trong file nếu lịch đó không còn trong file. Không sinh class sessions."
                : "Không soft-cancel dữ liệu vắng mặt trong file. Không sinh class sessions."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={applying} onClick={() => setConfirmOpen(false)}>Hủy</Button>
            <Button disabled={applying} onClick={handleApply} className="bg-blue-700 hover:bg-blue-800">
              {applying ? "Đang áp dụng..." : "Xác nhận áp dụng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
