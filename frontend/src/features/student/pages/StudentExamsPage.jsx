import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2, MapPin, AlertCircle } from "lucide-react";
import { httpClient } from "@/services/httpClient";

const EXAM_TYPE_LABEL = {
  MIDTERM: "Giữa kỳ",
  FINAL: "Cuối kỳ",
  MAKEUP: "Thi lại",
  OTHER: "Khác",
};

const EXAM_TYPE_COLOR = {
  MIDTERM: "bg-amber-50 border-amber-200 text-amber-800",
  FINAL: "bg-blue-50 border-blue-200 text-blue-800",
  MAKEUP: "bg-red-50 border-red-200 text-red-800",
  OTHER: "bg-gray-50 border-gray-200 text-gray-700",
};

const EXAM_TYPE_BADGE = {
  MIDTERM: "bg-amber-100 text-amber-700",
  FINAL: "bg-blue-100 text-blue-700",
  MAKEUP: "bg-red-100 text-red-700",
  OTHER: "bg-gray-100 text-gray-600",
};

const EXAM_METHOD_LABEL = {
  WRITTEN: "Viết",
  ORAL: "Vấn đáp",
  PRACTICAL: "Thực hành",
  ONLINE: "Trực tuyến",
};

const DAYS_VI = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

function formatDateHeader(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = DAYS_VI[d.getDay()];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}, ${dd}/${mm}/${d.getFullYear()}`;
}

function formatTime(t) {
  return t ? String(t).slice(0, 5) : "";
}

function getResponseData(res) {
  const d = res?.data?.data ?? res?.data ?? [];
  return Array.isArray(d) ? d : [];
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    httpClient.get("/api/categories/semesters")
      .then((res) => { if (mounted) setSemesters(getResponseData(res)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    const params = {};
    if (selectedSemester !== "all") params.semesterId = selectedSemester;
    httpClient.get("/api/student/exams", { params })
      .then((res) => { if (mounted) setExams(getResponseData(res)); })
      .catch((err) => { if (mounted) { setExams([]); setError(err?.response?.data?.message || "Không thể tải lịch thi."); } })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [selectedSemester]);

  const grouped = useMemo(() => {
    const map = {};
    for (const exam of exams) {
      const key = exam.examDate;
      if (!map[key]) map[key] = [];
      map[key].push(exam);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [exams]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lịch thi cá nhân</h1>
          <p className="mt-1 text-sm text-gray-500">Danh sách các kỳ thi của bạn theo học kỳ.</p>
        </div>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="all">Tất cả học kỳ</option>
          {semesters.map((sem) => (
            <option key={sem.id} value={String(sem.id)}>{sem.name || sem.semesterName || sem.semesterCode}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 py-20 text-center">
          <CalendarDays className="mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-semibold text-gray-600">Chưa có lịch thi</h3>
          <p className="mt-1 text-sm text-gray-400">Chưa có lịch thi trong học kỳ này.</p>
        </div>
      )}

      {!loading && !error && grouped.map(([date, items]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">{formatDateHeader(date)}</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="flex flex-col gap-3">
            {items.map((exam) => (
              <div
                key={exam.examId}
                className={`w-full rounded-xl border px-5 py-4 shadow-sm transition hover:shadow-md ${
                  EXAM_TYPE_COLOR[exam.examType] || EXAM_TYPE_COLOR.OTHER
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Bên trái: thông tin môn */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          EXAM_TYPE_BADGE[exam.examType] || EXAM_TYPE_BADGE.OTHER
                        }`}
                      >
                        {EXAM_TYPE_LABEL[exam.examType] || exam.examType}
                      </span>

                      {exam.examMethod && (
                        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {EXAM_METHOD_LABEL[exam.examMethod] || exam.examMethod}
                        </span>
                      )}
                    </div>

                    <h3 className="truncate text-base font-bold leading-snug text-gray-900">
                      {exam.courseName}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {exam.courseCode} · {exam.sectionCode}
                    </p>

                    {exam.note && (
                      <p className="mt-2 line-clamp-2 max-w-2xl text-xs italic text-gray-500">
                        {exam.note}
                      </p>
                    )}
                  </div>

                  {/* Bên phải: giờ + phòng */}
                  <div className="grid shrink-0 grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2 md:min-w-[360px]">
                    <div className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2">
                      <Clock className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Thời gian</p>
                        <p className="font-semibold text-gray-800">
                          {formatTime(exam.startTime)} – {formatTime(exam.endTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Phòng thi</p>
                        <p className="font-semibold text-gray-800">
                          {exam.classroomCode
                            ? `Phòng ${exam.classroomCode}`
                            : "Chưa có phòng"}
                          {exam.buildingCode ? ` · Tòa ${exam.buildingCode}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
