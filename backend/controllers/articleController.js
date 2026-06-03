const Article = require("../models/Article");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const musicCatalog = require("../config/musicCatalog");
const imageCatalog = require("../config/imageCatalog");

exports.createArticle = async (req, res) => {
  try {
    const { title, content, tone, status, musicTrack, blocks, parallelBlocks, footnotes, isAnonymous, scheduledAt } = req.body;
    let coverImage = "";

    if (req.file) {
      coverImage = `/uploads/${req.file.filename}`;
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
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

    const isPremium = true;

    // Check Anonymous publishing
    const wantAnonymous = isAnonymous === 'true' || isAnonymous === true;
    if (wantAnonymous && !isPremium) {
      return res.status(403).json({ message: "Anonymous publishing is a premium feature. Please upgrade your plan." });
    }

    // Determine final status
    let finalStatus = status || "draft";
    let scheduledDate = null;
    if (scheduledAt) {
      finalStatus = "scheduled";
      scheduledDate = new Date(scheduledAt);
    }

    // Check Scheduling
    const wantScheduled = finalStatus === "scheduled";
    if (wantScheduled && !isPremium) {
      return res.status(403).json({ message: "Scheduling articles is a premium feature. Please upgrade your plan." });
    }

    // Check Publish Limit for Free users
    if ((finalStatus === "published" || finalStatus === "scheduled") && !isPremium) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await Article.countDocuments({
        author: req.user._id,
        status: { $in: ["published", "scheduled"] },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (count >= 5) {
        return res.status(403).json({
          message: "You have reached your limit of 5 published articles for this month. Upgrade to Premium for unlimited publishing."
        });
      }
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
      isAnonymous: wantAnonymous,
      scheduledAt: scheduledDate,
      parallelBlocks: parsedParallelBlocks,
      author: req.user ? req.user._id : null
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
    const existing = await Article.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Article not found" });

    const { title, content, tone, status, musicTrack, blocks, footnotes, isAnonymous, scheduledAt, parallelBlocks } = req.body;
    
    const isPremium = true;

    // Check Anonymous publishing
    const wantAnonymous = isAnonymous === 'true' || isAnonymous === true;
    if (wantAnonymous && !isPremium) {
      return res.status(403).json({ message: "Anonymous publishing is a premium feature. Please upgrade your plan." });
    }

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
    let nextStatus = existing.status;
    let nextScheduledAt = existing.scheduledAt;

    if (scheduledAt) {
      nextStatus = "scheduled";
      nextScheduledAt = new Date(scheduledAt);
    } else if (status) {
      nextStatus = status;
      if (status !== 'scheduled') nextScheduledAt = null;
    }

    // Check Scheduling
    if (nextStatus === "scheduled" && !isPremium) {
      return res.status(403).json({ message: "Scheduling articles is a premium feature. Please upgrade your plan." });
    }

    updateFields.status = nextStatus;
    updateFields.scheduledAt = nextScheduledAt;

    // Check Publish Limit for Free users transitioning from draft to published/scheduled
    const currentStatus = existing.status || "draft";
    const isTransitioningToPublish = (currentStatus === "draft") && (nextStatus === "published" || nextStatus === "scheduled");

    if (isTransitioningToPublish && !isPremium) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await Article.countDocuments({
        author: req.user._id,
        status: { $in: ["published", "scheduled"] },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      if (count >= 5) {
        return res.status(403).json({
          message: "You have reached your limit of 5 published articles for this month. Upgrade to Premium for unlimited publishing."
        });
      }
    }

    if (isAnonymous !== undefined) updateFields.isAnonymous = wantAnonymous;

    if (req.file) {
      updateFields.coverImage = `/uploads/${req.file.filename}`;
    } else if (req.body.coverImage) {
      updateFields.coverImage = req.body.coverImage;
    }

    // Set/update author just in case
    if (!existing.author && req.user) {
      updateFields.author = req.user._id;
    }

    // Save a version snapshot before updating
    if (existing.blocks && existing.blocks.length > 0) {
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

// Music suggestions powered by Gemini AI
exports.suggestMusic = async (req, res) => {
  const title = req.body.title || "";
  const content = req.body.content || "";

  if (!title.trim() && !content.trim()) {
    return res.status(400).json({ error: "Please provide a title or content for music suggestions." });
  }

  // Fallback/shuffle that doesn't rely on tone
  const getRandomFallback = () => {
    let shuffled = [...musicCatalog].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(track => ({
      name: `${track.title} - ${track.artist}`,
      url: track.url
    }));
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith("your_gemini_api_key")) {
      console.log("⚠️ GEMINI_API_KEY not set. Using random catalog fallback.");
      return res.status(200).json({ tracks: getRandomFallback() });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an expert music supervisor and curator for a premium literary/blog platform called "FootNote".
Your task is to select the top 3 best matching ambient, instrumental, or lo-fi tracks from our curated music catalog for the following article:

Article Title: "${title}"
Article Content:
"${content}"

Here is the music catalog to choose from (each item contains title, artist, description, tones, and url):
${JSON.stringify(musicCatalog, null, 2)}

Constraints:
1. You MUST select the 3 tracks that best match the vibe, theme, and atmospheric quality of the written article title and content.
2. Rely purely on the meaning and context of the text written by the author, rather than any pre-selected tone.

Response format MUST be a JSON object with a single "tracks" array containing objects with "title", "artist", and "url" copied exactly from the catalog.
Example output format:
{
  "tracks": [
    {
      "title": "Quiet Observations",
      "artist": "Holographic Dusk",
      "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    ...
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (parsed && Array.isArray(parsed.tracks)) {
      const formattedTracks = parsed.tracks.map(track => {
        const matched = musicCatalog.find(
          c => c.title.toLowerCase() === track.title?.toLowerCase()
        );
        return {
          name: `${matched ? matched.title : track.title} - ${matched ? matched.artist : track.artist}`,
          url: matched ? matched.url : (track.url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
        };
      });

      if (formattedTracks.length >= 3) {
        return res.status(200).json({ tracks: formattedTracks.slice(0, 3) });
      }
    }

    console.log("⚠️ Gemini response parsing failed or returned insufficient tracks. Using fallback.");
    res.status(200).json({ tracks: getRandomFallback() });

  } catch (error) {
    console.error("Error suggesting music via Gemini:", error);
    try {
      res.status(200).json({ tracks: getRandomFallback() });
    } catch (innerErr) {
      console.error("INNER FALLBACK ERROR:", innerErr);
      res.status(500).json({ message: "Server error generating music suggestions" });
    }
  }
};

exports.generateArticle = async (req, res) => {
  try {
    const { prompt, tone, title, generateParallel } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const isParallel = generateParallel === true || generateParallel === "true";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith("your_gemini_api_key")) {
      console.log("⚠️ GEMINI_API_KEY not set. Using rich local catalog fallback for article generation.");
      
      const lowerPrompt = prompt.toLowerCase();
      const isHorror = lowerPrompt.includes("horror") || 
                       lowerPrompt.includes("creepy") || 
                       lowerPrompt.includes("scary") || 
                       lowerPrompt.includes("phone") ||
                       lowerPrompt.includes("ghost") ||
                       lowerPrompt.includes("dark");

      if (isHorror) {
        const mockTitle = "The Call at 2:13 AM";
        const mockBlocks = [
          {
            type: "heading",
            content: "I. The Ringing"
          },
          {
            type: "paragraph",
            content: "It started on a Tuesday. The phone on the bedside table vibrated, a low, mechanical hum that rattled the dust in the old apartment. Daniel reached for it, blinking against the darkness. The green digits on the clock read exactly 2:13 AM."
          },
          {
            type: "paragraph",
            content: "He checked the screen. The caller ID displayed his own name. And his own number. When he answered, there was only the sound of heavy, rhythmic breathing, followed by a whisper that sounded exactly like his own voice: 'Don't look at the door.'"
          },
          {
            type: "quote",
            content: "Sometimes, the voice on the other end is closer than you think."
          },
          {
            type: "paragraph",
            content: "Every night since, at precisely 2:13 AM, the phone would ring. Daniel tried turning it off, removing the SIM card, even unplugging the battery. It made no difference. The screen would glow, his own name flashing in the dark, and the whisper would grow louder, describing what he was wearing, what he was thinking."
          },
          {
            type: "paragraph",
            content: "He decided to wait outside his door one night. As 2:13 AM approached, he stood in the dim corridor, staring at his closed apartment door. Exactly on the minute, his phone buzzed in his hand. He answered. From inside the locked apartment, he heard his own voice whispering into the receiver: 'I see you standing in the hallway. Turn around.'"
          },
          {
            type: "poetry",
            content: "Who is speaking in the dark?\nLeaving such a chilling mark.\nHe who stands behind the pane,\nwhispering your name again."
          }
        ];
        
        const mockParallelBlocks = isParallel ? [
          {
            type: "paragraph",
            content: "(The shadow in the corner of the room seems to shift slightly whenever the phone rings. I tell myself it's just the streetlights outside.)"
          },
          {
            type: "paragraph",
            content: "(If I pick up tonight, will I hear myself scream?)"
          }
        ] : [];

        return res.status(200).json({
          title: mockTitle,
          blocks: mockBlocks,
          parallelBlocks: mockParallelBlocks
        });
      }

      const mockTitles = [
        "The Architecture of Silence",
        "Chronicles of the Unseen Horizon",
        "A Slow Monologue on Stillness",
        "The Geography of Solitude"
      ];
      const mockTitle = title || mockTitles[Math.floor(Math.random() * mockTitles.length)];
      
      const mockBlocks = [
        {
          type: "heading",
          content: "I. The Whispering Walls"
        },
        {
          type: "paragraph",
          content: `In the quiet spaces of our lives, the world continues its slow rotation. When exploring the prompt: "${prompt}", we touch upon a fundamental human longing — the search for connection in an increasingly overstimulated landscape.`
        },
        {
          type: "quote",
          content: "We do not need more information. We need more silence to understand what we already know."
        },
        {
          type: "paragraph",
          content: "To walk through the city at dawn is to observe the architecture before the noise invades it. The stones remember the stillness of the night, holding onto a clean clarity that is lost the moment the first engine starts."
        },
        {
          type: "poetry",
          content: "The leaves fall without a sound,\nmarking time upon the ground.\nWe watch the seasons come and go,\nin the slow light of the winter snow."
        }
      ];

      const mockParallelBlocks = isParallel ? [
        {
          type: "paragraph",
          content: "(The mind wanders, seeking an exit from the loop. We listen to the wind rattling the window frame, wondering if the response is enough.)"
        },
        {
          type: "paragraph",
          content: "(A memory of a quiet room in autumn. No screens, just the ticking of an old brass clock and the scent of rain.)"
        }
      ] : [];

      return res.status(200).json({
        title: mockTitle,
        blocks: mockBlocks,
        parallelBlocks: mockParallelBlocks
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `
You are a brilliant writer and AI co-author for a premium, high-aesthetic blog/essay platform called "FootNote".
Your task is to write a deep, engaging, and beautiful article based on the following instructions:

Article Topic/Prompt: "${prompt}"
Tone: "${tone || "General"}"
Proposed Title: "${title || ""}"

FootNote articles are written in structured blocks of different types:
- "heading": Used for section headings/subtitles.
- "paragraph": Used for standard paragraphs.
- "quote": Used for blockquotes.
- "poetry": Used for poetic passages or indented lyrics.

Constraints:
1. The writing must feel extremely premium, literary, and evocative (avoid standard corporate or generic AI language).
2. Format your response strictly as a JSON object containing a "title" field and a "blocks" array.
3. Each block object in the "blocks" array must have:
   - "type": "paragraph" | "heading" | "quote" | "poetry"
   - "content": "The text content for this block"
4. If the "generateParallel" constraint is true (${isParallel}), you must also write a parallel narrative ("Layer B"). A parallel narrative runs alongside the primary text as an alternative voice, subtext, inner monologue, or commentary. In this case, you must include a "parallelBlocks" array of block objects in the same block format.
5. Example JSON response format:
{
  "title": "Generated Title",
  "blocks": [
    { "type": "heading", "content": "I. The Echo Chamber" },
    { "type": "paragraph", "content": "..." },
    { "type": "quote", "content": "..." }
  ],
  "parallelBlocks": [ // Only include if generateParallel is true
    { "type": "paragraph", "content": "..." }
  ]
}
`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (parsed && Array.isArray(parsed.blocks)) {
      return res.status(200).json({
        title: parsed.title || title || "Untitled Generated Article",
        blocks: parsed.blocks,
        parallelBlocks: parsed.parallelBlocks || []
      });
    }

    throw new Error("Invalid output format from Gemini model");

  } catch (error) {
    console.error("Error generating article via Gemini:", error);
    res.status(500).json({ 
      message: "Server error generating article. Please try again.", 
      error: error.message 
    });
  }
};

exports.suggestCovers = async (req, res) => {
  let tone = req.query.tone || req.body.tone || "General";
  if (typeof tone === "string") tone = tone.trim();
  const title = req.body.title || "";
  const content = req.body.content || "";

  // Fallback/shuffle that prioritizes the active tone
  const getRandomFallback = () => {
    let filtered = imageCatalog.filter(img => img.tones && img.tones.includes(tone));
    if (filtered.length < 3) {
      const extra = imageCatalog.filter(img => !filtered.includes(img));
      filtered = filtered.concat(extra);
    }
    let shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith("your_gemini_api_key")) {
      console.log("⚠️ GEMINI_API_KEY not set. Using random image catalog fallback.");
      return res.status(200).json({ images: getRandomFallback() });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an expert design director and visual curator for a premium literary/blog platform called "FootNote".
Your task is to select the top 3 best matching cover images from our curated image catalog for the following article:

Article Title: "${title}"
Article Tone: "${tone}"
Article Content:
"${content}"

Here is the image catalog to choose from (each item contains description, tones, and url):
${JSON.stringify(imageCatalog, null, 2)}

Constraints:
1. You MUST prioritize images whose "tones" array matches the specified Article Tone ("${tone}").
2. Select exactly 3 images from the catalog that best match the theme, mood, and visual resonance of the article.
3. Response format MUST be a JSON object with a single "images" array containing objects with "description" and "url" copied exactly from the catalog.
Example output format:
{
  "images": [
    {
      "description": "Abstract beige paint strokes",
      "url": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800"
    },
    ...
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (parsed && Array.isArray(parsed.images)) {
      const validatedImages = parsed.images.map(img => {
        const matched = imageCatalog.find(
          c => c.url === img.url
        );
        return {
          description: matched ? matched.description : img.description,
          url: matched ? matched.url : (img.url || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800")
        };
      });

      if (validatedImages.length >= 3) {
        return res.status(200).json({ images: validatedImages.slice(0, 3) });
      }
    }

    console.log("⚠️ Gemini response parsing failed or returned insufficient images. Using fallback.");
    res.status(200).json({ images: getRandomFallback() });

  } catch (error) {
    console.error("Error suggesting covers via Gemini:", error);
    try {
      res.status(200).json({ images: getRandomFallback() });
    } catch (innerErr) {
      console.error("INNER FALLBACK ERROR:", innerErr);
      res.status(500).json({ message: "Server error generating cover suggestions" });
    }
  }
};
