const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not defined in .env file");
            return;
        }
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        console.log("⏳ Retrying in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;