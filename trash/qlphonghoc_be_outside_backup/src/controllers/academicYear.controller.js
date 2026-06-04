const db = require("../config/db");

// GET all academic years
exports.getAllAcademicYears = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM academic_years WHERE is_deleted = 0 ORDER BY id DESC"
    );

    res.json({
      success: true,
      message: "Fetch academic years successfully",
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

// GET academic year by id
exports.getAcademicYearById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM academic_years WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch academic year successfully",
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

// CREATE academic year
exports.createAcademicYear = async (req, res) => {
  try {
    const { year_label, start_date, end_date, is_current } = req.body;

    if (!year_label || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "year_label, start_date, end_date are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO academic_years (year_label, start_date, end_date, is_current, is_deleted)
       VALUES (?, ?, ?, ?, 0)`,
      [year_label, start_date, end_date, is_current ?? 0]
    );

    res.status(201).json({
      success: true,
      message: "Create academic year successfully",
      data: {
        id: result.insertId,
        year_label,
        start_date,
        end_date,
        is_current: is_current ?? 0
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

// UPDATE academic year
exports.updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year_label, start_date, end_date, is_current } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM academic_years WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found"
      });
    }

    await db.query(
      `UPDATE academic_years
       SET year_label = ?, start_date = ?, end_date = ?, is_current = ?
       WHERE id = ?`,
      [year_label, start_date, end_date, is_current ?? 0, id]
    );

    res.json({
      success: true,
      message: "Update academic year successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE academic year (soft delete)
exports.deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM academic_years WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found"
      });
    }

    await db.query(
      "UPDATE academic_years SET is_deleted = 1 WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Delete academic year successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};