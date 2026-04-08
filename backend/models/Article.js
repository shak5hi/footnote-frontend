const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  tone: {
    type: String,
  },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
  },
  coverImage: {
    type: String, // String path or URL
  },
  musicTrack: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Article", ArticleSchema);
