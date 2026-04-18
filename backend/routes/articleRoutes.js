const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const upload = require("../utils/upload");

router.post("/", upload.single("coverImage"), articleController.createArticle);
router.get("/", articleController.getArticles);
router.get("/drafts", articleController.getDrafts);
router.get("/music-suggestions", articleController.suggestMusic);
router.post("/publish-scheduled", articleController.publishScheduled);
router.get("/:id", articleController.getArticleById);
router.delete("/:id", articleController.deleteArticle);
router.put("/:id", upload.single("coverImage"), articleController.updateArticle);
router.get("/:id/versions", articleController.getVersions);
router.post("/:id/restore", articleController.restoreVersion);
router.post("/:id/track-reading", articleController.trackReading);

module.exports = router;
