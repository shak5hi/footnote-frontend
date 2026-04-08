const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/uploads", express.static("uploads"));

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(5001, () => {
    console.log("Server running on port 5001");
    console.log("Swagger docs available at: http://localhost:5001/api-docs");
});
