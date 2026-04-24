import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Calendar, Download, Search, Users, MapPin, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import ScheduleToolbar from "../components/ScheduleToolbar";

const scheduleData = [
  { id: "CS101.L11", name: "Lập trình hướng đối tượng", faculty: "CNTT", credits: 3, students: 45, lecturer: "TS. Nguyễn Văn An", day: "Thứ 2", slot: "Tiết 1-3", time: "07:00-09:30", room: "A-301", week: "15", status: "valid" },
  { id: "MATH201.L02", name: "Toán cao cấp 2", faculty: "TOÁN", credits: 4, students: 60, lecturer: "GS.TS. Trần Thị Bình", day: "Thứ 3", slot: "Tiết 4-6", time: "09:45-12:15", room: "B-105", week: "15", status: "valid" },
  { id: "NET301.L05", name: "Mạng máy tính", faculty: "CNTT", credits: 3, students: 38, lecturer: "ThS. Lê Minh Tú", day: "Thứ 4", slot: "Tiết 1-3", time: "07:00-09:30", room: "C-105", week: "15", status: "pending" },
  { id: "DB202.L08", name: "Cơ sở dữ liệu", faculty: "CNTT", credits: 3, students: 52, lecturer: "TS. Phạm Quang Hưng", day: "Thứ 4", slot: "Tiết 7-9", time: "13:00-15:30", room: "C-201", week: "15", status: "valid" },
  { id: "AI401.L01", name: "Trí tuệ nhân tạo", faculty: "CNTT", credits: 3, students: 35, lecturer: "PGS.TS. Hoàng Văn Nam", day: "Thứ 5", slot: "Tiết 1-3", time: "07:00-09:30", room: "A-301", week: "15", status: "conflict" },
  { id: "SE302.L03", name: "Công nghệ phần mềm", faculty: "CNTT", credits: 3, students: 48, lecturer: "TS. Vũ Thị Lan", day: "Thứ 6", slot: "Tiết 4-6", time: "09:45-12:15", room: "D-102", week: "15", status: "valid" },
  { id: "PHY101.L01", name: "Vật lý đại cương", faculty: "LÝ", credits: 3, students: 55, lecturer: "TS. Trần Văn Hải", day: "Thứ 7", slot: "Tiết 1-3", time: "07:00-09:30", room: "E-101", week: "15", status: "valid" }
];

const timeSlots = ["Tiết 1-3", "Tiết 4-6", "Tiết 7-9", "Tiết 10-12", "Tiết 13-15"];
const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const statusCfg = {
  valid: { label: "Hợp lệ", cls: "bg-green-100 text-green-700" },
  pending: { label: "Chưa phân phòng", cls: "bg-orange-100 text-orange-700" },
  conflict: { label: "Xung đột", cls: "bg-red-100 text-red-700" }
};

const StaffSchedulePage = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24",
    status: "all"
  });
  const [hoveredCell, setHoveredCell] = useState(null);

  const rooms = ["A-101", "A-301", "A-302", "B-105", "B-201", "C-105", "C-201", "D-102", "D-302", "E-101"];

  const filtered = scheduleData.filter((s) => {
    const matchBuilding = filters.building === "all" || s.room.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || s.room === filters.room;
    const matchStatus = filters.status === "all" || s.status === filters.status;
    return matchBuilding && matchRoom && matchStatus;
  });

  const filteredRooms = rooms.filter(r => {
    const matchBuilding = filters.building === "all" || r.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || r === filters.room;
    return matchBuilding && matchRoom;
  });

  // Group filtered schedule by room and time
  const gridData = {};
  filtered.forEach(s => {
    if (!gridData[s.room]) gridData[s.room] = {};
    gridData[s.room][`${s.day}-${s.slot}`] = s;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thời khóa biểu Giáo vụ</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý và theo dõi lịch học toàn hệ thống — Học kỳ 1, 2024-2025</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
            >
              Dạng lưới
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-sm">
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </Button>
        </div>
      </div>

      <ScheduleToolbar 
        filters={filters}
        onBuildingChange={(v) => setFilters(f => ({ ...f, building: v }))}
        onRoomChange={(v) => setFilters(f => ({ ...f, room: v }))}
        onWeekChange={(v) => setFilters(f => ({ ...f, week: v }))}
        onDateChange={(v) => setFilters(f => ({ ...f, date: v }))}
        onSearch={() => console.log("Searching with filters:", filters)} 
        onRefresh={() => window.location.reload()} 
      />

      {viewMode === "grid" ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[70vh]">
          <div className="min-w-[1200px]">
            {/* Table Header */}
            <div className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm">
              <div className="p-4 font-bold text-gray-700 border-r border-gray-200 bg-gray-50 sticky left-0 z-30">Phòng / Thứ</div>
              {days.map((day) => (
                <div key={day} className="p-4 font-bold text-gray-700 text-center border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            {filteredRooms.map((room) => (
              <div key={room}>
                {/* Room Section Header */}
                <div className="grid grid-cols-[150px_repeat(6,1fr)] bg-blue-50/50 border-b border-gray-200 sticky z-10" style={{ top: "53px" }}>
                  <div className="p-3 font-bold text-blue-900 border-r border-gray-200 flex items-center bg-blue-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-blue-400" />
                    {room}
                  </div>
                  <div className="col-span-6 bg-blue-50/30"></div>
                </div>

                {/* Time Slots for the Room */}
                {timeSlots.map((timeSlot) => (
                  <div key={`${room}-${timeSlot}`} className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                    <div className="p-3 text-xs font-semibold text-gray-500 border-r border-gray-200 flex items-center bg-gray-50/80 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {timeSlot}
                    </div>
                    {days.map((day) => {
                      const item = gridData[room]?.[`${day}-${timeSlot}`];
                      const cellKey = `${room}-${day}-${timeSlot}`;
                      const isHovered = hoveredCell === cellKey;
                      
                      return (
                        <div
                          key={day}
                          className={`p-2 border-r border-gray-100 last:border-r-0 min-h-[90px] relative transition-all ${
                            item 
                              ? item.status === "conflict" 
                                ? "bg-red-50 hover:bg-red-100 cursor-pointer" 
                                : "bg-blue-50 hover:bg-blue-100 cursor-pointer" 
                              : "hover:bg-gray-50"
                          }`}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {item && (
                            <div className="text-xs space-y-1 h-full flex flex-col justify-between">
                              <div>
                                <div className="font-bold text-blue-900 leading-tight">{item.name}</div>
                                <div className="text-[10px] text-gray-600 truncate mt-1">{item.lecturer}</div>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Users className="w-3 h-3" />
                                  {item.students}
                                </div>
                                <Badge className={`${statusCfg[item.status].cls} text-[9px] h-4 px-1 w-fit`}>
                                  {statusCfg[item.status].label}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {isHovered && item && (
                            <div className="absolute z-40 top-full left-0 mt-1 bg-gray-900 text-white p-3 rounded-lg shadow-xl text-[11px] w-52 animate-in fade-in zoom-in duration-200">
                              <div className="font-bold border-b border-gray-700 pb-1.5 mb-1.5">{item.name}</div>
                              <div className="space-y-1 text-gray-300">
                                <div className="flex justify-between">
                                  <span>Giảng viên:</span>
                                  <span className="font-semibold text-white text-right">{item.lecturer}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Mã lớp:</span>
                                  <span className="font-semibold text-white">{item.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Số SV:</span>
                                  <span className="font-semibold text-white">{item.students} SV</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                  <span>Thời gian:</span>
                                  <span className="font-semibold text-blue-300">{item.time}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Không tìm thấy kết quả</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Mã lớp HP</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Tên môn học</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Giảng viên</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Lịch học</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Phòng</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className={`hover:bg-gray-50 ${s.status === "conflict" ? "bg-red-50/30" : ""}`}>
                      <TableCell className="font-mono text-xs font-bold text-blue-700">{s.id}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-800">{s.name}</TableCell>
                      <TableCell className="text-xs text-gray-600">{s.lecturer}</TableCell>
                      <TableCell className="text-xs text-gray-700">{s.day} · {s.slot}</TableCell>
                      <TableCell className="text-xs font-semibold text-gray-900">{s.room || "Chưa phân"}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${statusCfg[s.status].cls} text-[11px]`}>{statusCfg[s.status].label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">Sửa</button>
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
        <CardHeader className="py-3 bg-gray-50 border-b">
          <CardTitle className="text-sm font-bold text-gray-700">Ghi chú ký hiệu</CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-50 border border-blue-200 rounded shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Đã được phân phòng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-50 border border-red-200 rounded shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Xung đột / Cần xử lý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white border border-gray-200 rounded shadow-sm" />
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
