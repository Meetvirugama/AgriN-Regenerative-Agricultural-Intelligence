import crypto from "crypto";
import { layer3Service as weatherService } from "../weather/weather.service.js";
import { satelliteService } from "../satellite/satellite.service.js";
import { soilService } from "../soil/soil.service.js";
import { geminiService } from "./gemini.service.js";
import {
  getActiveField,
  getFieldHistory,
  saveUserMessage,
  saveAiMessage,
  clearFarmerChat,
  findExistingMessage,
} from "../../db/repositories/ask.repository.js";

export const askService = {
  async getContext({ farmerId }) {
    const field = await getActiveField(farmerId);
    if (!field) {
      throw new Error("No active field is registered for this farmer.");
    }

    // Attempt to fetch context layers, but don't fail the whole request if one fails
    let weather = null, satellite = null, soil = null;
    
    try {
      const weatherData = await weatherService.getLocalizedForecast(field.id);
      if (weatherData && weatherData.forecasts) {
        weather = weatherData;
      }
    } catch (err) {
      console.warn(`[AskService] Failed to load weather for field ${field.id}`, err.message);
    }

    try {
      const satelliteData = await satelliteService.getLatestForField(field.id);
      if (satelliteData) {
        satellite = satelliteData;
      }
    } catch (err) {
      console.warn(`[AskService] Failed to load satellite for field ${field.id}`, err.message);
    }

    try {
      const soilData = await soilService.getActiveSoilProfile(field.id);
      if (soilData) {
        soil = soilData;
      }
    } catch (err) {
      console.warn(`[AskService] Failed to load soil for field ${field.id}`, err.message);
    }

    const history = await getFieldHistory(farmerId, 20);

    return {
      field: {
        id: field.id,
        name: field.name,
        areaHectares: field.areaHectares,
        latitude: field.latitude,
        longitude: field.longitude,
      },
      farmer: {
        language: field.farmerLanguage,
      },
      crop: {
        name: field.cropName,
        variety: field.cropVariety,
        sowingDate: field.sowingDate,
        growthStage: field.growthStage,
      },
      weather,
      satellite,
      soil,
      history: history.slice(0, 10),
    };
  },

  async answer({ farmerId, message, clientMessageId }) {
    if (clientMessageId) {
      const existing = await findExistingMessage(farmerId, clientMessageId);
      if (existing && existing.role === 'assistant') {
        return existing; // idempotency
      }
    }

    const context = await this.getContext({ farmerId });
    const userMessage = await saveUserMessage({
      farmerId,
      fieldId: context.field.id,
      clientMessageId: clientMessageId || crypto.randomUUID(),
      content: message,
    });

    try {
      const advisoryData = await geminiService.generateAdvisory({
        question: message,
        context,
      });

      const aiMessage = await saveAiMessage({
        farmerId,
        fieldId: context.field.id,
        parentMessageId: userMessage.id,
        content: advisoryData.answer,
        advisory: advisoryData.advisory,
        sources: advisoryData.sources,
      });

      return {
        id: aiMessage.id,
        role: "ai",
        content: advisoryData.answer,
        timestamp: aiMessage.created_at,
        advisory: advisoryData.advisory,
        sources: advisoryData.sources,
      };
    } catch (error) {
      console.error("AgriMesh advisory generation failed", {
        farmerId,
        fieldId: context.field.id,
        userMessageId: userMessage.id,
        error: error.message,
      });
      throw new Error("Agronomy intelligence is temporarily unavailable. Please try again.");
    }
  },

  async getHistory({ farmerId, limit, cursor }) {
    return getFieldHistory(farmerId, limit, cursor);
  },

  async clearHistory({ farmerId }) {
    return clearFarmerChat(farmerId);
  },
};
