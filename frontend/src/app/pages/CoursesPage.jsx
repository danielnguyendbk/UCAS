import { jsx, jsxs } from "react/jsx-runtime";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
const initialCourses = [
  { id: 1, code: "CS101", name: "Introduction to Programming", department: "Computer Science", credits: 3, students: 45, status: "Active" },
  { id: 2, code: "MATH201", name: "Calculus II", department: "Mathematics", credits: 4, students: 60, status: "Active" },
  { id: 3, code: "PHY301", name: "Quantum Mechanics", department: "Physics", credits: 3, students: 35, status: "Active" },
  { id: 4, code: "ENG102", name: "Technical Writing", department: "English", credits: 2, students: 50, status: "Active" },
  { id: 5, code: "BIO201", name: "Cell Biology", department: "Biology", credits: 3, students: 40, status: "Active" },
  { id: 6, code: "CHEM301", name: "Organic Chemistry", department: "Chemistry", credits: 4, students: 38, status: "Active" }
];
const CoursesPage = () => {
  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    department: "",
    credits: ""
  });
  const filteredCourses = courses.filter(
    (course) => course.code.toLowerCase().includes(searchTerm.toLowerCase()) || course.name.toLowerCase().includes(searchTerm.toLowerCase()) || course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleAddCourse = () => {
    if (!newCourse.code.trim() || !newCourse.name.trim() || !newCourse.department.trim() || !newCourse.credits) {
      return;
    }
    const course = {
      id: courses.length + 1,
      code: newCourse.code.trim().toUpperCase(),
      name: newCourse.name.trim(),
      department: newCourse.department.trim(),
      credits: Number(newCourse.credits),
      students: 0,
      status: "Active"
    };
    setCourses([course, ...courses]);
    setNewCourse({ code: "", name: "", department: "", credits: "" });
    setIsAddDialogOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Courses" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-1", children: "Manage course catalog and information" })
      ] }),
      /* @__PURE__ */ jsxs(Dialog, { open: isAddDialogOpen, onOpenChange: setIsAddDialogOpen, children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { className: "bg-blue-600 hover:bg-blue-700", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          "Add New Course"
        ] }) }),
        /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Add New Course" }),
            /* @__PURE__ */ jsx(DialogDescription, { children: "Create a new course in catalog." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "course-code", children: "Course Code" }),
                /* @__PURE__ */ jsx(Input, { id: "course-code", placeholder: "CS401", value: newCourse.code, onChange: (e) => setNewCourse({ ...newCourse, code: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "credits", children: "Credits" }),
                /* @__PURE__ */ jsx(Input, { id: "credits", type: "number", min: "1", placeholder: "3", value: newCourse.credits, onChange: (e) => setNewCourse({ ...newCourse, credits: e.target.value }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "course-name", children: "Course Name" }),
              /* @__PURE__ */ jsx(Input, { id: "course-name", placeholder: "Machine Learning Fundamentals", value: newCourse.name, onChange: (e) => setNewCourse({ ...newCourse, name: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "department", children: "Department" }),
              /* @__PURE__ */ jsx(Input, { id: "department", placeholder: "Computer Science", value: newCourse.department, onChange: (e) => setNewCourse({ ...newCourse, department: e.target.value }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setIsAddDialogOpen(false), children: "Cancel" }),
            /* @__PURE__ */ jsx(Button, { className: "bg-blue-600 hover:bg-blue-700", onClick: handleAddCourse, children: "Create Course" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200", children: [
      /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search courses...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Course Code" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Course Name" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Department" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Credits" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-center", children: "Students" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filteredCourses.map((course) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: course.code }),
          /* @__PURE__ */ jsx(TableCell, { children: course.name }),
          /* @__PURE__ */ jsx(TableCell, { children: course.department }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: course.credits }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-center", children: course.students }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { className: "bg-green-100 text-green-700 hover:bg-green-100", children: course.status }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "Edit" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "View" })
          ] }) })
        ] }, course.id)) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between px-4 py-3 border-t border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
        "Showing ",
        filteredCourses.length,
        " of ",
        courses.length,
        " courses"
      ] }) })
    ] })
  ] });
};
export {
  CoursesPage
};
