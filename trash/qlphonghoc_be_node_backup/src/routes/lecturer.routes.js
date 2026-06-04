const express = require("express");
const router = express.Router();
const controller = require("../controllers/lecturer.controller");

router.get("/", controller.getAllLecturers);
router.get("/:id", controller.getLecturerById);
router.post("/", controller.createLecturer);
router.put("/:id", controller.updateLecturer);
router.delete("/:id", controller.deleteLecturer);

module.exports = router;