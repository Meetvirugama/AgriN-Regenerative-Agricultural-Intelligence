import { Router } from "express";
import { query } from "../../db/connection.js";

const router = Router();

function serializeSettings(row) {
  return {
    language: row.language,
    timezone: row.timezone,
    enableSounds: row.enable_sounds,
    personalizedRecs: row.personalized_recommendations,
    voiceResponses: row.voice_responses,
    autoReadRecs: row.auto_read_recommendations,
    adviceLevel: row.advice_level,
    permissions: {
      crop: row.permission_crop,
      soil: row.permission_soil,
      weather: row.permission_weather,
      history: row.permission_history,
      health: row.permission_health,
      irrigation: row.permission_irrigation,
    },
  };
}

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
        language,
        timezone,
        enable_sounds,
        personalized_recommendations,
        voice_responses,
        auto_read_recommendations,
        advice_level,
        permission_crop,
        permission_soil,
        permission_weather,
        permission_history,
        permission_health,
        permission_irrigation
      FROM farmer_settings
      WHERE farmer_id = $1
      `,
      [farmerId]
    );

    // Create default settings automatically
    if (!result.rows.length) {
      const created = await query(
        `
        INSERT INTO farmer_settings (farmer_id)
        VALUES ($1)
        RETURNING *
        `,
        [farmerId]
      );

      return res.json({
        settings: serializeSettings(created.rows[0]),
      });
    }

    return res.json({
      settings: serializeSettings(result.rows[0]),
    });
  } catch (error) {
    console.error("[Settings] GET failed:", error);
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
      language,
      timezone,
      enableSounds,
      personalizedRecs,
      voiceResponses,
      autoReadRecs,
      adviceLevel,
      permissions,
    } = req.body;

    const validAdviceLevels = ["Simple", "Detailed", "Expert"];

    if (adviceLevel && !validAdviceLevels.includes(adviceLevel)) {
      return res.status(400).json({
        message: "Invalid advice level.",
      });
    }

    const result = await query(
      `
      INSERT INTO farmer_settings (
        farmer_id,
        language,
        timezone,
        enable_sounds,
        personalized_recommendations,
        voice_responses,
        auto_read_recommendations,
        advice_level,
        permission_crop,
        permission_soil,
        permission_weather,
        permission_history,
        permission_health,
        permission_irrigation,
        updated_at
      )
      VALUES (
        $1,
        COALESCE($2, 'English'),
        COALESCE($3, 'Asia/Kolkata'),
        COALESCE($4, TRUE),
        COALESCE($5, TRUE),
        COALESCE($6, FALSE),
        COALESCE($7, FALSE),
        COALESCE($8, 'Simple'),
        COALESCE($9, TRUE),
        COALESCE($10, TRUE),
        COALESCE($11, TRUE),
        COALESCE($12, TRUE),
        COALESCE($13, TRUE),
        COALESCE($14, TRUE),
        NOW()
      )
      ON CONFLICT (farmer_id)
      DO UPDATE SET
        language = COALESCE(EXCLUDED.language, farmer_settings.language),
        timezone = COALESCE(EXCLUDED.timezone, farmer_settings.timezone),
        enable_sounds = COALESCE(EXCLUDED.enable_sounds, farmer_settings.enable_sounds),
        personalized_recommendations = COALESCE(EXCLUDED.personalized_recommendations, farmer_settings.personalized_recommendations),
        voice_responses = COALESCE(EXCLUDED.voice_responses, farmer_settings.voice_responses),
        auto_read_recommendations = COALESCE(EXCLUDED.auto_read_recommendations, farmer_settings.auto_read_recommendations),
        advice_level = COALESCE(EXCLUDED.advice_level, farmer_settings.advice_level),
        permission_crop = COALESCE(EXCLUDED.permission_crop, farmer_settings.permission_crop),
        permission_soil = COALESCE(EXCLUDED.permission_soil, farmer_settings.permission_soil),
        permission_weather = COALESCE(EXCLUDED.permission_weather, farmer_settings.permission_weather),
        permission_history = COALESCE(EXCLUDED.permission_history, farmer_settings.permission_history),
        permission_health = COALESCE(EXCLUDED.permission_health, farmer_settings.permission_health),
        permission_irrigation = COALESCE(EXCLUDED.permission_irrigation, farmer_settings.permission_irrigation),
        updated_at = NOW()
      RETURNING *
      `,
      [
        farmerId,
        language,
        timezone,
        enableSounds,
        personalizedRecs,
        voiceResponses,
        autoReadRecs,
        adviceLevel,
        permissions?.crop,
        permissions?.soil,
        permissions?.weather,
        permissions?.history,
        permissions?.health,
        permissions?.irrigation,
      ]
    );

    return res.json({
      success: true,
      settings: serializeSettings(result.rows[0]),
    });
  } catch (error) {
    console.error("[Settings] PATCH failed:", error);
    next(error);
  }
});

export default router;
