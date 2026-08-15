import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cropRoutes } from './modules/crop/crop.routes';
import weatherRoutes from './modules/weather/weather.routes';
import soilRoutes from './modules/soil/soil.routes';
import diagnosisRoutes from './modules/disease/disease.routes';
import regenRoutes from './modules/regen/regen.routes';
import climateRiskRouter from './modules/climate-risk/climate-risk.routes';
import advisoryRouter from './modules/advisory/advisory.routes';
import voiceRouter from './modules/voice/voice.routes';
import feedbackRouter from './modules/feedback/feedback.routes';
import satelliteRoutes from './modules/satellite/satellite.routes';
import healthScoreRoutes from './modules/health-score/health-score.routes';
import escalationRoutes from './modules/escalation/escalation.routes';
import crossBorderRoutes from './modules/cross-border/crossBorder.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Field-scoped routes
app.use('/api/fields', cropRoutes);
app.use('/api/fields', weatherRoutes);
app.use('/api/fields', soilRoutes);
app.use('/api/fields', diagnosisRoutes);
app.use('/api/fields', regenRoutes);

// Module routes
app.use('/api', satelliteRoutes);
app.use('/api', healthScoreRoutes);
app.use('/api', climateRiskRouter);
app.use('/api', advisoryRouter);
app.use('/api', voiceRouter);
app.use('/api', feedbackRouter);
app.use('/api', crossBorderRoutes);
app.use('/api/escalations', escalationRoutes);

app.listen(PORT, () => {
  console.log(`AgriMesh Server running on port ${PORT}`);
});
