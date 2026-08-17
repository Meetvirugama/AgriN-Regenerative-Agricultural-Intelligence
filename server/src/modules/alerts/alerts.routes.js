import { Router } from "express";

const router = Router();

// Endpoint to get alerts
router.get("/", async (req, res) => {
  try {
    const mockAlerts = [
      {
        id: "alert-1",
        title: "Aphids detected in Moong Field 03",
        description: "Aphid population is above threshold level.",
        priority: "High",
        field: "Moong Field 03",
        time: "1h ago",
        resolved: false,
        type: "pest"
      },
      {
        id: "alert-2",
        title: "Low soil moisture in Wheat Field 01",
        description: "Soil moisture level is below optimal range.",
        priority: "Medium",
        field: "Wheat Field 01",
        time: "3h ago",
        resolved: false,
        type: "soil"
      },
      {
        id: "alert-3",
        title: "Nitrogen deficiency in Rice Field 02",
        description: "Recommended to apply nitrogen fertilizer.",
        priority: "Medium",
        field: "Rice Field 02",
        time: "5h ago",
        resolved: false,
        type: "nutrient"
      },
      {
        id: "alert-4",
        title: "Weather alert: Heavy rainfall expected",
        description: "Heavy rainfall expected in next 24 hours.",
        priority: "Low",
        field: "All Fields",
        time: "8h ago",
        resolved: false,
        type: "weather"
      },
      {
        id: "alert-5",
        title: "Irrigation completed",
        description: "Scheduled irrigation completed successfully.",
        priority: "Low",
        field: "Wheat Field 01",
        time: "Yesterday",
        resolved: true,
        type: "action"
      }
    ];

    res.json(mockAlerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
