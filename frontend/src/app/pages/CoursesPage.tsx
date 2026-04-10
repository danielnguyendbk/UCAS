import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Search, Plus } from "lucide-react";
import { useState } from "react";

const courses = [
  { id: 1, code: "CS101", name: "Nhập môn Lập trình", department: "Công nghệ thông tin", credits: 3, students: 45, status: "Đang mở" },
  { id: 2, code: "MATH201", name: "Giải tích II", department: "Toán học", credits: 4, students: 60, status: "Đang mở" },
  { id: 3, code: "PHY301", name: "Cơ học lượng tử", department: "Vật lý", credits: 3, students: 35, status: "Đang mở" },
  { id: 4, code: "ENG102", name: "Viết kỹ thuật", department: "Tiếng Anh", credits: 2, students: 50, status: "Đang mở" },
  { id: 5, code: "BIO201", name: "Sinh học tế bào", department: "Sinh học", credits: 3, students: 40, status: "Đang mở" },
  { id: 6, code: "CHEM301", name: "Hóa hữu cơ", department: "Hóa học", credits: 4, students: 38, status: "Đang mở" },
];

export const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Học phần</h1>
          <p className="text-gray-600 mt-1">Quản lý danh mục và thông tin học phần</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Thêm học phần
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm học phần..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã học phần</TableHead>
                <TableHead>Tên học phần</TableHead>
                <TableHead>Khoa/Bộ môn</TableHead>
                <TableHead className="text-center">Số tín chỉ</TableHead>
                <TableHead className="text-center">Sinh viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell className="text-center">{course.credits}</TableCell>
                  <TableCell className="text-center">{course.students}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Sửa
                      </Button>
                      <Button variant="outline" size="sm">
                        Xem
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredCourses.length} / {courses.length} học phần
          </div>
        </div>
      </div>
    </div>
  );
};
