import "./configs/env.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { requestLogger } from "./lib/logger.js";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(helmet());

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60)
}));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error("global error:", err);
  res.status(500).json({ error: "server error" });
});

export default app;