import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

import satelliteRoutes from './satellite/satellite.routes';
import { cropRoutes } from './routes/cropRoutes';
import weatherRoutes from './routes/weatherRoutes';
import soilRoutes from './routes/soilRoutes';

app.use('/api', satelliteRoutes);
app.use('/api/fields', cropRoutes);
app.use('/api/fields', weatherRoutes);
app.use('/api/fields', soilRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AgriMesh Server running on port ${PORT}`);
});
