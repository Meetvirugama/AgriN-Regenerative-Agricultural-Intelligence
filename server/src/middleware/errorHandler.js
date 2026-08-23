/**
 * Global Express error handler.
 * Must be registered LAST in the middleware chain (after all routes).
 *
 * Catches any error thrown or passed to next(err) and returns a
 * consistent JSON error shape so the frontend always gets the same structure.
 * Translates database and system errors into clean HTTP status codes.
 */
export function globalErrorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return _next(err);
  }

  let status = err.status ?? err.statusCode ?? 500;
  let message = err.message ?? "An unexpected error occurred.";

  // Translate PostgreSQL database error codes
  if (err.code) {
    switch (err.code) {
      case "22P02": // invalid_text_representation (e.g. malformed UUID)
        status = 400;
        message = "Invalid identifier or data format.";
        break;
      case "23505": // unique_violation
        status = 409;
        message = "Resource already exists with the provided unique information.";
        break;
      case "23503": // foreign_key_violation
        status = 400;
        message = "Referenced resource does not exist.";
        break;
      case "22001": // string_data_right_truncation
        status = 400;
        message = "Input exceeds maximum allowed character length.";
        break;
      default:
        break;
    }
  }

  // Sanitize generic 500 internal errors in production
  if (process.env.NODE_ENV === "production" && status === 500) {
    message = "An unexpected error occurred. Please try again.";
  }

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
