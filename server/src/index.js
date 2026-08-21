import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { cropRoutes } from "./modules/crop/crop.routes.js";
import { fieldRoutes } from "./modules/field/field.routes.js";
import weatherRoutes from "./modules/weather/weather.routes.js";
import soilRoutes from "./modules/soil/soil.routes.js";
import diagnosisRoutes from "./modules/disease/disease.routes.js";
import regenRoutes from "./modules/regen/regen.routes.js";
import climateRiskRouter from "./modules/climate-risk/climate-risk.routes.js";
import advisoryRouter from "./modules/advisory/advisory.routes.js";
import voiceRoutes from "./modules/voice/voice.routes.js";
import feedbackRouter from "./modules/feedback/feedback.routes.js";
import satelliteRoutes from "./modules/satellite/satellite.routes.js";
import healthScoreRoutes from "./modules/health-score/health-score.routes.js";
import escalationRoutes from "./modules/escalation/escalation.routes.js";
import crossBorderRoutes from "./modules/cross-border/cross-border.routes.js";
import alertsRoutes from "./modules/alerts/alerts.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import askRoutes from "./modules/ask/ask.routes.js";
import intelligenceRoutes from "./modules/intelligence/intelligence.routes.js";
import profileRoutes from "./modules/profile/profile.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { checkDatabaseHealth, pool } from "./db/connection.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { startScheduler } from "./jobs/scheduler.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1); // Trust first proxy (Render/Vercel)
const PORT = parseInt(process.env.PORT || "8000", 10);

// ─── Security Middleware ────────────────────────────────────────────────────

app.use(helmet());

// Restrict CORS to configured origins.
// In development, defaults to Vite dev server. In production, set ALLOWED_ORIGINS env var.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed.`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ─── Body Parsing ────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Auth Routes (own rate limiter, before general one) ──────────────────────

app.use("/api", authRoutes);
app.use("/api/v1", authRoutes);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use("/api", generalLimiter);

// ─── Request Logging & Timeout (lightweight, no external dependency) ──────────

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  // Set 60s timeout on the request socket to accommodate AI generation
  req.setTimeout(60000, () => {
    console.warn(`[Timeout] ${req.method} ${req.path} took longer than 60s`);
    req.destroy(new Error("Request timeout"));
  });
  next();
});

// ─── Health Check (unauthenticated, outside rate limiter) ────────────────────

app.get("/health", async (_req, res) => {
  const dbOk = await checkDatabaseHealth();
  const status = dbOk ? "healthy" : "degraded";
  res.status(dbOk ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: "v1",
    services: { database: dbOk ? "connected" : "unavailable" },
  });
});


// ─── API v1 Routes ───────────────────────────────────────────────────────────

// Field-scoped routes
app.use("/api/v1/fields", fieldRoutes);
app.use("/api/v1/fields", cropRoutes);
app.use("/api/v1/fields", requireAuth, weatherRoutes);
app.use("/api/v1/fields", requireAuth, soilRoutes);
app.use("/api/v1/fields", requireAuth, diagnosisRoutes);
app.use("/api/v1/fields", requireAuth, regenRoutes);

// Module routes
app.use("/api/v1", requireAuth, satelliteRoutes);
app.use("/api/v1", requireAuth, healthScoreRoutes);
app.use("/api/v1", requireAuth, climateRiskRouter);
app.use("/api/v1", requireAuth, advisoryRouter);
app.use("/api/v1", voiceRoutes);
app.use("/api/v1", requireAuth, feedbackRouter);
app.use("/api/v1", requireAuth, crossBorderRoutes);
app.use("/api/v1/escalations", requireAuth, escalationRoutes);
app.use("/api/v1/alerts", requireAuth, alertsRoutes);
app.use("/api/v1/chat", requireAuth, chatRoutes); // Keep legacy for backwards compatibility
app.use("/api/v1/ask", requireAuth, askRoutes); // New structured Ask API
app.use("/api/v1/intelligence", requireAuth, intelligenceRoutes);
app.use("/api/v1/profile", requireAuth, profileRoutes);
app.use("/api/v1/settings", requireAuth, settingsRoutes);


// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Route not found.", status: 404 } });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────

app.use(globalErrorHandler);

// ─── Server Start ─────────────────────────────────────────────────────────────

startScheduler();

const server = app.listen(PORT, () => {
  console.log(`✅ AgriMesh Server running on port ${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await pool.end();
      console.log("Database connection pool closed.");
    } catch (err) {
      console.error("Error closing database pool:", err);
    }
    process.exit(0);
  });
  // Force exit if server hasn't closed within 10 seconds
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
