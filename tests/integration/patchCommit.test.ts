import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import { commitPatch } from "../../server/controllers/patchController";
import { addToQueue, getQueue } from "../../server/controllers/queueController";
import { fileService } from "../../server/services/fileService";

// Mock Dependencies
const mocks = vi.hoisted(() => ({
  commitPatch: vi.fn(),
  getStagedDiff: vi.fn().mockResolvedValue(""),
}));

vi.mock("../../server/services/fileService");
vi.mock("../../server/services/gitService", () => {
  return {
    GitService: class {
      commitPatch = mocks.commitPatch;
      getStagedDiff = mocks.getStagedDiff;
    },
    gitService: {
      commitPatch: mocks.commitPatch,
      getStagedDiff: mocks.getStagedDiff,
    },
  };
});

const app: Express = express();
app.use(express.json());

// Mock Context & Routes
app.use((req, res, next) => {
  req.context = { dataDir: "root/data", assetsDir: "root/assets" };
  next();
});
app.post("/api/queue", addToQueue);
app.get("/api/queue", getQueue);
app.post("/api/commit", commitPatch);

describe("Integration: Patch Commit Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: Queue empty
    vi.mocked(fileService.exists).mockReturnValue(false);
    vi.mocked(fileService.readJson).mockImplementation(async (path: string) => {
      if (path.includes("queue.json")) return [];
      if (path.includes("patches.json")) return [];
      return [];
    });
  });

  it("should add item to queue then commit it successfully", async () => {
    // 1. Add to Queue
    const addRes = await request(app)
      .post("/api/queue")
      .send({
        change: {
          target_id: "u1",
          name: "Unit",
          field: "name",
          new: "Updated",
        },
      });

    expect(addRes.status).toBe(200);
    expect(fileService.writeJson).toHaveBeenCalledWith(
      expect.stringMatching(/queue\.json/),
      expect.arrayContaining([expect.objectContaining({ target_id: "u1" })])
    );

    // 2. Prepare mock for Commit step (Queue has item)
    vi.mocked(fileService.exists).mockReturnValue(true);
    vi.mocked(fileService.readJson).mockImplementation(async (path: string) => {
      if (path.includes("queue.json"))
        return [{ target_id: "u1", name: "Unit" }]; // Queue content
      if (path.includes("patches.json")) return [];
      return [];
    });

    // 3. Commit Patch
    const commitRes = await request(app).post("/api/commit").send({
      version: "1.1.0",
      title: "Integration Test Patch",
      type: "Patch",
      changes: [],
    });

    expect(commitRes.status).toBe(200);
    expect(commitRes.body.success).toBe(true);

    // Verify patches.json updated
    expect(fileService.writeJson).toHaveBeenCalledWith(
      expect.stringMatching(/patches\.json/),
      expect.arrayContaining([expect.objectContaining({ version: "1.1.0" })])
    );

    // Verify queue cleared
    expect(fileService.writeJson).toHaveBeenCalledWith(
      expect.stringMatching(/queue\.json/),
      []
    );

    // Verify Git Commit
    expect(mocks.commitPatch).toHaveBeenCalled();
  });

  it("should reject commit if queue is empty", async () => {
    // Mock empty queue
    vi.mocked(fileService.exists).mockReturnValue(true);
    vi.mocked(fileService.readJson).mockResolvedValue([]);

    const res = await request(app)
      .post("/api/commit")
      .send({ version: "1.2.0", title: "Empty", type: "Patch" });

    expect(res.status).toBe(400);
  });
});
