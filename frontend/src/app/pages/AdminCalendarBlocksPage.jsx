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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { httpClient } from "@/services/httpClient";

const getResponseData = (response) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const BLOCK_TYPE_LABEL = {
  HOLIDAY: "Ngày nghỉ",
  BREAK: "Nghỉ giữa kỳ",
  EXAM_WEEK: "Tuần thi",
  EVENT: "Sự kiện",
};

const BLOCK_TYPE_BADGE = {
  HOLIDAY: "bg-amber-100 text-amber-800 border-0",
  BREAK: "bg-sky-100 text-sky-800 border-0",
  EXAM_WEEK: "bg-blue-100 text-blue-800 border-0",
  EVENT: "bg-gray-100 text-gray-800 border-0",
};

const isTeachingAllowed = (block) => block.teachingAllowed === true || block.teachingAllowed === 1;

const EMPTY_FORM = {
  semesterId: "",
  title: "",
  type: "HOLIDAY",
  startDate: "",
  endDate: "",
  teachingAllowed: "false",
  note: "",
};

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

  const loadBlocks = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (selectedSemester !== "all") params.semesterId = selectedSemester;
      if (selectedType !== "all") params.type = selectedType;
      const response = await httpClient.get("/api/admin/calendar-blocks", { params });
      setBlocks(getResponseData(response));
    } catch (err) {
      setBlocks([]);
      setError(err?.response?.data?.message || "Không thể tải lịch học vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
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
          setError(err?.response?.data?.message || "Không thể tải lịch học vụ.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
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

  const openCreate = () => {
    setEditingBlock(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (block) => {
    setEditingBlock(block);
    setForm({
      semesterId: String(block.semesterId ?? ""),
      title: block.title ?? "",
      type: block.type ?? "HOLIDAY",
      startDate: block.startDate ? String(block.startDate) : "",
      endDate: block.endDate ? String(block.endDate) : "",
      teachingAllowed: isTeachingAllowed(block) ? "true" : "false",
      note: block.notes ?? "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.type || !form.startDate || !form.endDate) {
      setFormError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!editingBlock && !form.semesterId) {
      setFormError("Vui lòng chọn học kỳ.");
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      title: form.title.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      teachingAllowed: form.teachingAllowed === "true",
      note: form.note.trim() || null,
    };
    try {
      if (editingBlock) {
        await httpClient.put(`/api/admin/calendar-blocks/${editingBlock.id}`, payload);
      } else {
        await httpClient.post("/api/admin/calendar-blocks", {
          ...payload,
          semesterId: Number(form.semesterId),
        });
      }
      setDialogOpen(false);
      await loadBlocks();
    } catch (err) {
      setFormError(err?.response?.data?.message || (editingBlock ? "Cập nhật thất bại." : "Tạo thất bại."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (block) => {
    if (!window.confirm(`Xóa "${block.title}"?`)) return;
    try {
      await httpClient.delete(`/api/admin/calendar-blocks/${block.id}`);
      await loadBlocks();
    } catch (err) {
      alert(err?.response?.data?.message || "Xóa thất bại.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ngày nghỉ / Lịch học vụ</h1>
          <p className="mt-1 text-sm text-gray-500">
            Dữ liệu ngày nghỉ, tuần thi và sự kiện học vụ lấy từ database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Tạo ngày nghỉ
          </Button>
          <Button variant="ghost" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Tổng sự kiện", value: summary.total, color: "text-purple-600 bg-purple-50" },
          { label: "Ngày nghỉ", value: summary.holiday, color: "text-amber-600 bg-amber-50" },
          { label: "Nghỉ giữa kỳ", value: summary.break, color: "text-sky-600 bg-sky-50" },
          { label: "Tuần thi", value: summary.examWeek, color: "text-blue-600 bg-blue-50" },
          { label: "Không cho học", value: summary.blocked, color: "text-rose-600 bg-rose-50" },
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
            <Label className="text-xs font-semibold text-gray-600">Học kỳ áp dụng</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả học kỳ</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Loại sự kiện</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Object.entries(BLOCK_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Từ ngày</Label>
            <Input type="date" value={filterStartDate} onChange={(event) => setFilterStartDate(event.target.value)} className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600">Đến ngày</Label>
            <Input type="date" value={filterEndDate} onChange={(event) => setFilterEndDate(event.target.value)} className="h-9 text-xs" />
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-gray-600">Đang tải lịch học vụ...</p>
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
                  <TableHead>Tiêu đề sự kiện</TableHead>
                  <TableHead>Học kỳ</TableHead>
                  <TableHead>Loai</TableHead>
                  <TableHead>Từ ngày</TableHead>
                  <TableHead>Đến ngày</TableHead>
                  <TableHead>Tổ chức học</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
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
                        {isTeachingAllowed(block) ? "Cho phép học" : "Không cho học"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-gray-500">{block.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openEdit(block)}
                          className="text-blue-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(block)}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-sm text-gray-400">
                      Không có sự kiện học vụ phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Cập nhật sự kiện học vụ" : "Tạo ngày nghỉ / sự kiện học vụ"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {formError}
              </div>
            )}

            {!editingBlock && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Học kỳ <span className="text-rose-500">*</span>
                </Label>
                <Select value={form.semesterId} onValueChange={(value) => handleFormChange("semesterId", value)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Chọn học kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Tiêu đề <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(event) => handleFormChange("title", event.target.value)}
                placeholder="VD: Nghỉ Tết Nguyên Đán"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Loại <span className="text-rose-500">*</span>
                </Label>
                <Select value={form.type} onValueChange={(value) => handleFormChange("type", value)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BLOCK_TYPE_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Tổ chức học</Label>
                <Select value={form.teachingAllowed} onValueChange={(value) => handleFormChange("teachingAllowed", value)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không cho phép học</SelectItem>
                    <SelectItem value="true">Cho phép học</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Từ ngày <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => handleFormChange("startDate", event.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Đến ngày <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => handleFormChange("endDate", event.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Ghi chú</Label>
              <Input
                value={form.note}
                onChange={(event) => handleFormChange("note", event.target.value)}
                placeholder="Ghi chú thêm (không bắt buộc)"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingBlock ? "Lưu" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendarBlocksPage;
export { AdminCalendarBlocksPage };
