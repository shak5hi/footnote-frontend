const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    subscriptions: {
        type: Array,
        default: []
    },
    // Phase 4: Personal Aesthetic Profile
    profile: {
        bio: { type: String, default: '' },
        avatar: { type: String, default: '' },
        font: { type: String, enum: ['serif', 'sans', 'mono'], default: 'sans' },
        theme: { type: String, enum: ['deep', 'paper', 'minimal', 'typewriter'], default: 'deep' },
        spacing: { type: String, enum: ['compact', 'normal', 'relaxed'], default: 'normal' },
    },
    // Phase 4: Pinned Works (max 5)
    pinnedArticles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article"
    }],
    // Phase 4: "Now" Section
    now: {
        reading: { type: String, default: '' },
        listening: { type: String, default: '' },
        thinking: { type: String, default: '' },
    },
    // Phase 4: Writing Streaks
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastWriteDate: { type: Date, default: null },
    },
    // Phase 5: Reading History
    readingHistory: [{
        articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
        readAt: { type: Date, default: Date.now },
        timeSpentMs: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
    }],
});

module.exports = mongoose.model("User", userSchema);