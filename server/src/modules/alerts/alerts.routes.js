import { Router } from "express";
import { query, execute } from "../../db/connection.js";

const router = Router();

/**
 * GET /api/v1/alerts
 */
router.get("/", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub;

    if (!farmerId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const result = await query(
      `
      SELECT
        a.id,
        a.title,
        a.description,
        a.type,
        a.priority,
        a.resolved,
        a.resolved_at,
        a.read,
        a.read_at,
        a.source,
        a.confidence,
        a.metadata,
        a.created_at,

        f.id AS field_id,
        f.name AS field_name

      FROM alerts a

      LEFT JOIN fields f
        ON f.id = a.field_id

      WHERE a.farmer_id = $1

      ORDER BY
        a.resolved ASC,

        CASE LOWER(a.priority)
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,

        a.created_at DESC
      `,
      [farmerId]
    );

    const alerts = result.map(
      (row) => ({
        id: row.id,

        title: row.title,

        description:
          row.description,

        type: row.type,

        priority:
          row.priority,

        resolved:
          row.resolved,

        read:
          row.read,

        fieldId:
          row.field_id,

        field:
          row.field_name ||
          "All Fields",

        source:
          row.source,

        confidence:
          row.confidence != null
            ? Number(row.confidence)
            : null,

        metadata:
          row.metadata || {},

        createdAt:
          row.created_at,

        resolvedAt:
          row.resolved_at,

        readAt:
          row.read_at,
      })
    );

    return res.json({
      alerts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/alerts/read-all
 * Must be BEFORE /:alertId routes — otherwise Express matches "read-all" as alertId.
 */
router.patch(
  "/read-all",
  async (req, res, next) => {
    try {
      const farmerId = req.farmer?.sub;

      const rowCount = await execute(
        `
        UPDATE alerts
        SET
          read = TRUE,
          read_at = COALESCE(
            read_at,
            NOW()
          )

        WHERE farmer_id = $1
          AND read = FALSE
        `,
        [farmerId]
      );

      res.json({
        success: true,
        updated: rowCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/alerts/:alertId/read
 */
router.patch(
  "/:alertId/read",
  async (req, res, next) => {
    try {
      const farmerId = req.farmer?.sub;
      const { alertId } = req.params;

      const rows = await query(
        `
        UPDATE alerts
        SET
          read = TRUE,
          read_at = COALESCE(
            read_at,
            NOW()
          )

        WHERE id = $1
          AND farmer_id = $2

        RETURNING
          id,
          read,
          read_at
        `,
        [alertId, farmerId]
      );

      if (!rows.length) {
        return res.status(404).json({ message: "Alert not found." });
      }

      res.json({ success: true, alert: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/alerts/:alertId/resolve
 * Marks an alert as resolved (dismissed / actioned by farmer).
 */
router.patch(
  "/:alertId/resolve",
  async (req, res, next) => {
    try {
      const farmerId = req.farmer?.sub;
      const { alertId } = req.params;

      const rows = await query(
        `
        UPDATE alerts
        SET
          resolved = TRUE,
          resolved_at = COALESCE(resolved_at, NOW()),
          read = TRUE,
          read_at = COALESCE(read_at, NOW())
        WHERE id = $1
          AND farmer_id = $2
        RETURNING id, resolved, resolved_at
        `,
        [alertId, farmerId]
      );

      if (!rows.length) {
        return res.status(404).json({ message: "Alert not found." });
      }

      res.json({ success: true, alert: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
