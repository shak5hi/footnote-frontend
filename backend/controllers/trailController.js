const ReadingTrail = require("../models/ReadingTrail");

// Create a trail
exports.createTrail = async (req, res) => {
  try {
    const { title, description, articles } = req.body;
    const trail = new ReadingTrail({ title, description, articles: articles || [] });
    await trail.save();
    res.status(201).json(trail);
  } catch (error) {
    res.status(500).json({ message: "Server error creating trail" });
  }
};

// Get all trails
exports.getTrails = async (req, res) => {
  try {
    const trails = await ReadingTrail.find().populate('articles', 'title tone content coverImage').sort({ createdAt: -1 });
    res.status(200).json(trails);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching trails" });
  }
};

// Get single trail
exports.getTrailById = async (req, res) => {
  try {
    const trail = await ReadingTrail.findById(req.params.id).populate('articles', 'title tone content coverImage');
    if (!trail) return res.status(404).json({ message: "Trail not found" });
    res.status(200).json(trail);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching trail" });
  }
};

// Update trail
exports.updateTrail = async (req, res) => {
  try {
    const { title, description, articles } = req.body;
    const trail = await ReadingTrail.findByIdAndUpdate(
      req.params.id,
      { title, description, articles },
      { new: true }
    ).populate('articles', 'title tone content coverImage');
    if (!trail) return res.status(404).json({ message: "Trail not found" });
    res.status(200).json(trail);
  } catch (error) {
    res.status(500).json({ message: "Server error updating trail" });
  }
};

// Delete trail
exports.deleteTrail = async (req, res) => {
  try {
    await ReadingTrail.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Trail deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting trail" });
  }
};
