import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Calendar, Clock, MapPin, Users, XCircle, Send, BookOpen, ChevronLeft, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScheduleGridView } from "../components/ScheduleGridView";
import ScheduleToolbar from "../components/ScheduleToolbar";
import { useNavigate } from "react-router";

const mySchedule = [
  { id: 1, section: "CS101.L11", name: "Lập trình hướng đối tượng", credits: 3, class: "D21CNTT01", students: 45, day: "Thứ 2", slot: "Tiết 1-3", time: "07:00 - 09:30", room: "A-301", building: "Toà A", status: "active", week: "Tuần 15" },
  { id: 2, section: "CS201.L03", name: "Cấu trúc dữ liệu & GT", credits: 3, class: "D21CNTT02", students: 42, day: "Thứ 3", slot: "Tiết 4-6", time: "09:45 - 12:15", room: "A-205", building: "Toà A", status: "active", week: "Tuần 15" },
  { id: 3, section: "AI401.L01", name: "Trí tuệ nhân tạo", credits: 3, class: "D20CNTT01", students: 35, day: "Thứ 5", slot: "Tiết 1-3", time: "07:00 - 09:30", room: "A-301", building: "Toà A", status: "conflict", week: "Tuần 15" },
  { id: 4, section: "CS101.L12", name: "Lập trình hướng đối tượng", credits: 3, class: "D21CNTT03", students: 48, day: "Thứ 6", slot: "Tiết 7-9", time: "13:00 - 15:30", room: "B-102", building: "Toà B", status: "active", week: "Tuần 15" }
];

const statusConfigSchedule = {
  active: { label: "Đang dạy", cls: "bg-green-100 text-green-700" },
  conflict: { label: "Xung đột", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "Đã hủy", cls: "bg-gray-100 text-gray-500" }
};

const LecturerSchedulePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState(null);
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24"
  });

  const filteredSchedule = mySchedule.filter(s => {
    const matchBuilding = filters.building === "all" || s.building === filters.building || s.room.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || s.room === filters.room;
    return matchBuilding && matchRoom;
  });

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lịch dạy của tôi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} · {user?.code} · {user?.department}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Học kỳ 1, 2024-2025</p>
          <p className="text-xs font-semibold text-blue-700 mt-0.5">{mySchedule.length} lớp đang phụ trách</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Số lớp HK1", value: mySchedule.length, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Tổng tiết/tuần", value: mySchedule.length * 3, icon: Clock, color: "text-purple-600 bg-purple-50" },
          { label: "Tổng sinh viên", value: mySchedule.reduce((a, s) => a + s.students, 0), icon: Users, color: "text-green-600 bg-green-50" },
          { label: "Xung đột lịch", value: mySchedule.filter(s => s.status === "conflict").length, icon: XCircle, color: "text-red-600 bg-red-50" }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ScheduleToolbar 
            filters={filters}
            onBuildingChange={(v) => setFilters(f => ({ ...f, building: v }))}
            onRoomChange={(v) => setFilters(f => ({ ...f, room: v }))}
            onWeekChange={(v) => setFilters(f => ({ ...f, week: v }))}
            onDateChange={(v) => setFilters(f => ({ ...f, date: v }))}
            onSearch={() => console.log("Searching with filters:", filters)} 
            onRefresh={() => window.location.reload()} 
          />

          <div className="mt-4">
            <ScheduleGridView
            items={filteredSchedule.map(s => ({
              id: s.id,
              name: s.name,
              subLabel: s.section,
              detail1: `${s.class} · ${s.students} SV`,
              detail2: `${s.room} (${s.building})`,
              day: s.day,
              slot: s.slot,
              time: s.time,
              color: s.status === 'conflict' ? 'red' : 'blue',
              badge: statusConfigSchedule[s.status].label
            }))}
            onItemClick={(item) => {
              const session = mySchedule.find(s => s.id === item.id);
              if (session) setSelectedSession(session);
            }}
            compactDays={false}
          />
          </div>
        </div>

        <div>
          {selectedSession ? (
            <Card className="shadow-sm border-0 ring-1 ring-blue-200 sticky top-4">
              <CardHeader className="pb-3 bg-blue-600 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-white">{selectedSession.name}</CardTitle>
                <p className="text-xs text-blue-200 mt-0.5 font-mono">{selectedSession.section}</p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  { icon: Users, label: "Lớp sinh viên", value: selectedSession.class },
                  { icon: Users, label: "Số sinh viên", value: `${selectedSession.students} SV` },
                  { icon: BookOpen, label: "Số tín chỉ", value: `${selectedSession.credits} TC` },
                  { icon: Calendar, label: "Lịch học", value: `${selectedSession.day} · ${selectedSession.slot}` },
                  { icon: Clock, label: "Giờ học", value: selectedSession.time },
                  { icon: MapPin, label: "Phòng học", value: `${selectedSession.room} (${selectedSession.building})` }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">{item.label}</p>
                        <p className="text-xs font-semibold text-gray-900">{item.value}</p>
                      </div>
                    </div>
                  );
                })}

                {selectedSession.status === "conflict" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-700">⚠️ Xung đột lịch phát hiện</p>
                    <p className="text-[11px] text-red-600 mt-1">Phòng {selectedSession.room} có thể bị trùng lịch. Vui lòng gửi yêu cầu đổi phòng.</p>
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 mt-2"
                  onClick={() => navigate("/lecturer/room-change-request")}
                >
                  <Send className="w-3.5 h-3.5" /> Gửi yêu cầu cho lớp này
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center p-6">
              <Calendar className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Chọn một buổi học</p>
              <p className="text-xs text-gray-300 mt-1">để xem thông tin chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { LecturerSchedulePage };
