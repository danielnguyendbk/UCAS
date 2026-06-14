import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Progress } from "../components/ui/progress";
const AutoAssignmentPage = () => {
  const [algorithm, setAlgorithm] = useState("greedy");
  const [minimizeConflicts, setMinimizeConflicts] = useState(true);
  const [balanceUsage, setBalanceUsage] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const handleRunAssignment = async () => {
    setIsProcessing(true);
    setProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(i);
    }
    setIsProcessing(false);
    setResults({
      totalAssigned: 142,
      totalConflicts: 3,
      processingTime: "2.4s",
      assignments: [
        { courseCode: "CS101", room: "A-301", status: "success" },
        { courseCode: "MATH201", room: "B-105", status: "success" },
        { courseCode: "PHY301", room: "C-201", status: "success" },
        { courseCode: "ENG102", room: "A-402", status: "conflict" },
        { courseCode: "BIO201", room: "D-103", status: "success" }
      ]
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Auto Assignment" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Automatically assign rooms to courses using optimization algorithms" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Configuration" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Algorithm Selection" }),
            /* @__PURE__ */ jsxs(Select, { value: algorithm, onValueChange: setAlgorithm, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "greedy", children: "Greedy Algorithm" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "heuristic", children: "Heuristic Optimization" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "genetic", children: "Genetic Algorithm" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "simulated", children: "Simulated Annealing" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx(Label, { children: "Optimization Goals" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(
                Checkbox,
                {
                  id: "conflicts",
                  checked: minimizeConflicts,
                  onCheckedChange: (checked) => setMinimizeConflicts(checked)
                }
              ),
              /* @__PURE__ */ jsx(
                "label",
                {
                  htmlFor: "conflicts",
                  className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  children: "Minimize conflicts"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(
                Checkbox,
                {
                  id: "balance",
                  checked: balanceUsage,
                  onCheckedChange: (checked) => setBalanceUsage(checked)
                }
              ),
              /* @__PURE__ */ jsx(
                "label",
                {
                  htmlFor: "balance",
                  className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  children: "Balance room usage"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleRunAssignment,
              disabled: isProcessing,
              className: "w-full bg-blue-600 hover:bg-blue-700",
              children: [
                /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 mr-2" }),
                isProcessing ? "Processing..." : "Run Auto Assignment"
              ]
            }
          ),
          isProcessing && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Processing..." }),
              /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                progress,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Progress, { value: progress })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Assignment Results" }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          !results && !isProcessing && /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-gray-500", children: [
            /* @__PURE__ */ jsx(Play, { className: "w-12 h-12 mx-auto mb-4 opacity-20" }),
            /* @__PURE__ */ jsx("p", { children: "Run auto assignment to see results" })
          ] }),
          isProcessing && /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-4", children: "Processing assignments..." })
          ] }),
          results && !isProcessing && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-green-50 rounded-lg p-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-green-700", children: "Total Assigned" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-green-900", children: results.totalAssigned })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-red-50 rounded-lg p-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5 text-red-600" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-red-700", children: "Total Conflicts" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-900", children: results.totalConflicts })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 rounded-lg p-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-600" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-blue-700", children: "Processing Time" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-blue-900", children: results.processingTime })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Assignment Preview" }),
              /* @__PURE__ */ jsx("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Course Code" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Assigned Room" }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700", children: "Status" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: results.assignments.map((item, index) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm font-medium text-gray-900", children: item.courseCode }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-gray-600", children: item.room }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm", children: item.status === "success" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }),
                    "Success"
                  ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800", children: [
                    /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
                    "Conflict"
                  ] }) })
                ] }, index)) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { variant: "default", className: "bg-blue-600 hover:bg-blue-700", children: "Apply Assignments" }),
              /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Export Results" })
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
};
export {
  AutoAssignmentPage
};
