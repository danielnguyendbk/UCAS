const db = require("../config/db");

// GET all semesters
exports.getAllSemesters = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * 
      FROM semesters
      WHERE is_deleted = 0
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      message: "Fetch semesters successfully",
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

// GET semester by id
exports.getSemesterById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM semesters WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Semester not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch semester successfully",
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

// CREATE semester
exports.createSemester = async (req, res) => {
  try {
    const {
      academic_year_id,
      semester_type,
      semester_name,
      start_date,
      end_date,
      status
    } = req.body;

    if (
      !academic_year_id ||
      !semester_type ||
      !semester_name ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        success: false,
        message: "academic_year_id, semester_type, semester_name, start_date, end_date are required"
      });
    }

    const validSemesterTypes = ["FALL", "SPRING", "SUMMER"];
    if (!validSemesterTypes.includes(semester_type)) {
      return res.status(400).json({
        success: false,
        message: "semester_type must be one of: FALL, SPRING, SUMMER"
      });
    }

    const validStatuses = ["UPCOMING", "ACTIVE", "COMPLETED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be one of: UPCOMING, ACTIVE, COMPLETED"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO semesters
      (academic_year_id, semester_type, semester_name, start_date, end_date, status, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      [
        academic_year_id,
        semester_type,
        semester_name,
        start_date,
        end_date,
        status || "UPCOMING"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Create semester successfully",
      data: {
        id: result.insertId,
        academic_year_id,
        semester_type,
        semester_name,
        start_date,
        end_date,
        status: status || "UPCOMING"
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

// UPDATE semester
exports.updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      academic_year_id,
      semester_type,
      semester_name,
      start_date,
      end_date,
      status
    } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM semesters WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Semester not found"
      });
    }

    const validSemesterTypes = ["FALL", "SPRING", "SUMMER"];
    if (semester_type && !validSemesterTypes.includes(semester_type)) {
      return res.status(400).json({
        success: false,
        message: "semester_type must be one of: FALL, SPRING, SUMMER"
      });
    }

    const validStatuses = ["UPCOMING", "ACTIVE", "COMPLETED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be one of: UPCOMING, ACTIVE, COMPLETED"
      });
    }

    await db.query(
      `
      UPDATE semesters
      SET academic_year_id = ?, semester_type = ?, semester_name = ?, start_date = ?, end_date = ?, status = ?
      WHERE id = ?
      `,
      [
        academic_year_id,
        semester_type,
        semester_name,
        start_date,
        end_date,
        status || "UPCOMING",
        id
      ]
    );

    res.json({
      success: true,
      message: "Update semester successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE semester
exports.deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM semesters WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Semester not found"
      });
    }

    await db.query(
      "UPDATE semesters SET is_deleted = 1 WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Delete semester successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};