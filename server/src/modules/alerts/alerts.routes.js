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
router.get("/", async (req, res) => {
  try {
    const farmerId = req.user.id;
    const dbAlerts = await alertsRepository.findAlertsByFarmerId(farmerId);
    
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
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to create a new alert (for testing/seeding)
router.post("/", async (req, res) => {
  try {
    const farmerId = req.user.id;
    const newAlert = await alertsRepository.createAlert(farmerId, req.body);
    res.status(201).json(newAlert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
