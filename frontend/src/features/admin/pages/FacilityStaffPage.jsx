import { useEffect, useMemo, useState } from "react";
import ExcelImportActions from "@/features/admin/components/ExcelImportActions";
import {
  Search,
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  UserRound,
  Building2,
  BadgeInfo,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { httpClient } from "@/services/httpClient";

const EMPTY_FORM = {
  id: null,
  user_id: "",
  staff_code: "",
  building_id: "none",
  note: "",
};

const getResponseData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const isTrue = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

const normalizeUser = (user) => ({
  id: user.id,
  username: user.username || "",
  email: user.email || "",
  full_name: user.full_name || user.fullName || user.name || "",
  role: normalizeRole(user.role),
  is_active: isTrue(user.is_active ?? user.isActive ?? true),
  is_deleted: isTrue(user.is_deleted ?? user.isDeleted ?? false),
});

const normalizeBuilding = (building) => ({
  id: building.id,
  name: building.name || "",
  code: building.code || "",
});

const normalizeFacilityStaff = (item) => ({
  id: item.id,
  user_id: item.user_id ?? item.userId ?? "",
  staff_code: item.staff_code ?? item.staffCode ?? "",
  building_id: item.building_id ?? item.buildingId ?? "",
  note: item.note || "",
  username: item.username || "",
  full_name: item.full_name || item.fullName || item.name || "",
  building_name: item.building_name || item.buildingName || "",
  building_code: item.building_code || item.buildingCode || "",
  is_deleted: isTrue(item.is_deleted ?? item.isDeleted ?? false),
});

const getBuildingDisplay = (staff) => {
  if (staff.building_id && (staff.building_name || staff.building_code)) {
    return staff.building_code
      ? `${staff.building_name || "Tòa nhà"} (${staff.building_code})`
      : staff.building_name;
  }

  return "Chưa phân công";
};

export const FacilityStaffPage = () => {
  const [facilityStaff, setFacilityStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [staffForm, setStaffForm] = useState(EMPTY_FORM);

  const [viewStaff, setViewStaff] = useState(null);
  const [deleteStaff, setDeleteStaff] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [staffResponse, usersResponse, buildingsResponse] =
        await Promise.all([
          httpClient.get("/api/facility-staff"),
          httpClient.get("/api/users"),
          httpClient.get("/api/buildings"),
        ]);

      setFacilityStaff(getResponseData(staffResponse).map(normalizeFacilityStaff));
      setUsers(getResponseData(usersResponse).map(normalizeUser));
      setBuildings(getResponseData(buildingsResponse).map(normalizeBuilding));
    } catch (error) {
      console.error("Không tải được dữ liệu nhân viên CSVC:", error);
      setErrorMessage(
        "Không tải được dữ liệu nhân viên CSVC. Vui lòng kiểm tra backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((user) => map.set(String(user.id), user));
    return map;
  }, [users]);

  const buildingMap = useMemo(() => {
    const map = new Map();
    buildings.forEach((building) => map.set(String(building.id), building));
    return map;
  }, [buildings]);

  const enrichedStaff = useMemo(() => {
    return facilityStaff.map((staff) => {
      const user = userMap.get(String(staff.user_id)) || {};
      const building = buildingMap.get(String(staff.building_id)) || {};

      return {
        ...staff,
        username: staff.username || user.username || "",
        full_name: staff.full_name || user.full_name || "",
        email: user.email || "",
        role: user.role || "FACILITY",
        is_active: user.is_active ?? true,
        building_name: staff.building_name || building.name || "",
        building_code: staff.building_code || building.code || "",
      };
    });
  }, [facilityStaff, userMap, buildingMap]);

  const assignedUserIds = useMemo(() => {
    return new Set(facilityStaff.map((staff) => String(staff.user_id)));
  }, [facilityStaff]);

  const facilityUserOptions = useMemo(() => {
    return users.filter((user) => {
      const isFacilityRole = ["FACILITY", "EMPLOYEE", "EMPLOYEES"].includes(user.role);
      const isNotDeleted = !user.is_deleted;

      if (!isFacilityRole || !isNotDeleted) return false;

      if (formMode === "edit" && String(user.id) === String(staffForm.user_id)) {
        return true;
      }

      return !assignedUserIds.has(String(user.id));
    });
  }, [users, assignedUserIds, formMode, staffForm.user_id]);

  const filteredStaff = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return enrichedStaff.filter((staff) => {
      const matchSearch =
        !keyword ||
        [
          staff.staff_code,
          staff.full_name,
          staff.username,
          staff.email,
          staff.building_name,
          staff.building_code,
          staff.note,
        ].some((value) => String(value || "").toLowerCase().includes(keyword));

      const matchBuilding =
        buildingFilter === "all" ||
        (buildingFilter === "unassigned" && !staff.building_id) ||
        String(staff.building_id) === String(buildingFilter);

      return matchSearch && matchBuilding;
    });
  }, [enrichedStaff, searchTerm, buildingFilter]);

  const stats = useMemo(() => {
    const total = enrichedStaff.length;
    const assigned = enrichedStaff.filter((staff) => staff.building_id).length;
    const unassigned = total - assigned;
    const active = enrichedStaff.filter((staff) => staff.is_active).length;

    return { total, assigned, unassigned, active };
  }, [enrichedStaff]);

  const openCreateDialog = () => {
    setFormMode("create");
    setStaffForm(EMPTY_FORM);
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditDialog = (staff) => {
    setFormMode("edit");
    setStaffForm({
      id: staff.id,
      user_id: staff.user_id ? String(staff.user_id) : "",
      staff_code: staff.staff_code || "",
      building_id: staff.building_id ? String(staff.building_id) : "none",
      note: staff.note || "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleChangeForm = (field, value) => {
    setStaffForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!staffForm.user_id) {
      return "Vui lòng chọn tài khoản nhân viên CSVC.";
    }

    if (!staffForm.staff_code.trim()) {
      return "Mã nhân viên CSVC không được để trống.";
    }

    return "";
  };

  const buildPayload = () => ({
    user_id: Number(staffForm.user_id),
    staff_code: staffForm.staff_code.trim().toUpperCase(),
    building_id:
      staffForm.building_id && staffForm.building_id !== "none"
        ? Number(staffForm.building_id)
        : null,
    note: staffForm.note.trim() || null,
    is_deleted: 0,
  });

  const handleSaveStaff = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = buildPayload();

      if (formMode === "edit" && staffForm.id) {
        await httpClient.put(`/api/facility-staff/${staffForm.id}`, payload);
      } else {
        await httpClient.post("/api/facility-staff", payload);
      }

      setIsFormOpen(false);
      setStaffForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error("Không lưu được nhân viên CSVC:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không lưu được nhân viên CSVC. Vui lòng kiểm tra dữ liệu nhập.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaff?.id) return;

    setSaving(true);
    setErrorMessage("");

    try {
      await httpClient.delete(`/api/facility-staff/${deleteStaff.id}`);
      setDeleteStaff(null);
      await loadData();
    } catch (error) {
      console.error("Không xóa được nhân viên CSVC:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không xóa được nhân viên CSVC. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Nhân viên cơ sở vật chất
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý nhân viên phụ trách tòa nhà và khu vực phòng học
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExcelImportActions type="facilityStaff" onImported={loadData} />

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhân viên CSVC
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Tổng nhân viên"
          value={stats.total}
          icon={UserRound}
          tone="blue"
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          title="Đã phân công"
          value={stats.assigned}
          icon={Building2}
          tone="purple"
        />
        <StatCard
          title="Chưa phân công"
          value={stats.unassigned}
          icon={UserX}
          tone="orange"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, tài khoản, mã nhân viên, email, tòa nhà..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 h-10 text-sm rounded-lg"
          />
        </div>

        <select
          value={buildingFilter}
          onChange={(event) => setBuildingFilter(event.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Tất cả phân công</option>
          <option value="unassigned">Chưa phân công</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
              {building.code ? ` (${building.code})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Mã NV</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phân công tòa nhà</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải danh sách nhân viên CSVC...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <BadgeInfo className="w-10 h-10 text-gray-300" />
                    <div>
                      <p className="font-semibold text-gray-700">
                        Chưa có nhân viên CSVC phù hợp.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Bạn có thể thêm hồ sơ nhân viên CSVC mới từ tài khoản role FACILITY đã có.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-mono text-xs font-bold text-blue-700">
                    {staff.staff_code}
                  </TableCell>

                  <TableCell className="font-medium text-gray-900">
                    {staff.full_name || "Chưa có họ tên"}
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {staff.username || "Chưa liên kết"}
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {staff.email || "Chưa có email"}
                  </TableCell>

                  <TableCell>
                    {staff.building_id ? (
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-50">
                        {getBuildingDisplay(staff)}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-50">
                        Chưa phân công
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-gray-500 max-w-[220px] truncate">
                    {staff.note || "Không có"}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        staff.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {staff.is_active ? "Đang hoạt động" : "Tạm khóa"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewStaff(staff)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(staff)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteStaff(staff)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
          Hiển thị {filteredStaff.length} / {enrichedStaff.length} nhân viên CSVC
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit"
                ? "Cập nhật nhân viên CSVC"
                : "Thêm nhân viên CSVC"}
            </DialogTitle>
            <DialogDescription>
              Tạo hồ sơ nhân viên CSVC từ tài khoản role FACILITY đã có. Việc tạo tài khoản đăng nhập nằm ở module Quản lý tài khoản.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tài khoản nhân viên CSVC</Label>
              <select
                value={staffForm.user_id}
                onChange={(event) => handleChangeForm("user_id", event.target.value)}
                disabled={formMode === "edit"}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="">Chọn tài khoản role FACILITY</option>
                {facilityUserOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} - {user.full_name || user.email}
                  </option>
                ))}
              </select>

              {facilityUserOptions.length === 0 && formMode === "create" && (
                <p className="text-xs text-amber-600">
                  Hiện chưa có tài khoản FACILITY chưa được gắn hồ sơ nhân viên CSVC.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mã nhân viên CSVC</Label>
              <Input
                placeholder="VD: CSVC001"
                value={staffForm.staff_code}
                onChange={(event) => handleChangeForm("staff_code", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tòa nhà phụ trách</Label>
              <select
                value={staffForm.building_id}
                onChange={(event) => handleChangeForm("building_id", event.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="none">Chưa phân công</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                    {building.code ? ` (${building.code})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Có thể để “Chưa phân công”. Nhân viên sẽ được phân công tòa nhà sau.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <textarea
                rows={3}
                placeholder="VD: Phụ trách kiểm tra thiết bị phòng học buổi sáng"
                value={staffForm.note}
                onChange={(event) => handleChangeForm("note", event.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveStaff}
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : formMode === "edit"
                  ? "Lưu thay đổi"
                  : "Tạo nhân viên CSVC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewStaff)} onOpenChange={() => setViewStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết nhân viên CSVC</DialogTitle>
            <DialogDescription>
              Thông tin hồ sơ nhân viên cơ sở vật chất.
            </DialogDescription>
          </DialogHeader>

          {viewStaff && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Mã nhân viên" value={viewStaff.staff_code} />
              <DetailRow label="Họ và tên" value={viewStaff.full_name} />
              <DetailRow label="Tài khoản" value={viewStaff.username} />
              <DetailRow label="Email" value={viewStaff.email} />
              <DetailRow
                label="Tòa nhà phụ trách"
                value={getBuildingDisplay(viewStaff)}
              />
              <DetailRow label="Ghi chú" value={viewStaff.note || "Không có"} />
              <DetailRow
                label="Trạng thái"
                value={viewStaff.is_active ? "Đang hoạt động" : "Tạm khóa"}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStaff(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteStaff)} onOpenChange={() => setDeleteStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa nhân viên CSVC</DialogTitle>
            <DialogDescription>
              Hồ sơ nhân viên CSVC sẽ được xóa mềm khỏi danh sách quản lý. Tài khoản đăng nhập không bị xóa.
            </DialogDescription>
          </DialogHeader>

          {deleteStaff && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">
                {deleteStaff.staff_code} - {deleteStaff.full_name}
              </p>
              <p className="mt-1 text-gray-500">
                Phân công: {getBuildingDisplay(deleteStaff)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteStaff(null)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteStaff}
              disabled={saving}
            >
              {saving ? "Đang xóa..." : "Xóa hồ sơ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, tone }) => {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${toneClasses[tone] || toneClasses.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 border-b border-gray-50 py-2">
    <span className="text-xs font-bold text-gray-500">{label}:</span>
    <span className="col-span-2 text-xs text-gray-800">{value || "---"}</span>
  </div>
);

export default FacilityStaffPage;