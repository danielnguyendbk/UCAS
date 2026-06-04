import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Download, Calendar, TrendingUp } from "lucide-react";
const reports = [
  {
    id: 1,
    title: "Weekly Room Utilization Report",
    description: "Detailed analysis of classroom usage for the current week",
    icon: TrendingUp,
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Monthly Scheduling Summary",
    description: "Overview of all scheduled classes and assignments for the month",
    icon: Calendar,
    color: "bg-green-500"
  },
  {
    id: 3,
    title: "Conflict Resolution Report",
    description: "List of scheduling conflicts and resolution history",
    icon: FileText,
    color: "bg-red-500"
  },
  {
    id: 4,
    title: "Lecturer Workload Analysis",
    description: "Teaching hours and course distribution by faculty member",
    icon: TrendingUp,
    color: "bg-purple-500"
  }
];
const ReportsPage = () => {
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Reports" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Generate and download system reports" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: reports.map((report) => {
      const Icon = report.icon;
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: `${report.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`, children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-white" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: report.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: report.description })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "flex-1", children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 mr-2" }),
            "Preview"
          ] }),
          /* @__PURE__ */ jsxs(Button, { className: "flex-1 bg-blue-600 hover:bg-blue-700", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }),
            "Download"
          ] })
        ] }) })
      ] }, report.id);
    }) })
  ] });
};
export {
  ReportsPage
};
