import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  FileSpreadsheet, 
  Upload, 
  Info, 
  Eye, 
  Edit2,
  Calendar
} from "lucide-react";
import { httpClient } from "@/services/httpClient";

const mockExams = [
  {
    id: 1,
    courseCode: "INT1334",
    courseName: "Kỹ thuật lập trình",
    groupCode: "01",
    classCodes: "D24HTTT01",
    examDate: "2026-06-15",
    examShift: "Ca 1",
    examTime: "07:30 - 09:30",
    roomCode: "302-A2",
    buildingCode: "A2",
    studentCount: 65,
    proctorName: "Nguyễn Văn A",
    status: "PUBLISHED"
  },
  {
    id: 2,
    courseCode: "INT1408",
    courseName: "Cơ sở dữ liệu",
    groupCode: "04",
    classCodes: "D24CNTT02",
    examDate: "2026-06-16",
    examShift: "Ca 2",
    examTime: "10:00 - 12:00",
    roomCode: "105-A3",
    buildingCode: "A3",
    studentCount: 78,
    proctorName: "Trần Thị B",
    status: "ASSIGNED"
  },
  {
    id: 3,
    courseCode: "INT1306",
    courseName: "Cấu trúc dữ liệu và giải thuật",
    groupCode: "02",
    classCodes: "D24ATTT01",
    examDate: "2026-06-17",
    examShift: "Ca 3",
    examTime: "13:30 - 15:30",
    roomCode: "",
    buildingCode: "",
    studentCount: 52,
    proctorName: "",
    status: "UNASSIGNED"
  },
  {
    id: 4,
    courseCode: "INT1310",
    courseName: "Mạng máy tính",
    groupCode: "03",
    classCodes: "D24CNTT03",
    examDate: "2026-06-18",
    examShift: "Ca 4",
    examTime: "16:00 - 18:00",
    roomCode: "404-A3",
    buildingCode: "A3",
    studentCount: 80,
    proctorName: "Lê Văn D",
    status: "CONFLICT"
  }
];

const AdminExamsPage = () => {
  const [exams, setExams] = useState(mockExams);
  const [searchTerm, setSearchTerm] = useState("");

  // Live filter categories
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [classroomsList, setClassroomsList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Selected filters
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedProctor, setSelectedProctor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Alert dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", endpoint: "" });

  useEffect(() => {
    let isMounted = true;
    const fetchExamFilters = async () => {
      setLoadingFilters(true);
      try {
        const [sem, dep, cls, crs, rms, lct] = await Promise.all([
          httpClient.get("/api/categories/semesters").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/departments").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/classes").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/courses").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/classrooms").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/lecturers").catch(() => ({ data: [] }))
        ]);
        if (isMounted) {
          setSemesters(sem.data?.data || sem.data || []);
          setDepartments(dep.data?.data || dep.data || []);
          setClassesList(cls.data?.data || cls.data || []);
          setCoursesList(crs.data?.data || crs.data || []);
          setClassroomsList(rms.data?.data || rms.data || []);
          setLecturersList(lct.data?.data || lct.data || []);
        }
      } catch (err) {
        console.error("Lỗi khi tải bộ lọc lịch thi:", err);
      } finally {
        if (isMounted) {
          setLoadingFilters(false);
        }
      }
    };
    fetchExamFilters();
    return () => { isMounted = false; };
  }, []);

  const handleTriggerAction = (title, endpoint) => {
    setAlertContent({ title, endpoint });
    setIsAlertOpen(true);
  };

  const filteredExams = exams.filter((e) => {
    const matchesSearch = 
      e.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.classCodes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.proctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || e.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý lịch thi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tra cứu và quản lý lịch thi theo học kỳ, môn học, phòng thi và giám thị
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleTriggerAction("Import lịch thi Excel", "POST /api/admin/exams/import")}
          >
            <Upload className="w-4 h-4 mr-2" /> Import lịch thi
          </Button>
          <Button
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => handleTriggerAction("Tải Excel mẫu", "GET /api/admin/exams/template")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Xuất mẫu Excel
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTriggerAction("Xuất danh sách lịch thi Excel", "GET /api/admin/exams/export")}
          >
            Xuất Excel
          </Button>
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("all");
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Warning Alert Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 leading-relaxed shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Hệ thống chưa hỗ trợ quản lý lịch thi (Thiếu API):</span> Backend hiện tại không có controller xử lý xếp lịch thi (`/api/admin/exams`). Lịch thi hiển thị dưới đây đang chạy ở chế độ **giả lập**.
        </div>
      </div>

      {/* 7-Selector Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Semester Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.id)}>{sem.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Khoa</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Lớp hành chính</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Môn học</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {coursesList.map((crs) => (
                  <SelectItem key={crs.id} value={String(crs.id)}>{crs.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Room Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Phòng thi</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classroomsList.map((rm) => (
                  <SelectItem key={rm.id} value={String(rm.id)}>{rm.roomName || rm.roomNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proctor Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Giám thị</Label>
            <Select value={selectedProctor} onValueChange={setSelectedProctor}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {lecturersList.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trạng thái</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="UNASSIGNED">Chưa xếp phòng</SelectItem>
                <SelectItem value="ASSIGNED">Đã xếp phòng</SelectItem>
                <SelectItem value="CONFLICT">Có xung đột</SelectItem>
                <SelectItem value="PUBLISHED">Đã công bố</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo mã môn, tên môn, lớp, phòng thi, giám thị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700">Mã môn</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Tên môn học</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Nhóm/Tổ</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Lớp hành chính</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 font-semibold">Ngày thi</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Ca thi</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Thời gian</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Phòng thi</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Tòa nhà</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Số SV</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Giám thị</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-bold text-gray-750 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.length > 0 ? (
                filteredExams.map((ex) => (
                  <TableRow key={ex.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-semibold text-xs text-gray-900">{ex.courseCode}</TableCell>
                    <TableCell className="text-xs text-gray-700">{ex.courseName}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{ex.groupCode}</TableCell>
                    <TableCell className="text-xs text-gray-600">{ex.classCodes}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{ex.examDate}</TableCell>
                    <TableCell className="text-xs text-gray-600">{ex.examShift}</TableCell>
                    <TableCell className="text-xs text-gray-500">{ex.examTime}</TableCell>
                    <TableCell className="text-xs text-blue-600 font-semibold">{ex.roomCode || <span className="italic text-gray-400 font-normal">Chưa xếp</span>}</TableCell>
                    <TableCell className="text-xs text-gray-500">{ex.buildingCode || "-"}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{ex.studentCount}</TableCell>
                    <TableCell className="text-xs text-gray-600">{ex.proctorName || <span className="italic text-gray-400">Chưa xếp</span>}</TableCell>
                    <TableCell>
                      <Badge className={
                        ex.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800 border-0" :
                        ex.status === "ASSIGNED" ? "bg-blue-100 text-blue-800 border-0" :
                        ex.status === "UNASSIGNED" ? "bg-amber-100 text-amber-800 border-0" :
                        ex.status === "CONFLICT" ? "bg-red-100 text-red-800 border-0" :
                        "bg-gray-100 text-gray-800 border-0"
                      }>
                        {ex.status === "PUBLISHED" ? "Đã công bố" :
                         ex.status === "ASSIGNED" ? "Đã xếp phòng" :
                         ex.status === "UNASSIGNED" ? "Chưa xếp phòng" :
                         ex.status === "CONFLICT" ? "Có xung đột" : "Đã hủy"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => handleTriggerAction(`Xem chi tiết lịch thi: ${ex.courseName}`, `GET /api/admin/exams/${ex.id}`)}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => handleTriggerAction(`Sửa lịch thi: ${ex.courseName}`, `PUT /api/admin/exams/${ex.id}`)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => handleTriggerAction(`Xem trạng thái phòng thi: ${ex.roomCode}`, `GET /api/categories/classrooms/${ex.roomCode}`)}
                        >
                          Xem phòng
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center text-gray-400 italic">
                    Không tìm thấy lịch thi nào trùng khớp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Developer Alert Modal */}
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5.5 w-5.5 text-amber-600" />
              Chức năng đang phát triển
            </DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed text-sm">
              Hành động <strong className="text-gray-900">"{alertContent.title}"</strong> chưa thể hoàn thành vì hệ thống backend **thiếu API** sau:
              <div className="mt-3 p-3 bg-gray-50 font-mono text-xs rounded border border-gray-200 text-gray-700 break-all select-all">
                {alertContent.endpoint}
              </div>
              <p className="mt-3 text-gray-500 text-xs">
                Vui lòng cấu hình API endpoint này ở phía backend Spring Boot của dự án UCAS để kích hoạt tương tác lưu trữ lịch thi thực tế.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsAlertOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExamsPage;
export { AdminExamsPage };
