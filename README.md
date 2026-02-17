# The Grimoire: Spellcasters Manager

A local-first operator tool for **Spellcasters Chronicles**. Edit game entities, manage assets, track changes, and publish structured patch notes — all from a single tool.

## Workflow

```
Browse → Edit → Save or Queue → Tag → Publish
```

### Step 1: Browse the Library

The **sidebar** is the entry point. Use the category filters (Spellcasters, Creatures, Buildings, Spells, Consumables) or the search bar to find the entity you want to work with. The sidebar highlights items that are currently queued for a patch.

### Step 2: Edit in the Studio

Click any entity to open it in the **Studio**. A validated form editor with schema-driven fields. Edit stats, descriptions, assets, and metadata.

When saving, you have three options:

| Action         | Shortcut       | What it does                                                                                           |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| **Save**       | `Ctrl+S`       | Writes the JSON file only. No patch entry. Best for quick tweaks or WIP.                               |
| **Save + Tag** | `Ctrl+Shift+S` | Writes JSON + creates a tagged entry in `patches.json`. Use for significant changes you want to track. |
| **Queue**      | —              | Writes JSON + stages the change in `queue.json` for batching into a larger patch later.                |

> **Note:** You can add a "Reason" note when saving with tags or queuing. This note appears in the patch history for context.

#### Live Preview

Click the **Eye icon** in the Studio toolbar to open a **Live Preview** panel on the right side. This shows how the unit will appear on SpellcastersDB — both as an **Archive Card** and a **Detail Page** (including patch history). The preview updates in real-time as you edit fields.

### Step 3: Review & Tag in the Patch Manager

Switch to the **Patch Manager** to see all queued changes.

- Each change is displayed as a visual **DiffCard** showing what entity was modified, which fields changed, and the old → new values.
- **Tag**: Add tags like `balance` or `rework` to categorize the change.
- **Remove**: Discard the change from the queue.

### Step 4: Publish a Patch

1. Click **Create Patch** at the bottom of the Patch Manager.
2. Fill in Version, Type (balance / content / fix / rule / hotfix), Title, and Tags.
3. Click **Publish Patch**.

This bundles all queued changes into a single entry in `patches.json`, clears the queue, and commits via Git.

### Step 5: Review History

The **History** tab in the Patch Manager shows all published patches. Filter by tag or search by entity name to audit past changes.

## Entity Types

| Category              | Schema             | Data Folder                |
| --------------------- | ------------------ | -------------------------- |
| Spellcasters (Heroes) | `HeroSchema`       | `heroes/`                  |
| Creatures / Buildings | `UnitSchema`       | `units/`                   |
| Spells / Consumables  | `ConsumableSchema` | `consumables/` / `spells/` |

## Safety & Reliability

- **Backups**: Every patch commit triggers a full backup of `data/` to `data/backups/`.
- **Audit Logs**: Critical actions (save, queue, commit, rollback) are logged to `data/audit.jsonl`.
- **Health Check**: The header displays system health and version.
- **Validation**: Strict schema validation with instant UI feedback ensures data integrity.
- **Unsaved Changes**: The app prevents accidental navigation away from unsaved work.

## Patch History API

When publishing in **LIVE** mode, the Manager generates static JSON files in the API repo (`../spellcasters-community-api/`):

| File                    | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `changelog.json`        | Full history — array of all patches           |
| `changelog_latest.json` | Most recent patch object                      |
| `balance_index.json`    | Per-entity balance tags for deckbuilder icons |
| `timeline/{id}.json`    | Entity snapshot history for card pages        |

## Architecture

- **Frontend (`src/`)**: React + Vite + TailwindCSS v4. Zod schemas as single source of truth.
- **Backend (`server/`)**: Express + Node.js. Non-blocking Async I/O for file operations, git commits, asset uploads. Structured logging via Winston.
- **Data**: JSON files on disk. No database.

## Environments

| Mode              | Data Directory                        | Indicator  |
| ----------------- | ------------------------------------- | ---------- |
| **DEV** (default) | `./mock_data/`                        | Blue badge |
| **LIVE**          | `../spellcasters-community-api/data/` | Red theme  |

Switching modes re-fetches all data. Changes in one mode do not affect the other.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Git (must be installed and available in PATH)

### Installation

```bash
git clone <your-repo-url>
cd spellcasters-manager
npm install
```

### Running

1. **Seed Local Data** (first time):

   ```bash
   npm run sync-data
   ```

2. **Start the App**:
   ```bash
   npm run dev:all
   ```
   Starts both the Vite frontend (http://localhost:5173) and Express backend (http://localhost:3001).

### Testing

```bash
npm test               # Full suite (Unit + Integration + Client Services)
npm run test:coverage  # Generate coverage report
```

The test suite covers:

- **Server Unit Tests**: Controllers, Services (Git, File, Patch), Utils.
- **Integration Tests**: Data flow, Backup/Audit, Batch operations.
- **Client Service Tests**: HttpClient, PatchService (API layer).

**Current Coverage**: ~100% Backend Unit/Integration/Security + Critical Client Paths.

## Data Management

| Command                   | Action                       | When to use                         |
| ------------------------- | ---------------------------- | ----------------------------------- |
| `npm run sync-data`       | **Merge** Live data into Dev | Update local env without losing WIP |
| `npm run sync-data:clean` | **Wipe & Replace**           | Reset environment to match Live     |

## License

MIT
