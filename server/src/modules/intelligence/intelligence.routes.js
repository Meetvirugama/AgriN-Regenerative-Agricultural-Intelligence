import { Router } from "express";

const router = Router();

// Endpoint to fetch intelligence data
router.get("/", async (req, res) => {
  try {
    const data = {
      stats: {
        totalFields: 3,
        avgHealth: 78,
        activeAlerts: 3,
        recommendations: 5
      },
      healthDistribution: {
        good: 33,
        moderate: 33,
        poor: 33
      },
      topRecommendations: [
        {
          id: "rec-1",
          type: "irrigation",
          title: "Irrigate Wheat Field 01",
          desc: "Soil moisture is low. Irrigation recommended.",
          field: "Wheat Field 01",
          priority: "Medium"
        },
        {
          id: "rec-2",
          type: "nutrient",
          title: "Apply Nitrogen to Rice Field 02",
          desc: "Nitrogen levels are low. Apply urea.",
          field: "Rice Field 02",
          priority: "High"
        },
        {
          id: "rec-3",
          type: "pest",
          title: "Monitor Aphids in Moong Field 03",
          desc: "Aphids detected. Monitor closely.",
          field: "Moong Field 03",
          priority: "Medium"
        }
      ]
    };
    
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
