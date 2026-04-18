const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Article = require("../models/Article");

let mongod;

const connectDB = async () => {
    try {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log("Connecting to local In-Memory MongoDB (Bypassing Atlas IP block)...");
        await mongoose.connect(uri);
        console.log("✅ In-Memory MongoDB Connected!");

        // Seed DB if empty
        const count = await Article.countDocuments();
        if (count === 0) {
            await Article.create([
                {
                    title: "The Architecture of Sound",
                    content: "This whole story starts, as any good story starts, reading CVE’s on GitHub’s advisory feed. A few years back I was reading CVE-2022–1471, a vulnerability related to YAML parsing. It made me wonder: what if the spaces we construct are just as fragile, waiting for the right frequency to shatter? The walls around us hold memory. Wood remembers the wind. Concrete remembers the pour.\n\nWhen we build, we are not just enclosing space. We are setting the stage for acoustics. Sound is the invisible material of architecture. ",
                    tone: "Architecture",
                    coverImage: null,
                    author: new mongoose.Types.ObjectId(),
                    status: "published",
                    isAnonymous: false,
                    readCount: 1420
                },
                {
                    title: "We Replaced Presence With Proof",
                    content: "If no one sees it, does it still count? Somewhere along the way, we started living for the answer. We curate our mornings. We aestheticize our coffee. The act of living has become an act of documentation.\n\nI sit in cafes and watch people photograph their interactions before experiencing them. The memory is outsourced to a server before it is even formed in the mind. True luxury today is an undocumented moment.",
                    tone: "Observation",
                    coverImage: null,
                    author: new mongoose.Types.ObjectId(),
                    status: "published",
                    isAnonymous: true,
                    readCount: 3004
                }
            ]);
            console.log("🌱 Database seeded with mock articles.");
        }
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;