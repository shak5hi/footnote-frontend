const Article = require("../models/Article");

exports.createArticle = async (req, res) => {
  try {
    const { title, content, tone, status, musicTrack } = req.body;
    let coverImage = "";

    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    }

    const article = new Article({
      title,
      content,
      tone,
      status: status || "draft",
      musicTrack,
      coverImage,
      // author: req.user?._id // Add this if you have auth middleware later
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
    const drafts = await Article.find({ status: "draft" }).sort({ createdAt: -1 });
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
    const { title, content, tone, status, musicTrack } = req.body;
    let updateFields = { title, content, tone, status, musicTrack };
    
    if (req.file) {
      updateFields.coverImage = `/uploads/${req.file.filename}`;
    }

    const article = await Article.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ message: "Article updated successfully", article });
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({ message: "Server error updating article" });
  }
};

exports.suggestMusic = async (req, res) => {
  try {
    const tone = req.query.tone || "General";
    
    // Expanded array of track strings for better randomization
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
    
    // Randomize array to mimic real AI generation and take 3
    let shuffled = trackPool.sort(() => 0.5 - Math.random());
    let trackNames = shuffled.slice(0, 3);

    // Fetch real previews concurrently from iTunes
    const resolvedTracks = await Promise.all(trackNames.map(async (trackName) => {
      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(trackName)}&limit=1&entity=song`);
        const data = await response.json();
        
        let url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // generic fallback
        if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
           url = data.results[0].previewUrl; // Real .m4a preview snippet!
        }
        
        // Reformat name with a nice dash if not present
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
