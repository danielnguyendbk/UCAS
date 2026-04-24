import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Calendar, Clock, MapPin, Users, XCircle, BookOpen, GraduationCap, School
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScheduleGridView } from "../components/ScheduleGridView";
import ScheduleToolbar from "../components/ScheduleToolbar";

const studentScheduleData = [
  { id: 1, section: "CS101.L11", name: "Lập trình hướng đối tượng", credits: 3, lecturer: "TS. Nguyễn Văn An", day: "Thứ 2", slot: "Tiết 1-3", time: "07:00 - 09:30", room: "A-301", building: "Toà A", status: "ongoing", week: "Tuần 15" },
  { id: 2, section: "CS201.L03", name: "Cấu trúc dữ liệu & GT", credits: 3, lecturer: "PGS. Trần Thị Bình", day: "Thứ 3", slot: "Tiết 4-6", time: "09:45 - 12:15", room: "B-205", building: "Toà B", status: "upcoming", week: "Tuần 15" },
  { id: 3, section: "MATH102.L05", name: "Toán cao cấp 2", credits: 4, lecturer: "TS. Lê Minh Tú", day: "Thứ 4", slot: "Tiết 7-9", time: "13:00 - 15:30", room: "C-105", building: "Toà C", status: "upcoming", week: "Tuần 15" },
  { id: 4, section: "NET301.L01", name: "Mạng máy tính", credits: 3, lecturer: "ThS. Hoàng Văn Nam", day: "Thứ 6", slot: "Tiết 1-3", time: "07:00 - 09:30", room: "A-301", building: "Toà A", status: "upcoming", week: "Tuần 15" }
];

const statusConfig = {
  ongoing: { label: "Đang diễn ra", cls: "bg-green-100 text-green-700" },
  upcoming: { label: "Sắp tới", cls: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Nghỉ học", cls: "bg-red-100 text-red-700" }
};

const StudentSchedulePage = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  const [filters, setFilters] = useState({
    building: "all",
    room: "all",
    week: "15",
    date: "2026-04-24"
  });

  const filteredSchedule = studentScheduleData.filter(s => {
    const matchBuilding = filters.building === "all" || s.building === filters.building || s.room.startsWith(filters.building.replace("Tòa ", ""));
    const matchRoom = filters.room === "all" || s.room === filters.room;
    return matchBuilding && matchRoom;
  });

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thời khóa biểu cá nhân</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name} · {user?.code} · Lớp {user?.class || "D21CNTT01"}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Học kỳ 1, 2024-2025</p>
          <p className="text-xs font-semibold text-blue-700 mt-0.5">{studentScheduleData.length} môn học đang đăng ký</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Môn học HK1", value: studentScheduleData.length, icon: BookOpen, color: "text-blue-600 bg-blue-50" },
          { label: "Tổng tín chỉ", value: studentScheduleData.reduce((a, s) => a + s.credits, 0), icon: GraduationCap, color: "text-purple-600 bg-purple-50" },
          { label: "Số tiết/tuần", value: studentScheduleData.length * 3, icon: Clock, color: "text-green-600 bg-green-50" },
          { label: "Lịch nghỉ/bù", value: 0, icon: XCircle, color: "text-red-600 bg-red-50" }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
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
            onSearch={() => console.log("Searching student schedule:", filters)} 
            onRefresh={() => window.location.reload()} 
          />

          <div className="mt-4">
            <ScheduleGridView
              items={filteredSchedule.map(s => ({
                id: s.id,
                name: s.name,
                subLabel: s.section,
                detail1: s.lecturer,
                detail2: `${s.room} (${s.building})`,
                day: s.day,
                slot: s.slot,
                time: s.time,
                color: s.status === 'ongoing' ? 'green' : 'blue',
                badge: statusConfig[s.status].label
              }))}
              onItemClick={(item) => {
                const session = studentScheduleData.find(s => s.id === item.id);
                if (session) setSelectedSession(session);
              }}
              compactDays={false}
            />
          </div>
        </div>

        <div>
          {selectedSession ? (
            <Card className="shadow-lg border-0 ring-1 ring-blue-200 sticky top-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="pb-3 bg-blue-600 rounded-t-xl text-white">
                <CardTitle className="text-sm font-bold">{selectedSession.name}</CardTitle>
                <p className="text-xs text-blue-200 mt-0.5 font-mono">{selectedSession.section}</p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  { icon: GraduationCap, label: "Giảng viên", value: selectedSession.lecturer },
                  { icon: BookOpen, label: "Số tín chỉ", value: `${selectedSession.credits} TC` },
                  { icon: Calendar, label: "Lịch học", value: `${selectedSession.day} · ${selectedSession.slot}` },
                  { icon: Clock, label: "Giờ học", value: selectedSession.time },
                  { icon: MapPin, label: "Phòng học", value: `${selectedSession.room} (${selectedSession.building})` },
                  { icon: School, label: "Tòa nhà", value: selectedSession.building }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-gray-100">
                  <Badge className={`${statusConfig[selectedSession.status].cls} w-full justify-center py-1.5`}>
                    {statusConfig[selectedSession.status].label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center p-6">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Calendar className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-bold">Chi tiết buổi học</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[180px]">Chọn một ô trên lịch để xem thông tin chi tiết môn học</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StudentSchedulePage };
export default StudentSchedulePage;
