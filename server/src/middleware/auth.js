import { AuthService } from "../modules/auth/auth.service.js";

/**
 * Augment Express Request with the authenticated farmer.
 */

/**
 * requireAuth middleware.
 *
 * Validates the Bearer JWT in the Authorization header.
 * Sets req.farmer on success. Returns 401 on failure.
 *
 * Usage (protecting a route):
 *   router.get('/my-data', requireAuth, handler)
 *
 * Usage (protecting all routes in a router):
 *   router.use(requireAuth)
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        message: "Authentication required. Please log in.",
        status: 401,
      },
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  try {
    req.farmer = AuthService.verifyAccessToken(token);
    next();
  } catch (err) {
    const expired = err.name === "TokenExpiredError";
    res.status(401).json({
      error: {
        message: expired
          ? "Session expired. Please refresh your token or log in again."
          : "Invalid token. Please log in again.",
        status: 401,
        code: expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      },
    });
  }
}

/**
 * optionalAuth middleware.
 *
 * Like requireAuth but doesn't block unauthenticated requests.
 * Sets req.farmer if a valid token is present, otherwise continues.
 * Use for endpoints that have different behavior for logged-in users.
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.farmer = AuthService.verifyAccessToken(authHeader.slice(7));
    } catch {
      // Silently ignore invalid tokens in optional mode
    }
  }
  next();
}
