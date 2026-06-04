const express = require("express");
const router = express.Router();
const controller = require("../controllers/classroom.controller");

router.get("/", controller.getAllClassrooms);
router.get("/:id", controller.getClassroomById);
router.post("/", controller.createClassroom);
router.put("/:id", controller.updateClassroom);
router.delete("/:id", controller.deleteClassroom);

module.exports = router;