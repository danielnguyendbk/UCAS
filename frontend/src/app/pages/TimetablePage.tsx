import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, Download, Wand2, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";

const timetableData = [
  {
    id: 1,
    courseCode: "CS101",
    courseName: "Nhập môn Lập trình",
    lecturer: "TS. Sarah Johnson",
    studentCount: 45,
    day: "Thứ Hai",
    timeSlot: "08:00 - 10:00",
    assignedRoom: "A-301",
    status: "valid",
  },
  {
    id: 2,
    courseCode: "MATH201",
    courseName: "Giải tích II",
    lecturer: "PGS. Michael Chen",
    studentCount: 60,
    day: "Thứ Hai",
    timeSlot: "10:00 - 12:00",
    assignedRoom: "B-105",
    status: "valid",
  },
  {
    id: 3,
    courseCode: "PHY301",
    courseName: "Cơ học lượng tử",
    lecturer: "TS. Emily Brown",
    studentCount: 35,
    day: "Thứ Ba",
    timeSlot: "14:00 - 16:00",
    assignedRoom: "C-201",
    status: "valid",
  },
  {
    id: 4,
    courseCode: "ENG102",
    courseName: "Viết kỹ thuật",
    lecturer: "TS. Robert Lee",
    studentCount: 50,
    day: "Thứ Tư",
    timeSlot: "08:00 - 10:00",
    assignedRoom: "A-301",
    status: "conflict",
  },
  {
    id: 5,
    courseCode: "BIO201",
    courseName: "Sinh học tế bào",
    lecturer: "TS. Amanda White",
    studentCount: 40,
    day: "Thứ Năm",
    timeSlot: "10:00 - 12:00",
    assignedRoom: "",
    status: "pending",
  },
  {
    id: 6,
    courseCode: "CHEM301",
    courseName: "Hóa hữu cơ",
    lecturer: "PGS. David Kim",
    studentCount: 38,
    day: "Thứ Sáu",
    timeSlot: "14:00 - 16:00",
    assignedRoom: "D-102",
    status: "valid",
  },
];

export const TimetablePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterLecturer, setFilterLecturer] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Hợp lệ</Badge>;
      case "conflict":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Xung đột</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Chờ xử lý</Badge>;
      default:
        return null;
    }
  };

  const filteredData = timetableData.filter((item) => {
    const matchesSearch =
      item.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = filterDay === "all" || item.day === filterDay;
    const matchesRoom = filterRoom === "all" || item.assignedRoom === filterRoom;
    const matchesLecturer = filterLecturer === "all" || item.lecturer === filterLecturer;

    return matchesSearch && matchesDay && matchesRoom && matchesLecturer;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý thời khóa biểu</h1>
        <p className="text-gray-600 mt-1">Quản lý lịch học và phân phòng</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm học phần, giảng viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Lọc theo ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ngày</SelectItem>
              <SelectItem value="Thứ Hai">Thứ Hai</SelectItem>
              <SelectItem value="Thứ Ba">Thứ Ba</SelectItem>
              <SelectItem value="Thứ Tư">Thứ Tư</SelectItem>
              <SelectItem value="Thứ Năm">Thứ Năm</SelectItem>
              <SelectItem value="Thứ Sáu">Thứ Sáu</SelectItem>
              <SelectItem value="Thứ Bảy">Thứ Bảy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Lọc theo phòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng</SelectItem>
              <SelectItem value="A-301">A-301</SelectItem>
              <SelectItem value="B-105">B-105</SelectItem>
              <SelectItem value="C-201">C-201</SelectItem>
              <SelectItem value="D-102">D-102</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLecturer} onValueChange={setFilterLecturer}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder="Lọc theo giảng viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giảng viên</SelectItem>
              <SelectItem value="TS. Sarah Johnson">TS. Sarah Johnson</SelectItem>
              <SelectItem value="PGS. Michael Chen">PGS. Michael Chen</SelectItem>
              <SelectItem value="TS. Emily Brown">TS. Emily Brown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Wand2 className="w-4 h-4 mr-2" />
            Tự động xếp phòng
          </Button>
          <Button variant="outline">
            <AlertCircle className="w-4 h-4 mr-2" />
            Kiểm tra xung đột
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã học phần</TableHead>
                <TableHead>Tên học phần</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead className="text-center">Sinh viên</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Ca học</TableHead>
                <TableHead>Phòng được phân</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.courseCode}</TableCell>
                  <TableCell>{item.courseName}</TableCell>
                  <TableCell>{item.lecturer}</TableCell>
                  <TableCell className="text-center">{item.studentCount}</TableCell>
                  <TableCell>{item.day}</TableCell>
                  <TableCell>{item.timeSlot}</TableCell>
                  <TableCell>
                    {item.assignedRoom || (
                      <span className="text-gray-400 italic">Chưa phân phòng</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredData.length} / {timetableData.length} dòng dữ liệu
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Trước
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
