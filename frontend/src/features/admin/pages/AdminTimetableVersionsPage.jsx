import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Calendar, History, ArrowLeftRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import { getImportSemesters } from "@/features/admin/services/timetableImportService";
import { getTimetableVersions, rollbackTimetableVersion } from "@/features/admin/services/timetableVersionService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export default function AdminTimetableVersionsPage() {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState("all");
  const [search, setSearch] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Rollback state
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    getImportSemesters()
      .then((items) => setSemesters(items))
      .catch(() => toast.error("Không thể tải danh sách học kỳ."));
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const semId = semesterId === "all" ? undefined : Number(semesterId);
      const data = await getTimetableVersions({ semesterId: semId, search });
      setVersions(Array.isArray(data) ? data : data?.content ?? []);
    } catch (error) {
      toast.error("Không thể tải lịch sử phiên bản.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [semesterId, search]);

  const handleSelectVersion = (versionNo) => {
    if (selectedVersions.includes(versionNo)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionNo));
    } else {
      if (selectedVersions.length >= 2) {
        toast.warning("Chỉ được chọn tối đa 2 phiên bản để so sánh.");
        return;
      }
      setSelectedVersions([...selectedVersions, versionNo]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length !== 2) {
      toast.error("Vui lòng chọn đúng 2 phiên bản để so sánh.");
      return;
    }
    const [vA, vB] = selectedVersions;
    navigate(`/admin/timetable-versions/diff?semesterId=${semesterId}&versionA=${Math.min(vA, vB)}&versionB=${Math.max(vA, vB)}`);
  };

  const handleOpenRollback = (version) => {
    setRollbackTarget(version);
  };

  const handleConfirmRollback = async () => {
    if (!rollbackTarget) return;
    try {
      setRollingBack(true);
      await rollbackTimetableVersion({
        semesterId: rollbackTarget.semesterId,
        versionNo: rollbackTarget.versionNo
      });
      toast.success("Khôi phục phiên bản thời khóa biểu thành công!");
      setRollbackTarget(null);
      fetchVersions();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể khôi phục phiên bản thời khóa biểu.");
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch sử phiên bản thời khóa biểu</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Xem, so sánh và khôi phục (rollback) các phiên bản thời khóa biểu đã lưu.
          </p>
        </div>
        {selectedVersions.length === 2 && (
          <Button onClick={handleCompare} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeftRight className="mr-2 h-4 w-4" /> So sánh 2 phiên bản đã chọn
          </Button>
        )}
      </header>

      <section className="flex flex-col gap-4 md:flex-row md:items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full md:w-64">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Học kỳ</label>
          <Select value={semesterId} onValueChange={(val) => { setSemesterId(val); setSelectedVersions([]); }}>
            <SelectTrigger className="bg-slate-50">
              <SelectValue placeholder="Tất cả học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả học kỳ</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s.id ?? s.semester_id} value={String(s.id ?? s.semester_id)}>
                  {s.name ?? s.semester_name ?? s.semester_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mô tả tóm tắt, người tạo..."
              className="pl-9 bg-slate-50"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Chọn</TableHead>
              <TableHead className="w-24">Phiên bản</TableHead>
              <TableHead>Học kỳ</TableHead>
              <TableHead>Tóm tắt / Thay đổi</TableHead>
              <TableHead className="w-48">Người tạo</TableHead>
              <TableHead className="w-48">Thời gian tạo</TableHead>
              <TableHead className="w-32 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Không tìm thấy lịch sử phiên bản nào.
                </TableCell>
              </TableRow>
            ) : (
              versions.map((v) => {
                const isSelected = selectedVersions.includes(v.versionNo);
                return (
                  <TableRow key={v.versionId} className="hover:bg-slate-50/50">
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectVersion(v.versionNo)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        v{v.versionNo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {v.semesterName || v.semesterCode}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-md truncate">
                      {v.summary}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {v.createdByName}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {v.createdAt ? new Date(v.createdAt).toLocaleString("vi-VN") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenRollback(v)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" /> Rollback
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={!!rollbackTarget} onOpenChange={(open) => !rollingBack && !open && setRollbackTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="h-5 w-5" /> Xác nhận khôi phục phiên bản
            </DialogTitle>
            <DialogDescription>
              Bạn đang chuẩn bị khôi phục thời khóa biểu học kỳ này về phiên bản <strong>v{rollbackTarget?.versionNo}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
            <p><strong>Cảnh báo:</strong> Toàn bộ lịch hiện tại trong học kỳ (nếu đang ở trạng thái DRAFT hoặc CONFLICT) sẽ bị ghi đè hoàn toàn bằng dữ liệu của phiên bản này.</p>
            <p>Thao tác này <strong>không thể hoàn tác</strong> trực tiếp mà chỉ có thể khôi phục lại từ một phiên bản khác.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={rollingBack} onClick={() => setRollbackTarget(null)}>
              Hủy
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={rollingBack}
              onClick={handleConfirmRollback}
            >
              {rollingBack ? "Đang khôi phục..." : "Xác nhận Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
