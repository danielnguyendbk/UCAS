import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Calendar, FileSpreadsheet, ShieldAlert, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs } from "@/features/admin/services/auditService";
import { httpClient } from "@/services/httpClient";
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

const AUDIT_ACTIONS = [
  { value: "all", label: "Tất cả hành động" },
  { value: "INSERT", label: "INSERT (Thêm)" },
  { value: "UPDATE", label: "UPDATE (Sửa)" },
  { value: "DELETE", label: "DELETE (Xóa)" },
  { value: "LOGIN", label: "LOGIN (Đăng nhập)" },
  { value: "LOGOUT", label: "LOGOUT (Đăng xuất)" },
  { value: "APPROVE", label: "APPROVE (Duyệt)" },
  { value: "REJECT", label: "REJECT (Từ chối)" },
  { value: "REQUEST", label: "REQUEST (Yêu cầu)" },
  { value: "CANCEL", label: "CANCEL (Hủy)" },
  { value: "ASSIGN_ROOM", label: "ASSIGN_ROOM (Gán phòng)" },
  { value: "CHANGE_ROOM", label: "CHANGE_ROOM (Đổi phòng)" },
  { value: "GENERATE_SESSION", label: "GENERATE_SESSION (Tạo ca học)" },
  { value: "SCHEDULE_EXAM", label: "SCHEDULE_EXAM (Xếp lịch thi)" },
  { value: "OPEN_ROOM", label: "OPEN_ROOM (Mở phòng)" },
  { value: "CLOSE_ROOM", label: "CLOSE_ROOM (Đóng phòng)" },
  { value: "ROLLBACK", label: "ROLLBACK (Khôi phục)" },
];

export default function AdminAuditHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters state
  const [userId, setUserId] = useState("all");
  const [action, setAction] = useState("all");
  const [tableName, setTableName] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [page, setPage] = useState(0);
  const [size] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load user list for filter
  useEffect(() => {
    httpClient.get("/api/admin/users")
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? [];
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Không thể tải danh sách tài khoản người dùng."));
  }, []);

  const fetchLogs = async (currentPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size,
        userId: userId === "all" ? undefined : Number(userId),
        action: action === "all" ? undefined : action,
        tableName: tableName.trim() || undefined,
        search: search.trim() || undefined,
        startDate: startDate ? `${startDate}T00:00:00` : undefined,
        endDate: endDate ? `${endDate}T23:59:59` : undefined,
      };

      const data = await getAuditLogs(params);
      setLogs(data?.items || []);
      setTotalItems(data?.totalItems || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      toast.error("Không thể tải nhật ký hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchLogs(0);
  }, [userId, action, startDate, endDate]);

  // Debounced/Triggered searches
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs(0);
  };

  const handleResetFilters = () => {
    setUserId("all");
    setAction("all");
    setTableName("");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(0);
    setTimeout(() => fetchLogs(0), 50);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      // Fetch ALL logs with current filters (no page or size)
      const params = {
        userId: userId === "all" ? undefined : Number(userId),
        action: action === "all" ? undefined : action,
        tableName: tableName.trim() || undefined,
        search: search.trim() || undefined,
        startDate: startDate ? `${startDate}T00:00:00` : undefined,
        endDate: endDate ? `${endDate}T23:59:59` : undefined,
      };

      const data = await getAuditLogs(params);
      const allLogs = data?.items || [];

      if (allLogs.length === 0) {
        toast.warning("Không có dữ liệu nhật ký để xuất file.");
        return;
      }

      // Generate CSV content
      const headers = [
        "Mã ID",
        "Người thực hiện",
        "Vai trò",
        "Hành động",
        "Bảng tác động",
        "Mã Bản ghi",
        "Địa chỉ IP",
        "Mô tả",
        "Thời gian",
        "Giá trị cũ",
        "Giá trị mới"
      ];

      const csvRows = [
        "\uFEFF" + headers.join(","), // add BOM for Excel UTF-8 support
        ...allLogs.map((log) => {
          const escape = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          };
          return [
            log.id,
            escape(log.username),
            escape(log.userRole),
            escape(log.action),
            escape(log.tableName),
            log.recordId || "",
            escape(log.ipAddress),
            escape(log.description),
            log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "",
            escape(log.oldValues),
            escape(log.newValues)
          ].join(",");
        })
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `UCAS_Audit_Logs_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Xuất file CSV nhật ký hệ thống thành công!");
    } catch (error) {
      toast.error("Không thể xuất file CSV.");
    } finally {
      setExporting(false);
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "INSERT":
        return "bg-green-50 text-green-700 border-green-200";
      case "UPDATE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "ROLLBACK":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOGIN":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nhật ký hệ thống (Audit Logs)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, lọc và truy vết tất cả các hành động thay đổi dữ liệu và trạng thái trong hệ thống.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleResetFilters} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Đặt lại bộ lọc
          </Button>
          <Button
            onClick={handleExportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            size="sm"
            disabled={exporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </Button>
        </div>
      </header>

      {/* Filter panel */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Hành động</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tất cả hành động" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_ACTIONS.map((act) => (
                  <SelectItem key={act.value} value={act.value}>
                    {act.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Người thực hiện</label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tất cả người dùng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả người dùng</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.username} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bảng dữ liệu</label>
            <Input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="VD: semesters, users..."
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Từ ngày</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-8 bg-slate-50 border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Đến ngày</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-8 bg-slate-50 border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh theo mô tả, IP Address..."
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>
      </section>

      {/* Audit Logs Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow>
              <TableHead className="w-16 text-center">ID</TableHead>
              <TableHead className="w-40">Thời gian</TableHead>
              <TableHead className="w-36">Người dùng</TableHead>
              <TableHead className="w-32">Vai trò</TableHead>
              <TableHead className="w-36">Hành động</TableHead>
              <TableHead className="w-40">Bảng / ID</TableHead>
              <TableHead>Mô tả thay đổi</TableHead>
              <TableHead className="w-32">Địa chỉ IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                    <span>Đang tải dữ liệu nhật ký...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                  Không tìm thấy lịch sử nhật ký hệ thống nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/30">
                  <TableCell className="text-center font-mono text-xs text-slate-500">
                    {log.id}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {log.username}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs bg-slate-50 font-normal">
                      {log.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {log.tableName} {log.recordId ? `#${log.recordId}` : ""}
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm max-w-sm truncate" title={log.description}>
                    {log.description || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">
                    {log.ipAddress || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-800">{logs.length}</span> / <span className="font-medium text-slate-800">{totalItems}</span> bản ghi
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prev = Math.max(0, page - 1);
                  setPage(prev);
                  fetchLogs(prev);
                }}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
              </Button>
              <div className="text-xs font-medium text-slate-600 px-2">
                Trang {page + 1} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = Math.min(totalPages - 1, page + 1);
                  setPage(next);
                  fetchLogs(next);
                }}
                disabled={page === totalPages - 1}
              >
                Sau <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
