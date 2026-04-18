const express = require("express");
const router = express.Router();
const trailController = require("../controllers/trailController");

router.post("/", trailController.createTrail);
router.get("/", trailController.getTrails);
router.get("/:id", trailController.getTrailById);
router.put("/:id", trailController.updateTrail);
router.delete("/:id", trailController.deleteTrail);

module.exports = router;
