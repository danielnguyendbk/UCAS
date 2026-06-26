import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import ScheduleToolbar from "../components/ScheduleToolbar";
import { RoomTimetableGridView } from "../components/RoomTimetableGridView";
import { httpClient } from "../../services/httpClient";

const scheduleData = [
  { id: "CS101.L11", name: "Lập trình hướng đối tượng", faculty: "CNTT", credits: 3, students: 45, lecturer: "TS. Nguyễn Văn An", day: "Thứ 2", slot: "Tiết 1-3", time: "07:00-09:30", room: "A-301", week: "15", status: "valid" },
  { id: "MATH201.L02", name: "Toán cao cấp 2", faculty: "TOÁN", credits: 4, students: 60, lecturer: "GS.TS. Trần Thị Bình", day: "Thứ 3", slot: "Tiết 4-6", time: "09:45-12:15", room: "B-105", week: "15", status: "valid" },
  { id: "NET301.L05", name: "Mạng máy tính", faculty: "CNTT", credits: 3, students: 38, lecturer: "ThS. Lê Minh Tú", day: "Thứ 4", slot: "Tiết 1-3", time: "07:00-09:30", room: "C-105", week: "15", status: "pending" },
  { id: "DB202.L08", name: "Cơ sở dữ liệu", faculty: "CNTT", credits: 3, students: 52, lecturer: "TS. Phạm Quang Hưng", day: "Thứ 4", slot: "Tiết 7-9", time: "13:00-15:30", room: "C-201", week: "15", status: "valid" },
  { id: "AI401.L01", name: "Trí tuệ nhân tạo", faculty: "CNTT", credits: 3, students: 35, lecturer: "PGS.TS. Hoàng Văn Nam", day: "Thứ 5", slot: "Tiết 1-3", time: "07:00-09:30", room: "A-301", week: "15", status: "conflict" },
  { id: "SE302.L03", name: "Công nghệ phần mềm", faculty: "CNTT", credits: 3, students: 48, lecturer: "TS. Vũ Thị Lan", day: "Thứ 6", slot: "Tiết 4-6", time: "09:45-12:15", room: "D-102", week: "15", status: "valid" },
  { id: "PHY101.L01", name: "Vật lý đại cương", faculty: "LÝ", credits: 3, students: 55, lecturer: "TS. Trần Văn Hải", day: "Thứ 7", slot: "Tiết 1-3", time: "07:00-09:30", room: "E-101", week: "15", status: "valid" },
];

const statusCfg = {
  valid: { label: "Hợp lệ", cls: "bg-green-100 text-green-700" },
  pending: { label: "Chưa phân phòng", cls: "bg-orange-100 text-orange-700" },
  conflict: { label: "Xung đột", cls: "bg-red-100 text-red-700" },
};

const dayToCode = (day) => {
  if (String(day).includes("2")) return "MON";
  if (String(day).includes("3")) return "TUE";
  if (String(day).includes("4")) return "WED";
  if (String(day).includes("5")) return "THU";
  if (String(day).includes("6")) return "FRI";
  if (String(day).includes("7")) return "SAT";
  return "SUN";
};

const parseSlotRange = (slot) => {
  const values = String(slot).match(/\d+/g)?.map(Number) || [];
  if (!values.length) return { slotStart: null, slotEnd: null };
  return {
    slotStart: values[0],
    slotEnd: values[values.length - 1],
  };
};

const parseTimeRange = (time) => {
  const [startTime = "", endTime = ""] = String(time).split("-");
  return {
    startTime: startTime.trim(),
    endTime: endTime.trim(),
  };
};

const mapStaffScheduleRow = (item) => {
  const { slotStart, slotEnd } = parseSlotRange(item.slot);
  const { startTime, endTime } = parseTimeRange(item.time);
  const [courseCode, sectionGroup = "---"] = item.id.split(".");

  return {
    id: item.id,
    courseCode,
    sectionGroup,
    courseName: item.name,
    lecturer: item.lecturer,
    students: item.students,
    dayCode: dayToCode(item.day),
    room: item.room,
    allocationStatus: item.status === "conflict" ? "CONFLICT" : "ASSIGNED",
    slotStart,
    slotEnd,
    startTime,
    endTime,
  };
};

const StaffSchedulePage = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [timeSlots, setTimeSlots] = useState([]);
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24",
    status: "all",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchTimeSlots = async () => {
      try {
        const response = await httpClient.get("/api/categories/time-slots");
        const slots = response.data?.data || response.data || [];
        if (isMounted) setTimeSlots(Array.isArray(slots) ? slots : []);
      } catch (error) {
        console.error("Lỗi tải khung giờ thời khóa biểu:", error);
      }
    };

    fetchTimeSlots();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = scheduleData.filter((item) => {
    const matchBuilding =
      filters.building === "all" || item.room.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || item.room === filters.room;
    const matchStatus = filters.status === "all" || item.status === filters.status;
    const matchWeek = !filters.week || item.week === filters.week;
    return matchBuilding && matchRoom && matchStatus && matchWeek;
  });

  const gridRows = filtered.map(mapStaffScheduleRow);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thời khóa biểu Giáo vụ</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý và theo dõi lịch học toàn hệ thống - Học kỳ 1, 2024-2025
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "list" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "grid" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Dạng lưới
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-sm">
            <Download className="h-3.5 w-3.5" /> Xuất Excel
          </Button>
        </div>
      </div>

      <ScheduleToolbar
        filters={filters}
        onBuildingChange={(value) => setFilters((prev) => ({ ...prev, building: value }))}
        onRoomChange={(value) => setFilters((prev) => ({ ...prev, room: value }))}
        onWeekChange={(value) => setFilters((prev) => ({ ...prev, week: value }))}
        onDateChange={(value) => setFilters((prev) => ({ ...prev, date: value }))}
        onSearch={() => console.log("Searching with filters:", filters)}
        onRefresh={() => window.location.reload()}
      />

      {viewMode === "grid" ? (
        <RoomTimetableGridView rows={gridRows} timeSlots={timeSlots} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-500">Không tìm thấy kết quả</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Mã lớp học phần HP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Tên môn học</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Giảng viên</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Lịch học</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600">Trạng thái</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-gray-600">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-gray-50 ${item.status === "conflict" ? "bg-red-50/30" : ""}`}
                    >
                      <TableCell className="font-mono text-xs font-bold text-blue-700">{item.id}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-800">{item.name}</TableCell>
                      <TableCell className="text-xs text-gray-600">{item.lecturer}</TableCell>
                      <TableCell className="text-xs text-gray-700">{item.day} · {item.slot}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900">{item.room || "Chưa phân"}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${statusCfg[item.status].cls} text-[11px]`}>
                          {statusCfg[item.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800">
                          Sửa
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b bg-gray-50 py-3">
          <CardTitle className="text-sm font-bold text-gray-700">Ghi chú ký hiệu</CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-blue-200 bg-blue-50 shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Đã được phân phòng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-red-200 bg-red-50 shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Xung đột / Cần xử lý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-gray-200 bg-white shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Lịch trống</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { StaffSchedulePage };
export default StaffSchedulePage;
