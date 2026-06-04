import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Users, MapPin, Monitor, Plus, Search } from "lucide-react";
const initialClassrooms = [
  { id: 1, name: "A-301", capacity: 50, building: "A", floor: 3, facilities: ["Projector", "Whiteboard"], utilization: 85 },
  { id: 2, name: "A-302", capacity: 45, building: "A", floor: 3, facilities: ["Projector", "Computer"], utilization: 72 },
  { id: 3, name: "B-105", capacity: 60, building: "B", floor: 1, facilities: ["Smart Board", "AC"], utilization: 92 },
  { id: 4, name: "B-106", capacity: 55, building: "B", floor: 1, facilities: ["Projector"], utilization: 68 },
  { id: 5, name: "C-201", capacity: 40, building: "C", floor: 2, facilities: ["Projector", "Whiteboard", "AC"], utilization: 78 },
  { id: 6, name: "C-202", capacity: 35, building: "C", floor: 2, facilities: ["Smart Board"], utilization: 45 }
];
const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState(initialClassrooms);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    capacity: "",
    building: "",
    floor: "",
    facilities: ""
  });
  const filteredClassrooms = classrooms.filter(
    (room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()) || room.building.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleAddClassroom = () => {
    if (!newClassroom.name.trim() || !newClassroom.capacity || !newClassroom.building.trim() || !newClassroom.floor) {
      return;
    }
    const facilities = newClassroom.facilities.split(",").map((f) => f.trim()).filter(Boolean);
    const nextRoom = {
      id: classrooms.length + 1,
      name: newClassroom.name.trim(),
      capacity: Number(newClassroom.capacity),
      building: newClassroom.building.trim().toUpperCase(),
      floor: Number(newClassroom.floor),
      facilities,
      utilization: 0
    };
    setClassrooms([nextRoom, ...classrooms]);
    setNewClassroom({ name: "", capacity: "", building: "", floor: "", facilities: "" });
    setIsAddDialogOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Classrooms" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage classroom inventory and facilities" })
      ] }),
      /* @__PURE__ */ jsxs(Dialog, { open: isAddDialogOpen, onOpenChange: setIsAddDialogOpen, children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { className: "bg-blue-600 hover:bg-blue-700", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          "Add New Classroom"
        ] }) }),
        /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Add New Classroom" }),
            /* @__PURE__ */ jsx(DialogDescription, { children: "Create a new classroom with capacity and facilities." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "classroom-name", children: "Room Name" }),
              /* @__PURE__ */ jsx(Input, { id: "classroom-name", placeholder: "A-305", value: newClassroom.name, onChange: (e) => setNewClassroom({ ...newClassroom, name: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "building", children: "Building" }),
                /* @__PURE__ */ jsx(Input, { id: "building", placeholder: "A", value: newClassroom.building, onChange: (e) => setNewClassroom({ ...newClassroom, building: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "floor", children: "Floor" }),
                /* @__PURE__ */ jsx(Input, { id: "floor", type: "number", min: "1", placeholder: "3", value: newClassroom.floor, onChange: (e) => setNewClassroom({ ...newClassroom, floor: e.target.value }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "capacity", children: "Capacity" }),
              /* @__PURE__ */ jsx(Input, { id: "capacity", type: "number", min: "1", placeholder: "50", value: newClassroom.capacity, onChange: (e) => setNewClassroom({ ...newClassroom, capacity: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "facilities", children: "Facilities (comma separated)" }),
              /* @__PURE__ */ jsx(Input, { id: "facilities", placeholder: "Projector, AC, Whiteboard", value: newClassroom.facilities, onChange: (e) => setNewClassroom({ ...newClassroom, facilities: e.target.value }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setIsAddDialogOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsx(Button, { className: "bg-blue-600 hover:bg-blue-700", onClick: handleAddClassroom, children: "Create Classroom" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
      /* @__PURE__ */ jsx(Input, { placeholder: "Search room by name or building...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredClassrooms.map((room) => /* @__PURE__ */ jsx(Card, { className: "hover:shadow-lg transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-900", children: room.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-600 mt-1", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            "Building ",
            room.building,
            ", Floor ",
            room.floor
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Badge,
          {
            className: room.utilization > 80 ? "bg-green-100 text-green-700" : room.utilization > 60 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700",
            children: [
              room.utilization,
              "% Used"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-gray-500" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-900 font-medium", children: "Capacity:" }),
          /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
            room.capacity,
            " students"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Monitor, { className: "w-4 h-4 text-gray-500 mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 font-medium", children: "Facilities:" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: room.facilities.map((facility, index) => /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: facility }, index)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200 flex gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "Edit" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "View Schedule" })
      ] })
    ] }) }, room.id)) })
  ] });
};
export {
  ClassroomsPage
};
