import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, CalendarDays, Clock, Loader2, School, UserRound } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { httpClient } from "../../services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const settledData = (result) => (result.status === "fulfilled" ? getResponseData(result.value) : []);

const getActiveSemester = (semesters) => (
  semesters.find((semester) => String(semester.status || "").toUpperCase() === "ACTIVE") || semesters[0]
);

const SettingsPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const [semesterResult, slotResult, roomResult, courseResult, lecturerResult, userResult] = await Promise.allSettled([
          httpClient.get("/api/categories/semesters"),
          httpClient.get("/api/categories/time-slots"),
          httpClient.get("/api/categories/classrooms"),
          httpClient.get("/api/categories/courses"),
          httpClient.get("/api/categories/lecturers"),
          httpClient.get("/api/admin/users"),
        ]);

        if (!isMounted) return;
        setSemesters(settledData(semesterResult));
        setTimeSlots(settledData(slotResult));
        setClassrooms(settledData(roomResult));
        setCourses(settledData(courseResult));
        setLecturers(settledData(lecturerResult));
        setUsers(settledData(userResult));

        const allFailed = [semesterResult, slotResult, roomResult, courseResult, lecturerResult, userResult]
          .every((result) => result.status === "rejected");
        if (allFailed) setError("Không thể tải dữ liệu cài đặt hệ thống.");
      } catch (err) {
        if (isMounted) setError(err?.response?.data?.message || "Không thể tải dữ liệu cài đặt hệ thống.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSemester = useMemo(() => getActiveSemester(semesters), [semesters]);
  const sortedSlots = useMemo(() => (
    [...timeSlots].sort((a, b) => Number(a.slotNo || a.slotNumber || a.id || 0) - Number(b.slotNo || b.slotNumber || b.id || 0))
  ), [timeSlots]);

  const stats = [
    { label: "Học kỳ", value: semesters.length, icon: CalendarDays, color: "bg-blue-500" },
    { label: "Khung tiết", value: timeSlots.length, icon: Clock, color: "bg-emerald-500" },
    { label: "Phòng học", value: classrooms.length, icon: School, color: "bg-indigo-500" },
    { label: "Môn học", value: courses.length, icon: BookOpen, color: "bg-amber-500" },
    { label: "Giảng viên", value: lecturers.length, icon: UserRound, color: "bg-rose-500" },
    { label: "Tài khoản", value: users.length, icon: UserRound, color: "bg-slate-500" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cài đặt hệ thống</h1>
        <p className="mt-1 text-gray-600">Theo dõi cấu hình vận hành hiện tại từ dữ liệu database.</p>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải cài đặt...</p>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{item.value}</p>
                    </div>
                    <div className={`${item.color} flex h-11 w-11 items-center justify-center rounded-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Học kỳ đang áp dụng</CardTitle>
                <CardDescription>Dữ liệu lấy từ danh mục học kỳ của backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSemester ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{activeSemester.name}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {activeSemester.startDate || "-"} đến {activeSemester.endDate || "-"}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {activeSemester.status || "ACTIVE"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm font-semibold text-gray-400">
                    Chưa có học kỳ trong database.
                  </div>
                )}
                <div className="space-y-2">
                  {semesters.slice(0, 5).map((semester) => (
                    <div key={semester.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <span className="text-sm font-medium text-gray-800">{semester.name}</span>
                      <span className="text-xs text-gray-500">{semester.status || "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Khung tiết học</CardTitle>
                <CardDescription>Cấu hình tiết học hiện có trong database.</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedSlots.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {sortedSlots.map((slot) => (
                      <div key={slot.id} className="rounded-lg border border-gray-100 px-3 py-2">
                        <p className="text-sm font-semibold text-gray-900">
                          Tiết {slot.slotNo || slot.slotNumber || slot.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {slot.startTime || "-"} - {slot.endTime || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm font-semibold text-gray-400">
                    Chưa có khung tiết.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quy tắc vận hành</CardTitle>
                <CardDescription>Các công tắc đang chỉ hiển thị trạng thái, chưa có API lưu cấu hình.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-800">Phân phòng tự động</p>
                    <p className="text-sm text-gray-500">Cho phép Staff/Admin chạy thuật toán phân phòng.</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-800">Cảnh báo trùng lịch</p>
                    <p className="text-sm text-gray-500">Hiển thị cảnh báo khi phát hiện xung đột phòng hoặc tiết.</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-800">Thông báo email</p>
                    <p className="text-sm text-gray-500">Chưa có backend gửi email trong scope hiện tại.</p>
                  </div>
                  <Switch disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trạng thái dữ liệu</CardTitle>
                <CardDescription>Nhanh chóng kiểm tra dữ liệu nền để vận hành hệ thống.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Có phòng học", ok: classrooms.length > 0 },
                  { label: "Có môn học", ok: courses.length > 0 },
                  { label: "Có giảng viên", ok: lecturers.length > 0 },
                  { label: "Có tài khoản", ok: users.length > 0 },
                  { label: "Có khung tiết", ok: timeSlots.length > 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                    <Badge className={item.ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                      {item.ok ? "Đã có" : "Cần bổ sung"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled>Khôi phục mặc định</Button>
            <Button disabled className="bg-blue-600 hover:bg-blue-700">Lưu cài đặt</Button>
          </div>
        </>
      )}
    </div>
  );
};

export { SettingsPage };
