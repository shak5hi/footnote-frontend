const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if all fields filled
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all fields" });
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
            name,
            email,
            password: hashedPassword,
        });

        // Generate token
        const token = generateToken(user._id);

        // Send response
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};