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
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  FileText, 
  Info, 
  Calendar,
  Layers,
  Check,
  Eye
} from "lucide-react";
import { httpClient } from "@/services/httpClient";

const mockPendingSections = [
  {
    id: 1,
    courseCode: "INT1334",
    courseName: "Kỹ thuật lập trình",
    groupCode: "01",
    classCodes: "D24HTTT01",
    lecturerName: "Nguyễn Văn A",
    dayOfWeek: "Thứ 2",
    slotLabel: "Tiết 1-3",
    weeksLabel: "Tuần 1-15",
    roomCode: "302-A2",
    buildingCode: "A2",
    enrolledCount: 65,
    submittedBy: "staff01",
    status: "PENDING"
  },
  {
    id: 2,
    courseCode: "INT1408",
    courseName: "Cơ sở dữ liệu",
    groupCode: "04",
    classCodes: "D24CNTT02",
    lecturerName: "Trần Thị B",
    dayOfWeek: "Thứ 4",
    slotLabel: "Tiết 4-6",
    weeksLabel: "Tuần 1-15",
    roomCode: "105-A3",
    buildingCode: "A3",
    enrolledCount: 78,
    submittedBy: "staff01",
    status: "CONFLICT"
  },
  {
    id: 3,
    courseCode: "INT1306",
    courseName: "Cấu trúc dữ liệu và giải thuật",
    groupCode: "02",
    classCodes: "D24ATTT01",
    lecturerName: "Phạm Văn C",
    dayOfWeek: "Thứ 5",
    slotLabel: "Tiết 7-9",
    weeksLabel: "Tuần 1-15",
    roomCode: "201-A2",
    buildingCode: "A2",
    enrolledCount: 52,
    submittedBy: "staff02",
    status: "APPROVED"
  },
  {
    id: 4,
    courseCode: "INT1310",
    courseName: "Mạng máy tính",
    groupCode: "03",
    classCodes: "D24CNTT03",
    lecturerName: "Lê Văn D",
    dayOfWeek: "Thứ 6",
    slotLabel: "Tiết 10-12",
    weeksLabel: "Tuần 1-15",
    roomCode: "404-A3",
    buildingCode: "A3",
    enrolledCount: 80,
    submittedBy: "staff01",
    status: "REJECTED"
  }
];

const AdminTimetableApprovalPage = () => {
  const [sections, setSections] = useState(mockPendingSections);
  const [searchTerm, setSearchTerm] = useState("");
  
  // API filters
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Selected filters
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState("all");

  // Modal alert
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", endpoint: "" });

  useEffect(() => {
    let isMounted = true;
    const fetchFilters = async () => {
      setLoadingFilters(true);
      try {
        const [semRes, depRes, classRes] = await Promise.all([
          httpClient.get("/api/categories/semesters").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/departments").catch(() => ({ data: [] })),
          httpClient.get("/api/categories/classes").catch(() => ({ data: [] }))
        ]);
        if (isMounted) {
          setSemesters(semRes.data?.data || semRes.data || []);
          setDepartments(depRes.data?.data || depRes.data || []);
          setClassesList(classRes.data?.data || classRes.data || []);
        }
      } catch (err) {
        console.error("Lỗi khi tải bộ lọc danh mục:", err);
      } finally {
        if (isMounted) {
          setLoadingFilters(false);
        }
      }
    };
    fetchFilters();
    return () => { isMounted = false; };
  }, []);

  const handleTriggerAction = (title, endpoint) => {
    setAlertContent({ title, endpoint });
    setIsAlertOpen(true);
  };

  const filteredSections = sections.filter((s) => {
    const matchesSearch = 
      s.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classCodes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lecturerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roomCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || s.status === selectedStatus;
    const matchesStaff = selectedStaff === "all" || s.submittedBy === selectedStaff;

    return matchesSearch && matchesStatus && matchesStaff;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Duyệt & công bố thời khóa biểu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm tra kết quả phân phòng do Staff gửi lên trước khi công bố lịch chính thức
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => handleTriggerAction("Duyệt tất cả hợp lệ", "POST /api/admin/timetable/approve")}
          >
            <Check className="w-4 h-4 mr-2" /> Duyệt tất cả hợp lệ
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleTriggerAction("Công bố lịch chính thức", "POST /api/admin/timetable/publish")}
          >
            <Calendar className="w-4 h-4 mr-2" /> Công bố lịch
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTriggerAction("Xuất báo cáo Excel", "GET /api/admin/timetable/export")}
          >
            <FileText className="w-4 h-4 mr-1.5" /> Xuất Excel
          </Button>
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => {
              setSearchTerm("");
              setSelectedStatus("all");
              setSelectedStaff("all");
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Warning Box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 leading-relaxed shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Hệ thống chưa hỗ trợ phê duyệt tự động (Thiếu API):</span> Backend hiện tại chưa cung cấp các endpoint duyệt timetable (`/api/admin/timetable/pending-approval`, `/api/admin/timetable/approve`, `/api/admin/timetable/reject`, `/api/admin/timetable/publish`). Tính năng đang được hiển thị ở chế độ **giả lập**.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Chờ duyệt", val: 5, color: "text-amber-600 bg-amber-50" },
          { label: "Đã duyệt", val: 12, color: "text-emerald-600 bg-emerald-50" },
          { label: "Đã công bố", val: 0, color: "text-blue-600 bg-blue-50" },
          { label: "Từ chối", val: 2, color: "text-rose-600 bg-rose-50" },
          { label: "Có xung đột", val: 1, color: "text-red-700 bg-red-100" },
          { label: "Tổng lớp HP", val: 20, color: "text-purple-600 bg-purple-50" }
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-gray-500 font-medium">{c.label}</span>
            <span className={`text-2xl font-bold mt-2 px-2 py-0.5 rounded-lg w-max ${c.color}`}>{c.val}</span>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Semester Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.id)}>{sem.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trạng thái duyệt</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
                <SelectItem value="CONFLICT">Có xung đột</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Khoa</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Staff gửi</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="staff01">staff01</SelectItem>
                <SelectItem value="staff02">staff02</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submission Date Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Ngày gửi</Label>
            <Input type="date" className="h-9 text-xs" />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm theo mã môn, tên môn, lớp, giảng viên, phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700">Mã MH</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Tên môn học</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Nhóm</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Lớp hành chính</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Giảng viên</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Thứ</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Tiết</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Tuần học</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Phòng</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Tòa nhà</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">SV</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Người gửi</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-bold text-gray-750 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSections.length > 0 ? (
                filteredSections.map((s) => (
                  <TableRow key={s.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-semibold text-xs text-gray-900">{s.courseCode}</TableCell>
                    <TableCell className="text-xs text-gray-700">{s.courseName}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{s.groupCode}</TableCell>
                    <TableCell className="text-xs text-gray-600">{s.classCodes}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{s.lecturerName}</TableCell>
                    <TableCell className="text-xs text-gray-600">{s.dayOfWeek}</TableCell>
                    <TableCell className="text-xs text-gray-600">{s.slotLabel}</TableCell>
                    <TableCell className="text-xs text-gray-500">{s.weeksLabel}</TableCell>
                    <TableCell className="text-xs text-blue-600 font-semibold">{s.roomCode}</TableCell>
                    <TableCell className="text-xs text-gray-500">{s.buildingCode}</TableCell>
                    <TableCell className="text-xs text-gray-600">{s.enrolledCount}</TableCell>
                    <TableCell className="text-xs text-gray-500">{s.submittedBy}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.status === "PENDING" ? "bg-amber-100 text-amber-800 border-0" :
                          s.status === "APPROVED" ? "bg-emerald-100 text-emerald-800 border-0" :
                          s.status === "REJECTED" ? "bg-rose-100 text-rose-800 border-0" :
                          "bg-red-100 text-red-800 border-0"
                        }
                      >
                        {s.status === "PENDING" ? "Chờ duyệt" :
                         s.status === "APPROVED" ? "Đã duyệt" :
                         s.status === "REJECTED" ? "Từ chối" :
                         "Có xung đột"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => handleTriggerAction("Xem chi tiết", "GET /api/admin/timetable-approval/" + s.id)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleTriggerAction("Phê duyệt phòng học", "POST /api/admin/timetable/approve")}
                        >
                          Duyệt
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleTriggerAction("Từ chối phân phòng", "POST /api/admin/timetable/reject")}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={14} className="h-32 text-center text-gray-400 italic">
                    Không tìm thấy lớp học phần nào chờ duyệt.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* API Warning Dialog */}
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5.5 w-5.5 text-amber-600" />
              Chức năng đang phát triển
            </DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed text-sm">
              Hành động <strong className="text-gray-900">"{alertContent.title}"</strong> chưa thể hoàn thành vì hệ thống backend hiện tại **thiếu API** để thực thi:
              <div className="mt-3 p-3 bg-gray-50 font-mono text-xs rounded border border-gray-200 text-gray-700 break-all select-all">
                {alertContent.endpoint}
              </div>
              <p className="mt-3 text-gray-500 text-xs">
                Vui lòng bổ sung endpoint controller này ở phía backend Spring Boot của dự án UCAS để kích hoạt lưu trữ dữ liệu thực tế.
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

export default AdminTimetableApprovalPage;
export { AdminTimetableApprovalPage };
