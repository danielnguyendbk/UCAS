const db = require("../config/db");

// GET all buildings
exports.getAllBuildings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM buildings
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      message: "Fetch buildings successfully",
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

// GET building by id
exports.getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM buildings WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Building not found"
      });
    }

    res.json({
      success: true,
      message: "Fetch building successfully",
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

// CREATE building
exports.createBuilding = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "name and code are required"
      });
    }

    const [result] = await db.query(
      "INSERT INTO buildings (name, code) VALUES (?, ?)",
      [name, code]
    );

    res.status(201).json({
      success: true,
      message: "Create building successfully",
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

// UPDATE building
exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const [checkRows] = await db.query(
      "SELECT * FROM buildings WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Building not found"
      });
    }

    await db.query(
      "UPDATE buildings SET name = ?, code = ? WHERE id = ?",
      [name, code, id]
    );

    res.json({
      success: true,
      message: "Update building successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// DELETE building
exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;

    const [checkRows] = await db.query(
      "SELECT * FROM buildings WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Building not found"
      });
    }

    await db.query("DELETE FROM buildings WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Delete building successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};