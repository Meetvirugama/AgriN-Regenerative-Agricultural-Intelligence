import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import climateRiskRouter from './routes/climateRisk';
import advisoryRouter from './routes/advisory';
import voiceRouter from './routes/voice';
import feedbackRouter from './routes/feedback';
import escalationRoutes from './escalation/escalation.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

import satelliteRoutes from './satellite/satellite.routes';
import healthScoreRoutes from './health-score/health-score.routes';
import { cropRoutes } from './routes/cropRoutes';
import weatherRoutes from './routes/weatherRoutes';
import soilRoutes from './routes/soilRoutes';
import diagnosisRoutes from './routes/diagnosisRoutes';
import regenRoutes from './routes/regenRoutes';

app.use('/api', satelliteRoutes);
app.use('/api', healthScoreRoutes);
app.use('/api/fields', cropRoutes);
app.use('/api/fields', weatherRoutes);
app.use('/api/fields', soilRoutes);
app.use('/api/fields', diagnosisRoutes);
app.use('/api/fields', regenRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount the Climate Risk API (Layer 08)
app.use('/api', climateRiskRouter);
// Mount the Advisory API
app.use('/api', advisoryRouter);
// Mount the Voice API
app.use('/api', voiceRouter);
// Mount the Feedback & Memory API
app.use('/api', feedbackRouter);
// Mount the Escalation API (Layer 13)
app.use('/api/escalations', escalationRoutes);
// Mount the Cross-Border API (Layer 14)
import crossBorderRoutes from './cross-border/crossBorder.routes';
app.use('/api', crossBorderRoutes);

app.listen(PORT, () => {
  console.log(`AgriMesh Server running on port ${PORT}`);
});
