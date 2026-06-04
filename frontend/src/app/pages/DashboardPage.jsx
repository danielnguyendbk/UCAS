import { jsx, jsxs } from "react/jsx-runtime";
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
  ResponsiveContainer
} from "recharts";
const stats = [
  {
    title: "Total Classrooms",
    value: "48",
    description: "Active rooms available",
    icon: School,
    color: "bg-blue-500"
  },
  {
    title: "Total Courses",
    value: "156",
    description: "Courses this semester",
    icon: BookOpen,
    color: "bg-green-500"
  },
  {
    title: "Scheduled Classes",
    value: "892",
    description: "Total scheduled sessions",
    icon: Calendar,
    color: "bg-purple-500"
  },
  {
    title: "Conflict Alerts",
    value: "3",
    description: "Requires attention",
    icon: AlertTriangle,
    color: "bg-red-500"
  }
];
const roomUsageData = [
  { day: "Mon", usage: 85 },
  { day: "Tue", usage: 92 },
  { day: "Wed", usage: 78 },
  { day: "Thu", usage: 88 },
  { day: "Fri", usage: 75 },
  { day: "Sat", usage: 45 }
];
const utilizationData = [
  { name: "High Utilization", value: 32, color: "#3b82f6" },
  { name: "Medium Utilization", value: 12, color: "#10b981" },
  { name: "Low Utilization", value: 4, color: "#f59e0b" }
];
const DashboardPage = () => {
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Overview of classroom scheduling system" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: stats.map((stat) => {
      const Icon = stat.icon;
      return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: stat.title }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-gray-900 mt-2", children: stat.value }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: stat.description })
        ] }),
        /* @__PURE__ */ jsx("div", { className: `${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`, children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-white" }) })
      ] }) }) }, stat.title);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Room Usage by Weekday" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: roomUsageData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "day", stroke: "#6b7280" }),
          /* @__PURE__ */ jsx(YAxis, { stroke: "#6b7280" }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "usage", fill: "#3b82f6", radius: [8, 8, 0, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Room Utilization Rate" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: utilizationData,
              cx: "50%",
              cy: "50%",
              labelLine: false,
              label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`,
              outerRadius: 100,
              fill: "#8884d8",
              dataKey: "value",
              children: utilizationData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, {})
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Today's Schedule Preview" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [
        { time: "08:00 - 10:00", course: "CS101", room: "A-301", status: "ongoing" },
        { time: "10:00 - 12:00", course: "MATH201", room: "B-105", status: "upcoming" },
        { time: "14:00 - 16:00", course: "PHY301", room: "C-201", status: "upcoming" }
      ].map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-gray-900", children: item.time }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-600", children: item.course }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
            "Room: ",
            item.room
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `px-3 py-1 rounded-full text-xs font-medium ${item.status === "ongoing" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`,
            children: item.status === "ongoing" ? "Ongoing" : "Upcoming"
          }
        )
      ] }, index)) }) })
    ] })
  ] });
};
export {
  DashboardPage
};
