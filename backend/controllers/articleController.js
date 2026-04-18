const Article = require("../models/Article");

exports.createArticle = async (req, res) => {
  try {
    const { title, content, tone, status, musicTrack, blocks, parallelBlocks, footnotes, isAnonymous, scheduledAt } = req.body;
    let coverImage = "";

    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    }

    let parsedBlocks = [];
    let parsedParallelBlocks = [];
    let parsedFootnotes = [];
    try {
      parsedBlocks = blocks ? (typeof blocks === 'string' ? JSON.parse(blocks) : blocks) : [];
      parsedParallelBlocks = parallelBlocks ? (typeof parallelBlocks === 'string' ? JSON.parse(parallelBlocks) : parallelBlocks) : [];
      parsedFootnotes = footnotes ? (typeof footnotes === 'string' ? JSON.parse(footnotes) : footnotes) : [];
    } catch (e) { console.error("Parse error:", e); }

    const plainContent = parsedBlocks.length > 0
      ? parsedBlocks.map(b => b.content || '').filter(Boolean).join('\n\n')
      : (content || '');

    // Determine final status
    let finalStatus = status || "draft";
    let scheduledDate = null;
    if (scheduledAt) {
      finalStatus = "scheduled";
      scheduledDate = new Date(scheduledAt);
    }

    const article = new Article({
      title,
      content: plainContent,
      blocks: parsedBlocks,
      footnotes: parsedFootnotes,
      tone,
      status: finalStatus,
      musicTrack,
      coverImage,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      scheduledAt: scheduledDate,
      parallelBlocks: parsedParallelBlocks,
    });

    await article.save();

    res.status(201).json({ message: "Article saved successfully", article });
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({ message: "Server error creating article" });
  }
};

exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find({ status: "published" }).sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Server error fetching articles" });
  }
};

exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Article.find({ status: { $in: ["draft", "scheduled"] } }).sort({ createdAt: -1 });
    res.status(200).json(drafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ message: "Server error fetching drafts" });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    // Increment read count
    article.readCount = (article.readCount || 0) + 1;
    await article.save();
    res.status(200).json(article);
  } catch (error) {
    console.error("Error fetching article by ID:", error);
    res.status(500).json({ message: "Server error fetching article" });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: "Server error deleting article" });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { title, content, tone, status, musicTrack, blocks, footnotes, isAnonymous, scheduledAt, parallelBlocks } = req.body;
    let updateFields = { title, tone, musicTrack };
    
    let parsedBlocks = [];
    let parsedFootnotes = [];
    let parsedParallelBlocks = [];
    try {
      parsedBlocks = blocks ? (typeof blocks === 'string' ? JSON.parse(blocks) : blocks) : [];
      parsedFootnotes = footnotes ? (typeof footnotes === 'string' ? JSON.parse(footnotes) : footnotes) : [];
      parsedParallelBlocks = parallelBlocks ? (typeof parallelBlocks === 'string' ? JSON.parse(parallelBlocks) : parallelBlocks) : [];
    } catch (e) { console.error("Parse error:", e); }

    if (parsedBlocks.length > 0) {
      updateFields.blocks = parsedBlocks;
      updateFields.content = parsedBlocks.map(b => b.content || '').filter(Boolean).join('\n\n');
    } else if (content) {
      updateFields.content = content;
    }

    if (parsedFootnotes.length > 0) updateFields.footnotes = parsedFootnotes;
    if (parsedParallelBlocks.length > 0) updateFields.parallelBlocks = parsedParallelBlocks;

    // Status & scheduling
    if (scheduledAt) {
      updateFields.status = "scheduled";
      updateFields.scheduledAt = new Date(scheduledAt);
    } else if (status) {
      updateFields.status = status;
      if (status !== 'scheduled') updateFields.scheduledAt = null;
    }

    if (isAnonymous !== undefined) updateFields.isAnonymous = isAnonymous === 'true' || isAnonymous === true;

    if (req.file) {
      updateFields.coverImage = `/uploads/${req.file.filename}`;
    }

    // Save a version snapshot before updating
    const existing = await Article.findById(req.params.id);
    if (existing && existing.blocks && existing.blocks.length > 0) {
      const versionSnapshot = {
        blocks: existing.blocks,
        content: existing.content,
        savedAt: new Date(),
        label: "Auto-save"
      };
      // Keep max 20 versions
      const versions = [...(existing.versions || []), versionSnapshot].slice(-20);
      updateFields.versions = versions;
    }

    const article = await Article.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ message: "Article updated successfully", article });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({ message: "Server error updating article" });
  }
};

// Version History
exports.getVersions = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).select('versions title');
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ versions: article.versions || [], title: article.title });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching versions" });
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const { versionIndex } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    
    const version = article.versions?.[versionIndex];
    if (!version) return res.status(404).json({ message: "Version not found" });

    article.blocks = version.blocks;
    article.content = version.content;
    await article.save();

    res.status(200).json({ message: "Version restored", article });
  } catch (error) {
    res.status(500).json({ message: "Server error restoring version" });
  }
};

// Scheduled Publishing Check (call via cron or interval)
exports.publishScheduled = async (req, res) => {
  try {
    const now = new Date();
    const result = await Article.updateMany(
      { status: "scheduled", scheduledAt: { $lte: now } },
      { $set: { status: "published" } }
    );
    res.status(200).json({ published: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: "Server error publishing scheduled articles" });
  }
};

// Track reading time
exports.trackReading = async (req, res) => {
  try {
    const { timeSpentMs } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    
    article.readTimeMs = (article.readTimeMs || 0) + (timeSpentMs || 0);
    await article.save();
    
    res.status(200).json({ message: "Reading tracked" });
  } catch (error) {
    res.status(500).json({ message: "Server error tracking reading" });
  }
};

// Music suggestions (unchanged)
exports.suggestMusic = async (req, res) => {
  try {
    const tone = req.query.tone || "General";
    
    const recommendations = {
      "Reflection": [
        "Spiegel im Spiegel Arvo Part",
        "Avril 14th Aphex Twin",
        "Clair de Lune Claude Debussy",
        "Gymnopedie No 1 Erik Satie",
        "Valse Sentimentale Tchaikovsky",
        "Nocturne Op 9 No 2 Chopin",
        "To Build A Home Cinematic Orchestra"
      ],
      "Personal": [
        "Mystery of Love Sufjan Stevens",
        "Holocene Bon Iver",
        "Youth Daughter",
        "Sparks Coldplay",
        "Cherry Wine Hozier",
        "Liability Lorde",
        "Rosyln Bon Iver"
      ],
      "Observation": [
        "Weightless Marconi Union",
        "A Walk Tycho",
        "Halcyon On and On Orbital",
        "Daydreaming Radiohead",
        "Intro The xx",
        "Space Song Beach House",
        "Teardrop Massive Attack"
      ],
      "Essay": [
        "Time Hans Zimmer",
        "On the Nature of Daylight Max Richter",
        "Experience Ludovico Einaudi",
        "Arrival of the Birds Cinematic Orchestra",
        "Light of the Seven Ramin Djawadi",
        "Interstellar Main Theme Hans Zimmer",
        "Opus Eric Prydz"
      ],
      "Field Note": [
        "Comptine d'un autre Yann Tiersen",
        "The Winner Is Mychael Danna",
        "Astrovan Mt Joy",
        "Ends of the Earth Lord Huron",
        "Society Eddie Vedder",
        "Gooey Glass Animals",
        "Naked As We Came Iron & Wine"
      ],
      "General": [
        "Nuvole Bianche Ludovico Einaudi",
        "River Flows in You Yiruma",
        "Cornfield Chase Hans Zimmer",
        "Flight from the City Johann Johannsson",
        "Merry Christmas Mr Lawrence Ryuichi Sakamoto",
        "Kiss the Rain Yiruma",
        "Una Mattina Ludovico Einaudi"
      ]
    };

    let trackPool = recommendations[tone] || recommendations["General"];
    let shuffled = trackPool.sort(() => 0.5 - Math.random());
    let trackNames = shuffled.slice(0, 3);

    const resolvedTracks = await Promise.all(trackNames.map(async (trackName) => {
      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(trackName)}&limit=1&entity=song`);
        const data = await response.json();
        
        let url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
           url = data.results[0].previewUrl;
        }
        
        const prettyName = trackName.replace(/ ([^-]{4,})$/, ' - $1'); 
        return { name: prettyName, url };
      } catch (err) {
        console.error("iTunes fetch error for track:", trackName, err);
        return { name: trackName, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" };
      }
    }));

    res.status(200).json({ tracks: resolvedTracks });
  } catch (error) {
    console.error("Error suggesting music:", error);
    res.status(500).json({ message: "Server error generating music suggestions" });
  }
};
