import { useEffect, useMemo, useState } from "react";
import { CheckCircle, History, Send, Upload, Wrench, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS } from "@/constants/navigation";
import {
  ISSUE_CATEGORIES,
  PRIORITY_LEVELS,
} from "@/features/shared/constants/maintenanceFormConstants";
import { httpClient } from "@/services/httpClient";

const initialForm = {
  issueTitle: "",
  buildingId: "",
  classroomId: "",
  issueCategory: "",
  customCategory: "",
  severityLevel: "MEDIUM",
  description: "",
  contactPhone: "",
};

const getResponseData = (response) => response.data?.data || response.data;

const MaintenanceRequestForm = ({
  apiBasePath,
  title = "Yêu cầu sửa chữa",
  subtitle = "Báo cáo sự cố cơ sở vật chất phòng học",
  cardTitle = "Thông tin sự cố",
  historyPath,
  accent = "orange",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [buildings, setBuildings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const accentButton =
    accent === "blue"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-orange-600 hover:bg-orange-700";
  const accentIcon = accent === "blue" ? "text-blue-600" : "text-orange-500";
  const accentBg = accent === "blue" ? "bg-blue-50" : "bg-orange-50";

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : "—";
  const requesterName = user?.name || user?.username || "—";

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [buildingRes, classroomRes] = await Promise.all([
          httpClient.get("/api/categories/buildings"),
          httpClient.get("/api/categories/classrooms"),
        ]);
        setBuildings(buildingRes.data?.data || []);
        setClassrooms(classroomRes.data?.data || []);
      } catch (error) {
        console.error("Lỗi tải danh mục tòa nhà/phòng:", error);
      }
    };
    loadCategories();
  }, []);

  const roomsInBuilding = useMemo(() => {
    if (!form.buildingId) return [];
    return classrooms.filter(
      (room) => String(room.buildingId) === String(form.buildingId),
    );
  }, [classrooms, form.buildingId]);

  const selectedRoom = useMemo(
    () =>
      classrooms.find((room) => String(room.id) === String(form.classroomId)),
    [classrooms, form.classroomId],
  );

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmittedRequest(null);
  };

  const clearSelectedImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    clearSelectedImage();
    setSubmittedRequest(null);
  };

  const buildRoomCode = () => {
    if (selectedRoom) {
      const buildingCode =
        selectedRoom.buildingCode ||
        buildings.find((b) => String(b.id) === String(selectedRoom.buildingId))
          ?.code ||
        "";
      const roomNumber = selectedRoom.roomNumber || selectedRoom.roomName || "";
      if (buildingCode && roomNumber) {
        return `${buildingCode}-${roomNumber}`;
      }
      return selectedRoom.roomName || roomNumber;
    }
    return "";
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.issueTitle.trim()) {
      nextErrors.issueTitle = "Vui lòng nhập tiêu đề yêu cầu.";
    }
    if (!form.buildingId) {
      nextErrors.buildingId = "Vui lòng chọn tòa nhà.";
    }
    if (!form.classroomId) {
      nextErrors.classroomId = "Vui lòng chọn phòng.";
    }
    if (!form.issueCategory) {
      nextErrors.issueCategory = "Vui lòng chọn loại sự cố.";
    }
    if (form.issueCategory === "OTHER" && !form.customCategory.trim()) {
      nextErrors.customCategory = "Vui lòng nhập loại sự cố cụ thể.";
    }
    if (!form.severityLevel) {
      nextErrors.severityLevel = "Vui lòng chọn mức độ ưu tiên.";
    }
    if (!form.description.trim()) {
      nextErrors.description = "Vui lòng nhập mô tả sự cố.";
    } else if (form.description.trim().length < 10) {
      nextErrors.description = "Mô tả phải có ít nhất 10 ký tự.";
    }
    return nextErrors;
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Vui lòng chọn file ảnh." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Ảnh không được vượt quá 5MB." }));
      return;
    }

    clearSelectedImage();
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: "" }));
    setSubmittedRequest(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const roomCode = buildRoomCode();
    if (!roomCode) {
      setErrors((prev) => ({
        ...prev,
        classroomId: "Không xác định được mã phòng.",
      }));
      return;
    }

    let description = form.description.trim();
    if (form.issueCategory === "OTHER" && form.customCategory.trim()) {
      description = `Loại sự cố: ${form.customCategory.trim()}\n${description}`;
    }
    if (form.contactPhone.trim()) {
      description = `${description}\n\nLiên hệ: ${form.contactPhone.trim()}`;
    }

    const issueTitle = form.issueTitle.trim();

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadResponse = await httpClient.post(
          "/api/maintenance-files",
          uploadData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        imageUrl = getResponseData(uploadResponse)?.imageUrl || null;
      }

      const response = await httpClient.post(apiBasePath, {
        roomCode,
        issueCategory: form.issueCategory,
        severityLevel: form.severityLevel,
        issueTitle,
        description,
        imageUrl,
      });

      const createdRequest = getResponseData(response);
      setForm(initialForm);
      clearSelectedImage();
      setSubmittedRequest(createdRequest);
      setErrors({});
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi gửi yêu cầu sửa chữa.";
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {historyPath && (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(historyPath)}
            className="w-fit"
          >
            <History className="h-4 w-4" />
            Lịch sử sửa chữa
          </Button>
        )}
      </div>

      {submittedRequest && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="font-semibold">Yêu cầu đã được gửi thành công.</p>
            <p className="mt-0.5 text-xs text-green-700">
              Mã yêu cầu: {submittedRequest.requestCode}. Bộ phận phụ trách sẽ
              tiếp nhận và xử lý.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl">
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="pb-4 border-b border-gray-50">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${accentBg}`}
              >
                <Wrench className={`h-4 w-4 ${accentIcon}`} />
              </span>
              {cardTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errors.submit}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Thông tin người gửi
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Vai trò</Label>
                    <Input
                      readOnly
                      value={roleLabel}
                      className="h-10 bg-gray-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Họ tên</Label>
                    <Input
                      readOnly
                      value={requesterName}
                      className="h-10 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Chi tiết sự cố
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>
                      Tiêu đề yêu cầu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.issueTitle}
                      onChange={(event) =>
                        updateForm({ issueTitle: event.target.value })
                      }
                      placeholder="VD: Máy chiếu không lên nguồn"
                      className={`h-10 ${errors.issueTitle ? "border-red-400" : ""}`}
                    />
                    {errors.issueTitle && (
                      <p className="text-xs text-red-600">{errors.issueTitle}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Tòa nhà <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.buildingId}
                      onValueChange={(value) =>
                        updateForm({ buildingId: value, classroomId: "" })
                      }
                    >
                      <SelectTrigger
                        className={`h-10 ${errors.buildingId ? "border-red-400" : ""}`}
                      >
                        <SelectValue placeholder="Chọn tòa nhà" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem
                            key={building.id}
                            value={String(building.id)}
                          >
                            {building.name || building.buildingName || building.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.buildingId && (
                      <p className="text-xs text-red-600">{errors.buildingId}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Phòng <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.classroomId}
                      onValueChange={(value) =>
                        updateForm({ classroomId: value })
                      }
                      disabled={!form.buildingId}
                    >
                      <SelectTrigger
                        className={`h-10 ${errors.classroomId ? "border-red-400" : ""}`}
                      >
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomsInBuilding.map((room) => (
                          <SelectItem key={room.id} value={String(room.id)}>
                            {room.roomName ||
                              `${room.buildingCode || ""}-${room.roomNumber || ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.classroomId && (
                      <p className="text-xs text-red-600">{errors.classroomId}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Loại sự cố <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.issueCategory}
                      onValueChange={(value) =>
                        updateForm({
                          issueCategory: value,
                          customCategory:
                            value === "OTHER" ? form.customCategory : "",
                        })
                      }
                    >
                      <SelectTrigger
                        className={`h-10 ${errors.issueCategory ? "border-red-400" : ""}`}
                      >
                        <SelectValue placeholder="Chọn loại sự cố" />
                      </SelectTrigger>
                      <SelectContent>
                        {ISSUE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.issueCategory && (
                      <p className="text-xs text-red-600">
                        {errors.issueCategory}
                      </p>
                    )}
                  </div>

                  {form.issueCategory === "OTHER" && (
                    <div className="space-y-1.5">
                      <Label>
                        Loại sự cố cụ thể{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.customCategory}
                        onChange={(event) =>
                          updateForm({ customCategory: event.target.value })
                        }
                        placeholder="Nhập loại sự cố"
                        className={`h-10 ${errors.customCategory ? "border-red-400" : ""}`}
                      />
                      {errors.customCategory && (
                        <p className="text-xs text-red-600">
                          {errors.customCategory}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>
                      Mức độ ưu tiên <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.severityLevel}
                      onValueChange={(value) =>
                        updateForm({ severityLevel: value })
                      }
                    >
                      <SelectTrigger
                        className={`h-10 ${errors.severityLevel ? "border-red-400" : ""}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map((severity) => (
                          <SelectItem key={severity.value} value={severity.value}>
                            {severity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.severityLevel && (
                      <p className="text-xs text-red-600">
                        {errors.severityLevel}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label>
                      Mô tả chi tiết <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateForm({ description: event.target.value })
                      }
                      rows={5}
                      placeholder="Mô tả tình trạng hư hỏng, thời điểm phát hiện, ảnh hưởng..."
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                        errors.description ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-600">{errors.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Số điện thoại / Ghi chú liên hệ</Label>
                    <Input
                      value={form.contactPhone}
                      onChange={(event) =>
                        updateForm({ contactPhone: event.target.value })
                      }
                      placeholder="VD: 0912345678"
                      className="h-10"
                    />
                    <p className="text-[11px] text-gray-400">
                      Sẽ được ghi vào phần mô tả khi gửi yêu cầu.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Ảnh minh chứng</Label>
                    {!imagePreviewUrl ? (
                      <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:bg-gray-100">
                        <Upload className="mb-2 h-7 w-7 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Chọn ảnh từ máy
                        </span>
                        <span className="mt-1 text-xs text-gray-400">
                          JPG, PNG, GIF, WEBP — tối đa 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start">
                          <img
                            src={imagePreviewUrl}
                            alt="Ảnh minh chứng"
                            className="h-40 w-full rounded-lg border border-gray-100 object-cover md:w-56"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {imageFile?.name}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={clearSelectedImage}
                            >
                              <X className="h-3.5 w-3.5" />
                              Xóa ảnh
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.image && (
                      <p className="text-xs text-red-600">{errors.image}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`${accentButton} gap-2`}
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy / Làm mới
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenanceRequestForm;
