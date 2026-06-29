import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, Calendar, Loader2, School, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { httpClient } from "../../services/httpClient";

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS = {
  MON: "T2",
  TUE: "T3",
  WED: "T4",
  THU: "T5",
  FRI: "T6",
  SAT: "T7",
  SUN: "CN",
};

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const settledData = (result) => (result.status === "fulfilled" ? getResponseData(result.value) : []);

const normalizeStatus = (value) => String(value || "").trim().toUpperCase();

const getSectionDay = (section) => {
  const value = String(section.dayCode || section.day || "").trim().toUpperCase();
  if (DAY_ORDER.includes(value)) return value;
  if (value.includes("2")) return "MON";
  if (value.includes("3")) return "TUE";
  if (value.includes("4")) return "WED";
  if (value.includes("5")) return "THU";
  if (value.includes("6")) return "FRI";
  if (value.includes("7")) return "SAT";
  if (value.includes("CN") || value.includes("SUN")) return "SUN";
  return "";
};

const isAssignedSection = (section) => {
  const status = normalizeStatus(section.allocationStatus || section.statusText || section.sectionStatus);
  return Boolean(section.classroomId || section.room) || ["ASSIGNED", "PUBLISHED", "PENDING_APPROVAL"].includes(status);
};

const isConflictSection = (section) => {
  const status = normalizeStatus(section.allocationStatus || section.statusText || section.sectionStatus);
  return status.includes("CONFLICT");
};

const DashboardPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const [roomsResult, coursesResult, lecturersResult, sectionsResult] = await Promise.allSettled([
          httpClient.get("/api/categories/classrooms"),
          httpClient.get("/api/categories/courses"),
          httpClient.get("/api/categories/lecturers"),
          httpClient.get("/api/admin/class-sections"),
        ]);

        if (!isMounted) return;
        setClassrooms(settledData(roomsResult));
        setCourses(settledData(coursesResult));
        setLecturers(settledData(lecturersResult));
        setSections(settledData(sectionsResult));

        const allFailed = [roomsResult, coursesResult, lecturersResult, sectionsResult]
          .every((result) => result.status === "rejected");
        if (allFailed) setError("Không thể tải dữ liệu bảng điều khiển.");
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Không thể tải dữ liệu bảng điều khiển.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const assigned = sections.filter(isAssignedSection).length;
    const conflicts = sections.filter(isConflictSection).length;
    return [
      {
        title: "Phòng học",
        value: classrooms.length,
        description: "Phòng đang có trong danh mục",
        icon: School,
        color: "bg-blue-500",
      },
      {
        title: "Môn học",
        value: courses.length,
        description: "Môn học đang quản lý",
        icon: BookOpen,
        color: "bg-emerald-500",
      },
      {
        title: "Lớp học phần",
        value: sections.length,
        description: `${assigned} lớp đã có phòng`,
        icon: Calendar,
        color: "bg-indigo-500",
      },
      {
        title: "Giảng viên",
        value: lecturers.length,
        description: `${conflicts} cảnh báo trùng lịch`,
        icon: Users,
        color: conflicts > 0 ? "bg-red-500" : "bg-slate-500",
      },
    ];
  }, [classrooms.length, courses.length, lecturers.length, sections]);

  const roomUsageData = useMemo(() => (
    DAY_ORDER.map((day) => ({
      day: DAY_LABELS[day],
      usage: sections.filter((section) => getSectionDay(section) === day).length,
    }))
  ), [sections]);

  const utilizationData = useMemo(() => {
    const assigned = sections.filter(isAssignedSection).length;
    const conflicts = sections.filter(isConflictSection).length;
    const unassigned = Math.max(sections.length - assigned - conflicts, 0);
    return [
      { name: "Đã phân phòng", value: assigned, color: "#2563eb" },
      { name: "Chưa phân phòng", value: unassigned, color: "#14b8a6" },
      { name: "Trùng lịch", value: conflicts, color: "#ef4444" },
    ];
  }, [sections]);

  const previewItems = useMemo(() => (
    sections
      .filter((section) => section.schedule || section.day || section.dayCode || section.room)
      .slice(0, 5)
      .map((section) => ({
        id: section.id,
        time: section.schedule || [DAY_LABELS[getSectionDay(section)] || section.day, section.slotStart && `Tiết ${section.slotStart}`]
          .filter(Boolean)
          .join(" - ") || "Chưa có lịch",
        course: section.courseName || section.classCode || `Lop ${section.id}`,
        room: section.room || "Chưa phân phòng",
        status: normalizeStatus(section.allocationStatus || section.statusText || section.sectionStatus || "NO_SCHEDULE"),
      }))
  ), [sections]);

  const hasUtilizationData = utilizationData.some((item) => item.value > 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bảng điều khiển</h1>
        <p className="mt-1 text-gray-600">Tổng quan dữ liệu phòng học, môn học và lớp học phần từ database.</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải bảng điều khiển...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="mt-1 text-xs text-gray-500">{stat.description}</p>
                      </div>
                      <div className={`${stat.color} flex h-12 w-12 items-center justify-center rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lớp học phần theo ngày</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roomUsageData}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#6b7280" />
                      <YAxis allowDecimals={false} stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="usage" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm font-semibold text-gray-400">
                    Chưa có lớp học phần để thống kê.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tình trạng phân phòng</CardTitle>
              </CardHeader>
              <CardContent>
                {hasUtilizationData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={utilizationData}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        outerRadius={100}
                      >
                        {utilizationData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm font-semibold text-gray-400">
                    Chưa có dữ liệu phân phòng.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lịch gần nhất</CardTitle>
            </CardHeader>
            <CardContent>
              {previewItems.length > 0 ? (
                <div className="space-y-3">
                  {previewItems.map((item) => (
                    <div key={item.id} className="flex flex-col justify-between gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <div className="text-sm font-medium text-gray-900">{item.time}</div>
                        <div className="text-sm text-gray-600">{item.course}</div>
                        <div className="text-sm text-gray-600">Phòng: {item.room}</div>
                      </div>
                      <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm font-semibold text-gray-400">
                  Chưa có lịch lớp học phần.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export { DashboardPage };
