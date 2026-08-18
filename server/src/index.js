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
import intelligenceRoutes from "./modules/intelligence/intelligence.routes.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { checkDatabaseHealth } from "./db/connection.js";
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
  // Set 15s timeout on the request socket
  req.setTimeout(15000, () => {
    console.warn(`[Timeout] ${req.method} ${req.path} took longer than 15s`);
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
// stub-init is unprotected during development (Phase 4: add requireAuth once
// the client login flow is complete)

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
app.use("/api/v1", crossBorderRoutes);
app.use("/api/v1/escalations", requireAuth, escalationRoutes);
app.use("/api/v1/alerts", requireAuth, alertsRoutes);
app.use("/api/v1/chat", requireAuth, chatRoutes);
app.use("/api/v1/intelligence", requireAuth, intelligenceRoutes);

// ─── Legacy v0 Compatibility Aliases ─────────────────────────────────────────
// Keep /api/* working so the existing frontend doesn't break during migration.
// These will be removed once the frontend is updated to use /api/v1/*.

app.use("/api/fields", fieldRoutes);   // ← was missing — POST/PUT/DELETE /api/fields needs this
app.use("/api/fields", cropRoutes);
app.use("/api/fields", weatherRoutes);
app.use("/api/fields", soilRoutes);
app.use("/api/fields", diagnosisRoutes);
app.use("/api/fields", regenRoutes);
app.use("/api", satelliteRoutes);
app.use("/api", healthScoreRoutes);
app.use("/api", climateRiskRouter);
app.use("/api", advisoryRouter);
app.use("/api", voiceRoutes);
app.use("/api", feedbackRouter);
app.use("/api", crossBorderRoutes);
app.use("/api/escalations", escalationRoutes);

// ─── Legacy missing-route aliases ─────────────────────────────────────────────
// /api/alerts — frontend calls this without /v1 prefix
app.use("/api/alerts", alertsRoutes);

// /api/fields/stub-init — FieldProvider calls this to seed the active field
app.post("/api/fields/stub-init", async (req, res) => {
  try {
    const { layer1Service, STUB_FARMER_ID } = await import("./modules/field/field.service.js");
    await layer1Service.getOrCreateMockFarmer();
    const fields = await layer1Service.getAllFieldsForFarmer(STUB_FARMER_ID);
    if (fields.length === 0) {
      // No fields yet — return null gracefully so the shell still renders
      return res.json({ field: null });
    }
    res.json({ field: fields[0] });
  } catch (err) {
    console.error("[stub-init]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
});

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
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
  // Force exit if server hasn't closed within 10 seconds
  setTimeout(() => process.exit(1), 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
