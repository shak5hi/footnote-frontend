const mongoose = require("mongoose");

const ReadingTrailSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article"
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ReadingTrail", ReadingTrailSchema);
