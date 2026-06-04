const db = require("../config/db");

// GET all time slots
exports.getAllTimeSlots = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM time_slots
      ORDER BY slot_number ASC
    `);

    res.json({
      success: true,
      message: "Fetch time slots successfully",
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

// GET time slot by id
exports.getTimeSlotById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM time_slots WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch time slot successfully",
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

// CREATE time slot
exports.createTimeSlot = async (req, res) => {
  try {
    const { slot_number, start_time, end_time } = req.body;

    if (!slot_number || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "slot_number, start_time, end_time are required"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO time_slots (slot_number, start_time, end_time)
      VALUES (?, ?, ?)
      `,
      [slot_number, start_time, end_time]
    );

    res.status(201).json({
      success: true,
      message: "Create time slot successfully",
      data: {
        id: result.insertId,
        slot_number,
        start_time,
        end_time
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

// UPDATE time slot
exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { slot_number, start_time, end_time } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM time_slots WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    await db.query(
      `
      UPDATE time_slots
      SET slot_number = ?, start_time = ?, end_time = ?
      WHERE id = ?
      `,
      [slot_number, start_time, end_time, id]
    );

    res.json({
      success: true,
      message: "Update time slot successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE time slot
exports.deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM time_slots WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    await db.query("DELETE FROM time_slots WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Delete time slot successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};