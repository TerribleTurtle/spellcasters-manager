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

When saving, you have two options:

| Action    | Shortcut | What it does                                                                                         |
| --------- | -------- | ---------------------------------------------------------------------------------------------------- |
| **Save**  | `Ctrl+S` | Writes the JSON file to disk. An automatic audit entry is recorded in `patches.json` for every save. |
| **Queue** | —        | Writes JSON + stages the change in `queue.json` for batching into a larger patch release.            |

> **Note:** You can add a "Reason" note when queuing. This note appears in the patch history for context.

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
| Titans                | `UnitSchema`       | `titans/`                  |
| Spells / Consumables  | `ConsumableSchema` | `consumables/` / `spells/` |

## Safety & Reliability

- **Atomic Writes**: All JSON writes use a temp-file + rename strategy to prevent data corruption on crash.
- **Selective Saves**: Batch operations skip files whose content hasn't changed, reducing unnecessary I/O.
- **Backups**: Every patch commit and every data import triggers a full backup of the data directory.
- **Import Safety**: Imports can optionally route through the patch queue (`?queue=true`) for review before applying.
- **Audit Logs**: Critical actions (save, queue, commit, rollback) are logged to `data/audit.jsonl`.
- **Health Check**: The header displays system health and version.
- **Validation**: Strict schema validation with instant UI feedback ensures data integrity.
- **Unsaved Changes**: The app prevents accidental navigation away from unsaved work.
- **Path Security**: All file operations are guarded against directory traversal attacks.

## Patch History API

When publishing, the Manager generates static JSON files for the community API (`../spellcasters-community-api/`):

| File                    | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `changelog.json`        | Full history — array of all patches           |
| `changelog_latest.json` | Most recent patch object                      |
| `balance_index.json`    | Per-entity balance tags for deckbuilder icons |
| `timeline/{id}.json`    | Entity snapshot history for card pages        |

## Architecture

- **Frontend (`src/`)**: React + Vite + TailwindCSS v4. Zod schemas as single source of truth.
- **Backend (`server/`)**: Express + Node.js. Non-blocking Async I/O for file operations, git commits, asset uploads. Structured logging via Winston. Standardized error handling via `AppError`.
- **Data**: JSON files on disk (`data/`). No database. Git for version tracking.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Git (must be installed and available in PATH)

### Installation

```bash
git clone https://github.com/TerribleTurtle/spellcasters-manager.git
cd spellcasters-manager
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
DATA_DIR=./data     # Path to the JSON data directory
PORT=3001           # Backend server port (default: 3001)
```

> **Tip:** To switch data sources, change `DATA_DIR` and restart. No code changes needed.

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
npm test               # Full suite (Unit + Integration + Hooks + Components)
npm run test:coverage  # Generate coverage report
```

The test suite covers:

- **Server Unit Tests**: Controllers, Services (Git, File, Patch, Queue, Import, Publisher, Dev), Utils.
- **Integration Tests**: Data flow, Backup/Audit, Batch operations, Patch commit.
- **Frontend Hook Tests**: useEntityMutation, useEditorActions, useEntitySelection, useEditorForm.
- **Component Smoke Tests**: TableEditor, AppSidebar.

**Current Suite**: 412 tests across 44 files.

## Data Management

| Command                   | Action                       | When to use                                        |
| ------------------------- | ---------------------------- | -------------------------------------------------- |
| `npm run sync-data`       | **Merge** Live data into Dev | Update local env without losing WIP                |
| `npm run sync-data:clean` | **Wipe & Replace** (Safe)    | Reset to match Live (Auto-backs up dev data first) |

## License

MIT

## 🌐 Part of the Spellcasters Ecosystem

- **[Spellcasters Community API](https://github.com/TerribleTurtle/spellcasters-community-api)** — The shared data source (GitHub Pages)
- **[SpellcastersDB](https://github.com/TerribleTurtle/spellcastersdb)** — The public database & deckbuilder
- **[Spellcasters Bot](https://github.com/TerribleTurtle/spellcasters-bot)** — Discord integration

> All tools consume the same [Community API v2](https://terribleturtle.github.io/spellcasters-community-api/api/v2/).
