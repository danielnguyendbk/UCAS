import { useEffect, useMemo, useState } from "react";
import { School, BookOpen, Calendar, AlertTriangle, Loader2 } from "lucide-react";
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
  ResponsiveContainer,
} from "recharts";
import { getAdminDashboard } from "@/features/admin/services/adminDashboardService";

const formatNumber = (value) => {
  const numberValue = Number(value || 0);
  return new Intl.NumberFormat("vi-VN").format(numberValue);
};

export const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await getAdminDashboard();

        if (mounted) {
          setDashboardData(data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const summary = dashboardData?.summary || {};

    return [
      {
        title: "Tổng số phòng học",
        value: formatNumber(summary.totalClassrooms),
        description: "Phòng đang sẵn sàng sử dụng",
        icon: School,
        color: "bg-blue-500",
      },
      {
        title: "Tổng số học phần",
        value: formatNumber(summary.totalCourses),
        description: "Học phần trong học kỳ",
        icon: BookOpen,
        color: "bg-green-500",
      },
      {
        title: "Lớp đã xếp lịch",
        value: formatNumber(summary.scheduledClasses),
        description: "Tổng số buổi đã lên lịch",
        icon: Calendar,
        color: "bg-purple-500",
      },
      {
        title: "Cảnh báo xung đột",
        value: formatNumber(summary.conflictAlerts),
        description: "Cần kiểm tra và xử lý",
        icon: AlertTriangle,
        color: "bg-red-500",
      },
    ];
  }, [dashboardData]);

  const roomUsageData = dashboardData?.roomUsageByWeekday || [];
  const utilizationData = dashboardData?.roomUtilizationRate || [];
  const todaySchedulePreview = dashboardData?.todaySchedulePreview || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bảng điều khiển</h1>
          <p className="text-gray-600 mt-1">Tổng quan hệ thống xếp lịch phòng học</p>
          <p className="text-sm text-gray-500 mt-2">
            Học kỳ hiện tại:{" "}
            <span className="font-medium text-gray-700">
              {dashboardData?.activeSemester?.name || "Chưa xác định học kỳ active"}
            </span>
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        )}
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Lịch học hôm nay</CardTitle>
        </CardHeader>

        <CardContent>
          {todaySchedulePreview.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
              Hôm nay chưa có lịch học nào.
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedulePreview.map((item, index) => (
                <div
                  key={`${item.time}-${item.course}-${index}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};