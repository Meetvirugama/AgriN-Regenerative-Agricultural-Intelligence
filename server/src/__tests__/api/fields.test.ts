import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { cropRoutes } from '../../modules/crop/crop.routes';
import { pool } from '../../db/connection';

// Mock the pool to avoid real DB connections in this basic integration test
vi.mock('../../db/connection', () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [{ id: 'mock-farmer-1' }] }),
  },
}));

vi.mock('../../modules/field/field.service', () => ({
  layer1Service: {
    getOrCreateMockFarmer: vi.fn().mockResolvedValue({ id: 'mock-farmer-1', name: 'Ravi Kumar' }),
    getOrCreateStubField: vi.fn().mockResolvedValue({ id: 'mock-field-1', name: 'North Plot' }),
  }
}));

describe('Fields API Integration', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/fields', cropRoutes);

  it('POST /api/v1/fields/stub-init should return farmer and field', async () => {
    const res = await request(app)
      .post('/api/v1/fields/stub-init')
      .expect(200);

    expect(res.body).toHaveProperty('farmer');
    expect(res.body).toHaveProperty('field');
    expect(res.body.farmer.id).toBe('mock-farmer-1');
    expect(res.body.field.id).toBe('mock-field-1');
  });
});
