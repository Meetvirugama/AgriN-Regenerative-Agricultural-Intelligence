import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cropRoutes } from './routes/cropRoutes';
import weatherRoutes from './routes/weatherRoutes';
import soilRoutes from './routes/soilRoutes';
import diagnosisRoutes from './routes/diagnosisRoutes';
import regenRoutes from './routes/regenRoutes';
import climateRiskRouter from './routes/climateRisk';
import advisoryRouter from './routes/advisory';
import voiceRouter from './routes/voice';
import feedbackRouter from './routes/feedback';
import satelliteRoutes from './satellite/satellite.routes';
import healthScoreRoutes from './health-score/health-score.routes';
import escalationRoutes from './escalation/escalation.routes';
import crossBorderRoutes from './cross-border/crossBorder.routes';

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
