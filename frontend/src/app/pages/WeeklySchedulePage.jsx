import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, Users, Search } from "lucide-react";
import ScheduleToolbar from "../components/ScheduleToolbar";

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00"
];
const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const ROLE_SCHEDULE_CONFIG = {
  Admin: {
    title: "Lịch trực quan hàng tuần",
    subtitle: "Giao diện lưới tương tác theo dõi lịch phòng học",
    rowHeader: "Phòng / Thứ",
    rowItemLabel: "Phòng",
    detailLabel: "Giảng viên",
    countLabel: "Sinh viên",
    rows: [
      "A-101", "A-102", "A-301", "A-302", 
      "B-105", "B-106", "B-201", "B-202",
      "C-105", "C-201", "C-301", "C-302",
      "D-102", "D-302", "D-401", "D-402",
      "E-101", "E-201", "E-301"
    ],
    scheduleData: {
      "A-301": {
        "Thứ 2-08:00 - 10:00": { code: "CS101", detail: "TS. Nguyễn Văn An", count: 45 },
        "Thứ 3-10:00 - 12:00": { code: "MATH201", detail: "GS.TS. Trần Thị Bình", count: 60 },
        "Thứ 4-14:00 - 16:00": { code: "PHY301", detail: "TS. Trần Văn Hải", count: 35 }
      },
      "A-302": {
        "Thứ 2-10:00 - 12:00": { code: "ENG102", detail: "ThS. Lê Minh Tú", count: 50 },
        "Thứ 5-08:00 - 10:00": { code: "BIO201", detail: "TS. Vũ Thị Lan", count: 40 }
      },
      "B-105": {
        "Thứ 3-08:00 - 10:00": { code: "CHEM301", detail: "TS. Phạm Quang Hưng", count: 38 },
        "Thứ 7-14:00 - 16:00": { code: "CS201", detail: "PGS.TS. Hoàng Văn Nam", count: 42 }
      }
    }
  },
  Staff: {
    title: "Theo dõi phân phòng",
    subtitle: "Giám sát việc sử dụng phòng học toàn trường",
    rowHeader: "Phòng / Thứ",
    rowItemLabel: "Phòng",
    detailLabel: "Trạng thái",
    countLabel: "Số chỗ dùng",
    rows: [
      "A-301", "A-302", "B-105", "B-201", "C-201", "C-301", "D-102", "D-302", "E-101"
    ],
    scheduleData: {
      "A-301": {
        "Thứ 2-08:00 - 10:00": { code: "CS101.L11", detail: "Đã phân", count: 45 },
        "Thứ 5-08:00 - 10:00": { code: "AI401.L01", detail: "Xung đột", count: 35, status: "conflict" }
      },
      "C-201": {
        "Thứ 4-14:00 - 16:00": { code: "DB202.L08", detail: "Đã phân", count: 52 }
      }
    }
  }
};

const WeeklySchedulePage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24"
  });
  const [hoveredCell, setHoveredCell] = useState(null);

  const roleConfig = ROLE_SCHEDULE_CONFIG[user?.role] || ROLE_SCHEDULE_CONFIG.Admin;
  const { title, subtitle, rowHeader, rowItemLabel, detailLabel, countLabel, rows, scheduleData } = roleConfig;

  const filteredRows = rows.filter(r => {
    const matchBuilding = filters.building === "all" || r.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || r === filters.room;
    return matchBuilding && matchRoom;
  });

  return (
    <div className="p-6 space-y-6">
      <ScheduleToolbar 
        filters={filters}
        onBuildingChange={(v) => setFilters(f => ({ ...f, building: v }))}
        onRoomChange={(v) => setFilters(f => ({ ...f, room: v }))}
        onWeekChange={(v) => setFilters(f => ({ ...f, week: v }))}
        onDateChange={(v) => setFilters(f => ({ ...f, date: v }))}
        onSearch={() => console.log("Searching with filters:", filters)} 
        onRefresh={() => window.location.reload()} 
      />

      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-dashed border-gray-300">
          <Search className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">Không tìm thấy phòng học nào</p>
          <p className="text-xs text-gray-400 mt-1">Vui lòng thử thay đổi bộ lọc tòa nhà hoặc tên phòng</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[70vh]">
          <div className="min-w-[1200px]">
            {/* Table Header */}
            <div className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm">
              <div className="p-4 font-bold text-gray-700 border-r border-gray-200 bg-gray-50 sticky left-0 z-30">{rowHeader}</div>
              {days.map((day) => (
                <div key={day} className="p-4 font-bold text-gray-700 text-center border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            {filteredRows.map((row) => (
              <div key={row}>
                {/* Room Section Header */}
                <div className="grid grid-cols-[150px_repeat(6,1fr)] bg-blue-50/50 border-b border-gray-200 sticky z-10" style={{ top: "53px" }}>
                  <div className="p-3 font-bold text-blue-900 border-r border-gray-200 flex items-center bg-blue-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    {row}
                  </div>
                  <div className="col-span-6 bg-blue-50/30"></div>
                </div>

                {/* Time Slots for the Room */}
                {timeSlots.map((timeSlot) => (
                  <div key={`${row}-${timeSlot}`} className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                    <div className="p-3 text-xs font-semibold text-gray-500 border-r border-gray-200 flex items-center bg-gray-50/80 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {timeSlot}
                    </div>
                    {days.map((day) => {
                      const cellKey = `${day}-${timeSlot}`;
                      const classData = scheduleData[row]?.[cellKey];
                      const isHovered = hoveredCell === `${row}-${cellKey}`;
                      const isConflict = classData?.status === "conflict";

                      return (
                        <div
                          key={cellKey}
                          className={`p-2 border-r border-gray-100 last:border-r-0 min-h-[90px] relative transition-all ${
                            classData 
                              ? isConflict 
                                ? "bg-red-50 hover:bg-red-100 cursor-pointer" 
                                : "bg-blue-50 hover:bg-blue-100 cursor-pointer" 
                              : "hover:bg-gray-50"
                          }`}
                          onMouseEnter={() => setHoveredCell(`${row}-${cellKey}`)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {classData && (
                            <div className="text-xs space-y-1">
                              <div className="font-bold text-blue-900 leading-tight">{classData.code}</div>
                              <div className="text-[10px] text-gray-600 truncate">{classData.detail}</div>
                              {classData.count > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Users className="w-3 h-3" />
                                  {classData.count}
                                </div>
                              )}
                            </div>
                          )}

                          {isHovered && classData && (
                            <div className="absolute z-40 top-full left-0 mt-1 bg-gray-900 text-white p-3 rounded-lg shadow-xl text-[11px] w-52 animate-in fade-in zoom-in duration-200">
                              <div className="font-bold border-b border-gray-700 pb-1.5 mb-1.5">{classData.code}</div>
                              <div className="space-y-1 text-gray-300">
                                <div className="flex justify-between">
                                  <span>{detailLabel}:</span>
                                  <span className="font-semibold text-white">{classData.detail}</span>
                                </div>
                                {classData.count > 0 && (
                                  <div className="flex justify-between">
                                    <span>{countLabel}:</span>
                                    <span className="font-semibold text-white">{classData.count}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>{rowItemLabel}:</span>
                                  <span className="font-semibold text-white">{row}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                  <span>Time:</span>
                                  <span className="font-semibold text-blue-300">{timeSlot}</span>
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

export { WeeklySchedulePage };
export default WeeklySchedulePage;
