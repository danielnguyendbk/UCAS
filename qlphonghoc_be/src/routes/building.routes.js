const express = require("express");
const router = express.Router();
const controller = require("../controllers/building.controller");

router.get("/", controller.getAllBuildings);
router.get("/:id", controller.getBuildingById);
router.post("/", controller.createBuilding);
router.put("/:id", controller.updateBuilding);
router.delete("/:id", controller.deleteBuilding);

module.exports = router;