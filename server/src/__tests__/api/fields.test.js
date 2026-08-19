import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { cropRoutes } from "../../modules/crop/crop.routes.js";

// Mock the pool to avoid real DB connections in this basic integration test
vi.mock("../../db/connection", () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
  },
  queryOne: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../modules/crop/crop.service", () => ({
  layer2Service: {
    getFieldCropState: vi
      .fn()
      .mockResolvedValue({ field_id: "test-field-1", current_stage: "vegetative" }),
  },
}));

describe("Crop Routes Integration", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/fields", cropRoutes);

  it("GET /api/v1/fields/:fieldId/crop-state should return crop state", async () => {
    const res = await request(app)
      .get("/api/v1/fields/test-field-1/crop-state")
      .expect(200);

    expect(res.body).toHaveProperty("field_id");
    expect(res.body).toHaveProperty("current_stage");
  });
});

