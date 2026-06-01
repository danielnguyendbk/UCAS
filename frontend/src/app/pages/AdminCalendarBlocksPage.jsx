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
import { Textarea } from "../components/ui/textarea";
import { 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  FileText, 
  Calendar,
  X,
  Info,
  Trash2,
  Edit
} from "lucide-react";
import { httpClient } from "@/services/httpClient";

const mockCalendarBlocks = [
  {
    id: 1,
    title: "Nghỉ Tết Nguyên Đán",
    type: "HOLIDAY",
    startDate: "2026-02-10",
    endDate: "2026-02-20",
    teachingAllowed: false,
    notes: "Nghỉ lễ theo quy định nhà nước",
    status: "ACTIVE",
    semesterId: 1
  },
  {
    id: 2,
    title: "Tuần thi học kỳ I",
    type: "EXAM_WEEK",
    startDate: "2026-01-05",
    endDate: "2026-01-12",
    teachingAllowed: false,
    notes: "Tổ chức thi tập trung toàn trường",
    status: "ACTIVE",
    semesterId: 1
  },
  {
    id: 3,
    title: "Nghỉ lễ Giỗ tổ Hùng Vương",
    type: "HOLIDAY",
    startDate: "2026-04-18",
    endDate: "2026-04-18",
    teachingAllowed: false,
    notes: "Nghỉ 1 ngày (10/3 Âm lịch)",
    status: "ACTIVE",
    semesterId: 1
  },
  {
    id: 4,
    title: "Hội nghị nghiên cứu khoa học sinh viên",
    type: "OTHER",
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    teachingAllowed: true,
    notes: "Cho phép các giảng đường học bình thường nếu không tham gia",
    status: "ACTIVE",
    semesterId: 1
  }
];

const AdminCalendarBlocksPage = () => {
  const [blocks, setBlocks] = useState(mockCalendarBlocks);
  
  // API Semester loading
  const [semesters, setSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAllowed, setSelectedAllowed] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Create Form Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createType, setCreateType] = useState("HOLIDAY"); // Default
  const [formValues, setFormValues] = useState({
    semesterId: "",
    title: "",
    type: "HOLIDAY",
    startDate: "",
    endDate: "",
    teachingAllowed: "false",
    notes: ""
  });
  
  const [formError, setFormError] = useState("");
  const [formWarning, setFormWarning] = useState("");

  // Alert Modal
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState({ title: "", endpoint: "" });

  useEffect(() => {
    let isMounted = true;
    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      try {
        const res = await httpClient.get("/api/categories/semesters");
        const list = res.data?.data || res.data || [];
        if (isMounted) {
          setSemesters(list);
          if (list.length > 0) {
            setFormValues(prev => ({ ...prev, semesterId: String(list[0].id) }));
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải học kỳ:", err);
      } finally {
        if (isMounted) {
          setLoadingSemesters(false);
        }
      }
    };
    fetchSemesters();
    return () => { isMounted = false; };
  }, []);

  const handleOpenCreateModal = (type) => {
    setCreateType(type);
    setFormError("");
    setFormWarning("");
    setFormValues({
      semesterId: semesters[0] ? String(semesters[0].id) : "",
      title: "",
      type: type,
      startDate: "",
      endDate: "",
      teachingAllowed: type === "EXAM_WEEK" || type === "HOLIDAY" ? "false" : "true",
      notes: ""
    });
    setIsCreateOpen(true);
  };

  const handleFormChange = (key, val) => {
    setFormError("");
    setFormWarning("");
    
    const nextValues = { ...formValues, [key]: val };
    setFormValues(nextValues);

    // Simulated Overlapping calendar block warning check
    if (key === "startDate" || key === "endDate") {
      const start = nextValues.startDate;
      const end = nextValues.endDate;
      if (start && end) {
        const hasOverlap = blocks.some((b) => {
          // Check if overlap exists in the same semester
          if (String(b.semesterId) !== nextValues.semesterId) return false;
          
          return (
            (start >= b.startDate && start <= b.endDate) ||
            (end >= b.startDate && end <= b.endDate) ||
            (start <= b.startDate && end >= b.endDate)
          );
        });
        if (hasOverlap) {
          setFormWarning("⚠️ Cảnh báo: Khoảng thời gian này đang trùng lặp với một lịch học vụ khác đã tạo trong học kỳ.");
        }
      }
    }
  };

  const handleSaveBlock = () => {
    if (!formValues.title.trim()) {
      setFormError("Tiêu đề sự kiện là bắt buộc.");
      return;
    }
    if (!formValues.semesterId) {
      setFormError("Vui lòng chọn học kỳ áp dụng.");
      return;
    }
    if (!formValues.startDate || !formValues.endDate) {
      setFormError("Vui lòng nhập đầy đủ từ ngày đến ngày.");
      return;
    }
    if (new Date(formValues.startDate) > new Date(formValues.endDate)) {
      setFormError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    // Backend doesn't support the POST calendar blocks, show developer alert instead!
    setIsCreateOpen(false);
    handleTriggerAction(
      `Tạo ${formValues.type === 'HOLIDAY' ? 'ngày nghỉ' : 'tuần thi'}: "${formValues.title}"`,
      "POST /api/admin/calendar-blocks"
    );
  };

  const handleTriggerAction = (title, endpoint) => {
    setAlertContent({ title, endpoint });
    setIsAlertOpen(true);
  };

  const filteredBlocks = blocks.filter((b) => {
    const matchesSemester = selectedSemester === "all" || String(b.semesterId) === selectedSemester;
    const matchesType = selectedType === "all" || b.type === selectedType;
    
    let matchesAllowed = true;
    if (selectedAllowed !== "all") {
      const isAllowed = selectedAllowed === "true";
      matchesAllowed = b.teachingAllowed === isAllowed;
    }

    let matchesDates = true;
    if (filterStartDate) {
      matchesDates = matchesDates && b.startDate >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDates = matchesDates && b.endDate <= filterEndDate;
    }

    return matchesSemester && matchesType && matchesAllowed && matchesDates;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ngày nghỉ / Lịch học vụ</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý ngày nghỉ, tuần thi và các khoảng thời gian đặc biệt trong học kỳ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleOpenCreateModal("HOLIDAY")}
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo ngày nghỉ
          </Button>
          <Button
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => handleOpenCreateModal("EXAM_WEEK")}
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo tuần thi
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTriggerAction("Xuất mẫu ngày nghỉ Excel", "GET /api/admin/calendar-blocks/export")}
          >
            <FileText className="w-4 h-4 mr-1.5" /> Xuất Excel
          </Button>
          <Button
            variant="ghost"
            className="p-2"
            onClick={() => {
              setSelectedSemester("all");
              setSelectedType("all");
              setSelectedAllowed("all");
              setFilterStartDate("");
              setFilterEndDate("");
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
          <span className="font-bold">Hệ thống chưa hỗ trợ thiết lập lịch học vụ (Thiếu API):</span> Backend chưa có API lưu trữ sự kiện ngày nghỉ/thi (/api/admin/calendar-blocks). Mọi biểu mẫu khởi tạo, chỉnh sửa dưới đây đang hoạt động dưới chế độ **giả lập**.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tổng sự kiện", val: 4, color: "text-purple-600 bg-purple-50" },
          { label: "Ngày nghỉ", val: 2, color: "text-amber-600 bg-amber-50" },
          { label: "Tuần thi", val: 1, color: "text-blue-600 bg-blue-50" },
          { label: "Không cho phép học", val: 3, color: "text-rose-600 bg-rose-50" },
          { label: "Cho phép học", val: 1, color: "text-emerald-600 bg-emerald-50" }
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-gray-500 font-medium">{c.label}</span>
            <span className={`text-2xl font-bold mt-2 px-2 py-0.5 rounded-lg w-max ${c.color}`}>{c.val}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Semester Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Học kỳ áp dụng</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả học kỳ</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.id)}>{sem.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Block Type Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Loại sự kiện</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="HOLIDAY">Ngày nghỉ</SelectItem>
                <SelectItem value="EXAM_WEEK">Tuần thi</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allowed filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Quy định tổ chức học</Label>
            <Select value={selectedAllowed} onValueChange={setSelectedAllowed}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả quy định</SelectItem>
                <SelectItem value="true">Cho phép học</SelectItem>
                <SelectItem value="false">Không cho phép học</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Từ ngày</Label>
            <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Đến ngày</Label>
            <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-9 text-xs" />
          </div>
        </div>
      </div>

      {/* Blocks Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700">Tiêu đề sự kiện</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Loại sự kiện</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Từ ngày</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Đến ngày</TableHead>
                <TableHead className="text-xs font-bold text-gray-700 font-semibold">Quy định tổ chức học</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Ghi chú</TableHead>
                <TableHead className="text-xs font-bold text-gray-700">Trạng thái</TableHead>
                <TableHead className="text-xs font-bold text-gray-750 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlocks.length > 0 ? (
                filteredBlocks.map((b) => (
                  <TableRow key={b.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-semibold text-xs text-gray-900">{b.title}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      <Badge className={
                        b.type === "HOLIDAY" ? "bg-amber-100 text-amber-800 border-0" :
                        b.type === "EXAM_WEEK" ? "bg-blue-100 text-blue-800 border-0" :
                        "bg-gray-100 text-gray-800 border-0"
                      }>
                        {b.type === "HOLIDAY" ? "Ngày nghỉ" : b.type === "EXAM_WEEK" ? "Tuần thi" : "Khác"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{b.startDate}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-medium">{b.endDate}</TableCell>
                    <TableCell className="text-xs">
                      <span className={b.teachingAllowed ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                        {b.teachingAllowed ? "Cho phép học" : "Không cho phép học"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-xs truncate">{b.notes || "-"}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => handleTriggerAction(`Xem chi tiết: ${b.title}`, `GET /api/admin/calendar-blocks/${b.id}`)}
                        >
                          Chi tiết
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-gray-500 hover:text-blue-600"
                          onClick={() => handleTriggerAction(`Chỉnh sửa sự kiện: ${b.title}`, `PUT /api/admin/calendar-blocks/${b.id}`)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleTriggerAction(`Xóa lịch học vụ: ${b.title}`, `DELETE /api/admin/calendar-blocks/${b.id}`)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-400 italic">
                    Không tìm thấy sự kiện nào trùng khớp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Tạo {createType === "HOLIDAY" ? "ngày nghỉ mới" : "tuần thi mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập lịch học vụ nhằm tránh xếp thời khóa biểu trùng lặp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <div className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded border border-red-200">
                {formError}
              </div>
            )}
            {formWarning && (
              <div className="text-[11px] text-amber-700 font-bold bg-amber-50 p-2.5 rounded border border-amber-200">
                {formWarning}
              </div>
            )}

            {/* Semester Select */}
            <div className="space-y-1.5">
              <Label htmlFor="sem">Học kỳ áp dụng</Label>
              <Select value={formValues.semesterId} onValueChange={(val) => handleFormChange("semesterId", val)}>
                <SelectTrigger id="sem"><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={String(sem.id)}>{sem.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Tiêu đề sự kiện</Label>
              <Input
                id="title"
                placeholder={createType === "HOLIDAY" ? "Ví dụ: Nghỉ Giỗ tổ Hùng Vương" : "Ví dụ: Tuần thi lý thuyết K24"}
                value={formValues.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
              />
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start">Từ ngày</Label>
                <Input
                  id="start"
                  type="date"
                  value={formValues.startDate}
                  onChange={(e) => handleFormChange("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Đến ngày</Label>
                <Input
                  id="end"
                  type="date"
                  value={formValues.endDate}
                  onChange={(e) => handleFormChange("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Teaching allowed */}
            <div className="space-y-1.5">
              <Label htmlFor="allowed">Cho phép tổ chức học?</Label>
              <Select value={formValues.teachingAllowed} onValueChange={(val) => handleFormChange("teachingAllowed", val)}>
                <SelectTrigger id="allowed"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Có - Vẫn cho phép học bình thường</SelectItem>
                  <SelectItem value="false">Không - Khóa toàn bộ lịch học vào ngày này</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Ghi chú chi tiết</Label>
              <Textarea
                id="notes"
                placeholder="Nhập lý do nghỉ, đối tượng áp dụng..."
                value={formValues.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveBlock} className="bg-blue-600 hover:bg-blue-700 text-white">Lưu lịch học vụ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Developer Alert Modal */}
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5.5 w-5.5 text-amber-600" />
              Chức năng đang phát triển
            </DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed text-sm">
              Hành động <strong className="text-gray-900">"{alertContent.title}"</strong> chưa thể lưu trữ trên hệ thống thực tế vì backend **thiếu API** sau:
              <div className="mt-3 p-3 bg-gray-50 font-mono text-xs rounded border border-gray-200 text-gray-700 break-all select-all">
                {alertContent.endpoint}
              </div>
              <p className="mt-3 text-gray-500 text-xs">
                Vui lòng cấu hình REST API controller này ở phía backend Spring Boot để hỗ trợ lưu trữ vĩnh viễn.
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

export default AdminCalendarBlocksPage;
export { AdminCalendarBlocksPage };
