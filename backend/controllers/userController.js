const User = require("../models/User");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('pinnedArticles');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile aesthetics
exports.updateProfile = async (req, res) => {
  try {
    const { bio, font, theme, spacing, now } = req.body;
    const update = {};
    
    if (bio !== undefined) update['profile.bio'] = bio;
    if (font) update['profile.font'] = font;
    if (theme) update['profile.theme'] = theme;
    if (spacing) update['profile.spacing'] = spacing;
    if (now) {
      if (now.reading !== undefined) update['now.reading'] = now.reading;
      if (now.listening !== undefined) update['now.listening'] = now.listening;
      if (now.thinking !== undefined) update['now.thinking'] = now.thinking;
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// Pin/unpin articles
exports.updatePinnedArticles = async (req, res) => {
  try {
    const { pinnedArticles } = req.body; // array of article IDs, max 5
    const pinned = (pinnedArticles || []).slice(0, 5);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { pinnedArticles: pinned },
      { new: true }
    ).select('-password').populate('pinnedArticles');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error updating pins" });
  }
};

// Update writing streak
exports.recordWrite = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toDateString();
    const lastWrite = user.streak?.lastWriteDate ? new Date(user.streak.lastWriteDate).toDateString() : null;

    if (lastWrite === today) {
      return res.status(200).json({ streak: user.streak });
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let newCurrent = 1;
    if (lastWrite === yesterday) {
      newCurrent = (user.streak?.current || 0) + 1;
    }

    user.streak = {
      current: newCurrent,
      longest: Math.max(newCurrent, user.streak?.longest || 0),
      lastWriteDate: new Date(),
    };
    await user.save();

    res.status(200).json({ streak: user.streak });
  } catch (error) {
    res.status(500).json({ message: "Server error recording write" });
  }
};

// Track reading history
exports.trackReading = async (req, res) => {
  try {
    const { articleId, timeSpentMs, completed } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if already in history
    const existing = user.readingHistory.find(r => r.articleId?.toString() === articleId);
    if (existing) {
      existing.timeSpentMs = (existing.timeSpentMs || 0) + (timeSpentMs || 0);
      if (completed) existing.completed = true;
      existing.readAt = new Date();
    } else {
      user.readingHistory.push({ articleId, timeSpentMs: timeSpentMs || 0, completed: completed || false });
    }

    // Keep last 100 entries
    if (user.readingHistory.length > 100) {
      user.readingHistory = user.readingHistory.slice(-100);
    }

    await user.save();
    res.status(200).json({ message: "Reading tracked" });
  } catch (error) {
    res.status(500).json({ message: "Server error tracking reading" });
  }
};

// Get reading stats
exports.getReadingStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('readingHistory').populate('readingHistory.articleId', 'title tone');
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalArticles = user.readingHistory.length;
    const completed = user.readingHistory.filter(r => r.completed).length;
    const totalTimeMs = user.readingHistory.reduce((sum, r) => sum + (r.timeSpentMs || 0), 0);

    // Favorite tones
    const toneCounts = {};
    user.readingHistory.forEach(r => {
      const tone = r.articleId?.tone || 'General';
      toneCounts[tone] = (toneCounts[tone] || 0) + 1;
    });

    res.status(200).json({
      totalArticles,
      completed,
      totalTimeMs,
      totalTimeMinutes: Math.round(totalTimeMs / 60000),
      favoriteTones: Object.entries(toneCounts).sort((a, b) => b[1] - a[1]).slice(0, 3),
      history: user.readingHistory.slice(-20).reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching reading stats" });
  }
};
