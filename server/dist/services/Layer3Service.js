"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer3Service = void 0;
const Database_1 = require("../models/Database");
const WeatherProvider_1 = require("./weather/WeatherProvider");
const WeatherRuleEngine_1 = require("./weather/WeatherRuleEngine");
const Layer1Service_1 = require("./Layer1Service");
class Layer3Service {
    provider;
    ruleEngine;
    constructor() {
        this.provider = new WeatherProvider_1.MockWeatherProvider();
        this.ruleEngine = new WeatherRuleEngine_1.WeatherRuleEngine();
    }
    async fetchAndStoreForecast(fieldId) {
        const field = Layer1Service_1.layer1Service.getField(fieldId);
        if (!field) {
            throw new Error(`Field ${fieldId} not found`);
        }
        // Coordinates are mocked in Layer 1, so we just pass dummy values
        const forecasts = await this.provider.getForecast(0, 0, fieldId);
        // Store in DB
        Database_1.db.weatherSnapshots.set(fieldId, forecasts);
        // Evaluate rules to generate flags
        const flags = this.ruleEngine.evaluate(fieldId, forecasts);
        Database_1.db.weatherFlags.set(fieldId, flags);
        return { forecasts, flags };
    }
    getLocalizedForecast(fieldId) {
        const forecasts = Database_1.db.weatherSnapshots.get(fieldId) || [];
        const flags = Database_1.db.weatherFlags.get(fieldId) || [];
        return { forecasts, flags };
    }
    async getFieldWeatherHistory(fieldId) {
        return await this.provider.getHistory(0, 0, fieldId);
    }
}
exports.layer3Service = new Layer3Service();
