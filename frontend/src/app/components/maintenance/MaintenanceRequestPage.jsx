import { useState } from "react";
import { CheckCircle, History, Send, Upload, Wrench, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { httpClient } from "@/services/httpClient";
import { ISSUE_CATEGORIES, SEVERITY_LEVELS } from "./maintenanceConstants";

const initialForm = {
  roomCode: "",
  issueCategory: "",
  severityLevel: "MEDIUM",
  issueTitle: "",
  description: "",
};

const getResponseData = (response) => response.data?.data || response.data;

const MaintenanceRequestPage = ({
  apiBasePath,
  title = "Yêu cầu sửa chữa",
  subtitle = "Báo cáo sự cố cơ sở vật chất phòng học",
  cardTitle = "Thông tin sự cố",
  historyPath,
  accent = "orange",
}) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
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

  const resetFormAfterSubmit = () => {
    setForm(initialForm);
    clearSelectedImage();
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.roomCode.trim()) nextErrors.roomCode = "Vui lòng nhập mã phòng.";
    if (!form.issueCategory) nextErrors.issueCategory = "Vui lòng chọn loại sự cố.";
    if (!form.severityLevel) nextErrors.severityLevel = "Vui lòng chọn mức độ.";
    if (!form.description.trim()) nextErrors.description = "Vui lòng nhập mô tả sự cố.";
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
        roomCode: form.roomCode.trim(),
        issueCategory: form.issueCategory,
        severityLevel: form.severityLevel,
        issueTitle: form.issueTitle.trim() || null,
        description: form.description.trim(),
        imageUrl,
      });

      const createdRequest = getResponseData(response);
      resetFormAfterSubmit();
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
              Mã yêu cầu: {submittedRequest.requestCode}. Bộ phận phụ trách sẽ tiếp nhận và xử lý.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${accentBg}`}>
                <Wrench className={`h-4 w-4 ${accentIcon}`} />
              </span>
              {cardTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errors.submit}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Mã phòng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.roomCode}
                    onChange={(event) => updateForm({ roomCode: event.target.value })}
                    placeholder="VD: A101, A-A101, B102"
                    className={`h-10 ${errors.roomCode ? "border-red-400" : ""}`}
                  />
                  {errors.roomCode && (
                    <p className="text-xs text-red-600">{errors.roomCode}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Loại sự cố <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.issueCategory}
                    onValueChange={(value) => updateForm({ issueCategory: value })}
                  >
                    <SelectTrigger className={`h-10 ${errors.issueCategory ? "border-red-400" : ""}`}>
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
                    <p className="text-xs text-red-600">{errors.issueCategory}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Mức độ</Label>
                  <Select
                    value={form.severityLevel}
                    onValueChange={(value) => updateForm({ severityLevel: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((severity) => (
                        <SelectItem key={severity.value} value={severity.value}>
                          {severity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={form.issueTitle}
                    onChange={(event) => updateForm({ issueTitle: event.target.value })}
                    placeholder="VD: Máy chiếu không lên nguồn"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>
                    Mô tả chi tiết <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateForm({ description: event.target.value })}
                    rows={5}
                    placeholder="Mô tả tình trạng hư hỏng, thời điểm phát hiện, ảnh hưởng đến lớp học hoặc người sử dụng..."
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                      errors.description ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600">{errors.description}</p>
                  )}
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
                        JPG, PNG, GIF, WEBP - tối đa 5MB
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
                          <p className="mt-1 text-xs text-gray-500">
                            {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ""}
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

              <div className="flex flex-wrap gap-3 pt-1">
                <Button type="submit" disabled={submitting} className={`${accentButton} gap-2`}>
                  <Send className="h-4 w-4" />
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Xóa form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MaintenanceRequestPage;
