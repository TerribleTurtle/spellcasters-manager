import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { patchService } from "../../server/services/patchService";
import { queueService } from "../../server/services/queueService";
import fs from "fs";
import path from "path";
import { createTempEnv, TempEnv } from "../helpers/tempEnv";
import { Change, Patch } from "../../server/services/patchService";

// Mock gitService and publisherService so we don't trigger real git commits or static site builds
vi.mock("../../server/services/gitService", () => {
  return {
    gitService: {
      commitPatch: vi.fn(),
      getStagedDiff: vi.fn().mockResolvedValue(""),
    },
  };
});

vi.mock("../../server/services/publisherService", () => {
  return {
    publisherService: {
      publishChangelog: vi.fn(),
      publishIfNeeded: vi.fn().mockResolvedValue([]),
    },
  };
});

describe("Integration: PatchService", () => {
  let env: TempEnv;

  beforeEach(async () => {
    vi.clearAllMocks();
    env = await createTempEnv(); // Start fresh, real Temp FS
  });

  afterEach(async () => {
    if (env) await env.cleanup();
  });

  it("commitPatch writes patches.json, clears queue.json, and handles atomic writes correctly", async () => {
    // 1. Seed the real file and use enqueueEntityChange
    await env.seedFile("heroes", "hero_1.json", {
      id: "hero_1",
      name: "Hero",
      base_health: 100,
    });
    await queueService.enqueueEntityChange(
      env.dataDir,
      { id: "hero_1", name: "Hero", base_health: 120 },
      "heroes",
      "hero_1.json"
    );

    // Verify queue was actually written
    const queuePath = path.join(env.dataDir, "queue.json");
    expect(fs.existsSync(queuePath)).toBe(true);
    const preQueue: Change[] = JSON.parse(fs.readFileSync(queuePath, "utf-8"));
    expect(preQueue).toHaveLength(1);

    // 2. Commit the patch
    const patch = await patchService.commitPatch(
      env.dataDir,
      "Buff Hero Health",
      "1.0.1",
      "balance",
      ["buff"]
    );

    // 3. Assertions
    expect(patch.version).toBe("1.0.1");
    expect(patch.title).toBe("Buff Hero Health");
    expect(patch.changes).toHaveLength(1);

    // Check that patches.json was created and has the patch
    const patchesPath = path.join(env.dataDir, "patches.json");
    expect(fs.existsSync(patchesPath)).toBe(true);

    const storedPatches: Patch[] = JSON.parse(
      fs.readFileSync(patchesPath, "utf-8")
    );
    expect(storedPatches).toHaveLength(1);
    expect(storedPatches[0].id).toBe(patch.id);

    // Check that queue.json was cleared
    const postQueue: Change[] = JSON.parse(fs.readFileSync(queuePath, "utf-8"));
    expect(postQueue).toHaveLength(0);
  });

  it("quickSave writes patches.json immediately without a queue", async () => {
    const change: Change = {
      target_id: "unit_1.json",
      name: "Unit 1",
      field: "entity",
      category: "units",
      change_type: "edit",
      diffs: [{ kind: "E", path: ["attack"], lhs: 10, rhs: 15 }],
    };

    const patch = await patchService.quickSave(
      env.dataDir,
      change,
      "quick-fix-1",
      ["hotfix"]
    );

    expect(patch.version).toBe("quick-fix-1");

    const patchesPath = path.join(env.dataDir, "patches.json");
    expect(fs.existsSync(patchesPath)).toBe(true);
    const storedPatches: Patch[] = JSON.parse(
      fs.readFileSync(patchesPath, "utf-8")
    );
    expect(storedPatches).toHaveLength(1);
    expect(storedPatches[0].changes[0].target_id).toBe("unit_1.json");
  });
});
