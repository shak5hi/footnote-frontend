const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/:id", userController.getProfile);
router.put("/:id/profile", userController.updateProfile);
router.put("/:id/pinned", userController.updatePinnedArticles);
router.post("/:id/record-write", userController.recordWrite);
router.post("/:id/track-reading", userController.trackReading);
router.get("/:id/reading-stats", userController.getReadingStats);

module.exports = router;
