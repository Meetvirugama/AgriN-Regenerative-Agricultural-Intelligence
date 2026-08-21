import { Router } from "express";
import { alertsRepository } from "../../db/repositories/alertsRepository.js";

const router = Router();

// Helper function to format time (e.g., "1h ago")
const timeSince = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

// Endpoint to get alerts
// Handles both authenticated (/api/v1/alerts with requireAuth) and
// legacy unauthenticated (/api/alerts) — returns [] when no auth present.
router.get("/", async (req, res, next) => {
  console.log(`[Alerts] GET /api/v1/alerts called for farmer:`, req.farmer?.sub);
  try {
    const farmerId = req.farmer?.sub;
    if (!farmerId) {
      console.log(`[Alerts] No farmer ID, returning empty array`);
      return res.json([]);
    }

    console.log(`[Alerts] Fetching from DB for farmer:`, farmerId);
    const dbAlerts = await alertsRepository.findAlertsByFarmerId(farmerId);
    console.log(`[Alerts] Found ${dbAlerts.length} alerts in DB`);
    
    // Map to the format expected by the frontend
    const formattedAlerts = dbAlerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      priority: alert.priority,
      field: alert.field,
      time: timeSince(alert.created_at),
      resolved: alert.resolved,
      type: alert.type
    }));

    res.json(formattedAlerts);
  } catch (err) {
    next(err);
  }
});

// Endpoint to create a new alert (for testing/seeding)
router.post("/", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub;
    // Guard against unauthenticated POST via legacy mount
    if (!farmerId) {
      return res.status(401).json({ error: { message: "Authentication required to create alerts.", status: 401 } });
    }
    const newAlert = await alertsRepository.createAlert(farmerId, req.body);
    res.status(201).json(newAlert);
  } catch (err) {
    next(err);
  }
});

export default router;
