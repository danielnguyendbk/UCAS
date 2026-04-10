import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const rooms = ["A-301", "A-302", "B-105", "B-106", "C-201"];

// Mock schedule data
const scheduleData: Record<string, Record<string, any>> = {
  "A-301": {
    "Thứ Hai-08:00 - 10:00": { code: "CS101", lecturer: "TS. Sarah", students: 45 },
    "Thứ Ba-10:00 - 12:00": { code: "MATH201", lecturer: "PGS. Chen", students: 60 },
    "Thứ Tư-14:00 - 16:00": { code: "PHY301", lecturer: "TS. Brown", students: 35 },
  },
  "A-302": {
    "Thứ Hai-10:00 - 12:00": { code: "ENG102", lecturer: "TS. Lee", students: 50 },
    "Thứ Năm-08:00 - 10:00": { code: "BIO201", lecturer: "TS. White", students: 40 },
  },
  "B-105": {
    "Thứ Ba-08:00 - 10:00": { code: "CHEM301", lecturer: "PGS. Kim", students: 38 },
    "Thứ Sáu-14:00 - 16:00": { code: "CS201", lecturer: "TS. Johnson", students: 42 },
  },
  "B-106": {
    "Thứ Tư-10:00 - 12:00": { code: "HIST101", lecturer: "TS. Taylor", students: 55 },
  },
  "C-201": {
    "Thứ Năm-14:00 - 16:00": { code: "ART201", lecturer: "PGS. Davis", students: 30 },
    "Thứ Sáu-08:00 - 10:00": { code: "MUS101", lecturer: "TS. Wilson", students: 25 },
  },
};

export const WeeklySchedulePage = () => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lịch tuần trực quan</h1>
          <p className="text-gray-600 mt-1">Dạng lưới tương tác cho lịch sử dụng phòng học</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-4">Tuần 1, Tháng 03/2026</span>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header Row */}
          <div className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200 bg-gray-50">
            <div className="p-4 font-medium text-gray-700 border-r border-gray-200">
              Phòng / Thời gian
            </div>
            {days.map((day) => (
              <div key={day} className="p-4 font-medium text-gray-700 text-center border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots for each room */}
          {rooms.map((room) => (
            <div key={room}>
              {/* Room Header */}
              <div className="grid grid-cols-[150px_repeat(6,1fr)] bg-blue-50 border-b border-gray-200">
                <div className="p-3 font-semibold text-blue-900 border-r border-gray-200 flex items-center">
                  {room}
                </div>
                <div className="col-span-6"></div>
              </div>

              {/* Time Slots */}
              {timeSlots.map((timeSlot) => (
                <div
                  key={`${room}-${timeSlot}`}
                  className="grid grid-cols-[150px_repeat(6,1fr)] border-b border-gray-200"
                >
                  <div className="p-3 text-sm text-gray-600 border-r border-gray-200 flex items-center">
                    {timeSlot}
                  </div>
                  {days.map((day) => {
                    const cellKey = `${day}-${timeSlot}`;
                    const classData = scheduleData[room]?.[cellKey];
                    const isHovered = hoveredCell === `${room}-${cellKey}`;

                    return (
                      <div
                        key={cellKey}
                        className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[80px] relative transition-all ${
                          classData
                            ? "bg-blue-50 hover:bg-blue-100 cursor-pointer"
                            : "hover:bg-gray-50"
                        }`}
                        onMouseEnter={() => setHoveredCell(`${room}-${cellKey}`)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {classData && (
                          <div className="text-xs space-y-1">
                            <div className="font-semibold text-blue-900">{classData.code}</div>
                            <div className="text-gray-600">{classData.lecturer}</div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Users className="w-3 h-3" />
                              {classData.students}
                            </div>
                          </div>
                        )}

                        {/* Hover Tooltip */}
                        {isHovered && classData && (
                          <div className="absolute z-10 top-full left-0 mt-1 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs w-48">
                            <div className="font-semibold mb-1">{classData.code}</div>
                            <div className="space-y-1 text-gray-300">
                              <div>Giảng viên: {classData.lecturer}</div>
                              <div>Sinh viên: {classData.students}</div>
                              <div>Phòng: {room}</div>
                              <div>Ca học: {timeSlot}</div>
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

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chú thích</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-50 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Đã có lớp học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-200 rounded"></div>
              <span className="text-sm text-gray-600">Khung giờ trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-50 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-600">Xung đột</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
