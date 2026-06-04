import { jsx, jsxs } from "react/jsx-runtime";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
import { Search, Plus, Mail, Phone } from "lucide-react";
import { useState } from "react";
const initialLecturers = [
  { id: 1, name: "Dr. Sarah Johnson", department: "Computer Science", email: "sjohnson@university.edu", phone: "+1 234-567-8901", courses: 3, status: "Active" },
  { id: 2, name: "Prof. Michael Chen", department: "Mathematics", email: "mchen@university.edu", phone: "+1 234-567-8902", courses: 4, status: "Active" },
  { id: 3, name: "Dr. Emily Brown", department: "Physics", email: "ebrown@university.edu", phone: "+1 234-567-8903", courses: 2, status: "Active" },
  { id: 4, name: "Dr. Robert Lee", department: "English", email: "rlee@university.edu", phone: "+1 234-567-8904", courses: 3, status: "Active" },
  { id: 5, name: "Dr. Amanda White", department: "Biology", email: "awhite@university.edu", phone: "+1 234-567-8905", courses: 2, status: "Active" },
  { id: 6, name: "Prof. David Kim", department: "Chemistry", email: "dkim@university.edu", phone: "+1 234-567-8906", courses: 3, status: "Active" }
];
const LecturersPage = () => {
  const [lecturers, setLecturers] = useState(initialLecturers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLecturer, setNewLecturer] = useState({
    name: "",
    department: "",
    email: "",
    phone: ""
  });
  const filteredLecturers = lecturers.filter(
    (lecturer) => lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) || lecturer.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleAddLecturer = () => {
    if (!newLecturer.name.trim() || !newLecturer.department.trim() || !newLecturer.email.trim()) {
      return;
    }
    const lecturer = {
      id: lecturers.length + 1,
      name: newLecturer.name.trim(),
      department: newLecturer.department.trim(),
      email: newLecturer.email.trim(),
      phone: newLecturer.phone.trim() || "N/A",
      courses: 0,
      status: "Active"
    };
    setLecturers([lecturer, ...lecturers]);
    setNewLecturer({ name: "", department: "", email: "", phone: "" });
    setIsAddDialogOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Lecturers" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage faculty members and teaching staff" })
      ] }),
      /* @__PURE__ */ jsxs(Dialog, { open: isAddDialogOpen, onOpenChange: setIsAddDialogOpen, children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { className: "bg-blue-600 hover:bg-blue-700", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          "Add New Lecturer"
        ] }) }),
        /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Add New Lecturer" }),
            /* @__PURE__ */ jsx(DialogDescription, { children: "Create a lecturer profile for scheduling." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "lecturer-name", children: "Full Name" }),
              /* @__PURE__ */ jsx(Input, { id: "lecturer-name", placeholder: "Dr. Alex Nguyen", value: newLecturer.name, onChange: (e) => setNewLecturer({ ...newLecturer, name: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "lecturer-department", children: "Department" }),
              /* @__PURE__ */ jsx(Input, { id: "lecturer-department", placeholder: "Computer Science", value: newLecturer.department, onChange: (e) => setNewLecturer({ ...newLecturer, department: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "lecturer-email", children: "Email" }),
                /* @__PURE__ */ jsx(Input, { id: "lecturer-email", type: "email", placeholder: "alex@university.edu", value: newLecturer.email, onChange: (e) => setNewLecturer({ ...newLecturer, email: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "lecturer-phone", children: "Phone" }),
                /* @__PURE__ */ jsx(Input, { id: "lecturer-phone", placeholder: "+84 98-xxx-xxxx", value: newLecturer.phone, onChange: (e) => setNewLecturer({ ...newLecturer, phone: e.target.value }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setIsAddDialogOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsx(Button, { className: "bg-blue-600 hover:bg-blue-700", onClick: handleAddLecturer, children: "Create Lecturer" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Search lecturers...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          className: "pl-10"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredLecturers.map((lecturer) => /* @__PURE__ */ jsx(Card, { className: "hover:shadow-lg transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900", children: lecturer.name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: lecturer.department })
        ] }),
        /* @__PURE__ */ jsx(Badge, { className: "bg-green-100 text-green-700 hover:bg-green-100", children: lecturer.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [
          /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: lecturer.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [
          /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { children: lecturer.phone })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-gray-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Active Courses" }),
          /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-gray-900", children: lecturer.courses })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "Edit" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "Schedule" })
        ] })
      ] })
    ] }) }, lecturer.id)) })
  ] });
};
export {
  LecturersPage
};
