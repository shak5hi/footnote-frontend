const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

exports.signup = async (req, res) => {
    try {
        let { firstName, lastName, email, password } = req.body;

        // Normalize email
        if (email) email = email.toLowerCase().trim();


        // Check if all fields filled
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        // Generate token
        const token = generateToken(user._id);

        // Send response
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token: token,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        // Normalize email
        if (email) email = email.toLowerCase().trim();


        // Check if email and password provided
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate token
        const token = generateToken(user._id);

        console.log(`✅ [SUCCESS] Login successful for user: ${user.email}`);

        // Send response
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token: token,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.subscribe = async (req, res) => {
    try {
        console.log("📥 [SUBSCRIPTION] Attempt for user:", req.user ? req.user._id : 'NO USER');
        const user = await User.findById(req.user._id);
        if (!user) {
            console.error("❌ [SUBSCRIPTION] User not found in DB");
            return res.status(404).json({ message: "User not found" });
        }

        const { name, bio, avatar } = req.body;
        console.log(`📝 [SUBSCRIPTION] Payload: ${name}, ${bio}`);
        
        if (!name) return res.status(400).json({ message: "Author name required" });

        if (!user.subscriptions) user.subscriptions = [];

        const exists = user.subscriptions.find(sub => sub.name === name);
        if (!exists) {
            user.subscriptions.push({ name, bio, avatar });
            await user.save();
            console.log(`✅ [SUBSCRIPTION] Success for ${name}`);
        } else {
            console.log(`ℹ️ [SUBSCRIPTION] Already subscribed to ${name}`);
        }
        res.status(200).json({ message: "Subscribed successfully" });
    } catch (err) {
        console.error("❌ [SUBSCRIPTION] Internal Error:", err);
        res.status(500).json({ message: "Server error during subscription", error: err.message });
    }
};

exports.getSubscriptions = async (req, res) => {
    try {
        console.log("🔍 [GET_SUBS] Fetching for user:", req.user ? req.user._id : 'NO USER');
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.status(200).json({ subscriptions: user.subscriptions || [] });
    } catch (err) {
        console.error("❌ [GET_SUBS] Internal Error:", err);
        res.status(500).json({ message: "Server error fetching subscriptions", error: err.message });
    }
};