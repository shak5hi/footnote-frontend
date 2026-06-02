const imageCatalog = [
  // Reflection
  {
    description: "A steaming cup of coffee resting on a stack of old hardcover books near a rainy window.",
    tones: ["Reflection", "General"],
    url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A misty lake landscape with calm water reflecting the foggy grey sky at dawn.",
    tones: ["Reflection", "General"],
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Soft warm morning sunlight shining through window blinds onto a clean, minimalist bed.",
    tones: ["Reflection", "Personal"],
    url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A quiet, green forest landscape reflecting on a perfectly mirror-like lake at sunset.",
    tones: ["Reflection", "General", "Field Note"],
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "An open hardbound book lying flat on a soft linen sheet in warm, natural afternoon light.",
    tones: ["Reflection", "Personal", "Essay"],
    url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Tall pine trees enveloped in dense morning fog on a quiet mountain trail.",
    tones: ["Reflection", "Field Note"],
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800"
  },

  // Personal
  {
    description: "A close-up of hands wrapped around a warm ceramic mug on a rustic wooden table.",
    tones: ["Personal", "Field Note"],
    url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A vintage mechanical typewriter sitting on an dark oak writing desk.",
    tones: ["Personal", "Essay"],
    url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A single candle glowing softly in a dark room, casting warm shadows.",
    tones: ["Personal", "Reflection"],
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A nostalgic polaroid photo resting on a textured wooden background.",
    tones: ["Personal", "General"],
    url: "https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Cozy warm string lights illuminating a balcony rail on a quiet evening.",
    tones: ["Personal", "Reflection"],
    url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A close-up of a hand holding a single delicate dried leaf under soft, golden sunset rays.",
    tones: ["Personal", "Field Note"],
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800"
  },

  // Observation
  {
    description: "A quiet urban street slicked with rain reflecting yellow streetlights at twilight.",
    tones: ["Observation", "Essay"],
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "An empty wooden bench inside a quiet cafe looking out of a rain-streaked glass window.",
    tones: ["Observation", "Personal"],
    url: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Geometric shadows cast by window panes onto a smooth, minimalist concrete wall.",
    tones: ["Observation", "Essay"],
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Soft afternoon shadows falling on an empty concrete staircase in a modern minimalist building.",
    tones: ["Observation", "General", "Essay"],
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A geometric, high-contrast perspective shot of a modern concrete building facade against a clear sky.",
    tones: ["Observation", "Essay"],
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A single chair placed by a massive floor-to-ceiling glass window looking out onto a quiet cityscape.",
    tones: ["Observation", "Reflection"],
    url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=800"
  },

  // Essay
  {
    description: "High-angle view of a classical library with dark wood bookshelves and rows of study tables.",
    tones: ["Essay", "General"],
    url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A minimalist desk setup showing a hand writing in a leather journal with a fountain pen.",
    tones: ["Essay", "Personal"],
    url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A clean, modern architectural spiral staircase made of white stone and glass.",
    tones: ["Essay", "Observation"],
    url: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A close-up focusing on the printed text and binding of an open thick hardback book.",
    tones: ["Essay", "Reflection"],
    url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A rustic workspace with antique maps, rolled parchment, and a feather pen inkwell.",
    tones: ["Essay", "Personal"],
    url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Symmetrical rows of modern white concrete columns inside a minimalist gallery hall.",
    tones: ["Essay", "Observation", "General"],
    url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=800"
  },

  // Field Note
  {
    description: "Sunlight filtering down through the dense green canopy of a quiet pine forest.",
    tones: ["Field Note", "General"],
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A glowing orange campfire outside a green tent pitched in the wilderness at dusk.",
    tones: ["Field Note", "Personal"],
    url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Dried flowers pressed and arranged between the yellowed pages of an open notebook.",
    tones: ["Field Note", "Reflection"],
    url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Calm, green-mossy rocks in the middle of a flowing forest stream.",
    tones: ["Field Note", "General"],
    url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Macro shot of a wet green fern leaf covered in sparkling fresh morning dew drops.",
    tones: ["Field Note", "Reflection"],
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A traveler with a backpack looking out at massive, rugged mountain peaks in the distance.",
    tones: ["Field Note", "General"],
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"
  },

  // General
  {
    description: "Abstract minimal art painting with beige, white, and earthy paint strokes.",
    tones: ["General", "Reflection"],
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "A still life composition showing a ceramic vase with dried pampas grass against a neutral wall.",
    tones: ["General", "Observation"],
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Gentle ripples of clear ocean water shimmering in bright afternoon sunlight.",
    tones: ["General", "Field Note"],
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Fine, wind-blown ripples in clean beige desert sand.",
    tones: ["General", "Observation"],
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Minimalist close-up texture of white and gray marble stone.",
    tones: ["General", "Essay"],
    url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800"
  },
  {
    description: "Wispy orange and pink clouds scattering across the sky at sunset.",
    tones: ["General", "Personal", "Reflection"],
    url: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&q=80&w=800"
  }
];

module.exports = imageCatalog;
