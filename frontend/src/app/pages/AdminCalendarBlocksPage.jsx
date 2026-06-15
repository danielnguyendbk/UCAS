import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Edit, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
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

const BLOCK_TYPE_LABEL = {
  HOLIDAY: "Ngay nghi",
  BREAK: "Nghi giua ky",
  EXAM_WEEK: "Tuan thi",
  EVENT: "Su kien",
};

const BLOCK_TYPE_BADGE = {
  HOLIDAY: "bg-amber-100 text-amber-800 border-0",
  BREAK: "bg-sky-100 text-sky-800 border-0",
  EXAM_WEEK: "bg-blue-100 text-blue-800 border-0",
  EVENT: "bg-gray-100 text-gray-800 border-0",
};

const isTeachingAllowed = (block) => block.teachingAllowed === true || block.teachingAllowed === 1;

const AdminCalendarBlocksPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAllowed, setSelectedAllowed] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSemesters = async () => {
      const response = await httpClient.get("/api/categories/semesters").catch(() => ({ data: [] }));
      if (isMounted) setSemesters(getResponseData(response));
    };

    loadSemesters();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadBlocks = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (selectedSemester !== "all") params.semesterId = selectedSemester;
        if (selectedType !== "all") params.type = selectedType;
        const response = await httpClient.get("/api/admin/calendar-blocks", { params });
        if (isMounted) setBlocks(getResponseData(response));
      } catch (err) {
        if (isMounted) {
          setBlocks([]);
          setError(err?.response?.data?.message || "Khong the tai lich hoc vu.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBlocks();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester, selectedType]);

  const filteredBlocks = useMemo(() => (
    blocks.filter((block) => {
      const allowed = isTeachingAllowed(block);
      const matchesAllowed = selectedAllowed === "all" || String(allowed) === selectedAllowed;
      const matchesStart = !filterStartDate || String(block.startDate) >= filterStartDate;
      const matchesEnd = !filterEndDate || String(block.endDate) <= filterEndDate;
      return matchesAllowed && matchesStart && matchesEnd;
    })
  ), [blocks, filterEndDate, filterStartDate, selectedAllowed]);

  const summary = useMemo(() => ({
    total: blocks.length,
    holiday: blocks.filter((block) => block.type === "HOLIDAY").length,
    break: blocks.filter((block) => block.type === "BREAK").length,
    examWeek: blocks.filter((block) => block.type === "EXAM_WEEK").length,
    blocked: blocks.filter((block) => !isTeachingAllowed(block)).length,
  }), [blocks]);

  const resetFilters = () => {
    setSelectedSemester("all");
    setSelectedType("all");
    setSelectedAllowed("all");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ngay nghi / Lich hoc vu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Du lieu ngay nghi, tuan thi va su kien hoc vu lay tu database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Tao ngay nghi
          </Button>
          <Button disabled variant="outline">Tao tuan thi</Button>
          <Button variant="ghost" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Tong su kien", value: summary.total, color: "text-purple-600 bg-purple-50" },
          { label: "Ngay nghi", value: summary.holiday, color: "text-amber-600 bg-amber-50" },
          { label: "Nghi giua ky", value: summary.break, color: "text-sky-600 bg-sky-50" },
          { label: "Tuan thi", value: summary.examWeek, color: "text-blue-600 bg-blue-50" },
          { label: "Khong cho hoc", value: summary.blocked, color: "text-rose-600 bg-rose-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-gray-500">{item.label}</span>
            <span className={`mt-2 block w-max rounded-lg px-2 py-0.5 text-2xl font-bold ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Hoc ky ap dung</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca hoc ky</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Loai su kien</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca loai</SelectItem>
                {Object.entries(BLOCK_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Quy dinh to chuc hoc</Label>
            <Select value={selectedAllowed} onValueChange={setSelectedAllowed}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca quy dinh</SelectItem>
                <SelectItem value="true">Cho phep hoc</SelectItem>
                <SelectItem value="false">Khong cho phep hoc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Tu ngay</Label>
            <Input type="date" value={filterStartDate} onChange={(event) => setFilterStartDate(event.target.value)} className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Den ngay</Label>
            <Input type="date" value={filterEndDate} onChange={(event) => setFilterEndDate(event.target.value)} className="h-9 text-xs" />
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Dang tai lich hoc vu...</p>
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
                  <TableHead>Tieu de su kien</TableHead>
                  <TableHead>Hoc ky</TableHead>
                  <TableHead>Loai</TableHead>
                  <TableHead>Tu ngay</TableHead>
                  <TableHead>Den ngay</TableHead>
                  <TableHead>To chuc hoc</TableHead>
                  <TableHead>Ghi chu</TableHead>
                  <TableHead className="text-right">Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlocks.length > 0 ? filteredBlocks.map((block) => (
                  <TableRow key={block.id} className="hover:bg-gray-50/40">
                    <TableCell className="text-xs font-semibold text-gray-900">{block.title}</TableCell>
                    <TableCell className="text-xs text-gray-600">{block.semesterName || block.semesterCode || "-"}</TableCell>
                    <TableCell>
                      <Badge className={BLOCK_TYPE_BADGE[block.type] || "bg-gray-100 text-gray-800 border-0"}>
                        {BLOCK_TYPE_LABEL[block.type] || block.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-600">{String(block.startDate || "-")}</TableCell>
                    <TableCell className="text-xs font-medium text-gray-600">{String(block.endDate || "-")}</TableCell>
                    <TableCell className="text-xs">
                      <span className={isTeachingAllowed(block) ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                        {isTeachingAllowed(block) ? "Cho phep hoc" : "Khong cho hoc"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-gray-500">{block.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="xs" disabled title="Chua co API cap nhat calendar block">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" disabled title="Chua co API xoa calendar block">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-gray-400">
                      Khong co su kien hoc vu phu hop.
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

export default AdminCalendarBlocksPage;
export { AdminCalendarBlocksPage };
