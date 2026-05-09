const db = require("../config/db");

// GET all faculties
exports.getAllFaculties = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * 
      FROM faculties
      WHERE is_deleted = 0
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      message: "Fetch faculties successfully",
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

// GET faculty by id
exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM faculties WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch faculty successfully",
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

// CREATE faculty
exports.createFaculty = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "name and code are required"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO faculties (name, code, is_deleted)
      VALUES (?, ?, 0)
      `,
      [name, code]
    );

    res.status(201).json({
      success: true,
      message: "Create faculty successfully",
      data: {
        id: result.insertId,
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

// UPDATE faculty
exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM faculties WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    await db.query(
      `
      UPDATE faculties
      SET name = ?, code = ?
      WHERE id = ?
      `,
      [name, code, id]
    );

    res.json({
      success: true,
      message: "Update faculty successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM faculties WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    await db.query(
      "UPDATE faculties SET is_deleted = 1 WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Delete faculty successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};