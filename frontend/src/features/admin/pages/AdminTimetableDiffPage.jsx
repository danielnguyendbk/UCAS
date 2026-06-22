import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { getTimetableDiff } from "@/features/admin/services/timetableVersionService";

const DAY_LABELS = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "CN",
};

const SESSION_LABELS = {
  THEORY: "Lý thuyết",
  PRACTICE: "Thực hành",
};

function DiffBadge({ type }) {
  if (type === "added") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold flex items-center gap-1 w-fit">
        <PlusCircle className="h-3 w-3" /> Thêm mới
      </Badge>
    );
  }
  if (type === "removed") {
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold flex items-center gap-1 w-fit">
        <MinusCircle className="h-3 w-3" /> Đã xóa
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold flex items-center gap-1 w-fit">
      <RefreshCw className="h-3 w-3" /> Thay đổi
    </Badge>
  );
}

function SectionTable({ title, icon: Icon, sections, diffType, iconClass, search }) {
  const filtered = sections.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.sectionCode?.toLowerCase().includes(q) ||
      s.courseCode?.toLowerCase().includes(q) ||
      s.className?.toLowerCase().includes(q) ||
      s.lecturerCode?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="rounded-xl border overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b ${iconClass}`}>
        <Icon className="h-4 w-4" />
        {title}
        <span className="ml-auto text-xs font-normal opacity-70">{filtered.length} lớp học phần</span>
      </div>
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Không có thay đổi.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Loại</TableHead>
                <TableHead>Mã học phần</TableHead>
                <TableHead>Tên lớp</TableHead>
                <TableHead>Môn học</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.sectionId}>
                  <TableCell><DiffBadge type={diffType} /></TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{s.sectionCode}</TableCell>
                  <TableCell className="text-xs text-slate-600">{s.className}</TableCell>
                  <TableCell className="font-mono text-xs">{s.courseCode}</TableCell>
                  <TableCell className="font-mono text-xs">{s.lecturerCode}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function ScheduleTable({ title, icon: Icon, schedules, diffType, iconClass, search }) {
  const filtered = schedules.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.sectionCode?.toLowerCase().includes(q) ||
      s.courseCode?.toLowerCase().includes(q) ||
      s.classroomCode?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="rounded-xl border overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b ${iconClass}`}>
        <Icon className="h-4 w-4" />
        {title}
        <span className="ml-auto text-xs font-normal opacity-70">{filtered.length} ca học</span>
      </div>
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Không có thay đổi.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Loại</TableHead>
                <TableHead>Học phần</TableHead>
                <TableHead>Môn học</TableHead>
                <TableHead>Thứ</TableHead>
                <TableHead>Tiết</TableHead>
                <TableHead>Hình thức</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.scheduleId}>
                  <TableCell><DiffBadge type={diffType} /></TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{s.sectionCode}</TableCell>
                  <TableCell className="font-mono text-xs">{s.courseCode}</TableCell>
                  <TableCell className="text-xs">{DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}</TableCell>
                  <TableCell className="text-xs">{s.slotStart} → {s.slotEnd}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {SESSION_LABELS[s.sessionType] ?? s.sessionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.classroomCode || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

export default function AdminTimetableDiffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const semesterId = searchParams.get("semesterId");
  const versionAParam = searchParams.get("versionA");
  const versionBParam = searchParams.get("versionB");

  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("sections");
  const [search, setSearch] = useState("");

  // Local inputs for manual version selection
  const [inputSemesterId, setInputSemesterId] = useState(semesterId ?? "");
  const [inputVersionA, setInputVersionA] = useState(versionAParam ?? "");
  const [inputVersionB, setInputVersionB] = useState(versionBParam ?? "");

  const fetchDiff = async (sid, vA, vB) => {
    if (!sid || !vA || !vB) return;
    try {
      setLoading(true);
      setDiff(null);
      const data = await getTimetableDiff({ semesterId: sid, versionA: vA, versionB: vB });
      setDiff(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể tải kết quả so sánh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (semesterId && versionAParam && versionBParam) {
      fetchDiff(semesterId, versionAParam, versionBParam);
    }
  }, []);

  const totalSectionChanges = diff
    ? (diff.addedSections?.length ?? 0) + (diff.modifiedSections?.length ?? 0)
    : 0;
  const totalScheduleChanges = diff
    ? (diff.addedSchedules?.length ?? 0) +
      (diff.modifiedSchedules?.length ?? 0) +
      (diff.removedSchedules?.length ?? 0)
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                So sánh phiên bản thời khóa biểu
              </h1>
            </div>
            {diff && (
              <p className="text-sm text-slate-500 mt-0.5">
                {diff.semesterName} · v{diff.versionA} → v{diff.versionB}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Version selector */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">ID học kỳ</label>
          <Input
            value={inputSemesterId}
            onChange={(e) => setInputSemesterId(e.target.value)}
            placeholder="VD: 1"
            className="bg-slate-50"
          />
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Phiên bản A</label>
          <Input
            type="number"
            min={1}
            value={inputVersionA}
            onChange={(e) => setInputVersionA(e.target.value)}
            placeholder="VD: 1"
            className="bg-slate-50"
          />
        </div>
        <div className="flex items-center justify-center self-end pb-1">
          <ArrowLeftRight className="h-4 w-4 text-slate-400" />
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Phiên bản B</label>
          <Input
            type="number"
            min={1}
            value={inputVersionB}
            onChange={(e) => setInputVersionB(e.target.value)}
            placeholder="VD: 2"
            className="bg-slate-50"
          />
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 self-end"
          disabled={loading || !inputSemesterId || !inputVersionA || !inputVersionB}
          onClick={() => fetchDiff(inputSemesterId, inputVersionA, inputVersionB)}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {loading ? "Đang so sánh..." : "So sánh"}
        </Button>
      </section>

      {/* Summary chips */}
      {diff && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
            <PlusCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-emerald-800">{diff.addedSections?.length ?? 0}</span>
            <span className="text-emerald-700">lớp học phần thêm</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <RefreshCw className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-800">{diff.modifiedSections?.length ?? 0}</span>
            <span className="text-amber-700">lớp học phần sửa</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
            <PlusCircle className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-emerald-800">{diff.addedSchedules?.length ?? 0}</span>
            <span className="text-emerald-700">ca học thêm</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <RefreshCw className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-800">{diff.modifiedSchedules?.length ?? 0}</span>
            <span className="text-amber-700">ca học sửa</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
            <MinusCircle className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-red-800">{diff.removedSchedules?.length ?? 0}</span>
            <span className="text-red-700">ca học hủy</span>
          </div>
          {totalSectionChanges + totalScheduleChanges === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Không phát hiện thay đổi giữa hai phiên bản.</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs + search */}
      {diff && (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setTab("sections")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  tab === "sections"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Lớp học phần
                {totalSectionChanges > 0 && (
                  <span className="ml-1.5 rounded-full bg-blue-100 text-blue-700 px-1.5 text-[11px] font-semibold">
                    {totalSectionChanges}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("schedules")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  tab === "schedules"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Lịch học
                {totalScheduleChanges > 0 && (
                  <span className="ml-1.5 rounded-full bg-blue-100 text-blue-700 px-1.5 text-[11px] font-semibold">
                    {totalScheduleChanges}
                  </span>
                )}
              </button>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Lọc theo mã môn, lớp, phòng..."
                className="pl-9 bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            {tab === "sections" && (
              <>
                <SectionTable
                  title="Lớp học phần thêm mới"
                  icon={PlusCircle}
                  sections={diff.addedSections ?? []}
                  diffType="added"
                  iconClass="bg-emerald-50 text-emerald-700 border-emerald-100"
                  search={search}
                />
                <SectionTable
                  title="Lớp học phần thay đổi"
                  icon={RefreshCw}
                  sections={diff.modifiedSections ?? []}
                  diffType="modified"
                  iconClass="bg-amber-50 text-amber-700 border-amber-100"
                  search={search}
                />
              </>
            )}
            {tab === "schedules" && (
              <>
                <ScheduleTable
                  title="Lịch học thêm mới"
                  icon={PlusCircle}
                  schedules={diff.addedSchedules ?? []}
                  diffType="added"
                  iconClass="bg-emerald-50 text-emerald-700 border-emerald-100"
                  search={search}
                />
                <ScheduleTable
                  title="Lịch học thay đổi"
                  icon={RefreshCw}
                  schedules={diff.modifiedSchedules ?? []}
                  diffType="modified"
                  iconClass="bg-amber-50 text-amber-700 border-amber-100"
                  search={search}
                />
                <ScheduleTable
                  title="Lịch học đã hủy"
                  icon={MinusCircle}
                  schedules={diff.removedSchedules ?? []}
                  diffType="removed"
                  iconClass="bg-red-50 text-red-700 border-red-100"
                  search={search}
                />
              </>
            )}
          </div>
        </>
      )}

      {!diff && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
          <ArrowLeftRight className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">Chọn hai phiên bản để so sánh.</p>
        </div>
      )}
    </div>
  );
}
