const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const upload = require("../utils/upload");

router.post("/", upload.single("coverImage"), articleController.createArticle);
router.get("/", articleController.getArticles);
router.get("/drafts", articleController.getDrafts);
router.get("/music-suggestions", articleController.suggestMusic);
router.get("/:id", articleController.getArticleById);
router.delete("/:id", articleController.deleteArticle);
router.put("/:id", upload.single("coverImage"), articleController.updateArticle);

module.exports = router;
