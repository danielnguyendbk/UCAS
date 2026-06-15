import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, Loader2, Plus, Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { httpClient } from "../../services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await httpClient.get("/api/categories/courses");
        if (isMounted) setCourses(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Không thể tải danh sách môn học.");
          setCourses([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) => {
      const text = [
        course.courseCode,
        course.name,
        course.departmentName,
        course.departmentCode,
        course.requiredRoomType,
      ].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [courses, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Môn học</h1>
          <p className="mt-1 text-gray-600">Danh mục môn học lấy từ database.</p>
        </div>
        <Button disabled className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Thêm môn học
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo mã môn, tên môn, khoa..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải môn học...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã môn</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Khoa/bộ môn</TableHead>
                  <TableHead className="text-center">Tín chỉ</TableHead>
                  <TableHead>Loại phòng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-semibold text-gray-900">
                      {course.courseCode || `MH-${course.id}`}
                    </TableCell>
                    <TableCell>{course.name || "Chưa cập nhật"}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-800">{course.departmentName || "Chưa cập nhật"}</div>
                      <div className="text-xs text-gray-500">{course.departmentCode || course.facultyCode || ""}</div>
                    </TableCell>
                    <TableCell className="text-center">{course.credits ?? "-"}</TableCell>
                    <TableCell>{course.requiredRoomType || "Không yêu cầu"}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đang dùng</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" disabled>Sửa</Button>
                        <Button variant="outline" size="sm" disabled>Xem</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center">
                      <BookOpen className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500">Không có môn học phù hợp.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
            Hiển thị {filteredCourses.length} / {courses.length} môn học
          </div>
        </div>
      )}
    </div>
  );
};

export { CoursesPage };
