import { ZodError } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/endpoint', validate({ body: MyBodySchema }), handler)
 *
 * Validates req.body, req.params, and req.query against provided schemas.
 * Returns 422 with structured field-level errors on validation failure.
 */
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          error: {
            message: "Validation failed. Please check your input.",
            status: 422,
            fields: err.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Validates that specified route parameter(s) conform to UUID format.
 * Prevents malformed URL parameters and database-level type errors.
 *
 * Usage:
 *   router.get('/:fieldId', validateUuidParam('fieldId'), handler)
 */
export function validateUuidParam(...paramNames) {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value && !UUID_REGEX.test(value)) {
        res.status(400).json({
          error: {
            message: `Invalid ID format for '${paramName}'. Must be a valid UUID.`,
            status: 400,
          },
        });
        return;
      }
    }
    next();
  };
}
