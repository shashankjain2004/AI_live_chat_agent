import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { runMigrations } from "./db/migrate";

const app = express();
const PORT = process.env.PORT || 3001;

// Run DB migrations on startup
runMigrations();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "50kb" })); // hard limit on body size

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/chat", chatRouter);

// 404 + error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Spur Chat backend running on http://localhost:${PORT}`);
});
