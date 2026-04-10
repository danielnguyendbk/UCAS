import { School, BookOpen, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const stats = [
  {
    title: "Tổng số phòng học",
    value: "48",
    description: "Phòng đang sẵn sàng sử dụng",
    icon: School,
    color: "bg-blue-500",
  },
  {
    title: "Tổng số học phần",
    value: "156",
    description: "Học phần trong học kỳ này",
    icon: BookOpen,
    color: "bg-green-500",
  },
  {
    title: "Lớp đã xếp lịch",
    value: "892",
    description: "Tổng số buổi đã lên lịch",
    icon: Calendar,
    color: "bg-purple-500",
  },
  {
    title: "Cảnh báo xung đột",
    value: "3",
    description: "Cần xử lý",
    icon: AlertTriangle,
    color: "bg-red-500",
  },
];

const roomUsageData = [
  { day: "T2", usage: 85 },
  { day: "T3", usage: 92 },
  { day: "T4", usage: 78 },
  { day: "T5", usage: 88 },
  { day: "T6", usage: 75 },
  { day: "T7", usage: 45 },
];

const utilizationData = [
  { name: "Sử dụng cao", value: 32, color: "#3b82f6" },
  { name: "Sử dụng trung bình", value: 12, color: "#10b981" },
  { name: "Sử dụng thấp", value: 4, color: "#f59e0b" },
];

export const DashboardPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bảng điều khiển</h1>
        <p className="text-gray-600 mt-1">Tổng quan hệ thống xếp lịch phòng học</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mức sử dụng phòng theo ngày trong tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="usage" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ sử dụng phòng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Xem nhanh lịch hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "08:00 - 10:00", course: "CS101", room: "A-301", status: "ongoing" },
              { time: "10:00 - 12:00", course: "MATH201", room: "B-105", status: "upcoming" },
              { time: "14:00 - 16:00", course: "PHY301", room: "C-201", status: "upcoming" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-900">{item.time}</div>
                  <div className="text-sm text-gray-600">{item.course}</div>
                  <div className="text-sm text-gray-600">Phòng: {item.room}</div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "ongoing"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.status === "ongoing" ? "Đang diễn ra" : "Sắp diễn ra"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
