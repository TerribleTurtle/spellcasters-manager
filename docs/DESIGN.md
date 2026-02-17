# Design Document: "The Grimoire" (Spellcasters Data Manager)

> **Status:** Active
> **Last Updated:** 2026-02-16

## 1. Identity

"The Grimoire" is a **local-first operator tool** for a solo dev managing a community game API. It replaces manual JSON editing with validated forms, a structured patch workflow, and git integration.

It exists to do exactly **three jobs**:

| #   | Job                | Description                                                                    |
| --- | ------------------ | ------------------------------------------------------------------------------ |
| 1   | **Quick Fix**      | Open an entity → change a value → save → done. Under 30 seconds.               |
| 2   | **Patch Publish**  | Batch multiple changes → tag them → publish a versioned patch with git commit. |
| 3   | **Data Integrity** | Prevent bad data from reaching the API. Zod validates on save. Period.         |

If a feature doesn't serve one of these three jobs, it doesn't belong.

## 2. UX Principles

1. **Speed Over Polish** — The UI gets out of the way. No animations that delay a click.
2. **Safety Through Visibility** — You need to see what changed, what's queued, and what you're about to commit. The `.env` path is the only thing that determines what data you touch.
3. **One Screen, One Job** — The Library finds entities. The Editor edits. The Patch Manager reviews and commits.
4. **Trust the Operator** — Schema validation catches real errors. No hand-holding.
5. **Maintainability = Less Code** — Every component you don't write is one you don't debug at 2am.

## 3. Architecture

### Technology Stack

| Layer           | Tech                              | Purpose                                                |
| --------------- | --------------------------------- | ------------------------------------------------------ |
| Frontend        | React + Vite + TailwindCSS v4     | UI with hot reload                                     |
| Backend         | Express + Node.js                 | File system bridge (read/write JSON, asset management) |
| Validation      | Zod (`src/domain/schemas.ts`)     | Single source of truth for both client and server      |
| Version Control | Git CLI (`git add`, `git commit`) | Automated commits on patch publish                     |
| Data            | JSON files on disk                | No database — files are the source of truth            |

### Why a Local Server?

Browser sandbox prevents direct file writes. The Express server bridges the gap, exposing:

- **Health**: `GET /api/health`
- **Data**:
  - `GET /api/list/:category` — List files
  - `GET /api/data/:category/:filename` — Read file
  - `POST /api/save/:category/:filename` — Writr file (optional `?queue=true`)
  - `POST /api/save/:category/batch` — Batch write
  - `DELETE /api/data/:category/:filename` — Delete file
  - `POST /api/admin/reset` — Reset DEV data
  - `GET /api/data/export` / `POST /api/data/import` — Bulk data portability
- **Patches**:
  - `GET/POST/PUT/DELETE /api/patches/queue` — Manage queue
  - `POST /api/patches/quick-commit` — Silent save + tag
  - `GET /api/patches/history` — Read patches.json
  - `POST /api/patches/commit` — Publish queue to patch
  - `POST /api/patches/:id/rollback` — Revert a patch
- **Assets**:
  - `GET /api/assets/list` — List images
  - `POST /api/assets/upload` — Upload image

## 4. Core Workflow

```
Browse Library → Edit Entity → Quick Save or Queue → Tag → Publish Patch → Git Commit
```

## 5. Entity Model

All entities validated by Zod schemas in `src/domain/schemas.ts`:

- **UnitSchema**: Core stats (health, damage, range, speed, cost), type, tier.
- **HeroSchema**: Extends Unit with `hero_class`, `abilities`, `ultimate_ability`.
- **ConsumableSchema**: Items/spells with `effect_type`, `value`, `duration`, `cooldown`, `rarity`.
- **ChangeSchema**: Tracks `target_id`, `field`, `old`, `new`, plus optional `tags`.
- **PatchSchema**: Versioned bundle of Changes with `title`, `type`, `date`, `tags`.

## 6. Data Directory

The server reads/writes a single directory defined by `DATA_DIR` in `.env`.
Change the path, restart, done. No modes.

| Path                                  | Typical Use                         |
| ------------------------------------- | ----------------------------------- |
| `../spellcasters-community-api/data/` | Your fork's real data               |
| `./mock_data/`                        | Safe sandbox for testing / dev work |

## 7. Security

- **Authentication**: None (localhost only, bound to `127.0.0.1`).
- Run via `npm run dev:all`.
