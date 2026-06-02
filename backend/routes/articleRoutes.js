const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const upload = require("../utils/upload");
const { protect, premiumOnly } = require("../middleware/authMiddleware");

router.post("/", protect, upload.single("coverImage"), articleController.createArticle);
router.get("/", articleController.getArticles);
router.get("/drafts", articleController.getDrafts);
router.get("/music-suggestions", articleController.suggestMusic);
router.post("/music-suggestions", articleController.suggestMusic);
router.get("/cover-suggestions", articleController.suggestCovers);
router.post("/cover-suggestions", articleController.suggestCovers);
router.post("/publish-scheduled", articleController.publishScheduled);
router.post("/generate", articleController.generateArticle);
router.get("/:id", articleController.getArticleById);
router.delete("/:id", articleController.deleteArticle);
router.put("/:id", protect, upload.single("coverImage"), articleController.updateArticle);
router.get("/:id/versions", articleController.getVersions);
router.post("/:id/restore", articleController.restoreVersion);
router.post("/:id/track-reading", articleController.trackReading);

module.exports = router;
