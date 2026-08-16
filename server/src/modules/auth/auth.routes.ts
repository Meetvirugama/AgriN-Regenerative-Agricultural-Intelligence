import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to all auth endpoints
router.use(authLimiter);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const RequestOtpSchema = z.object({
  phone_number: z
    .string()
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^\+?[\d\s\-().]+$/, 'Invalid phone number format'),
});

const VerifyOtpSchema = z.object({
  phone_number: z.string().min(7).max(20),
  code: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

const RefreshSchema = z.object({
  refresh_token: z.string().min(10, 'Invalid refresh token'),
});

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/request-otp
 *
 * Step 1 of login — sends a 6-digit OTP to the farmer's phone.
 * Does NOT require authentication.
 */
router.post(
  '/auth/request-otp',
  validate({ body: RequestOtpSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.requestOtp(req.body.phone_number);
      // Always respond success — never confirm/deny whether a phone is registered
      res.json({
        message: 'OTP sent. Check your phone.',
        // In development, log to console instead of SMS
        ...(process.env.NODE_ENV !== 'production' && {
          _dev_note: 'Check server logs for the OTP code (SMS disabled in development)',
        }),
      });
    } catch (err) { next(err); }
  }
);

/**
 * POST /api/auth/verify-otp
 *
 * Step 2 of login — verifies the OTP and returns JWT access + refresh tokens.
 * Creates the farmer account automatically on first login.
 */
router.post(
  '/auth/verify-otp',
  validate({ body: VerifyOtpSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await AuthService.verifyOtpAndLogin(
        req.body.phone_number,
        req.body.code,
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
        }
      );
      res.json(tokens);
    } catch (err: any) {
      // OTP failures are 401, not 500
      if (
        err.message?.includes('incorrect') ||
        err.message?.includes('expired') ||
        err.message?.includes('attempts')
      ) {
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
  '/auth/refresh',
  validate({ body: RefreshSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await AuthService.refreshAccessToken(req.body.refresh_token);
      res.json(tokens);
    } catch (err: any) {
      res.status(401).json({ error: { message: err.message, status: 401 } });
    }
  }
);

/**
 * POST /api/auth/logout
 *
 * Revokes the farmer's refresh token (or all tokens if none provided).
 * Requires a valid access token.
 */
router.post(
  '/auth/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.logout(
        req.farmer!.sub,
        req.body.refresh_token ?? undefined
      );
      res.json({ message: 'Logged out successfully.' });
    } catch (err) { next(err); }
  }
);

/**
 * GET /api/auth/me
 *
 * Returns the authenticated farmer's profile from the JWT payload.
 * Can be used by the frontend to hydrate the auth context on load.
 */
router.get(
  '/auth/me',
  requireAuth,
  (req: Request, res: Response) => {
    res.json({ farmer: req.farmer });
  }
);

export default router;
