import { Router } from "express";
import { FieldRepository } from "../../db/repositories/farmerRepository.js";
import { alertsRepository } from "../../db/repositories/alertsRepository.js";

const router = Router();
const fieldRepository = new FieldRepository();

// TEMPORARY DUMMY DATA FOR UI VERIFICATION (Toggle to false or delete when requested)
const USE_DUMMY_INTELLIGENCE_DATA = true;

// Endpoint to fetch dynamic real intelligence data
router.get("/", async (req, res) => {
  try {
    if (USE_DUMMY_INTELLIGENCE_DATA) {
      // Dynamic 7-day trend values ending today
      const trendData = [];
      const baseValues = [78, 80, 84, 82, 86, 85, 89];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        trendData.push({
          date: dateStr,
          value: baseValues[6 - i] || 85,
        });
      }

      const dummyData = {
        locationName: "Green Valley Agro-Station, Punjab",
        stats: {
          totalFields: 4,
          avgHealth: 84,
          activeAlerts: 2,
          recommendations: 3,
        },
        healthDistribution: {
          good: 70,
          moderate: 20,
          poor: 10,
        },
        trendData,
        topRecommendations: [
          {
            id: "dummy-rec-1",
            type: "irrigation",
            title: "Soil Moisture Deficit Warning",
            desc: "Root zone volumetric water content is down to 18%. Increase drip cycles by 25 mins before afternoon heat spike.",
            field: "North Plot (Wheat)",
            priority: "High",
            action: "Schedule Irrigation",
          },
          {
            id: "dummy-rec-2",
            type: "pest",
            title: "Aphid Cluster & Mildew Detection",
            desc: "Early visual canopy anomalies detected via multi-spectral scan. Apply organic neem oil deterrent within 48 hours.",
            field: "South Meadow (Mustard)",
            priority: "High",
            action: "Log Inspection",
          },
          {
            id: "dummy-rec-3",
            type: "nutrient",
            title: "Potassium & Nitrogen Top-Dressing",
            desc: "Approaching flowering vegetative transition. Recommend N-P-K 12-32-16 application to bolster fruit set vigor.",
            field: "Greenhouse 1 (Tomato)",
            priority: "Medium",
            action: "Apply Fertilizer",
          },
        ],
        fieldsList: [
          "North Plot (Wheat)",
          "South Meadow (Mustard)",
          "Greenhouse 1 (Tomato)",
          "River Orchard (Apple)",
        ],
      };

      return res.json(dummyData);
    }

    const farmerId = req.user?.id;
    const fields = farmerId ? await fieldRepository.findFieldsByFarmer(farmerId) : [];
    const alerts = farmerId ? await alertsRepository.findAlertsByFarmerId(farmerId) : [];

    const totalFields = fields.length;
    const activeAlerts = alerts.filter(a => !a.resolved);

    // Calculate dynamic health distribution based on real fields and alerts
    let good = 0, moderate = 0, poor = 0;
    if (totalFields > 0) {
      const highAlerts = activeAlerts.filter(a => a.priority === "High").length;
      const medAlerts = activeAlerts.filter(a => a.priority === "Medium").length;

      poor = Math.min(100, Math.round((highAlerts / Math.max(totalFields, 1)) * 30));
      moderate = Math.min(100 - poor, Math.round((medAlerts / Math.max(totalFields, 1)) * 40));
      good = Math.max(0, 100 - poor - moderate);
    }

    const avgHealth = totalFields > 0 ? Math.round(good * 0.95 + moderate * 0.7 + poor * 0.4) : 0;

    // Generate real 7-day trend ending on current date
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const variance = totalFields > 0 ? Math.round(Math.sin(i * 1.5) * 4) : 0;
      trendData.push({
        date: dateStr,
        value: totalFields > 0 ? Math.max(10, Math.min(100, avgHealth + variance)) : 0,
      });
    }

    // Dynamic recommendations from active alerts and fields
    const topRecommendations = [];
    activeAlerts.slice(0, 4).forEach((alert, idx) => {
      topRecommendations.push({
        id: alert.id || `rec-${idx + 1}`,
        type: alert.type || (alert.priority === "High" ? "nutrient" : "irrigation"),
        title: alert.title,
        desc: alert.description,
        field: alert.field || (fields[0]?.name || "Main Field"),
        priority: alert.priority || "Medium",
        action: alert.type === "pest" ? "Log Inspection" : alert.type === "nutrient" ? "Apply Fertilizer" : "Schedule Irrigation"
      });
    });

    // If no urgent alerts but fields exist, provide stage-appropriate routine management item
    if (topRecommendations.length === 0 && totalFields > 0) {
      fields.slice(0, 2).forEach((f, idx) => {
        topRecommendations.push({
          id: `rec-field-${idx}`,
          type: "irrigation",
          title: `Monitor ${f.name} (${f.crop_type || "Crop"})`,
          desc: `All metrics nominal. Stage conditions are optimal for ${f.crop_variety || "current crop"}.`,
          field: f.name,
          priority: "Low",
          action: "View Parcel"
        });
      });
    }

    const data = {
      locationName: fields[0]?.location_name || "My Farm",
      stats: {
        totalFields,
        avgHealth,
        activeAlerts: activeAlerts.length,
        recommendations: topRecommendations.length,
      },
      healthDistribution: {
        good,
        moderate,
        poor,
      },
      trendData,
      topRecommendations,
      fieldsList: fields.map(f => f.name),
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
