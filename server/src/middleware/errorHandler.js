/**
 * Global Express error handler.
 * Must be registered LAST in the middleware chain (after all routes).
 *
 * Catches any error thrown or passed to next(err) and returns a
 * consistent JSON error shape so the frontend always gets the same structure.
 */
export function globalErrorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return _next(err);
  }

  const status = err.status ?? err.statusCode ?? 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "An unexpected error occurred. Please try again."
      : (err.message ?? "An unexpected error occurred.");

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}: ${err.message}`,
  );

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}
