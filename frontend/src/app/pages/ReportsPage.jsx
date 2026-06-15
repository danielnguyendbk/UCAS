import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Download, FileText, Loader2, School, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { httpClient } from "../../services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const settledData = (result) => (result.status === "fulfilled" ? getResponseData(result.value) : []);

const ReportsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [calendarBlocks, setCalendarBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setLoading(true);
      setError("");
      try {
        const [roomsResult, sectionsResult, examsResult, blocksResult] = await Promise.allSettled([
          httpClient.get("/api/categories/classrooms"),
          httpClient.get("/api/admin/class-sections"),
          httpClient.get("/api/admin/exams"),
          httpClient.get("/api/admin/calendar-blocks"),
        ]);

        if (!isMounted) return;
        setClassrooms(settledData(roomsResult));
        setSections(settledData(sectionsResult));
        setExams(settledData(examsResult));
        setCalendarBlocks(settledData(blocksResult));

        const allFailed = [roomsResult, sectionsResult, examsResult, blocksResult]
          .every((result) => result.status === "rejected");
        if (allFailed) setError("Không thể tải dữ liệu báo cáo.");
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.message || "Không thể tải dữ liệu báo cáo.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const reports = useMemo(() => {
    const assignedSections = sections.filter((section) => section.room || section.classroomId).length;
    const conflictSections = sections.filter((section) => section.allocationStatus === "CONFLICT").length;
    const activeRooms = classrooms.filter((room) => room.active !== false).length;
    const scheduledExams = exams.filter((exam) => exam.status === "SCHEDULED").length;

    return [
      {
        id: "rooms",
        title: "Thống kê phòng học",
        description: `${activeRooms} phòng đang hoạt động / ${classrooms.length} phòng`,
        value: activeRooms,
        icon: School,
        color: "bg-blue-500",
      },
      {
        id: "sections",
        title: "Tổng hợp lớp học phần",
        description: `${assignedSections} lớp đã có phòng / ${sections.length} lớp học phần`,
        value: sections.length,
        icon: Calendar,
        color: "bg-emerald-500",
      },
      {
        id: "conflicts",
        title: "Cảnh báo trùng lịch",
        description: `${conflictSections} lớp học phần cần kiểm tra`,
        value: conflictSections,
        icon: TrendingUp,
        color: conflictSections > 0 ? "bg-red-500" : "bg-slate-500",
      },
      {
        id: "exams",
        title: "Lịch thi",
        description: `${scheduledExams} lịch thi đang xếp / ${exams.length} lịch thi`,
        value: exams.length,
        icon: FileText,
        color: "bg-indigo-500",
      },
      {
        id: "calendar",
        title: "Lịch học vụ",
        description: `${calendarBlocks.length} ngày nghỉ, tuần thi hoặc sự kiện`,
        value: calendarBlocks.length,
        icon: Calendar,
        color: "bg-amber-500",
      },
    ];
  }, [calendarBlocks.length, classrooms, exams, sections]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Báo cáo</h1>
        <p className="mt-1 text-gray-600">Tổng hợp nhanh từ dữ liệu database hiện có.</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải báo cáo...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`${report.color} flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <p className="mt-1 text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-3xl font-bold text-gray-900">{report.value}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" disabled>
                        <FileText className="mr-2 h-4 w-4" />
                        Xem
                      </Button>
                      <Button disabled className="bg-blue-600 hover:bg-blue-700">
                        <Download className="mr-2 h-4 w-4" />
                        Tải về
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { ReportsPage };
