const express = require("express");
require("dotenv").config();

const loggerMiddleware = require("./middleware/loggerMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(express.json());

// Logging middleware
app.use(loggerMiddleware);

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Logging & Monitoring API is running"
    });
});

// Product routes
app.use("/api/products", productRoutes);

// Handle requests that do not match any route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error handling middleware
// Must be after all routes
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});