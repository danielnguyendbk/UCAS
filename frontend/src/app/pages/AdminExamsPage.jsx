import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Edit2, Eye, FileSpreadsheet, Loader2, RefreshCw, Search, Upload } from "lucide-react";
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

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const settledData = (result) => (result.status === "fulfilled" ? getResponseData(result.value) : []);

const STATUS_LABEL = {
  DRAFT: "Nhap",
  SCHEDULED: "Da xep lich",
  CANCELLED: "Da huy",
  COMPLETED: "Da hoan thanh",
};

const STATUS_BADGE = {
  DRAFT: "bg-amber-100 text-amber-800 border-0",
  SCHEDULED: "bg-blue-100 text-blue-800 border-0",
  CANCELLED: "bg-gray-100 text-gray-800 border-0",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-0",
};

const formatTimeRange = (exam) => [exam.startTime, exam.endTime]
  .filter(Boolean)
  .map((value) => String(value).slice(0, 5))
  .join(" - ") || "-";

const AdminExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [classroomsList, setClassroomsList] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedProctor, setSelectedProctor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      const [sem, dep, cls, crs, rms, lct] = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
        httpClient.get("/api/categories/courses"),
        httpClient.get("/api/categories/classrooms"),
        httpClient.get("/api/categories/lecturers"),
      ]);
      if (!isMounted) return;
      setSemesters(settledData(sem));
      setDepartments(settledData(dep));
      setClassesList(settledData(cls));
      setCoursesList(settledData(crs));
      setClassroomsList(settledData(rms));
      setLecturersList(settledData(lct));
    };

    loadFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExams = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (selectedSemester !== "all") params.semesterId = selectedSemester;
        if (selectedStatus !== "all") params.status = selectedStatus;
        const response = await httpClient.get("/api/admin/exams", { params });
        if (isMounted) setExams(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setExams([]);
          setError(err?.response?.data?.message || "Khong the tai lich thi.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadExams();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester, selectedStatus]);

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return exams.filter((exam) => {
      const matchesDept = selectedDept === "all" || String(exam.departmentId) === selectedDept;
      const matchesClass = selectedClass === "all" || String(exam.classCodes || "").includes(selectedClass);
      const matchesCourse = selectedCourse === "all" || String(exam.courseId) === selectedCourse;
      const matchesRoom = selectedRoom === "all" || String(exam.classroomId) === selectedRoom;
      const matchesProctor = selectedProctor === "all" || String(exam.proctorId || "") === selectedProctor;
      const searchable = [
        exam.courseCode,
        exam.courseName,
        exam.sectionCode,
        exam.classCodes,
        exam.roomCode,
        exam.roomName,
        exam.buildingCode,
        exam.proctorName,
        exam.examType,
      ].join(" ").toLowerCase();
      return matchesDept && matchesClass && matchesCourse && matchesRoom && matchesProctor
        && (!query || searchable.includes(query));
    });
  }, [exams, searchTerm, selectedClass, selectedCourse, selectedDept, selectedProctor, selectedRoom]);

  const summary = useMemo(() => ({
    total: exams.length,
    draft: exams.filter((exam) => exam.status === "DRAFT").length,
    scheduled: exams.filter((exam) => exam.status === "SCHEDULED").length,
    completed: exams.filter((exam) => exam.status === "COMPLETED").length,
    cancelled: exams.filter((exam) => exam.status === "CANCELLED").length,
  }), [exams]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSemester("all");
    setSelectedDept("all");
    setSelectedClass("all");
    setSelectedCourse("all");
    setSelectedRoom("all");
    setSelectedProctor("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quan ly lich thi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tra cuu lich thi tu database theo hoc ky, mon hoc, phong thi va giam thi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <Upload className="mr-2 h-4 w-4" />
            Import lich thi
          </Button>
          <Button disabled variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Xuat mau Excel
          </Button>
          <Button variant="ghost" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Tong lich thi", value: summary.total, color: "text-purple-600 bg-purple-50" },
          { label: "Nhap", value: summary.draft, color: "text-amber-600 bg-amber-50" },
          { label: "Da xep lich", value: summary.scheduled, color: "text-blue-600 bg-blue-50" },
          { label: "Da hoan thanh", value: summary.completed, color: "text-emerald-600 bg-emerald-50" },
          { label: "Da huy", value: summary.cancelled, color: "text-gray-600 bg-gray-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-gray-500">{item.label}</span>
            <span className={`mt-2 block w-max rounded-lg px-2 py-0.5 text-2xl font-bold ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Hoc ky</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Khoa</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name || department.departmentName || department.departmentCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Lop hanh chinh</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {classesList.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.classCode || classItem.className || String(classItem.id)}>
                    {classItem.className || classItem.classCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Mon hoc</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {coursesList.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>{course.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Phong thi</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {classroomsList.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>{room.roomName || room.roomNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Giam thi</Label>
            <Select value={selectedProctor} onValueChange={setSelectedProctor}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {lecturersList.map((lecturer) => (
                  <SelectItem key={lecturer.id} value={String(lecturer.id)}>{lecturer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trang thai</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tim theo ma mon, ten mon, lop, phong thi, giam thi..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Dang tai lich thi...</p>
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
                  <TableHead>Ma mon</TableHead>
                  <TableHead>Ten mon hoc</TableHead>
                  <TableHead>Lop</TableHead>
                  <TableHead>Ngay thi</TableHead>
                  <TableHead>Thoi gian</TableHead>
                  <TableHead>Phong thi</TableHead>
                  <TableHead>Toa nha</TableHead>
                  <TableHead>So SV</TableHead>
                  <TableHead>Giam thi</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-right">Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length > 0 ? filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="hover:bg-gray-50/40">
                    <TableCell className="text-xs font-semibold text-gray-900">{exam.courseCode}</TableCell>
                    <TableCell className="text-xs text-gray-700">{exam.courseName}</TableCell>
                    <TableCell className="text-xs text-gray-600">{exam.classCodes || exam.sectionCode || "-"}</TableCell>
                    <TableCell className="text-xs font-medium text-gray-600">{String(exam.examDate || "-")}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatTimeRange(exam)}</TableCell>
                    <TableCell className="text-xs font-semibold text-blue-600">{exam.roomCode || exam.roomName || "-"}</TableCell>
                    <TableCell className="text-xs text-gray-500">{exam.buildingCode || "-"}</TableCell>
                    <TableCell className="text-xs font-medium text-gray-600">{exam.studentCount ?? "-"}</TableCell>
                    <TableCell className="text-xs text-gray-600">{exam.proctorName || "-"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[exam.status] || "bg-gray-100 text-gray-800 border-0"}>
                        {STATUS_LABEL[exam.status] || exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="xs" disabled title="Chua co API chi tiet lich thi">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" disabled title="Chua co API cap nhat lich thi">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-sm text-gray-400">
                      Khong co lich thi phu hop.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamsPage;
export { AdminExamsPage };
