import { useEffect, useMemo, useState } from "react";
import { BadgeInfo, Building2, Loader2, Pencil, Plus, RefreshCw, Search, ShieldCheck, Badge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { httpClient } from "@/services/httpClient";

const EMPTY_FORM = {
  id: null,
  semesterId: "",
  facilityStaffId: "",
  buildingId: "",
  status: "ACTIVE",
  note: "",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const normalize = (value) => String(value ?? "").trim();

const getResponseData = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return payload?.data ?? payload ?? [];
};

const getPageData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? {};
  if (Array.isArray(payload?.items)) {
    return payload;
  }
  return {
    items: [],
    page: 0,
    size: 20,
    totalItems: 0,
    totalPages: 0,
  };
};

const getActiveSemester = (semesters) =>
  semesters.find((semester) => String(semester.status ?? semester.statusLabel ?? "").toUpperCase() === "ACTIVE") ??
  semesters[0] ??
  null;

const formatSemesterLabel = (semester) => {
  if (!semester) return "";
  return (
    semester.name ||
    semester.semester_name ||
    semester.semesterName ||
    semester.code ||
    semester.semester_code ||
    `#${semester.id ?? semester.semesterId}`
  );
};

const normalizeAssignment = (item) => ({
  id: item.id ?? item.assignmentId,
  semesterId: item.semesterId ?? item.semester_id,
  semesterCode: item.semesterCode ?? item.semester_code ?? "",
  semesterName: item.semesterName ?? item.semester_name ?? "",
  facilityStaffId: item.facilityStaffId ?? item.facility_staff_id,
  staffCode: item.staffCode ?? item.staff_code ?? "",
  username: item.username ?? "",
  fullName: item.fullName ?? item.full_name ?? item.username ?? "",
  buildingId: item.buildingId ?? item.building_id,
  buildingCode: item.buildingCode ?? item.building_code ?? "",
  buildingName: item.buildingName ?? item.building_name ?? "",
  status: String(item.status ?? "ACTIVE").toUpperCase(),
  note: item.note ?? "",
  assignedByUsername: item.assignedByUsername ?? item.assigned_by_username ?? "",
  assignedAt: item.assignedAt ?? item.assigned_at ?? "",
});

const normalizeStaff = (item) => ({
  id: item.id ?? item.facility_staff_id,
  staffCode: item.staffCode ?? item.staff_code ?? "",
  username: item.username ?? "",
  email: item.email ?? "",
  buildingId: item.buildingId ?? item.building_id ?? null,
  buildingCode: item.buildingCode ?? item.building_code ?? "",
  buildingName: item.buildingName ?? item.building_name ?? "",
  note: item.note ?? "",
  status: String(item.status ?? item.user_status ?? "ACTIVE").toUpperCase(),
});

const normalizeBuilding = (item) => ({
  id: item.id ?? item.building_id,
  code: item.code ?? item.building_code ?? "",
  name: item.name ?? item.building_name ?? "",
});

const normalizeSemester = (item) => ({
  id: item.id ?? item.semester_id,
  code: item.code ?? item.semester_code ?? "",
  name: item.name ?? item.semester_name ?? "",
  status: item.status ?? "",
});

export const FacilityAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [facilityStaff, setFacilityStaff] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [semesterId, setSemesterId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form, setForm] = useState(EMPTY_FORM);

  const [statusTarget, setStatusTarget] = useState(null);

  useEffect(() => {
    void loadInitialData();
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
    void loadAssignments();
  }, [semesterId, page, size, status, search]);

  const semesterOptions = useMemo(() => semesters, [semesters]);
  const staffOptions = useMemo(
    () => facilityStaff.filter((item) => item.status === "ACTIVE"),
    [facilityStaff],
  );

  const buildingMap = useMemo(() => {
    const map = new Map();
    buildings.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [buildings]);

  const staffMap = useMemo(() => {
    const map = new Map();
    facilityStaff.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [facilityStaff]);

  const currentSemester = useMemo(
    () => semesterOptions.find((item) => String(item.id) === String(semesterId)),
    [semesterOptions, semesterId],
  );

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentsResponse, staffResponse, buildingsResponse, semestersResponse] = await Promise.all([
        httpClient.get("/api/admin/facility-assignments", {
          params: { semesterId: semesterId || undefined, page, size, search: normalize(search) || undefined, status },
        }),
        httpClient.get("/api/facility-staff"),
        httpClient.get("/api/categories/buildings"),
        httpClient.get("/api/categories/semesters"),
      ]);

      const pageData = getPageData(assignmentsResponse);
      setAssignments((pageData.items || []).map(normalizeAssignment));
      setTotalItems(pageData.totalItems ?? 0);
      setTotalPages(pageData.totalPages ?? 0);
      setFacilityStaff(getResponseData(staffResponse).map(normalizeStaff));
      setBuildings(getResponseData(buildingsResponse).map(normalizeBuilding));
      setSemesters(getResponseData(semestersResponse).map(normalizeSemester));
    } catch (exception) {
      console.error("Failed to load facility assignment data", exception);
      setError("Không tải được danh sách phân công. Vui lòng kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await httpClient.get("/api/admin/facility-assignments", {
        params: {
          semesterId: semesterId || undefined,
          page,
          size,
          search: normalize(search) || undefined,
          status: status === "ALL" ? undefined : status,
        },
      });
      const pageData = getPageData(response);
      setAssignments((pageData.items || []).map(normalizeAssignment));
      setTotalItems(pageData.totalItems ?? 0);
      setTotalPages(pageData.totalPages ?? 0);
    } catch (exception) {
      console.error("Failed to load assignments", exception);
      setError("Không tải được danh sách phân công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadAssignments();
  };

  const openCreate = () => {
    setFormMode("create");
    setForm({
      ...EMPTY_FORM,
      semesterId: semesterId || "",
      status: "ACTIVE",
    });
    setIsFormOpen(true);
  };

  const openEdit = (assignment) => {
    setFormMode("edit");
    setForm({
      id: assignment.id,
      semesterId: String(assignment.semesterId ?? ""),
      facilityStaffId: String(assignment.facilityStaffId ?? ""),
      buildingId: String(assignment.buildingId ?? ""),
      status: assignment.status || "ACTIVE",
      note: assignment.note || "",
    });
    setIsFormOpen(true);
  };

  const buildPayload = () => ({
    semesterId: Number(form.semesterId),
    facilityStaffId: Number(form.facilityStaffId),
    buildingId: Number(form.buildingId),
    status: form.status,
    note: form.note.trim() || null,
  });

  const handleSave = async () => {
    if (!form.semesterId || !form.facilityStaffId || !form.buildingId) {
      setError("Vui lòng chọn học kỳ, nhân viên CSVC và tòa nhà.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      if (formMode === "edit" && form.id) {
        await httpClient.put(`/api/admin/facility-assignments/${form.id}`, payload);
        toast.success("Đã cập nhật phân công.");
      } else {
        await httpClient.post("/api/admin/facility-assignments", payload);
        toast.success("Đã tạo phân công.");
      }
      setIsFormOpen(false);
      await refresh();
    } catch (exception) {
      console.error("Failed to save assignment", exception);
      const apiError = exception?.response?.data;
      setError(apiError?.message || apiError?.error || "Không lưu được phân công.");
      toast.error(apiError?.message || "Không lưu được phân công.");
    } finally {
      setSaving(false);
    }
  };

  const requestStatusToggle = (assignment) => {
    setStatusTarget(assignment);
  };

  const confirmStatusToggle = async () => {
    if (!statusTarget) return;
    const assignment = statusTarget;
    setSaving(true);
    setError("");
    try {
      const nextStatus = assignment.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await httpClient.patch(`/api/admin/facility-assignments/${assignment.id}/status`, { status: nextStatus });
      toast.success("Đã cập nhật trạng thái phân công.");
      await refresh();
    } catch (exception) {
      console.error("Failed to update status", exception);
      const apiError = exception?.response?.data;
      setError(apiError?.message || "Không cập nhật được trạng thái.");
      toast.error(apiError?.message || "Không cập nhật được trạng thái.");
    } finally {
      setSaving(false);
      setStatusTarget(null);
    }
  };

  const activeSemesterLabel = currentSemester ? `${currentSemester.name || currentSemester.code}` : "Chưa chọn học kỳ";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Phân công tòa theo học kỳ</h1>
          <p className="mt-1 text-sm text-gray-600">Quản lý phân công nhân viên cơ sở vật chất theo học kỳ.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm phân công
        </Button>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-4">
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
                {formatSemesterLabel(semester)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 lg:col-span-2">
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
              placeholder="staff_code, username, building_code, building_name..."
              className="pl-9"
            />
          </div>
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
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>{activeSemesterLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Tổng {totalItems} bản ghi</span>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading || saving}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead>Mã nhân viên</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Tòa phụ trách</TableHead>
              <TableHead>Học kỳ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải phân công...
                  </div>
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <BadgeInfo className="h-10 w-10 text-gray-300" />
                    <div>
                      <p className="font-semibold text-gray-700">Chưa có phân công phù hợp.</p>
                      <p className="mt-1 text-xs text-gray-400">Hãy tạo phân công mới hoặc đổi bộ lọc.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => {
                const building = buildingMap.get(String(assignment.buildingId));
                const staff = staffMap.get(String(assignment.facilityStaffId));
                const isActive = assignment.status === "ACTIVE";
                return (
                  <TableRow key={assignment.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs font-semibold text-blue-700">
                      {assignment.staffCode || staff?.staffCode || "---"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.username || staff?.username || "---"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">
                        {assignment.buildingName || building?.name || "---"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {assignment.buildingCode || building?.code || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{assignment.semesterName || formatSemesterLabel(currentSemester)}</div>
                      <div className="text-xs text-gray-400">{assignment.semesterCode || currentSemester?.code || ""}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"}
                      >
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-gray-500">
                      {assignment.note || "Không có"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(assignment)} disabled={saving}>
                          <Pencil className="mr-1 h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={isActive ? "text-amber-700 hover:bg-amber-50" : "text-green-700 hover:bg-green-50"}
                          onClick={() => requestStatusToggle(assignment)}
                          disabled={saving}
                        >
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          {isActive ? "Ngưng" : "Kích hoạt"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div>
            Hiển thị {assignments.length} / {totalItems} phân công
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{formMode === "edit" ? "Cập nhật phân công" : "Thêm phân công"}</DialogTitle>
            <DialogDescription>Phân công tòa nhà cho nhân viên cơ sở vật chất theo học kỳ.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Học kỳ</Label>
              <select
                value={form.semesterId}
                onChange={(event) => setForm((previous) => ({ ...previous, semesterId: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn học kỳ</option>
                {semesterOptions.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {formatSemesterLabel(semester)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Nhân viên CSVC</Label>
              <select
                value={form.facilityStaffId}
                onChange={(event) => setForm((previous) => ({ ...previous, facilityStaffId: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn nhân viên</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.staffCode} - {staff.username || staff.email || `#${staff.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tòa nhà</Label>
              <select
                value={form.buildingId}
                onChange={(event) => setForm((previous) => ({ ...previous, buildingId: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn tòa nhà</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name} {building.code ? `(${building.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select
                value={form.status}
                onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Ghi chú</Label>
              <textarea
                rows={4}
                value={form.note}
                onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Mô tả ngắn về phân công"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : formMode === "edit" ? "Lưu thay đổi" : "Tạo phân công"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(statusTarget)} onOpenChange={() => setStatusTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            <DialogDescription>
              {statusTarget
                ? `Cập nhật trạng thái phân công của ${statusTarget.staffCode || statusTarget.username || "nhân viên"}?`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)} disabled={saving}>
              Hủy
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => void confirmStatusToggle()}
              disabled={saving}
            >
              {saving ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilityAssignmentsPage;
