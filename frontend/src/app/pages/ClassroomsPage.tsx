import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Users, MapPin, Monitor } from "lucide-react";
import { getApi, postApi, putApi } from "../../services/api";

type RoomType = "LECTURE" | "LAB" | "SEMINAR" | "AUDITORIUM";

type BackendClassroom = {
  id: number;
  building_id: number;
  building_name?: string;
  floor_number?: number | null;
  room_number: string;
  room_name?: string | null;
  room_type?: RoomType;
  capacity: number;
  has_projector?: number;
  has_ac?: number;
  is_active?: number;
};

type BackendBuilding = {
  id: number;
  name: string;
};

type Classroom = {
  id: number;
  buildingId: number;
  roomNumber: string;
  roomName: string;
  name: string;
  capacity: number;
  building: string;
  floor: number | null;
  facilities: string[];
  roomType: string;
  roomTypeCode: RoomType;
  hasProjector: boolean;
  hasAc: boolean;
  isActive: boolean;
};

type ClassroomForm = {
  building_id: string;
  floor_number: string;
  room_number: string;
  room_name: string;
  room_type: RoomType;
  capacity: string;
  has_projector: boolean;
  has_ac: boolean;
  is_active: boolean;
};

const initialFormData: ClassroomForm = {
  building_id: "",
  floor_number: "",
  room_number: "",
  room_name: "",
  room_type: "LECTURE",
  capacity: "",
  has_projector: false,
  has_ac: false,
  is_active: true,
};

function getRoomTypeLabel(type?: string) {
  switch (type) {
    case "LECTURE":
      return "Phòng lý thuyết";
    case "LAB":
      return "Phòng thực hành";
    case "SEMINAR":
      return "Phòng seminar";
    case "AUDITORIUM":
      return "Hội trường";
    default:
      return "Không xác định";
  }
}

function mapClassroomFromBackend(room: BackendClassroom): Classroom {
  const facilities: string[] = [];
  const roomTypeCode: RoomType = room.room_type || "LECTURE";
  const hasProjector = Number(room.has_projector ?? 0) === 1;
  const hasAc = Number(room.has_ac ?? 0) === 1;

  if (hasProjector) {
    facilities.push("Máy chiếu");
  }

  if (hasAc) {
    facilities.push("Điều hòa");
  }

  const roomName = room.room_name || `Phòng ${room.room_number}`;

  return {
    id: room.id,
    buildingId: room.building_id,
    roomNumber: room.room_number,
    roomName,
    name: roomName,
    capacity: Number(room.capacity || 0),
    building: room.building_name || `ID ${room.building_id}`,
    floor: room.floor_number ?? null,
    facilities,
    roomType: getRoomTypeLabel(roomTypeCode),
    roomTypeCode,
    hasProjector,
    hasAc,
    isActive: Number(room.is_active ?? 1) === 1,
  };
}

export const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [buildings, setBuildings] = useState<BackendBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState<number | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClassroomForm>({
    ...initialFormData,
  });

  const isEditing = editingClassroomId !== null;

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setEditingClassroomId(null);
  };

  const loadClassrooms = () => {
    setLoading(true);
    setError("");

    getApi<BackendClassroom[]>("/classrooms")
      .then((data) => {
        const mappedClassrooms = data.map(mapClassroomFromBackend);
        setClassrooms(mappedClassrooms);
      })
      .catch((err) => {
        console.error("Failed to load classrooms:", err);
        setError("Không thể tải danh sách phòng học từ backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadBuildings = () => {
    setLoadingBuildings(true);

    getApi<BackendBuilding[]>("/buildings")
      .then((data) => {
        setBuildings(data);
      })
      .catch((err) => {
        console.error("Failed to load buildings:", err);
      })
      .finally(() => {
        setLoadingBuildings(false);
      });
  };

  useEffect(() => {
    loadClassrooms();
    loadBuildings();
  }, []);

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (room: Classroom) => {
    setEditingClassroomId(room.id);
    setFormData({
      building_id: String(room.buildingId),
      floor_number: room.floor !== null ? String(room.floor) : "",
      room_number: room.roomNumber,
      room_name: room.roomName,
      room_type: room.roomTypeCode,
      capacity: String(room.capacity),
      has_projector: room.hasProjector,
      has_ac: room.hasAc,
      is_active: room.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSaveClassroom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.building_id || !formData.room_number || !formData.capacity) {
      alert("Vui lòng nhập đủ Tòa nhà, Số phòng và Sức chứa.");
      return;
    }

    const capacity = Number(formData.capacity);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      alert("Sức chứa phải là số lớn hơn 0.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        building_id: Number(formData.building_id),
        floor_number: formData.floor_number
          ? Number(formData.floor_number)
          : null,
        room_number: formData.room_number.trim(),
        room_name: formData.room_name.trim() || null,
        room_type: formData.room_type,
        capacity,
        has_projector: formData.has_projector ? 1 : 0,
        has_ac: formData.has_ac ? 1 : 0,
        is_active: formData.is_active ? 1 : 0,
      };

      console.log(isEditing ? "Update classroom payload:" : "Create classroom payload:", payload);

      if (isEditing) {
        await putApi(`/classrooms/${editingClassroomId}`, payload);
      } else {
        await postApi<BackendClassroom>("/classrooms", payload);
      }

      closeForm();
      loadClassrooms();
    } catch (err) {
      console.error("Failed to save classroom:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể lưu phòng học. Vui lòng kiểm tra backend."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Đang tải danh sách phòng học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">Lỗi tải dữ liệu</p>
          <p className="text-red-600 mt-1">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            Hãy kiểm tra backend có đang chạy ở http://localhost:3000 không.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Phòng học</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh sách phòng học và trang thiết bị
          </p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openAddForm}>
          Thêm phòng học
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditing ? "Sửa phòng học" : "Thêm phòng học mới"}
            </h2>

            <form
              onSubmit={handleSaveClassroom}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tòa nhà
                </label>

                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.building_id}
                  onChange={(e) =>
                    setFormData({ ...formData, building_id: e.target.value })
                  }
                  required
                >
                  <option value="">
                    {loadingBuildings ? "Đang tải tòa nhà..." : "Chọn tòa nhà"}
                  </option>

                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tầng
                </label>

                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.floor_number}
                  onChange={(e) =>
                    setFormData({ ...formData, floor_number: e.target.value })
                  }
                  placeholder="Ví dụ: 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số phòng
                </label>

                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                  placeholder="Ví dụ: A201"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phòng
                </label>

                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.room_name}
                  onChange={(e) =>
                    setFormData({ ...formData, room_name: e.target.value })
                  }
                  placeholder="Ví dụ: Phòng học A201"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại phòng
                </label>

                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.room_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      room_type: e.target.value as RoomType,
                    })
                  }
                >
                  <option value="LECTURE">Phòng lý thuyết</option>
                  <option value="LAB">Phòng thực hành</option>
                  <option value="SEMINAR">Phòng seminar</option>
                  <option value="AUDITORIUM">Hội trường</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sức chứa
                </label>

                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Ví dụ: 60"
                  required
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.has_projector}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        has_projector: e.target.checked,
                      })
                    }
                  />
                  Có máy chiếu
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.has_ac}
                    onChange={(e) =>
                      setFormData({ ...formData, has_ac: e.target.checked })
                    }
                  />
                  Có điều hòa
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Đang hoạt động
                </label>
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Hủy
                </Button>

                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting
                    ? isEditing
                      ? "Đang cập nhật..."
                      : "Đang thêm..."
                    : isEditing
                    ? "Cập nhật phòng học"
                    : "Lưu phòng học"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {classrooms.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-gray-600">Chưa có dữ liệu phòng học.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {room.name}
                    </h3>

                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      Tòa {room.building}
                      {room.floor !== null ? `, Tầng ${room.floor}` : ""}
                    </div>
                  </div>

                  <Badge
                    className={
                      room.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {room.isActive ? "Hoạt động" : "Tạm ngưng"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 font-medium">
                      Sức chứa:
                    </span>
                    <span className="text-gray-600">
                      {room.capacity} sinh viên
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 font-medium">
                      Loại phòng:
                    </span>
                    <span className="text-gray-600">{room.roomType}</span>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Monitor className="w-4 h-4 text-gray-500 mt-0.5" />

                    <div>
                      <span className="text-gray-900 font-medium">
                        Thiết bị:
                      </span>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.facilities.length > 0 ? (
                          room.facilities.map((facility, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {facility}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs">
                            Chưa có thông tin thiết bị
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditForm(room)}
                  >
                    Sửa
                  </Button>

                  <Button variant="outline" size="sm" className="flex-1">
                    Xem lịch
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};