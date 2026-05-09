require("dotenv").config();
const express = require("express");
const cors = require("cors");

const academicYearRoutes = require("./routes/academicYear.routes");
const semesterRoutes = require("./routes/semester.routes");
const facultyRoutes = require("./routes/faculty.routes");
const departmentRoutes = require("./routes/department.routes");
const courseRoutes = require("./routes/course.routes");
const lecturerRoutes = require("./routes/lecturer.routes");
const buildingRoutes = require("./routes/building.routes");
const classroomRoutes = require("./routes/classroom.routes");
const timeSlotRoutes = require("./routes/timeSlot.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API qlphonghoc is running" });
});

app.use("/academic-years", academicYearRoutes);
app.use("/semesters", semesterRoutes);
app.use("/faculties", facultyRoutes);
app.use("/departments", departmentRoutes);
app.use("/courses", courseRoutes);
app.use("/lecturers", lecturerRoutes);
app.use("/buildings", buildingRoutes);
app.use("/classrooms", classroomRoutes);
app.use("/time-slots", timeSlotRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});