import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import { registerRoutes } from "../../server/routes";
import {
  registerMiddleware,
  registerErrorHandler,
} from "../../server/middleware";
import { createTempEnv, TempEnv } from "../helpers/tempEnv";

// We do not want to trigger backups or git commits via the API,
// so we mock those services, but keep FileService real to test the API reading/writing.
vi.mock("../../server/services/backupService", () => ({
  backupService: { createBackup: vi.fn(), backupFile: vi.fn() },
}));
vi.mock("../../server/services/gitService", () => ({
  gitService: {
    commitPatch: vi.fn(),
    getStagedDiff: vi.fn().mockResolvedValue(""),
  },
}));
vi.mock("../../server/services/publisherService", () => ({
  publisherService: {
    publishChangelog: vi.fn(),
    publishIfNeeded: vi.fn(),
  },
}));

describe("Integration: Server Routes & Middleware", () => {
  let app: Express;
  let env: TempEnv;

  beforeEach(async () => {
    vi.clearAllMocks();
    env = await createTempEnv();

    // Construct a realistic express app
    app = express();
    registerMiddleware(app, env.dataDir, env.assetsDir);
    registerRoutes(app, env.assetsDir);
    registerErrorHandler(app); // Catch AppErrors
  });

  afterEach(async () => {
    if (env) await env.cleanup();
  });

  it("GET /api/health returns OK", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });

  it("GET /api/list/:category returns empty list when no files", async () => {
    const res = await request(app).get("/api/list/units");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /api/bulk/:category returns seeded files", async () => {
    await env.seedFile("units", "u1.json", { id: "u1", name: "Unit 1" });
    await env.seedFile("units", "u2.json", { id: "u2", name: "Unit 2" });

    const res = await request(app).get("/api/bulk/units");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    // Assert we get the actual typed objects back
    const names = res.body.map((u: any) => u.name).sort();
    expect(names).toEqual(["Unit 1", "Unit 2"]);
  });

  it("POST /api/save/:category/:filename saves modifications accurately", async () => {
    // Seed a valid base entity to ensure schema validation passes on save
    await env.seedFile("units", "u1.json", {
      id: "u1",
      name: "Original Name",
      base_health: 100,
    });

    // Fetch it via API to get the fully populated default schema object
    const getRes = await request(app).get("/api/data/units/u1.json");
    const payload = { ...getRes.body, name: "Updated Name", attack: 50 };

    const postRes = await request(app)
      .post("/api/save/units/u1.json")
      .send(payload);

    expect(postRes.status).toBe(200);
    expect(postRes.body.success).toBe(true);

    // Verify we can fetch the updated name
    const verifyRes = await request(app).get("/api/data/units/u1.json");
    expect(verifyRes.body.name).toBe("Updated Name");
    expect(verifyRes.body.attack).toBe(50);
  });

  it("GET /api/bulk/:category returns gracefully for unknown categories", async () => {
    const res = await request(app).get("/api/bulk/unknown_cat");
    // Depending on specific implementation, it might throw a 400 or just return []
    if (res.status === 400) {
      expect(res.body.error).toContain("Invalid category");
    } else {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    }
  });
});
