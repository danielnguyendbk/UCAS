import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Check, Eye, Loader2, RefreshCw, Search } from "lucide-react";
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

const STATUS_LABEL = {
  NO_SCHEDULE: "Chua co lich",
  UNASSIGNED: "Chua phan phong",
  ASSIGNED: "Da phan phong",
  PENDING_APPROVAL: "Cho duyet",
  PUBLISHED: "Da cong bo",
  CONFLICT: "Co xung dot",
};

const STATUS_BADGE = {
  NO_SCHEDULE: "bg-gray-100 text-gray-700 border-0",
  UNASSIGNED: "bg-amber-100 text-amber-800 border-0",
  ASSIGNED: "bg-blue-100 text-blue-800 border-0",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 border-0",
  PUBLISHED: "bg-emerald-100 text-emerald-800 border-0",
  CONFLICT: "bg-red-100 text-red-800 border-0",
};

const getStatus = (section) => section.allocationStatus || section.statusText || "NO_SCHEDULE";

const getCourseCode = (section) => {
  const value = section.classCode || "";
  return value.includes(".L") ? value.split(".L")[0] : value;
};

const AdminTimetableApprovalPage = () => {
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      const [semRes, depRes, classRes] = await Promise.allSettled([
        httpClient.get("/api/categories/semesters"),
        httpClient.get("/api/categories/departments"),
        httpClient.get("/api/categories/classes"),
      ]);
      if (!isMounted) return;
      setSemesters(semRes.status === "fulfilled" ? getResponseData(semRes.value) : []);
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
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (selectedSemester !== "all") params.semesterId = selectedSemester;
        const response = await httpClient.get("/api/admin/class-sections", { params });
        if (isMounted) setSections(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setSections([]);
          setError(err?.response?.data?.message || "Khong the tai du lieu lop hoc phan.");
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

  const summary = useMemo(() => ({
    total: sections.length,
    unassigned: sections.filter((section) => getStatus(section) === "UNASSIGNED").length,
    assigned: sections.filter((section) => getStatus(section) === "ASSIGNED").length,
    conflicts: sections.filter((section) => getStatus(section) === "CONFLICT").length,
    published: sections.filter((section) => getStatus(section) === "PUBLISHED").length,
  }), [sections]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSemester("all");
    setSelectedStatus("all");
    setSelectedDepartment("all");
    setSelectedClass("all");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Duyet va cong bo thoi khoa bieu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Doc danh sach lop hoc phan va trang thai phan phong tu database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled>
            <Check className="mr-2 h-4 w-4" />
            Duyet hop le
          </Button>
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="mr-2 h-4 w-4" />
            Cong bo lich
          </Button>
          <Button variant="ghost" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Tong lop HP", value: summary.total, color: "text-purple-600 bg-purple-50" },
          { label: "Chua phan phong", value: summary.unassigned, color: "text-amber-600 bg-amber-50" },
          { label: "Da phan phong", value: summary.assigned, color: "text-blue-600 bg-blue-50" },
          { label: "Co xung dot", value: summary.conflicts, color: "text-red-700 bg-red-50" },
          { label: "Da cong bo", value: summary.published, color: "text-emerald-600 bg-emerald-50" },
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Hoc ky</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Trang thai</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca</SelectItem>
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
                <SelectItem value="all">Tat ca</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.departmentCode || department.code || String(department.id)}>
                    {department.name || department.departmentName || department.departmentCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Lop hanh chinh</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tim theo ma mon, ten mon, lop, giang vien, phong..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Dang tai lop hoc phan...</p>
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
                  <TableHead>Ma MH</TableHead>
                  <TableHead>Ten mon hoc</TableHead>
                  <TableHead>Lop hanh chinh</TableHead>
                  <TableHead>Giang vien</TableHead>
                  <TableHead>Thu</TableHead>
                  <TableHead>Tiet</TableHead>
                  <TableHead>Phong</TableHead>
                  <TableHead>SV</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead className="text-right">Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSections.length > 0 ? filteredSections.map((section) => {
                  const status = getStatus(section);
                  return (
                    <TableRow key={section.id} className="hover:bg-gray-50/40">
                      <TableCell className="text-xs font-semibold text-gray-900">{getCourseCode(section)}</TableCell>
                      <TableCell className="text-xs text-gray-700">{section.courseName || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.classCodes || section.classNames || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.lecturerName || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.day || "-"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.slotStart && section.slotEnd ? `${section.slotStart}-${section.slotEnd}` : "-"}</TableCell>
                      <TableCell className="text-xs font-semibold text-blue-600">{section.room || "Chua phan"}</TableCell>
                      <TableCell className="text-xs text-gray-600">{section.studentCount ?? 0}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[status] || "bg-gray-100 text-gray-700 border-0"}>
                          {STATUS_LABEL[status] || status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="xs" disabled title="Chua co API chi tiet phe duyet">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="xs" disabled>Duyet</Button>
                          <Button variant="ghost" size="xs" disabled>Tu choi</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-sm text-gray-400">
                      Khong co lop hoc phan phu hop.
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

export default AdminTimetableApprovalPage;
export { AdminTimetableApprovalPage };
