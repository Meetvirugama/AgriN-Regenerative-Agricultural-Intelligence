import { Router } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { authLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

// Apply strict rate limiting to all auth endpoints


// ─── Validation Schemas ───────────────────────────────────────────────────────

const RequestOtpSchema = z.object({
  identifier: z.string().min(5).optional(),
  phone_number: z.string().min(5).optional()
}).refine(data => data.identifier || data.phone_number, {
  message: "Either identifier or phone_number is required"
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const RegisterSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  phone_number: z.string().optional(),
});

const VerifyOtpSchema = z.object({
  identifier: z.string().min(5).optional(),
  phone_number: z.string().min(5).optional(),
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must be numeric"),
}).refine(data => data.identifier || data.phone_number, {
  message: "Either identifier or phone_number is required"
});

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numeric"),
  new_password: z.string().min(4, "Password must be at least 4 characters"),
});

const RefreshSchema = z.object({
  refresh_token: z.string().min(10, "Invalid refresh token"),
});

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/request-otp
 *
 * Step 1 of login — sends a 6-digit OTP to the farmer's phone.
 * Does NOT require authentication.
 */
router.post(
  "/auth/request-otp",
  authLimiter, validate({ body: RequestOtpSchema }),
  async (req, res, next) => {
    try {
      const identifier = req.body.identifier || req.body.phone_number;
      await AuthService.requestOtp(identifier);
      // Always respond success — never confirm/deny whether a phone is registered
      res.json({
        message: "OTP sent. Check your device.",
        // In development, log to console instead of SMS
        ...(process.env.NODE_ENV !== "production" && {
          _dev_note:
            "Check server logs for the OTP code (SMS/Email disabled in development)",
        }),
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/verify-otp
 *
 * Step 2 of login — verifies the OTP and returns JWT access + refresh tokens.
 * Creates the farmer account automatically on first login.
 */
router.post(
  "/auth/verify-otp",
  authLimiter, validate({ body: VerifyOtpSchema }),
  async (req, res, next) => {
    try {
      const identifier = req.body.identifier || req.body.phone_number;
      const tokens = await AuthService.verifyOtpAndLogin(
        identifier,
        req.body.code,
        {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      );
      res.json(tokens);
    } catch (err) {
      // OTP failures are 401, not 500
      if (
        err.message?.includes("incorrect") ||
        err.message?.includes("expired") ||
        err.message?.includes("attempts")
      ) {
        res.status(401).json({ error: { message: err.message, status: 401 } });
      } else {
        next(err);
      }
    }
  },
);

/**
 * POST /api/auth/login
 *
 * Email and password login.
 */
router.post(
  "/auth/login",
  authLimiter, validate({ body: LoginSchema }),
  async (req, res, next) => {
    try {
      const tokens = await AuthService.loginWithPassword(
        req.body.email,
        req.body.password,
        {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      );
      res.json(tokens);
    } catch (err) {
      if (err.message?.includes("Invalid email or password") || err.message?.includes("Account does not have a password")) {
        res.status(401).json({ error: { message: err.message, status: 401 } });
      } else {
        next(err);
      }
    }
  },
);

/**
 * POST /api/auth/login/google
 *
 * Exchanges a Google Access Token for a local backend JWT session.
 */
router.post(
  "/auth/login/google",
  authLimiter, validate({ body: z.object({ access_token: z.string() }) }),
  async (req, res, next) => {
    try {
      const tokens = await AuthService.loginWithGoogle(
        req.body.access_token,
        {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        }
      );
      res.json(tokens);
    } catch (err) {
      if (err.message?.includes("Invalid Google access token")) {
        res.status(401).json({ error: { message: err.message, status: 401 } });
      } else {
        next(err);
      }
    }
  }
);

/**
 * POST /api/auth/refresh
 *
 * Exchange a valid refresh token for a new access + refresh token pair.
 * The old refresh token is revoked (rotation).
 */
router.post(
  "/auth/refresh",
  authLimiter, validate({ body: RefreshSchema }),
  async (req, res, next) => {
    try {
      const tokens = await AuthService.refreshAccessToken(
        req.body.refresh_token,
      );
      res.json(tokens);
    } catch (err) {
      res.status(401).json({ error: { message: err.message, status: 401 } });
    }
  },
);

/**
 * POST /api/auth/logout
 *
 * Revokes the farmer's refresh token (or all tokens if none provided).
 * Requires a valid access token.
 */
router.post("/auth/logout", requireAuth, async (req, res, next) => {
  try {
    await AuthService.logout(
      req.farmer.sub,
      req.body.refresh_token ?? undefined,
    );
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 *
 * Returns the authenticated farmer's profile from the JWT payload.
 * Can be used by the frontend to hydrate the auth context on load.
 */
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ farmer: req.farmer });
});

/**
 * POST /api/auth/register
 *
 * Register a new farmer with email and password.
 */
router.post(
  "/auth/register",
  authLimiter, validate({ body: RegisterSchema }),
  async (req, res, next) => {
    try {
      const tokens = await AuthService.registerWithEmail(
        req.body.name,
        req.body.email,
        req.body.password,
        req.body.phone_number,
        {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      );
      res.json(tokens);
    } catch (err) {
      if (err.message?.includes("already exists")) {
        res.status(409).json({ error: { message: err.message, status: 409 } });
      } else {
        next(err);
      }
    }
  },
);

/**
 * POST /api/auth/forgot-password
 */
router.post(
  "/auth/forgot-password",
  authLimiter, validate({ body: ForgotPasswordSchema }),
  async (req, res, next) => {
    try {
      await AuthService.requestPasswordReset(req.body.email);
      res.json({ message: "If an account with that email exists, we sent a password reset OTP." });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/reset-password
 */
router.post(
  "/auth/reset-password",
  authLimiter, validate({ body: ResetPasswordSchema }),
  async (req, res, next) => {
    try {
      await AuthService.resetPasswordWithOtp(
        req.body.email,
        req.body.code,
        req.body.new_password,
        {
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        }
      );
      res.json({ message: "Password reset successful. You can now login." });
    } catch (err) {
      if (err.message?.includes("incorrect") || err.message?.includes("expired")) {
        res.status(401).json({ error: { message: err.message, status: 401 } });
      } else {
        next(err);
      }
    }
  }
);

export default router;
