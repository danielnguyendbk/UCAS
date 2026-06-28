import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, BookOpen, CalendarDays, Clock, Loader2, School, UserRound,
  Plus, Pencil, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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

const SEMESTER_TYPES = [
  { value: "HK1", label: "Học kỳ 1" },
  { value: "HK2", label: "Học kỳ 2" },
  { value: "HKH", label: "Học kỳ hè" },
];

const SEMESTER_STATUSES = [
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Chưa kích hoạt" },
  { value: "LOCKED", label: "Đã khoá" },
];

const statusBadgeClass = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "ACTIVE") return "bg-green-100 text-green-800";
  if (s === "LOCKED") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
};

const EMPTY_FORM = {
  name: "",
  code: "",
  year: new Date().getFullYear(),
  type: "HK1",
  startDate: "",
  endDate: "",
  status: "INACTIVE",
};

const SettingsPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Semester management
  const [semDialogOpen, setSemDialogOpen] = useState(false);
  const [editingSem, setEditingSem] = useState(null);
  const [semForm, setSemForm] = useState(EMPTY_FORM);
  const [semSaving, setSemSaving] = useState(false);
  const [semError, setSemError] = useState("");
  const [expandedYears, setExpandedYears] = useState({});

  const fetchSemesters = async () => {
    try {
      const res = await httpClient.get("/api/categories/semesters");
      setSemesters(getResponseData(res));
    } catch {
      // ignore partial failure
    }
  };

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
    return () => { isMounted = false; };
  }, []);

  const activeSemester = useMemo(() => getActiveSemester(semesters), [semesters]);
  const sortedSlots = useMemo(() => (
    [...timeSlots].sort((a, b) => Number(a.slotNo || a.slotNumber || a.id || 0) - Number(b.slotNo || b.slotNumber || b.id || 0))
  ), [timeSlots]);

  // Group semesters by academic year
  const semestersByYear = useMemo(() => {
    const groups = {};
    for (const sem of semesters) {
      const year = sem.academicYear || sem.semester_year || sem.year || "Không rõ năm học";
      if (!groups[year]) groups[year] = [];
      groups[year].push(sem);
    }
    return Object.entries(groups).sort(([a], [b]) => String(b).localeCompare(String(a)));
  }, [semesters]);

  const stats = [
    { label: "Học kỳ", value: semesters.length, icon: CalendarDays, color: "bg-blue-500" },
    { label: "Khung tiết", value: timeSlots.length, icon: Clock, color: "bg-emerald-500" },
    { label: "Phòng học", value: classrooms.length, icon: School, color: "bg-indigo-500" },
    { label: "Môn học", value: courses.length, icon: BookOpen, color: "bg-amber-500" },
    { label: "Giảng viên", value: lecturers.length, icon: UserRound, color: "bg-rose-500" },
    { label: "Tài khoản", value: users.length, icon: UserRound, color: "bg-slate-500" },
  ];

  const openCreate = () => {
    setEditingSem(null);
    setSemForm({ ...EMPTY_FORM });
    setSemError("");
    setSemDialogOpen(true);
  };

  const openEdit = (sem) => {
    setEditingSem(sem);
    setSemForm({
      name: sem.name || sem.semesterName || "",
      code: sem.code || sem.semesterCode || "",
      year: sem.year || sem.semesterYear || new Date().getFullYear(),
      type: sem.type || sem.semesterType || "HK1",
      startDate: sem.startDate || "",
      endDate: sem.endDate || "",
      status: sem.status || "INACTIVE",
    });
    setSemError("");
    setSemDialogOpen(true);
  };

  const saveSemester = async () => {
    if (!semForm.name.trim()) { setSemError("Tên học kỳ không được để trống."); return; }
    if (!semForm.startDate || !semForm.endDate) { setSemError("Vui lòng chọn ngày bắt đầu và kết thúc."); return; }
    if (semForm.startDate >= semForm.endDate) { setSemError("Ngày kết thúc phải sau ngày bắt đầu."); return; }

    setSemSaving(true);
    setSemError("");
    try {
      const payload = {
        semester_name: semForm.name.trim(),
        semester_code: semForm.code.trim() || undefined,
        semester_year: Number(semForm.year),
        semester_type: semForm.type,
        start_date: semForm.startDate,
        end_date: semForm.endDate,
        status: semForm.status,
      };

      if (editingSem) {
        await httpClient.put(`/api/semesters/${editingSem.id}`, payload);
      } else {
        await httpClient.post("/api/semesters", payload);
      }

      setSemDialogOpen(false);
      await fetchSemesters();
    } catch (err) {
      setSemError(err?.response?.data?.message || "Lưu học kỳ thất bại.");
    } finally {
      setSemSaving(false);
    }
  };

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

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

          {/* Semester management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quản lý học kỳ theo năm học</CardTitle>
                <CardDescription>
                  Tạo và cập nhật học kỳ.
                  {activeSemester && (
                    <span className="ml-1">
                      Học kỳ đang hoạt động: <strong>{activeSemester.name}</strong>
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Thêm học kỳ
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {semestersByYear.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm font-semibold text-gray-400">
                  Chưa có học kỳ trong database.
                </div>
              )}
              {semestersByYear.map(([year, sems]) => {
                const isOpen = expandedYears[year] !== false;
                return (
                  <div key={year} className="rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                      onClick={() => toggleYear(year)}
                    >
                      <span className="font-semibold text-sm text-gray-800">Năm học {year}</span>
                      <span className="flex items-center gap-2 text-xs text-gray-500">
                        {sems.length} học kỳ
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-gray-100">
                        {sems.map((sem) => (
                          <div key={sem.id} className="flex items-center justify-between px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{sem.name}</p>
                              <p className="text-xs text-gray-500">
                                {sem.startDate || "—"} → {sem.endDate || "—"}
                                {sem.code ? <span className="ml-2 text-gray-400">({sem.code})</span> : null}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <Badge className={statusBadgeClass(sem.status)}>
                                {sem.status || "INACTIVE"}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(sem)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        </>
      )}

      {/* Semester create/edit dialog */}
      <Dialog open={semDialogOpen} onOpenChange={setSemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSem ? "Cập nhật học kỳ" : "Thêm học kỳ mới"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {semError && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {semError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Tên học kỳ <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="VD: Học kỳ 1 năm học 2025-2026"
                  value={semForm.name}
                  onChange={(e) => setSemForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mã học kỳ</Label>
                <Input
                  placeholder="VD: HK1_2526"
                  value={semForm.code}
                  onChange={(e) => setSemForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Năm học</Label>
                <Input
                  type="number"
                  placeholder="VD: 2025"
                  value={semForm.year}
                  onChange={(e) => setSemForm((f) => ({ ...f, year: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Loại học kỳ</Label>
                <Select value={semForm.type} onValueChange={(v) => setSemForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={semForm.status} onValueChange={(v) => setSemForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Ngày bắt đầu <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={semForm.startDate}
                  onChange={(e) => setSemForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ngày kết thúc <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={semForm.endDate}
                  onChange={(e) => setSemForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSemDialogOpen(false)} disabled={semSaving}>
              Huỷ
            </Button>
            <Button onClick={saveSemester} disabled={semSaving} className="gap-1.5">
              {semSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingSem ? "Cập nhật" : "Tạo học kỳ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { SettingsPage };
