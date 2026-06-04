const db = require("../config/db");

// GET all lecturers
exports.getAllLecturers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, d.name AS department_name
      FROM lecturers l
      JOIN departments d ON l.department_id = d.id
      WHERE l.is_deleted = 0
      ORDER BY l.id DESC
    `);

    res.json({
      success: true,
      message: "Fetch lecturers successfully",
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

// GET lecturer by id
exports.getLecturerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT l.*, d.name AS department_name
      FROM lecturers l
      JOIN departments d ON l.department_id = d.id
      WHERE l.id = ? AND l.is_deleted = 0
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch lecturer successfully",
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

// CREATE lecturer
exports.createLecturer = async (req, res) => {
  try {
    const {
      user_id,
      department_id,
      staff_code,
      full_name,
      email,
      phone
    } = req.body;

    if (!user_id || !department_id || !staff_code || !full_name || !email) {
      return res.status(400).json({
        success: false,
        message: "user_id, department_id, staff_code, full_name, email are required"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO lecturers
      (user_id, department_id, staff_code, full_name, email, phone, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      [user_id, department_id, staff_code, full_name, email, phone || null]
    );

    res.status(201).json({
      success: true,
      message: "Create lecturer successfully",
      data: {
        id: result.insertId,
        user_id,
        department_id,
        staff_code,
        full_name,
        email,
        phone: phone || null
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

// UPDATE lecturer
exports.updateLecturer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      department_id,
      staff_code,
      full_name,
      email,
      phone
    } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM lecturers WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found"
      });
    }

    await db.query(
      `
      UPDATE lecturers
      SET user_id = ?, department_id = ?, staff_code = ?, full_name = ?, email = ?, phone = ?
      WHERE id = ?
      `,
      [user_id, department_id, staff_code, full_name, email, phone || null, id]
    );

    res.json({
      success: true,
      message: "Update lecturer successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE lecturer
exports.deleteLecturer = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM lecturers WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found"
      });
    }

    await db.query("UPDATE lecturers SET is_deleted = 1 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Delete lecturer successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};