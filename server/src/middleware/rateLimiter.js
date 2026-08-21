import rateLimit from "express-rate-limit";

/**
 * General API rate limiter — 200 requests per minute per IP.
 * Protects all endpoints from basic abuse.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests. Please wait a moment before trying again.",
      status: 429,
    },
  },
});

/**
 * Strict limiter for expensive AI/ML endpoints (disease diagnosis, advisory generation).
 * 20 requests per minute per IP — these call external AI APIs with real cost.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many AI requests. Please wait before submitting again.",
      status: 429,
    },
  },
});

/**
 * Auth endpoint limiter — 10 OTP requests per 15 minutes per IP.
 * Prevents OTP spam/abuse.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 100, // Strict in prod to prevent OTP brute force
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many authentication attempts. Please wait 15 minutes.",
      status: 429,
    },
  },
});
