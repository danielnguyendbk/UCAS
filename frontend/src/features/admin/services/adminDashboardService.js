const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const fallbackDashboardData = {
  activeSemester: {
    name: "Chưa xác định học kỳ active",
  },
  summary: {
    totalClassrooms: 48,
    totalCourses: 156,
    scheduledClasses: 892,
    conflictAlerts: 3,
  },
  roomUsageByWeekday: [
    { day: "T2", usage: 85 },
    { day: "T3", usage: 92 },
    { day: "T4", usage: 78 },
    { day: "T5", usage: 88 },
    { day: "T6", usage: 75 },
    { day: "T7", usage: 45 },
  ],
  roomUtilizationRate: [
    { name: "Sử dụng cao", value: 32, color: "#3b82f6" },
    { name: "Sử dụng trung bình", value: 12, color: "#10b981" },
    { name: "Sử dụng thấp", value: 4, color: "#f59e0b" },
  ],
  todaySchedulePreview: [
    {
      time: "08:00 - 10:00",
      course: "CS101",
      room: "A-301",
      status: "ongoing",
    },
    {
      time: "10:00 - 12:00",
      course: "MATH201",
      room: "B-105",
      status: "upcoming",
    },
    {
      time: "14:00 - 16:00",
      course: "PHY301",
      room: "C-201",
      status: "upcoming",
    },
  ],
};

export async function getAdminDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Dashboard API failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Using fallback dashboard data:", error);
    return fallbackDashboardData;
  }
}