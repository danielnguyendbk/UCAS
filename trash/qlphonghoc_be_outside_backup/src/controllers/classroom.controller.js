const db = require("../config/db");

// GET all classrooms
exports.getAllClassrooms = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, b.name AS building_name
      FROM classrooms c
      JOIN buildings b ON c.building_id = b.id
      ORDER BY c.id DESC
    `);

    res.json({
      success: true,
      message: "Fetch classrooms successfully",
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

// GET classroom by id
exports.getClassroomById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT c.*, b.name AS building_name
      FROM classrooms c
      JOIN buildings b ON c.building_id = b.id
      WHERE c.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch classroom successfully",
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

// CREATE classroom
exports.createClassroom = async (req, res) => {
  try {
    const {
      building_id,
      floor_number,
      room_number,
      room_name,
      room_type,
      capacity,
      has_projector,
      has_ac,
      is_active
    } = req.body;

    if (!building_id || !room_number || !capacity) {
      return res.status(400).json({
        success: false,
        message: "building_id, room_number, capacity are required"
      });
    }

    const validRoomTypes = ["LECTURE", "LAB", "SEMINAR", "AUDITORIUM"];
    if (room_type && !validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        success: false,
        message: "room_type must be one of: LECTURE, LAB, SEMINAR, AUDITORIUM"
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO classrooms
      (building_id, floor_number, room_number, room_name, room_type, capacity, has_projector, has_ac, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        building_id,
        floor_number || null,
        room_number,
        room_name || null,
        room_type || "LECTURE",
        capacity,
        has_projector ?? 0,
        has_ac ?? 0,
        is_active ?? 1
      ]
    );

    res.status(201).json({
      success: true,
      message: "Create classroom successfully",
      data: {
        id: result.insertId,
        building_id,
        floor_number: floor_number || null,
        room_number,
        room_name: room_name || null,
        room_type: room_type || "LECTURE",
        capacity,
        has_projector: has_projector ?? 0,
        has_ac: has_ac ?? 0,
        is_active: is_active ?? 1
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

// UPDATE classroom
exports.updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      building_id,
      floor_number,
      room_number,
      room_name,
      room_type,
      capacity,
      has_projector,
      has_ac,
      is_active
    } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM classrooms WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found"
      });
    }

    const validRoomTypes = ["LECTURE", "LAB", "SEMINAR", "AUDITORIUM"];
    if (room_type && !validRoomTypes.includes(room_type)) {
      return res.status(400).json({
        success: false,
        message: "room_type must be one of: LECTURE, LAB, SEMINAR, AUDITORIUM"
      });
    }

    await db.query(
      `
      UPDATE classrooms
      SET building_id = ?, floor_number = ?, room_number = ?, room_name = ?, room_type = ?, capacity = ?, has_projector = ?, has_ac = ?, is_active = ?
      WHERE id = ?
      `,
      [
        building_id,
        floor_number || null,
        room_number,
        room_name || null,
        room_type || "LECTURE",
        capacity,
        has_projector ?? 0,
        has_ac ?? 0,
        is_active ?? 1,
        id
      ]
    );

    res.json({
      success: true,
      message: "Update classroom successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE classroom
exports.deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM classrooms WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found"
      });
    }

    await db.query("DELETE FROM classrooms WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Delete classroom successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};