import { useEffect, useMemo, useState } from "react";
import ExcelImportActions from "@/features/admin/components/ExcelImportActions";
import {
  Users,
  MapPin,
  Monitor,
  Plus,
  Search,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Snowflake,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { httpClient } from "@/services/httpClient";

const EMPTY_FORM = {
  id: null,
  building_id: "",
  floor_number: "",
  room_number: "",
  room_name: "",
  room_type: "LECTURE",
  capacity: "",
  has_projector: true,
  has_ac: true,
  is_active: true,
};

const ROOM_TYPE_LABELS = {
  LECTURE: "Phòng lý thuyết",
  LAB: "Phòng máy / thực hành",
  SEMINAR: "Phòng seminar",
  AUDITORIUM: "Hội trường",
};

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const getResponseData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};


const readBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
};

const getRoomStatusBadge = (room) => {
  if (!room.is_active || room.usage_status === "DISABLED") {
    return {
      label: "Bảo trì / Tạm ngưng",
      className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    };
  }

  if (room.is_in_use || room.usage_status === "IN_USE") {
    return {
      label: "Đang được sử dụng",
      className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    };
  }

  return {
    label: "Sẵn sàng sử dụng",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  };
};
const normalizeClassroom = (room) => {
  const isActive = readBoolean(room.is_active ?? room.isActive, true);
  const isInUse = readBoolean(room.is_in_use ?? room.isInUse, false);
  const usageStatus =
    room.usage_status ??
    room.usageStatus ??
    (!isActive ? "DISABLED" : isInUse ? "IN_USE" : "AVAILABLE");

  return {
    id: room.id,
    building_id: room.building_id ?? room.buildingId ?? "",
    floor_number: room.floor_number ?? room.floorNumber ?? "",
    room_number: room.room_number ?? room.roomNumber ?? "",
    room_name: room.room_name ?? room.roomName ?? "",
    room_type: room.room_type ?? room.roomType ?? "LECTURE",
    capacity: room.capacity ?? "",
    has_projector: readBoolean(room.has_projector ?? room.hasProjector, false),
    has_ac: readBoolean(room.has_ac ?? room.hasAc, false),
    is_active: isActive,
    is_in_use: isInUse,
    usage_status: usageStatus,
    usage_status_label:
      room.usage_status_label ??
      room.usageStatusLabel ??
      getRoomStatusBadge({
        is_active: isActive,
        is_in_use: isInUse,
        usage_status: usageStatus,
      }).label,
    building_name: room.building_name ?? room.buildingName ?? "",
    building_code: room.building_code ?? room.buildingCode ?? "",
  };
};

const normalizeBuilding = (building) => ({
  id: building.id,
  name: building.name ?? "",
  code: building.code ?? "",
});

const getRoomDisplayName = (room) => {
  if (room.room_name) return room.room_name;
  if (room.building_code && room.room_number) {
    return `${room.building_code}-${room.room_number}`;
  }
  return room.room_number || "Chưa đặt tên";
};

export const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Giữ card to: 3 cột x 2 hàng mỗi trang.
  const pageSize = 6;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [classroomForm, setClassroomForm] = useState(EMPTY_FORM);

  const [viewClassroom, setViewClassroom] = useState(null);
  const [deleteClassroom, setDeleteClassroom] = useState(null);

  const handleSearchChange = (event) => {
    setCurrentPage(1);
    setSearchTerm(event.target.value);
  };

  const handleBuildingFilterChange = (event) => {
    setCurrentPage(1);
    setSelectedBuildingId(event.target.value);
  };

    const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [classroomsResponse, buildingsResponse] = await Promise.all([
        httpClient.get("/api/classrooms"),
        httpClient.get("/api/buildings"),
      ]);

      const classroomData = getResponseData(classroomsResponse).map(normalizeClassroom);

      const buildingData = getResponseData(buildingsResponse)
        .map(normalizeBuilding)
        .sort((a, b) => {
          const codeA = String(a.code || a.name || "").toLowerCase();
          const codeB = String(b.code || b.name || "").toLowerCase();

          return codeA.localeCompare(codeB, "vi");
        });

      setClassrooms(classroomData);
      setBuildings(buildingData);
    } catch (error) {
      console.error("Không tải được dữ liệu phòng học:", error);
      setErrorMessage("Không tải được dữ liệu phòng học. Vui lòng kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredClassrooms = useMemo(() => {
  const keyword = normalizeSearchText(searchTerm);

  return classrooms.filter((room) => {
    const roomBuilding = buildings.find(
      (building) => String(building.id) === String(room.building_id),
    );

    const roomBuildingName = room.building_name || roomBuilding?.name || "";
    const roomBuildingCode = room.building_code || roomBuilding?.code || "";

    const matchesBuilding =
      selectedBuildingId === "ALL" ||
      String(room.building_id) === String(selectedBuildingId);

    const values = [
      getRoomDisplayName({
        ...room,
        building_name: roomBuildingName,
        building_code: roomBuildingCode,
      }),
      room.room_number,
      room.room_name,
      room.room_type,
      roomBuildingName,
      roomBuildingCode,
      ROOM_TYPE_LABELS[room.room_type],
      `${roomBuildingCode}-${room.room_number}`,
      `${roomBuildingCode}${room.room_number}`,
      `${roomBuildingName} ${room.room_number}`,
      `tòa ${roomBuildingCode}`,
      `toa ${roomBuildingCode}`,
      `tòa nhà ${roomBuildingCode}`,
      `toa nha ${roomBuildingCode}`,
      `phòng ${room.room_number}`,
      `phong ${room.room_number}`,
    ];

    const matchesKeyword =
      !keyword ||
      values.some((value) => normalizeSearchText(value).includes(keyword));

    return matchesBuilding && matchesKeyword;
  });
}, [classrooms, buildings, searchTerm, selectedBuildingId]);

  const totalPages = Math.max(1, Math.ceil(filteredClassrooms.length / pageSize));

  const paginatedClassrooms = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClassrooms.slice(startIndex, startIndex + pageSize);
  }, [filteredClassrooms, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBuildingId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  

  const selectedBuilding = buildings.find(
    (building) => String(building.id) === String(selectedBuildingId),
  );

  const openCreateDialog = () => {
    setFormMode("create");
    setClassroomForm({
      ...EMPTY_FORM,
      building_id: buildings[0]?.id ? String(buildings[0].id) : "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditDialog = (room) => {
    setFormMode("edit");
    setClassroomForm({
      id: room.id,
      building_id: room.building_id ? String(room.building_id) : "",
      floor_number: room.floor_number ? String(room.floor_number) : "",
      room_number: room.room_number || "",
      room_name: room.room_name || "",
      room_type: room.room_type || "LECTURE",
      capacity: room.capacity ? String(room.capacity) : "",
      has_projector: Boolean(room.has_projector),
      has_ac: Boolean(room.has_ac),
      is_active: Boolean(room.is_active),
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleChangeForm = (field, value) => {
    setClassroomForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!classroomForm.building_id) {
      return "Vui lòng chọn tòa nhà.";
    }

    if (!classroomForm.room_number.trim()) {
      return "Số phòng không được để trống.";
    }

    if (!classroomForm.floor_number || Number(classroomForm.floor_number) < 0) {
      return "Tầng phòng không hợp lệ.";
    }

    if (!classroomForm.capacity || Number(classroomForm.capacity) <= 0) {
      return "Sức chứa phải lớn hơn 0.";
    }

    if (!classroomForm.room_type) {
      return "Vui lòng chọn loại phòng.";
    }

    return "";
  };

  const buildPayload = () => {
    const selectedBuilding = buildings.find(
      (building) => String(building.id) === String(classroomForm.building_id),
    );

    const roomNumber = classroomForm.room_number.trim();
    const defaultRoomName = selectedBuilding?.code
      ? `${selectedBuilding.code}-${roomNumber}`
      : roomNumber;

    return {
      building_id: Number(classroomForm.building_id),
      floor_number: Number(classroomForm.floor_number),
      room_number: roomNumber,
      room_name: classroomForm.room_name.trim() || defaultRoomName,
      room_type: classroomForm.room_type,
      capacity: Number(classroomForm.capacity),
      has_projector: classroomForm.has_projector ? 1 : 0,
      has_ac: classroomForm.has_ac ? 1 : 0,
      is_active: classroomForm.is_active ? 1 : 0,
    };
  };

  const handleSaveClassroom = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = buildPayload();

      if (formMode === "edit" && classroomForm.id) {
        await httpClient.put(`/api/classrooms/${classroomForm.id}`, payload);
      } else {
        await httpClient.post("/api/classrooms", payload);
      }

      setIsFormOpen(false);
      setClassroomForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error("Không lưu được phòng học:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không lưu được phòng học. Vui lòng kiểm tra dữ liệu nhập.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!deleteClassroom?.id) return;

    setSaving(true);
    setErrorMessage("");

    try {
      await httpClient.delete(`/api/classrooms/${deleteClassroom.id}`);
      setDeleteClassroom(null);
      await loadData();
    } catch (error) {
      console.error("Không xóa được phòng học:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không xóa được phòng học. Phòng có thể đang được sử dụng trong lịch học.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderFacilities = (room) => {
    const facilities = [];

    if (room.has_projector) facilities.push("Máy chiếu");
    if (room.has_ac) facilities.push("Máy lạnh");

    if (facilities.length === 0) {
      return (
        <Badge variant="outline" className="text-xs">
          Chưa có tiện ích
        </Badge>
      );
    }

    return facilities.map((facility) => (
      <Badge key={facility} variant="outline" className="text-xs">
        {facility}
      </Badge>
    ));
  };

  const renderPageNumbers = () => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    const visiblePages = pages.filter((page) => {
      if (totalPages <= 5) return true;
      if (page === 1 || page === totalPages) return true;
      return Math.abs(page - currentPage) <= 1;
    });

    return visiblePages.map((page, index) => {
      const previousPage = visiblePages[index - 1];
      const shouldShowDots = previousPage && page - previousPage > 1;

      return (
        <div key={page} className="flex items-center gap-2">
          {shouldShowDots && <span className="text-sm text-gray-400">...</span>}
          <Button
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className={page === currentPage ? "bg-blue-600 hover:bg-blue-700" : ""}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        </div>
      );
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Phòng học</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh sách phòng học, sức chứa và cơ sở vật chất
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExcelImportActions type="classroom" onImported={loadData} />

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm phòng học
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_120px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm theo tên phòng, số phòng, loại phòng..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>

          <select
            value={selectedBuildingId}
            onChange={handleBuildingFilterChange}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Tất cả tòa nhà</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
                
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setSelectedBuildingId("ALL");
            }}
          >
            Xóa lọc
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>
            Hiển thị{" "}
            <span className="font-semibold text-gray-900">
              {filteredClassrooms.length}
            </span>{" "}
            / {classrooms.length} phòng
          </span>

          {selectedBuildingId !== "ALL" && (
            <Badge variant="outline">
              Tòa nhà: {selectedBuilding?.name || "Đang lọc"}
            </Badge>
          )}

          {searchTerm.trim() && (
            <Badge variant="outline">Từ khóa: {searchTerm.trim()}</Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-10 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách phòng học...
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Không tìm thấy phòng học nào.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedClassrooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 truncate">
                        {getRoomDisplayName(room)}
                      </h3>

                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {room.building_name || "Chưa có tòa nhà"}
                          {room.floor_number !== ""
                            ? `, tầng ${room.floor_number}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const statusBadge = getRoomStatusBadge(room);

                      return (
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-900 font-medium">Loại phòng:</span>
                      <span className="text-gray-600">
                        {ROOM_TYPE_LABELS[room.room_type] || room.room_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-900 font-medium">Sức chứa:</span>
                      <span className="text-gray-600">{room.capacity} sinh viên</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Monitor className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-medium">Thiết bị:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {renderFacilities(room)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Snowflake className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-900 font-medium">Mã phòng:</span>
                      <span className="text-gray-600">{room.room_number}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-200 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewClassroom(room)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Xem
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(room)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Sửa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteClassroom(room)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClassrooms.length > pageSize && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Trang{" "}
                <span className="font-semibold text-gray-900">{currentPage}</span>
                /
                <span className="font-semibold text-gray-900">{totalPages}</span>
                {" · "}
                {filteredClassrooms.length} phòng phù hợp
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Trước
                </Button>

                {renderPageNumbers()}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Cập nhật phòng học" : "Thêm phòng học"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin phòng học theo dữ liệu cơ sở vật chất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="building">Tòa nhà</Label>
                <select
                  id="building"
                  value={classroomForm.building_id}
                  onChange={(event) =>
                    handleChangeForm("building_id", event.target.value)
                  }
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Chọn tòa nhà</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                      {building.code ? ` (${building.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor-number">Tầng</Label>
                <Input
                  id="floor-number"
                  type="number"
                  min="0"
                  placeholder="VD: 3"
                  value={classroomForm.floor_number}
                  onChange={(event) =>
                    handleChangeForm("floor_number", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="room-number">Số phòng</Label>
                <Input
                  id="room-number"
                  placeholder="VD: 301"
                  value={classroomForm.room_number}
                  onChange={(event) =>
                    handleChangeForm("room_number", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-name">Tên phòng</Label>
                <Input
                  id="room-name"
                  placeholder="VD: A-301"
                  value={classroomForm.room_name}
                  onChange={(event) =>
                    handleChangeForm("room_name", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="capacity">Sức chứa</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="VD: 60"
                  value={classroomForm.capacity}
                  onChange={(event) =>
                    handleChangeForm("capacity", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-type">Loại phòng</Label>
                <select
                  id="room-type"
                  value={classroomForm.room_type}
                  onChange={(event) =>
                    handleChangeForm("room_type", event.target.value)
                  }
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="LECTURE">Phòng lý thuyết</option>
                  <option value="LAB">Phòng máy / thực hành</option>
                  <option value="SEMINAR">Phòng seminar</option>
                  <option value="AUDITORIUM">Hội trường</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={classroomForm.has_projector}
                  onChange={(event) =>
                    handleChangeForm("has_projector", event.target.checked)
                  }
                />
                Có máy chiếu
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={classroomForm.has_ac}
                  onChange={(event) =>
                    handleChangeForm("has_ac", event.target.checked)
                  }
                />
                Có máy lạnh
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={classroomForm.is_active}
                  onChange={(event) =>
                    handleChangeForm("is_active", event.target.checked)
                  }
                />
                Cho phép sử dụng phòng
              </label>
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
              onClick={handleSaveClassroom}
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : formMode === "edit"
                  ? "Lưu thay đổi"
                  : "Tạo phòng học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewClassroom)} onOpenChange={() => setViewClassroom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết phòng học</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết phòng học trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          {viewClassroom && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Tên phòng:</span>
                <span className="col-span-2">{getRoomDisplayName(viewClassroom)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Số phòng:</span>
                <span className="col-span-2">{viewClassroom.room_number}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Tòa nhà:</span>
                <span className="col-span-2">
                  {viewClassroom.building_name || "Chưa có"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Tầng:</span>
                <span className="col-span-2">{viewClassroom.floor_number}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Loại phòng:</span>
                <span className="col-span-2">
                  {ROOM_TYPE_LABELS[viewClassroom.room_type] || viewClassroom.room_type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Sức chứa:</span>
                <span className="col-span-2">{viewClassroom.capacity} sinh viên</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Thiết bị:</span>
                <span className="col-span-2">
                  {viewClassroom.has_projector ? "Máy chiếu" : "Không có máy chiếu"}
                  {" · "}
                  {viewClassroom.has_ac ? "Máy lạnh" : "Không có máy lạnh"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Trạng thái:</span>
                <span className="col-span-2">
                  {viewClassroom.usage_status_label || getRoomStatusBadge(viewClassroom).label}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewClassroom(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteClassroom)}
        onOpenChange={() => setDeleteClassroom(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa phòng học</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa phòng học này không? Nếu phòng đang được dùng trong lịch học, hệ thống có thể không cho xóa.
            </DialogDescription>
          </DialogHeader>

          {deleteClassroom && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">
                {getRoomDisplayName(deleteClassroom)}
              </p>
              <p className="mt-1 text-gray-500">
                Tòa nhà: {deleteClassroom.building_name || "Chưa có"} · Sức chứa:{" "}
                {deleteClassroom.capacity}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteClassroom(null)}
              disabled={saving}
            >
              Hủy
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteClassroom}
              disabled={saving}
            >
              {saving ? "Đang xóa..." : "Xóa phòng học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};