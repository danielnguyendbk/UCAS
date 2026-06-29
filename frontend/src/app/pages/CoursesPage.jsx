import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import ExcelImportActions from "@/features/admin/components/ExcelImportActions";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { httpClient } from "@/services/httpClient";

const readCourseActive = (course) => {
  const value = course.is_active ?? course.isActive ?? course.active;
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
};

const EMPTY_FORM = {
  id: null,
  department_id: "",
  course_code: "",
  course_name: "",
  credits: "",
  required_room_type: "LECTURE",
  description: "",
};

const ROOM_TYPE_LABELS = {
  LECTURE: "Phòng lý thuyết",
  LAB: "Phòng máy / thực hành",
  SEMINAR: "Phòng seminar",
  AUDITORIUM: "Hội trường",
};

const getResponseData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

const normalizeCourse = (course) => ({
  id: course.id,
  department_id: course.department_id ?? course.departmentId ?? "",
  course_code: course.course_code ?? course.courseCode ?? "",
  course_name: course.course_name ?? course.courseName ?? "",
  credits: course.credits ?? "",
  required_room_type:
    course.required_room_type ?? course.requiredRoomType ?? "LECTURE",
  description: course.description ?? "",
  department_name:
    course.department_name ?? course.departmentName ?? course.department ?? "",
  department_code: course.department_code ?? course.departmentCode ?? "",  is_deleted: course.is_deleted ?? course.isDeleted ?? 0,
  is_active: readCourseActive(course),
  isActive: readCourseActive(course),
});

const normalizeDepartment = (department) => ({
  id: department.id,
  name: department.name ?? department.department_name ?? "",
  code: department.code ?? department.department_code ?? "",
});

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [courseForm, setCourseForm] = useState(EMPTY_FORM);

  const [viewCourse, setViewCourse] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [coursesResponse, departmentsResponse] = await Promise.all([
        httpClient.get("/api/courses"),
        httpClient.get("/api/departments"),
      ]);

      setCourses(getResponseData(coursesResponse).map(normalizeCourse));
      setDepartments(getResponseData(departmentsResponse).map(normalizeDepartment));
    } catch (error) {
      console.error("Không tải được dữ liệu môn học:", error);
      setErrorMessage("Không tải được dữ liệu môn học. Vui lòng kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCourses = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return courses;

    return courses.filter((course) => {
      const values = [
        course.course_code,
        course.course_name,
        course.department_name,
        course.department_code,
        course.required_room_type,
        course.description,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(keyword),
      );
    });
  }, [courses, searchTerm]);

  const openCreateDialog = () => {
    setFormMode("create");
    setCourseForm({
      ...EMPTY_FORM,
      department_id: departments[0]?.id ? String(departments[0].id) : "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditDialog = (course) => {
    setFormMode("edit");
    setCourseForm({
      id: course.id,
      department_id: course.department_id ? String(course.department_id) : "",
      course_code: course.course_code || "",
      course_name: course.course_name || "",
      credits: course.credits ? String(course.credits) : "",
      required_room_type: course.required_room_type || "LECTURE",
      description: course.description || "",
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleChangeForm = (field, value) => {
    setCourseForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!courseForm.course_code.trim()) {
      return "Mã môn học không được để trống.";
    }

    if (!courseForm.course_name.trim()) {
      return "Tên môn học không được để trống.";
    }

    if (!courseForm.department_id) {
      return "Vui lòng chọn bộ môn/khoa phụ trách.";
    }

    if (!courseForm.credits || Number(courseForm.credits) <= 0) {
      return "Số tín chỉ phải lớn hơn 0.";
    }

    if (!courseForm.required_room_type) {
      return "Vui lòng chọn loại phòng yêu cầu.";
    }

    return "";
  };

  const buildPayload = () => ({
    department_id: Number(courseForm.department_id),
    course_code: courseForm.course_code.trim().toUpperCase(),
    course_name: courseForm.course_name.trim(),
    credits: Number(courseForm.credits),
    required_room_type: courseForm.required_room_type,
    description: courseForm.description?.trim() || null,
    is_deleted: 0,
  });

  const handleSaveCourse = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const payload = buildPayload();

      if (formMode === "edit" && courseForm.id) {
        await httpClient.put(`/api/courses/${courseForm.id}`, payload);
      } else {
        await httpClient.post("/api/courses", payload);
      }

      setIsFormOpen(false);
      setCourseForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error("Không lưu được môn học:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Không lưu được môn học. Vui lòng kiểm tra dữ liệu nhập.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourse?.id) return;

    setSaving(true);
    setErrorMessage("");

    try {
      await httpClient.delete(`/api/courses/${deleteCourse.id}`);
      setDeleteCourse(null);
      await loadData();
    } catch (error) {
      console.error("Không xóa được môn học:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          "Không xóa được môn học. Môn học có thể đang được sử dụng bởi lớp học phần.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Môn học</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục môn học và thông tin đào tạo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExcelImportActions type="course" onImported={loadData} />

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm môn học
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm theo mã môn, tên môn, bộ môn..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã môn</TableHead>
                <TableHead>Tên môn học</TableHead>
                <TableHead>Bộ môn/Khoa</TableHead>
                <TableHead className="text-center">Tín chỉ</TableHead>
                <TableHead>Loại phòng yêu cầu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách môn học...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-500">
                    Không tìm thấy môn học nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      {course.course_code}
                    </TableCell>
                    <TableCell>{course.course_name}</TableCell>
                    <TableCell>
                      {course.department_name || course.department_code || "Chưa có"}
                    </TableCell>
                    <TableCell className="text-center">
                      {course.credits}
                    </TableCell>
                    <TableCell>
                      {ROOM_TYPE_LABELS[course.required_room_type] ||
                        course.required_room_type}
                    </TableCell>
                    <TableCell>
  {(() => {
    const isActive =
      course.is_active === true ||
      course.is_active === 1 ||
      course.is_active === "1" ||
      course.is_active === "true" ||
      course.isActive === true ||
      course.isActive === 1 ||
      course.isActive === "1" ||
      course.isActive === "true";

    return (
      <Badge
        className={
          isActive
            ? "bg-green-100 text-green-700 hover:bg-green-100"
            : "bg-gray-100 text-gray-600 hover:bg-gray-100"
        }
      >
        {isActive ? "Đang sử dụng" : "Chưa sử dụng"}
      </Badge>
    );
  })()}
</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewCourse(course)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteCourse(course)}
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
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredCourses.length} / {courses.length} môn học
          </div>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Cập nhật môn học" : "Thêm môn học"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin môn học theo cấu trúc dữ liệu đào tạo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="course-code">Mã môn</Label>
                <Input
                  id="course-code"
                  placeholder="VD: CS101"
                  value={courseForm.course_code}
                  onChange={(event) =>
                    handleChangeForm("course_code", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Số tín chỉ</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  placeholder="3"
                  value={courseForm.credits}
                  onChange={(event) =>
                    handleChangeForm("credits", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-name">Tên môn học</Label>
              <Input
                id="course-name"
                placeholder="VD: Cơ sở dữ liệu"
                value={courseForm.course_name}
                onChange={(event) =>
                  handleChangeForm("course_name", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Bộ môn/Khoa</Label>
              <select
                id="department"
                value={courseForm.department_id}
                onChange={(event) =>
                  handleChangeForm("department_id", event.target.value)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn bộ môn/khoa</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                    {department.code ? ` (${department.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-type">Loại phòng yêu cầu</Label>
              <select
                id="room-type"
                value={courseForm.required_room_type}
                onChange={(event) =>
                  handleChangeForm("required_room_type", event.target.value)
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="LECTURE">Phòng lý thuyết</option>
                <option value="LAB">Phòng máy / thực hành</option>
                <option value="SEMINAR">Phòng seminar</option>
                <option value="AUDITORIUM">Hội trường</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Nhập mô tả ngắn cho môn học"
                value={courseForm.description}
                onChange={(event) =>
                  handleChangeForm("description", event.target.value)
                }
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
              onClick={handleSaveCourse}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : formMode === "edit" ? "Lưu thay đổi" : "Tạo môn học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewCourse)} onOpenChange={() => setViewCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết môn học</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết của môn học trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          {viewCourse && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Mã môn:</span>
                <span className="col-span-2">{viewCourse.course_code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Tên môn:</span>
                <span className="col-span-2">{viewCourse.course_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Bộ môn:</span>
                <span className="col-span-2">
                  {viewCourse.department_name || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Tín chỉ:</span>
                <span className="col-span-2">{viewCourse.credits}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Loại phòng:</span>
                <span className="col-span-2">
                  {ROOM_TYPE_LABELS[viewCourse.required_room_type] ||
                    viewCourse.required_room_type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-600">Mô tả:</span>
                <span className="col-span-2">
                  {viewCourse.description || "Chưa có mô tả"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCourse(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteCourse)} onOpenChange={() => setDeleteCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa môn học</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa môn học này không? Thao tác này sẽ xóa mềm bằng trường is_deleted.
            </DialogDescription>
          </DialogHeader>

          {deleteCourse && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">
                {deleteCourse.course_code} - {deleteCourse.course_name}
              </p>
              <p className="mt-1 text-gray-500">
                Bộ môn: {deleteCourse.department_name || "Chưa có"}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCourse(null)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteCourse}
              disabled={saving}
            >
              {saving ? "Đang xóa..." : "Xóa môn học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};