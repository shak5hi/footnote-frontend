const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(5001, () => {
    console.log("Server running on port 5001");
    console.log("Swagger docs available at: http://localhost:5001/api-docs");
});
