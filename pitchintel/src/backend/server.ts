import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import apiRouter from "./apiRouter.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Vite default port
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" })); // Allow larger payloads for slide content
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "PitchIntel Backend",
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PitchIntel Backend running on port ${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "⚠️  Warning: OPENAI_API_KEY not found in environment variables"
    );
  }
});

export default app;
