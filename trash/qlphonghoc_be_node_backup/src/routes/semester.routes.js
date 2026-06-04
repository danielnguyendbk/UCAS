const express = require("express");
const router = express.Router();
const controller = require("../controllers/semester.controller");

router.get("/", controller.getAllSemesters);
router.get("/:id", controller.getSemesterById);
router.post("/", controller.createSemester);
router.put("/:id", controller.updateSemester);
router.delete("/:id", controller.deleteSemester);

module.exports = router;