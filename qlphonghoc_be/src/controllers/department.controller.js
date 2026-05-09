const db = require("../config/db");

// GET all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, f.name AS faculty_name
      FROM departments d
      JOIN faculties f ON d.faculty_id = f.id
      WHERE d.is_deleted = 0
      ORDER BY d.id DESC
    `);

    res.json({
      success: true,
      message: "Fetch departments successfully",
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

// GET department by id
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT d.*, f.name AS faculty_name
      FROM departments d
      JOIN faculties f ON d.faculty_id = f.id
      WHERE d.id = ? AND d.is_deleted = 0
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch department successfully",
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

// CREATE department
exports.createDepartment = async (req, res) => {
  try {
    const { faculty_id, name, code } = req.body;

    if (!faculty_id || !name || !code) {
      return res.status(400).json({
        success: false,
        message: "faculty_id, name and code are required"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO departments (faculty_id, name, code, is_deleted)
      VALUES (?, ?, ?, 0)
      `,
      [faculty_id, name, code]
    );

    res.status(201).json({
      success: true,
      message: "Create department successfully",
      data: {
        id: result.insertId,
        faculty_id,
        name,
        code
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

// UPDATE department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_id, name, code } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM departments WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    await db.query(
      `
      UPDATE departments
      SET faculty_id = ?, name = ?, code = ?
      WHERE id = ?
      `,
      [faculty_id, name, code, id]
    );

    res.json({
      success: true,
      message: "Update department successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM departments WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    await db.query(
      "UPDATE departments SET is_deleted = 1 WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Delete department successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};