const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || "fallback_jwt_secret_for_development_purposes_only";
    return jwt.sign({ id }, secret, {
        expiresIn: "7d",
    });
};


module.exports = generateToken;