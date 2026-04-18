const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  content: {
    type: String,
  },
  blocks: [
    {
      type: { type: String, enum: ["paragraph", "poetry", "quote", "image", "music", "heading"], default: "paragraph" },
      content: { type: String },
      meta: { type: mongoose.Schema.Types.Mixed }
    }
  ],
  footnotes: [
    {
      id: { type: String },
      refText: { type: String },
      content: { type: String }
    }
  ],
  tone: {
    type: String,
  },
  status: {
    type: String,
    enum: ["draft", "published", "scheduled"],
    default: "draft",
  },
  coverImage: {
    type: String,
  },
  musicTrack: {
    type: String,
  },
  // Phase 2: Version History
  versions: [
    {
      blocks: { type: Array, default: [] },
      content: { type: String },
      savedAt: { type: Date, default: Date.now },
      label: { type: String } // e.g. "Auto-save", "Manual save"
    }
  ],
  // Phase 2: Scheduled Publishing
  scheduledAt: {
    type: Date,
    default: null,
  },
  // Phase 2: Anonymous Publishing
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  // Phase 5: Parallel Narratives
  parallelBlocks: [
    {
      type: { type: String, default: "paragraph" },
      content: { type: String },
      meta: { type: mongoose.Schema.Types.Mixed }
    }
  ],
  // Phase 5: Reading Trail membership
  trailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReadingTrail",
    default: null,
  },
  trailOrder: {
    type: Number,
    default: 0,
  },
  // Stats
  readCount: { type: Number, default: 0 },
  readTimeMs: { type: Number, default: 0 },
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
