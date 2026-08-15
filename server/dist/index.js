"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const climateRisk_1 = __importDefault(require("./routes/climateRisk"));
const advisory_1 = __importDefault(require("./routes/advisory"));
const escalation_routes_1 = __importDefault(require("./escalation/escalation.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const satellite_routes_1 = __importDefault(require("./satellite/satellite.routes"));
const health_score_routes_1 = __importDefault(require("./health-score/health-score.routes"));
const cropRoutes_1 = require("./routes/cropRoutes");
const weatherRoutes_1 = __importDefault(require("./routes/weatherRoutes"));
const soilRoutes_1 = __importDefault(require("./routes/soilRoutes"));
const diagnosisRoutes_1 = __importDefault(require("./routes/diagnosisRoutes"));
const regenRoutes_1 = __importDefault(require("./routes/regenRoutes"));
app.use('/api', satellite_routes_1.default);
app.use('/api', health_score_routes_1.default);
app.use('/api/fields', cropRoutes_1.cropRoutes);
app.use('/api/fields', weatherRoutes_1.default);
app.use('/api/fields', soilRoutes_1.default);
app.use('/api/fields', diagnosisRoutes_1.default);
app.use('/api/fields', regenRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Mount the Climate Risk API (Layer 08)
app.use('/api', climateRisk_1.default);
// Mount the Advisory API
app.use('/api', advisory_1.default);
// Mount the Escalation API (Layer 13)
app.use('/api/escalations', escalation_routes_1.default);
// Mount the Cross-Border API (Layer 14)
const crossBorder_routes_1 = __importDefault(require("./cross-border/crossBorder.routes"));
app.use('/api', crossBorder_routes_1.default);
app.listen(PORT, () => {
    console.log(`AgriMesh Server running on port ${PORT}`);
});
