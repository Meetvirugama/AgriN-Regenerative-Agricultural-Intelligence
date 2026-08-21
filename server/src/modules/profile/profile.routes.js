import { Router } from "express";
import { query } from "../../db/connection.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub;

    if (!farmerId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const [farmerResult, statsResult, historyResult, aiInsightsResult] = await Promise.all([
      query(
        `
        SELECT
          id,
          name,
          phone_number AS phone,
          email,
          location,
          profile_image_url,
          preferred_language,
          farming_experience_years,
          created_at
        FROM farmers
        WHERE id = $1
        LIMIT 1
        `,
        [farmerId]
      ),

      query(
        `
        SELECT
          COUNT(*)::int AS field_count,
          COALESCE(SUM(area_hectares * 2.47105), 0) AS total_acres,
          COUNT(DISTINCT crop_type)::int AS crop_count
        FROM fields
        WHERE farmer_id = $1
        `,
        [farmerId]
      ),

      query(
        `
        SELECT
          id,
          id AS field_id,
          crop_type,
          crop_variety,
          sowing_date,
          NULL AS harvest_date,
          'active' AS status,
          area_hectares * 2.47105 AS area_acres,
          created_at
        FROM fields
        WHERE farmer_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [farmerId]
      ),

      query(
        `
        SELECT COUNT(*)::int AS count
        FROM advisory_records a
        JOIN fields f ON f.id = a.field_id
        WHERE f.farmer_id = $1
        `,
        [farmerId]
      ).catch(() => ({
        rows: [{ count: 0 }],
      }))
    ]);

    if (!farmerResult.rows.length) {
      return res.status(404).json({
        message: "Farmer profile not found.",
      });
    }

    const farmer = farmerResult.rows[0];
    const stats = statsResult.rows[0];

    return res.json({
      profile: {
        id: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        email: farmer.email,
        location: farmer.location,
        profileImageUrl: farmer.profile_image_url,
        preferredLanguage: farmer.preferred_language || "English",
        farmingExperienceYears: farmer.farming_experience_years,
        joinedAt: farmer.created_at,
      },

      stats: {
        fields: Number(stats.field_count) || 0,
        acres: Number(stats.total_acres) || 0,
        crops: Number(stats.crop_count) || 0,
        aiInsights: Number(aiInsightsResult.rows[0]?.count) || 0,
      },

      history: historyResult.rows.map((row) => ({
        id: row.id,
        fieldId: row.field_id,
        cropType: row.crop_type,
        cropVariety: row.crop_variety,
        sowingDate: row.sowing_date,
        harvestDate: row.harvest_date,
        status: row.status,
        areaAcres: row.area_acres,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("[Profile] Failed:", error);
    next(error);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const farmerId = req.farmer?.sub;

    if (!farmerId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const {
      name,
      phone,
      email,
      location,
      preferredLanguage,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    const result = await query(
      `
      UPDATE farmers
      SET
        name = $1,
        phone_number = COALESCE($2, phone_number),
        email = $3,
        location = $4,
        preferred_language = $5
      WHERE id = $6
      RETURNING
        id,
        name,
        phone_number AS phone,
        email,
        location,
        profile_image_url,
        preferred_language,
        farming_experience_years
      `,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        location?.trim() || null,
        preferredLanguage || "English",
        farmerId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    const farmer = result.rows[0];

    res.json({
      profile: {
        id: farmer.id,
        name: farmer.name,
        phone: farmer.phone,
        email: farmer.email,
        location: farmer.location,
        profileImageUrl: farmer.profile_image_url,
        preferredLanguage: farmer.preferred_language,
        farmingExperienceYears: farmer.farming_experience_years,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
