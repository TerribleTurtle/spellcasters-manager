/**
 * Temporary Environment Helper for Integration Tests
 *
 * Creates isolated, real filesystem directories for tests that need
 * to verify actual file I/O (no mocks). Each call to `createTempEnv()`
 * produces a unique temp folder that is cleaned up via `cleanup()`.
 *
 * Convention:
 *   - `src/**\/*.test.tsx` → Client tests, run in jsdom
 *   - `tests/**\/*.test.ts`  → Server tests,  run in node
 */
import fsPromises from "fs/promises";
import path from "path";
import os from "os";

export interface TempEnv {
  /** Absolute path to the temporary data directory (contains category sub-folders). */
  dataDir: string;
  /** Absolute path to the temporary assets directory. */
  assetsDir: string;
  /**
   * Seed a JSON file into a category folder.
   * @param category  The category sub-folder (e.g. 'units', 'heroes').
   * @param filename  The JSON filename (e.g. 'archer.json').
   * @param data      The object to write as JSON.
   */
  seedFile: (
    category: string,
    filename: string,
    data: unknown
  ) => Promise<void>;
  /** Recursively remove the entire temp directory. */
  cleanup: () => Promise<void>;
}

/**
 * Creates an isolated temporary environment for integration tests.
 *
 * The structure mirrors the production layout:
 * ```
 * <tmpDir>/
 *   data/
 *     units/
 *     heroes/
 *     spells/
 *     consumables/
 *     titans/
 *   assets/
 * ```
 *
 * @param categories Optional override of sub-folders to create inside `data/`.
 *                   Defaults to the five registered entity categories.
 */
export async function createTempEnv(
  categories: string[] = ["units", "heroes", "spells", "consumables", "titans"]
): Promise<TempEnv> {
  const root = await fsPromises.mkdtemp(path.join(os.tmpdir(), "sc-test-"));
  const dataDir = path.join(root, "data");
  const assetsDir = path.join(root, "assets");

  // Create the category sub-folders
  for (const cat of categories) {
    await fsPromises.mkdir(path.join(dataDir, cat), { recursive: true });
  }
  await fsPromises.mkdir(assetsDir, { recursive: true });

  const seedFile = async (
    category: string,
    filename: string,
    data: unknown
  ) => {
    const catDir = path.join(dataDir, category);
    await fsPromises.mkdir(catDir, { recursive: true });
    await fsPromises.writeFile(
      path.join(catDir, filename),
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  };

  const cleanup = async () => {
    // Guard: only remove paths that live inside os.tmpdir()
    if (root.startsWith(os.tmpdir())) {
      await fsPromises.rm(root, { recursive: true, force: true });
    }
  };

  return { dataDir, assetsDir, seedFile, cleanup };
}
