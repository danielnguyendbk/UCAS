import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  Eye,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { httpClient } from "@/services/httpClient";
import { getApiError } from "@/utils/apiError";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const STATUS_LABEL = {
  NO_SCHEDULE: "Chưa có lịch",
  UNASSIGNED: "Chưa phân phòng",
  ASSIGNED: "Đã phân phòng",
  PENDING_APPROVAL: "Chờ duyệt",
  PUBLISHED: "Đã công bố",
  CONFLICT: "Có xung đột",
};

const STATUS_BADGE = {
  NO_SCHEDULE: "bg-gray-100 text-gray-700 border-0",
  UNASSIGNED: "bg-amber-100 text-amber-800 border-0",
  ASSIGNED: "bg-blue-100 text-blue-800 border-0",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 border-0",
  PUBLISHED: "bg-emerald-100 text-emerald-800 border-0",
  CONFLICT: "bg-red-100 text-red-800 border-0",
};

const WORKFLOW_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  VALIDATING: "Đang kiểm tra",
  CONFLICT: "Có xung đột",
  READY_FOR_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PUBLISHED: "Đã công bố",
  LOCKED: "Đã khóa",
};

const PAGE_SIZE = 10;

const getStatus = (section) => section.allocationStatus || section.statusText || "NO_SCHEDULE";

const getCourseCode = (section) => {
  const value = section.classCode || "";
  return value.includes(".L") ? value.split(".L")[0] : value;
};

const AdminTimetableApprovalPage = () => {
  const [sections, setSections] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      const [semRes, depRes, classRes] = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
      ]);
      if (!isMounted) return;
      const semesterItems =
        semRes.status === "fulfilled" ? getResponseData(semRes.value) : [];
      setSemesters(semesterItems);
      const defaultSemester =
        semesterItems.find((semester) => semester.status === "ACTIVE") || semesterItems[0];
      if (defaultSemester) setSelectedSemester(String(defaultSemester.id));
      setDepartments(depRes.status === "fulfilled" ? getResponseData(depRes.value) : []);
      setClassesList(classRes.status === "fulfilled" ? getResponseData(classRes.value) : []);
    };

    loadFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSections = async () => {
      if (!selectedSemester) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const params =
          selectedSemester === "all" ? {} : { semesterId: selectedSemester };
        const workflowRequest =
          selectedSemester === "all"
            ? Promise.resolve({ data: null })
            : httpClient.get("/api/admin/timetable-workflow/pending", { params });
        const [response, workflowResponse] = await Promise.all([
          httpClient.get("/api/admin/class-sections", { params }),
          workflowRequest,
        ]);
        if (isMounted) {
          setSections(getResponseData(response));
          setWorkflow(workflowResponse.data?.data ?? workflowResponse.data ?? null);
        }
      } catch (err) {
        if (isMounted) {
          const apiError = getApiError(
            err,
            "Không thể tải dữ liệu lớp học phần.",
          );
          setSections([]);
          setWorkflow(null);
          setError(apiError.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSections();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester]);

  const filteredSections = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return sections.filter((section) => {
      const status = getStatus(section);
      const matchesStatus = selectedStatus === "all" || status === selectedStatus;
      const matchesDepartment = selectedDepartment === "all"
        || section.departmentCode === selectedDepartment;
      const matchesClass = selectedClass === "all"
        || String(section.classCodes || section.classNames || "").includes(selectedClass);
      const searchable = [
        section.classCode,
        section.courseName,
        section.classCodes,
        section.classNames,
        section.lecturerName,
        section.day,
        section.schedule,
        section.room,
      ].join(" ").toLowerCase();
      return matchesStatus && matchesDepartment && matchesClass && (!query || searchable.includes(query));
    });
  }, [classesList, searchTerm, sections, selectedClass, selectedDepartment, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSections.length / PAGE_SIZE));
  const pagedSections = useMemo(
    () =>
      filteredSections.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredSections],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedSemester,
    selectedStatus,
    selectedDepartment,
    selectedClass,
  ]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const runWorkflowAction = async (action) => {
    if (!selectedSemester) return;
    setIsActionRunning(true);
    setActionMessage(null);
    try {
      const response = await httpClient.post(
        `/api/admin/timetable-workflow/${action}?semesterId=${selectedSemester}`,
      );
      setWorkflow(response.data?.data ?? response.data);
      setActionMessage({
        tone: "success",
        text: response.data?.message || "Cập nhật trạng thái thành công.",
      });
    } catch (requestError) {
      const apiError = getApiError(
        requestError,
        "Không thể cập nhật trạng thái thời khóa biểu.",
      );
      const failedWorkflow = apiError.details;
      if (failedWorkflow) setWorkflow(failedWorkflow);
      setActionMessage({
        tone: "error",
        errorCode: apiError.errorCode,
        text: apiError.message,
      });
    } finally {
      setIsActionRunning(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedDepartment("all");
    setSelectedClass("all");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Duyệt và công bố thời khóa biểu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Đọc danh sách lớp học phần và trạng thái phân phòng từ database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={
              isActionRunning || workflow?.timetableStatus !== "READY_FOR_APPROVAL"
            }
            onClick={() => runWorkflowAction("approve")}
          >
            <Check className="mr-2 h-4 w-4" />
            Duyệt hợp lệ
          </Button>
          <Button
            disabled={isActionRunning || workflow?.timetableStatus !== "APPROVED"}
            onClick={() => runWorkflowAction("publish")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Công bố lịch
          </Button>
          <Button
            variant="outline"
            disabled={isActionRunning || workflow?.timetableStatus !== "PUBLISHED"}
            onClick={() => runWorkflowAction("lock")}
          >
            <LockKeyhole className="mr-2 h-4 w-4" />
            Khóa thời khóa biểu
          </Button>
          <Button variant="ghost" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            actionMessage.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Tổng số lịch", value: workflow?.totalSchedules ?? 0 },
          { label: "Lịch hợp lệ", value: workflow?.validCount ?? 0 },
          { label: "Lịch xung đột", value: workflow?.conflictCount ?? 0 },
          {
            label: "Trạng thái workflow",
            value:
              WORKFLOW_STATUS_LABEL[workflow?.timetableStatus] ||
              workflow?.timetableStatus ||
              "Chưa chọn học kỳ",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <span className="text-xs font-medium text-gray-500">{item.label}</span>
            <span className="mt-2 block text-xl font-bold text-gray-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Học kỳ</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trạng thái</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Khoa</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.departmentCode || department.code || String(department.id)}>
                    {department.name || department.departmentName || department.departmentCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Lớp hành chính</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {classesList.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.classCode || classItem.className || String(classItem.id)}>
                    {classItem.className || classItem.classCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo mã môn, tên môn, lớp, giảng viên, phòng..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải lớp học phần...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Mã MH</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Lớp hành chính</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Thu</TableHead>
                  <TableHead>Tiết</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>SV</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSections.length > 0 ? pagedSections.map((section) => {
                  const status = getStatus(section);
                  return (
                    <TableRow key={section.id} className="hover:bg-gray-50/40">
                      <TableCell className="text-xs font-semibold text-gray-900">{getCourseCode(section)}</TableCell>
                      <TableCell className="text-xs text-gray-700">{section.courseName || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.classCodes || section.classNames || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.lecturerName || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.day || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.slotStart && section.slotEnd ? `${section.slotStart}-${section.slotEnd}` : "-"}</TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600">{section.room || "Chưa phân"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.studentCount ?? 0}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[status] || "bg-gray-100 text-gray-700 border-0"}>
                          {STATUS_LABEL[status] || status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="xs" disabled title="Chưa có API chi tiết phê duyệt">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="xs" disabled>Duyệt</Button>
                          <Button variant="ghost" size="xs" disabled>Từ chối</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-sm text-gray-400">
                      Không có lớp học phần phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredSections.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span>
                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredSections.length)} /{" "}
                {filteredSections.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  Trước
                </Button>
                <span>Trang {currentPage}/{totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTimetableApprovalPage;
export { AdminTimetableApprovalPage };
