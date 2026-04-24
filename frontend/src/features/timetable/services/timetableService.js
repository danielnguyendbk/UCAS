const TIMETABLE_DATA = [
  {
    id: 1,
    courseCode: "CS101",
    courseName: "Introduction to Programming",
    lecturer: "Dr. Sarah Johnson",
    studentCount: 45,
    day: "Monday",
    timeSlot: "08:00 - 10:00",
    assignedRoom: "A-301",
    status: "valid"
  },
  {
    id: 2,
    courseCode: "MATH201",
    courseName: "Calculus II",
    lecturer: "Prof. Michael Chen",
    studentCount: 60,
    day: "Monday",
    timeSlot: "10:00 - 12:00",
    assignedRoom: "B-105",
    status: "valid"
  },
  {
    id: 3,
    courseCode: "PHY301",
    courseName: "Quantum Mechanics",
    lecturer: "Dr. Emily Brown",
    studentCount: 35,
    day: "Tuesday",
    timeSlot: "14:00 - 16:00",
    assignedRoom: "C-201",
    status: "valid"
  },
  {
    id: 4,
    courseCode: "ENG102",
    courseName: "Technical Writing",
    lecturer: "Dr. Robert Lee",
    studentCount: 50,
    day: "Wednesday",
    timeSlot: "08:00 - 10:00",
    assignedRoom: "A-301",
    status: "conflict"
  },
  {
    id: 5,
    courseCode: "BIO201",
    courseName: "Cell Biology",
    lecturer: "Dr. Amanda White",
    studentCount: 40,
    day: "Thursday",
    timeSlot: "10:00 - 12:00",
    assignedRoom: "",
    status: "pending"
  },
  {
    id: 6,
    courseCode: "CHEM301",
    courseName: "Organic Chemistry",
    lecturer: "Prof. David Kim",
    studentCount: 38,
    day: "Friday",
    timeSlot: "14:00 - 16:00",
    assignedRoom: "D-102",
    status: "valid"
  }
];
const timetableService = {
  async getTimetableItems() {
    return Promise.resolve(TIMETABLE_DATA);
  }
};
export {
  timetableService
};
