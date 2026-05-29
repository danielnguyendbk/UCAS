import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { generateTimetable, getSemesters, lockTimetable, publishTimetable } from "../../../api/adminTimetableApi";
import { getLatestSemester } from "../../../utils/semesterUtils";

const statusLabelMap = {
  DRAFT: { label: "Bản nháp", className: "bg-slate-100 text-slate-700" },
  PUBLISHED: { label: "Đã công bố", className: "bg-emerald-50 text-emerald-700" },
  LOCKED: { label: "Đã khóa", className: "bg-rose-50 text-rose-700" },
};

export function AdminGenerateTimetableTab() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchSemesters() {
      try {
        setLoading(true);
        const data = await getSemesters();
        setSemesters(data || []);
        if (data?.length && !selectedSemesterId) {
          const latestSemester = getLatestSemester(data);
          const latestId = latestSemester?.id ?? latestSemester?.semesterId;
          setSelectedSemesterId(latestId ? String(latestId) : "");
        }
      } catch (error) {
        toast.error("Không thể tải danh sách học kỳ.");
      } finally {
        setLoading(false);
      }
    }

    fetchSemesters();
  }, []);

  const selectedSemester = useMemo(
    () => semesters.find((item) => String(item.id ?? item.semesterId) === String(selectedSemesterId)),
    [semesters, selectedSemesterId]
  );

  const timetableStatus = String(
    selectedSemester?.timetableStatus ?? selectedSemester?.timetable_status ?? "DRAFT"
  ).toUpperCase();

  const statusBadge = statusLabelMap[timetableStatus] || statusLabelMap.DRAFT;
  const isLocked = timetableStatus === "LOCKED";

  const refreshSemesters = async () => {
    const data = await getSemesters();
    setSemesters(data || []);
    if (!selectedSemesterId && data?.length) {
      const latestSemester = getLatestSemester(data);
      const latestId = latestSemester?.id ?? latestSemester?.semesterId;
      setSelectedSemesterId(latestId ? String(latestId) : "");
    }
  };
  

  const handleGenerate = async () => {
    if (!selectedSemesterId) return;
    try {
      setActionLoading(true);
      const result = await generateTimetable(Number(selectedSemesterId));
      setSummary(result || null);
      toast.success("Đã sinh thời khóa biểu thành công.");
      await refreshSemesters();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Sinh thời khóa biểu thất bại.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSemesterId) return;
    try {
      setActionLoading(true);
      await publishTimetable(Number(selectedSemesterId));
      toast.success("Đã công bố thời khóa biểu.");
      await refreshSemesters();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể công bố thời khóa biểu.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async () => {
    if (!selectedSemesterId) return;
    try {
      setActionLoading(true);
      await lockTimetable(Number(selectedSemesterId));
      toast.success("Đã khóa thời khóa biểu.");
      await refreshSemesters();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Không thể khóa thời khóa biểu.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sinh thời khóa biểu</h2>
            <p className="text-sm text-gray-500">Theo dõi trạng thái và kích hoạt các thao tác chính.</p>
          </div>
          <div className="w-full lg:w-72">
            <select
              value={selectedSemesterId}
              onChange={(event) => setSelectedSemesterId(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
            >
              <option value="">Chọn học kỳ</option>
              {semesters.map((semester) => (
                <option key={semester.id ?? semester.semesterId} value={semester.id ?? semester.semesterId}>
                  {semester.name || semester.semesterName || semester.code || `Học kỳ ${semester.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
        ) : selectedSemesterId ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-500">Trạng thái:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
            {isLocked && (
              <span className="text-rose-600 text-xs">Học kỳ đã khóa, không thể sinh lịch mới.</span>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedSemesterId || isLocked || actionLoading}
            className="px-5 py-2 rounded-lg bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#1E3A8A]/90 disabled:opacity-60"
          >
            Sinh thời khóa biểu
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!selectedSemesterId || actionLoading}
            className="px-5 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 disabled:opacity-60"
          >
            Công bố thời khóa biểu
          </button>
          <button
            type="button"
            onClick={handleLock}
            disabled={!selectedSemesterId || actionLoading}
            className="px-5 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-medium hover:bg-rose-50 disabled:opacity-60"
          >
            Khóa thời khóa biểu
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Tóm tắt sau khi sinh lịch</h3>
        {summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-gray-500">Lịch mới tạo</p>
              <p className="text-xl font-semibold text-gray-900">{summary.createdCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-gray-500">Lịch cập nhật</p>
              <p className="text-xl font-semibold text-gray-900">{summary.updatedCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-gray-500">Buổi bị hủy do nghỉ</p>
              <p className="text-xl font-semibold text-gray-900">{summary.cancelledByHolidayCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-gray-500">Bỏ qua</p>
              <p className="text-xl font-semibold text-gray-900">{summary.skippedCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
              <p className="text-gray-500">Cảnh báo</p>
              <p className="text-gray-700 text-sm mt-1">
                {summary.warnings?.length ? summary.warnings.join(", ") : "Không có cảnh báo."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chưa có dữ liệu. Hãy sinh thời khóa biểu để xem tóm tắt.</p>
        )}
      </section>
    </div>
  );
}
