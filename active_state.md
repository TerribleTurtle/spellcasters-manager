# Active Project State

## Project Identity

**Name:** The Grimoire (Spellcasters Manager)
**Type:** Local-first operator tool (React/Vite Frontend + Node/Express Backend)
**Identity:** A wrench, not a dashboard. Fast, safe, invisible when things go right.

### The Three Jobs

1. **Quick Fix** — Open → change → save → done. Under 30 seconds.
2. **Patch Publish** — Batch changes → tag → publish versioned patch with git commit.
3. **Data Integrity** — Zod validates on save. Bad data never reaches the API.

## Current Status

**Phase:** Phase 10: Release Ready (v1.0.2)
**Focus:** Deployment & Maintenance
**Test Coverage:** 115 Tests Passing (100% Backend Unit/Integration/Security + Client Services)

## Sources of Truth

- **Project Definitions:** `project_definitions.md` (in Gemini brain)
- **Design Guidelines:** `docs/DESIGN.md`
- **Schemas:** `src/domain/schemas/` (Zod schemas — split into enums, Unit, Consumable, Patch modules)

## Naming Conventions

| UI Label          | Internal View Key | Component                       |
| ----------------- | ----------------- | ------------------------------- |
| Library (Sidebar) | `currentCategory` | `AppSidebar` → `EntityList`     |
| Studio            | `forge`           | `ForgePage`                     |
| Patch Manager     | `scribe`          | `ScribePanel` (Queue / History) |

## Task Board

### Done

- [x] Core feature set (v0.1.0) — Library, Studio, Patch Manager, Git integration
- [x] Schema-driven editor fields via `schemaToFields()`
- [x] Backend test suite: 77 tests covering Controllers, Services, Schemas, Integration
- [x] Documentation integrity audit
- [x] Project definitions established (Three Jobs, UX Principles, Scope boundaries)
- [x] Phase 1: Documentation alignment (DESIGN.md, README.md, USER_GUIDE.md)
- [x] Phase 2: Builder consolidation (deleted 3 builders, creation via editors)
- [x] Phase 3: TableEditor simplification (removed drift detection, Add Field dropdown)
- [x] Phase 4: Cleanup & verification (orphaned panels deleted, build clean, all tests pass)
- [x] Phase 5: Constraint cleanup (react-dropzone removed, UnsavedChangesDialog deleted, native file input)
- [x] Live Preview Mock (Collapsible side-panel with Archive Card & Detail Page views)
- [x] Phase 6: QoL enhancements (Silent Save, reason/notes, keyboard shortcuts, tier field ordering)
- [x] Phase 7: Editor UI Polish (Field visibility, 2-col layout, Headline constraints, Preview layout)
- [x] Project Assessment (CTO Scorecard: Professional Level)
- [x] Bug Fixes: Search filters, Image paths, False positive edits, Dropdown pre-fill
- [x] Feature Gap Analysis (4 empty-state MUST-HAVEs identified, 4 SHOULD-HAVEs, 2 backlog)
- [x] Release Polish: Implemented Zod client-side validation feedback (toast errors)
- [x] Release Polish: Refined History empty states (no data vs no matches)
- [x] Cleanup: Code hygiene audit passed (no console.logs/TODOs), README updated.
- [x] Data Flow Optimization: Atomic writes, Bulk loading (N+1→5 requests), Promise.allSettled error resilience
- [x] Security Audit: "Triton" scan passed, dependencies clean, no secrets leaked.
- [x] Security Hardening: Multer sanitization, importData guards, execFile implementation.
- [x] Scoped Git Commits: `commitPatch` now stages only the exact files modified, not the whole directory or repo.
- [x] Final Cleanup (cleanup-5): Lint 183→97 (remaining = UI lib patterns), removed unused imports/vars, ESLint test overrides, README verified.
- [x] Reset Dev Data: Backup before wipe, git state reset, live-data guards, patch_tags in history, git diff capture in patches.
- [x] Build Fix (Critical): Fixed `useCallback` runtime error in ScribePanel/HistoryGrid and `zodResolver` type mismatch in Editors.
- [x] Final Audit (/cleanup-5): Verified tests (98/98), fixed lint errors, updated README.md with new safety features.
- [x] Validation Limits: Number fields now show range hints (e.g. 1–5) and clamp logic on blur.
- [x] CONTRIBUTOR_GUIDE.md: Zero-to-PR beginner guide for community contributors (Node.js + Git only, no Python).
- [x] Save Metadata: `last_modified` now injected client-side before diff preview, visible to user before confirm.
- [x] Patch Merging: Overlapping changes for same entity/field now merge in queue (oldest old, newest new).
- [x] Env Cleanup: Removed DEV/LIVE mode concept. Single `DATA_DIR` env var — change path, restart, done.
- [x] Refactoring Audit: Modernization report generated — 3 critical bugs found, 20+ improvement items prioritized.
- [x] Phase 1-6: Code Modernization Executed — Critical bugs fixed, error handling standardized, dead code removed, `EntityListHash` refactored, types secured.
- [x] Cleanup-5: Final audit passed (101 tests, TSC clean, lint 62 baseline). README updated. Stale `mode` dep fixed.
- [x] Backend Service Extraction: `DataService` created, `dataController` reduced 320→113 lines.
- [x] Frontend Hook Decomposition: `useAppData` & `useEditorActions` split into query/mutation/util hooks.
- [x] Schema Organization: Monolithic `schemas.ts` split into `enums`, `Unit`, `Consumable`, `Patch` modules with barrel re-export.
- [x] Modernization Audit #2: Full codebase re-audit (40 files). Findings: PatchService god object, 42 `any` types, `handleOpenInEditor` complexity. 7 low / 3 medium / 2 high effort items identified. Overall: professional shape.
- [x] Cleanup-6: UI Audit — audited components/hooks, removed developer comments, removed obsolete Sync/Reset dialogs & service methods. Build verified.
- [x] Final Audit (cleanup-5): TSC clean, 103/103 tests, lint 39 baseline (all `no-explicit-any`), zero debug artifacts, README verified.
- [x] Data Path Switcher: UI widget in sidebar to Switch (live/mock), Sync (preserve queue), Wipe & Copy (clean). Backend `devController.ts` + 3 API endpoints.
- [x] Data Flow & Safety Audit: Proto-pollution guard, `ChangeSchema` validation on queue/patch/import, schema validation on `importData`. 103/103 tests.
- [x] Data Safety Hardening: Atomic queue backups, selective batch writes (dirty-check), pre-import safety backups, import-to-queue mode. 114/114 tests. README updated.
- [x] ScribePanel Metadata Sync: Removed stale merge logic that was overwriting server metadata with stale React state. Per-change tags/reasons now persist correctly through the full queue→commit flow.
- [x] Cleanup-7: Lint 42→36 — removed unused imports (`logger`, `originalWriteFile`), prefixed unused params, removed 3 useless catch clauses, fixed `useCallback` deps. TSC clean, 114/114 tests, zero debug artifacts.
- [x] Patch Audit Trail + Toolbar Simplification: All save paths write to `patches.json`. Removed Quick Save (3rd button), eliminated `skipPatch` and dead code. Toolbar: Save + Queue only. 116/116 tests, TSC clean.
- [x] Entity Duplication Fix: Standardized `target_id` to always use filename (not UUID). Fixed `useEntityMutation.ts`, `gitService.ts`, hardened `changeUtils.ts`. 114/114 tests, TSC clean.
- [ ] Consolidated Data Path: Merge `useEntityMutation` + `useDiffLogic` into a single `useDataMutation` hook.
- [x] Duplicate Entity Flow Fix: Fixed "Editor not available for all" — `handleDuplicate` now reads `_category` from entity data and switches category. Duped data forwards to editor, cancel clears state, identity fields cleared for fresh naming. Auto-opens new entity after save. 116/116 tests.
- [x] Windows Sync Fix: `devController.ts` — use `tsx.cmd` + `shell: true` on Windows so `execFile` can spawn the `.cmd` shim.
- [x] Deployment Fixes: Resolved 27 TSC errors (type narrowing on `unknown` values) across 10 files, stabilized flaky backup test. 115/115 tests, TSC clean.
- [x] Cleanup-8 (Docs): Documentation audit & fixes. `USER_GUIDE.md` rewritten (removed DEV/LIVE, Save+Tag). `README.md` workflow table corrected. `.env.example` completed. Dead `'quick'` save type removed from `SavePreviewDialog` + `useDiffLogic`. TSC clean, 115/115 tests, lint 0 errors.

### Planned

### Ready for Release 🚀

- [x] Manual smoke test: Quick Fix, Patch Publish, Entity Create flows (QA Guide created)
- [x] Environment Tidy: Audited configs, dependencies, secrets. Removed temporary build/lint artifacts.
- [x] UI Wiring Audit: Verified all buttons/workflows. Added missing feedback to `DiffCard`. Cleaned up orphaned dialogs.
- [x] Final Cleanup (Release Polish): Removed stale `scripts/`, `dist/`. Fixed all lint errors (strict mode). Updated codebase patterns.
- [x] Final Audit (/cleanup-5): Passed (Lint clean, Tests passing, Build verified). Regressions in DataService fixed.
- [ ] Deployment to staging/prod environment
