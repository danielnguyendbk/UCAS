import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Users, MapPin, Monitor } from "lucide-react";

const classrooms = [
  { id: 1, name: "A-301", capacity: 50, building: "A", floor: 3, facilities: ["Máy chiếu", "Bảng trắng"], utilization: 85 },
  { id: 2, name: "A-302", capacity: 45, building: "A", floor: 3, facilities: ["Máy chiếu", "Máy tính"], utilization: 72 },
  { id: 3, name: "B-105", capacity: 60, building: "B", floor: 1, facilities: ["Bảng thông minh", "Điều hòa"], utilization: 92 },
  { id: 4, name: "B-106", capacity: 55, building: "B", floor: 1, facilities: ["Máy chiếu"], utilization: 68 },
  { id: 5, name: "C-201", capacity: 40, building: "C", floor: 2, facilities: ["Máy chiếu", "Bảng trắng", "Điều hòa"], utilization: 78 },
  { id: 6, name: "C-202", capacity: 35, building: "C", floor: 2, facilities: ["Bảng thông minh"], utilization: 45 },
];

export const ClassroomsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Phòng học</h1>
          <p className="text-gray-600 mt-1">Quản lý danh sách phòng học và trang thiết bị</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">Thêm phòng học</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    Tòa {room.building}, Tầng {room.floor}
                  </div>
                </div>
                <Badge
                  className={
                    room.utilization > 80
                      ? "bg-green-100 text-green-700"
                      : room.utilization > 60
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }
                >
                  Đã dùng {room.utilization}%
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 font-medium">Sức chứa:</span>
                  <span className="text-gray-600">{room.capacity} sinh viên</span>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Monitor className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-gray-900 font-medium">Thiết bị:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.facilities.map((facility, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Sửa
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Xem lịch
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
