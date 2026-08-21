import { query } from "../../db/connection.js";

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

export const settingsService = {
  async getSettings(farmerId) {
    if (!farmerId) return null;

    try {
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

      if (!result.rows.length) {
        // Return defaults if no settings found
        return {
          language: "English",
          timezone: "Asia/Kolkata",
          enableSounds: true,
          personalizedRecs: true,
          voiceResponses: false,
          autoReadRecs: false,
          adviceLevel: "Simple",
          permissions: {
            crop: true,
            soil: true,
            weather: true,
            history: true,
            health: true,
            irrigation: true,
          },
        };
      }

      return serializeSettings(result.rows[0]);
    } catch (error) {
      console.error("[Settings Service] Failed to fetch settings:", error);
      throw error;
    }
  },
};
