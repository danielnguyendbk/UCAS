const db = require("../config/db");

// GET all courses
exports.getAllCourses = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, d.name AS department_name
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      WHERE c.is_deleted = 0
      ORDER BY c.id DESC
    `);

    res.json({
      success: true,
      message: "Fetch courses successfully",
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET course by id
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT c.*, d.name AS department_name
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      WHERE c.id = ? AND c.is_deleted = 0
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch course successfully",
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// CREATE course
exports.createCourse = async (req, res) => {
  try {
    const {
      department_id,
      course_code,
      course_name,
      credits,
      required_room_type,
      description
    } = req.body;

    if (!department_id || !course_code || !course_name || credits == null) {
      return res.status(400).json({
        success: false,
        message: "department_id, course_code, course_name, credits are required"
      });
    }

    const validRoomTypes = ["LECTURE", "LAB", "SEMINAR", "AUDITORIUM"];
    if (required_room_type && !validRoomTypes.includes(required_room_type)) {
      return res.status(400).json({
        success: false,
        message: "required_room_type must be one of: LECTURE, LAB, SEMINAR, AUDITORIUM"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO courses
      (department_id, course_code, course_name, credits, required_room_type, description, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      [
        department_id,
        course_code,
        course_name,
        credits,
        required_room_type || "LECTURE",
        description || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Create course successfully",
      data: {
        id: result.insertId,
        department_id,
        course_code,
        course_name,
        credits,
        required_room_type: required_room_type || "LECTURE",
        description: description || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// UPDATE course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      department_id,
      course_code,
      course_name,
      credits,
      required_room_type,
      description
    } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM courses WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const validRoomTypes = ["LECTURE", "LAB", "SEMINAR", "AUDITORIUM"];
    if (required_room_type && !validRoomTypes.includes(required_room_type)) {
      return res.status(400).json({
        success: false,
        message: "required_room_type must be one of: LECTURE, LAB, SEMINAR, AUDITORIUM"
      });
    }

    await db.query(
      `
      UPDATE courses
      SET department_id = ?, course_code = ?, course_name = ?, credits = ?, required_room_type = ?, description = ?
      WHERE id = ?
      `,
      [
        department_id,
        course_code,
        course_name,
        credits,
        required_room_type || "LECTURE",
        description || null,
        id
      ]
    );

    res.json({
      success: true,
      message: "Update course successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM courses WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    await db.query("UPDATE courses SET is_deleted = 1 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Delete course successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};