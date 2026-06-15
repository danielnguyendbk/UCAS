import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, Search, UserRound } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { httpClient } from "@/services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const STATUS_LABEL = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Chưa kích hoạt",
  LOCKED: "Đã khóa",
};

const STATUS_BADGE = {
  ACTIVE: "bg-green-100 text-green-800 border-0",
  INACTIVE: "bg-gray-100 text-gray-700 border-0",
  LOCKED: "bg-red-100 text-red-800 border-0",
};

const FacilityStaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBuildings = async () => {
      const response = await httpClient.get("/api/categories/buildings").catch(() => ({ data: [] }));
      if (isMounted) setBuildings(getResponseData(response));
    };

    loadBuildings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStaff = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (selectedBuilding !== "all") params.buildingId = selectedBuilding;
        if (selectedStatus !== "all") params.status = selectedStatus;

        const response = await httpClient.get("/api/admin/facility-staff", { params });
        if (isMounted) setStaff(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setStaff([]);
          setError(err?.response?.data?.message || "Không thể tải danh sách nhân viên cơ sở vật chất.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [selectedBuilding, selectedStatus]);

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return staff;
    return staff.filter((item) => {
      const text = [
        item.staffCode,
        item.username,
        item.email,
        item.buildingCode,
        item.buildingName,
        item.note,
      ].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [searchTerm, staff]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedBuilding("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nhân viên cơ sở vật chất</h1>
          <p className="mt-1 text-gray-600">
            Quản lý nhân viên phụ trách tòa nhà và khu vực phòng học từ dữ liệu database.
          </p>
        </div>
        <Button disabled className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px_auto] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm theo mã nhân viên, tài khoản, email, tòa nhà..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Tòa nhà phụ trách</Label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tòa nhà</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={String(building.id)}>
                    {building.buildingName || building.name || building.buildingCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trạng thái</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Chưa kích hoạt</SelectItem>
                <SelectItem value="LOCKED">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={resetFilters}>Đặt lại</Button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải nhân viên...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/60">
                <TableRow>
                  <TableHead>Mã nhân viên</TableHead>
                  <TableHead>Tài khoản</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tòa nhà phụ trách</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? filteredStaff.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-mono text-xs font-semibold text-gray-900">{item.staffCode}</TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{item.username}</TableCell>
                    <TableCell className="text-sm text-gray-600">{item.email || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800">
                        {item.buildingName || "Chưa gán tòa nhà"}
                      </div>
                      <div className="text-xs text-gray-500">{item.buildingCode || ""}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-500">{item.note || "-"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[item.status] || "bg-gray-100 text-gray-700 border-0"}>
                        {STATUS_LABEL[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled>Sửa phân công</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <UserRound className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500">Không có nhân viên phù hợp.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            Hiển thị {filteredStaff.length} / {staff.length} nhân viên
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityStaffPage;
