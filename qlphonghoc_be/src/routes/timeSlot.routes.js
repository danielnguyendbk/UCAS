const express = require("express");
const router = express.Router();
const controller = require("../controllers/timeSlot.controller");

router.get("/", controller.getAllTimeSlots);
router.get("/:id", controller.getTimeSlotById);
router.post("/", controller.createTimeSlot);
router.put("/:id", controller.updateTimeSlot);
router.delete("/:id", controller.deleteTimeSlot);

module.exports = router;