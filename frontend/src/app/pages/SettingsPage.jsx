import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
const SettingsPage = () => {
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Settings" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage system preferences and configurations" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "General Settings" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Basic system configuration" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "university", children: "University Name" }),
            /* @__PURE__ */ jsx(Input, { id: "university", defaultValue: "University of Excellence" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "semester", children: "Current Semester" }),
            /* @__PURE__ */ jsx(Input, { id: "semester", defaultValue: "Spring 2026" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "timezone", children: "Timezone" }),
            /* @__PURE__ */ jsx(Input, { id: "timezone", defaultValue: "UTC-5" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Scheduling Preferences" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Configure default scheduling behavior" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx(Label, { children: "Auto-assign rooms" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Automatically assign available rooms" })
            ] }),
            /* @__PURE__ */ jsx(Switch, { defaultChecked: true })
          ] }),
          /* @__PURE__ */ jsx(Separator, {}),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx(Label, { children: "Conflict notifications" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Alert when scheduling conflicts occur" })
            ] }),
            /* @__PURE__ */ jsx(Switch, { defaultChecked: true })
          ] }),
          /* @__PURE__ */ jsx(Separator, {}),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx(Label, { children: "Email reminders" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Send email notifications to lecturers" })
            ] }),
            /* @__PURE__ */ jsx(Switch, {})
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Time Slot Configuration" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Set available time slots for scheduling" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "start", children: "Start Time" }),
              /* @__PURE__ */ jsx(Input, { id: "start", type: "time", defaultValue: "08:00" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "end", children: "End Time" }),
              /* @__PURE__ */ jsx(Input, { id: "end", type: "time", defaultValue: "18:00" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "duration", children: "Slot Duration (minutes)" }),
            /* @__PURE__ */ jsx(Input, { id: "duration", type: "number", defaultValue: "120" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Notification Settings" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Manage notification preferences" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx(Label, { children: "Browser notifications" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Show desktop notifications" })
            ] }),
            /* @__PURE__ */ jsx(Switch, { defaultChecked: true })
          ] }),
          /* @__PURE__ */ jsx(Separator, {}),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx(Label, { children: "Sound alerts" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Play sound for important events" })
            ] }),
            /* @__PURE__ */ jsx(Switch, {})
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Reset to Defaults" }),
      /* @__PURE__ */ jsx(Button, { className: "bg-blue-600 hover:bg-blue-700", children: "Save Changes" })
    ] })
  ] });
};
export {
  SettingsPage
};
