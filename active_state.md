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

**Phase:** Phase 14: v1.0.5 Released
**Focus:** Released | Code Modernization, Editor Refactoring, Type Safety ✅
**Test Coverage:** 415 Tests Passing (44 files, Verified)

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
- [x] Refactoring Audit #3: Full codebase audit. Extracted `ImportService` from `DataService` (365→210 lines). 115/115 tests.
- [x] Delta-Only Save Fix: `useDiffLogic` now computes user-changed fields only, applies delta to raw disk data. Prevents `normalizeHero` from rewriting `class`→`hero_class` or abilities Object→Array on save. 5 regression tests + audit script. 182/182 tests.
- [x] Data Shape Protection: `HeroSchema` fixed to accept both Array and Object abilities. `class` field added to schema. 154 shape-preservation tests covering all 35 mock files. 336/336 total tests.
- [x] Backend Save Guard: `dataService.saveData` now reads existing file before writing and merges back any missing keys. Prevents silent field loss regardless of frontend behavior. 336/336 tests.
- [x] Queue Revert: Removing items from the patch queue now reverts entity data on disk to its original state. `revertChange` helper in `QueueService`. 4 new unit tests (177 total).
- [x] Save/Queue Guard: Save and Queue buttons disabled when no user changes (`!isDirty && !isNew && !isRestored`). 5 new EditorToolbar tests. 343/343 tests.
- [x] Test Audit #2 (/test-audit): Grade A- (up from B+). 344/344 tests. Quick fixes: split compound Middleware test (7→8), jsdom `environmentMatchGlobs`.
- [x] Cleanup-9: Stale TODO removed (`dataService.ts`), README test count updated (173→344). TSC clean, lint 0 errors, 344/344 tests. `.env.example` verified.
- [x] Frontend Data Shape Safety Audit: Fixed 7 unsafe `.map()`/`.filter()`/`Object.entries()` calls across 5 files (`HeroAbilitiesPanel`, `PreviewDetailPage`, `HistoryGrid`, `DiffCard`, `usePatchQueue`). All now use `Array.isArray` guards. 343/344 tests (1 pre-existing flaky integration test).
- [x] Data Integrity Safeguards: Created `src/lib/guards.ts` (`safeArray`, `safeObject`). Refactored 6 files to use centralized guards. Added API response validation in client `DataService.getAll/getBulk`. 344/344 tests.
- [x] Server-Side `last_modified`: `dataService.saveData` now stamps `last_modified` ISO timestamp on every single-entity save (matching existing `saveBatch` behavior). TSC clean, 11/11 DataService tests pass.
- [x] Cleanup-10 (cleanup-5): Fixed 5 build errors (`HeroAbilitiesPanel` safeArray generic, `HistoryGrid` state cast, `vite.config` ts-ignore, `AppSidebar.test` mock data, `TableEditor.test` import path). Build passes, 344/344 tests (1 pre-existing flaky), lint 0 errors, no debug artifacts.
- [x] Publisher Redesign (Phase 1-3): Removed `balance_direction` field + `balance_index.json`. Paginated changelog (`changelog_page_N.json` + `changelog_index.json`). `publishIfNeeded()` now triggers on save/delete/commit. Community-API schemas updated. 345/345 tests.
- [x] SpellcastersDB Migration (Phase 4): Updated types/schemas/service for paginated changelog API. Removed all balance_index/PatchType badge code. Added `InspectorHistory` (most recent patch in inspector), `PatchHistorySection` sort/filter controls, `useEntityHistory` hook. Rewrote 3 test files. Zero stale references.\r\n- [x] Slim Commit Pipeline: `commitPatch` now slims queue changes (full→diffs) before writing to `patches.json`. Extracted `buildSlimChange` to `server/utils/slimChange.ts`. Fixed `last_modified` timing (stamp before diff). Fixed `vite.config.ts` lint. 345/345 tests, TSC clean, lint 0 errors.

- [x] Data Pipeline Audit & Fixes: Delete patches now use `buildSlimChange` (consistent slim diffs). Batch saves pass real `oldData` for actual diffs (was hollow). Standard save reads disk once instead of twice. TSC clean, 345 tests.
- [x] Live Asset Path Fix: `ASSETS_DIR` now resolves dynamically to support both mock (nested) and live (sibling) folder structures. Injected `assetsDir` into request context. 345/345 tests.
- [x] Mock Data Restructure: Moved content to `mock_data/data` and `mock_data/assets` (sibling). Aligned mock environment with live repo structure. Server logic simplified to always use sibling assets. 345/345 tests.
- [x] Strict Schema Alignment (Phase 11): Editor fields/types now match community API schemas exactly. Removed phantom fields (`tier`, `cost`, `rarity`). Added conformance tests.
- [x] Schema Conformance Test: Added `SchemaConformance.test.ts` to recursively verify Zod vs JSON schema parity.
- [x] Ordered JSON Output: Created `sortKeys` utility in `server/utils/jsonUtils.ts`. Integrated into `DataService` and `PatchService`. All entity and patch files now have deterministic key order (`$schema`→`id`→`name`→alpha→`last_modified`→`changelog`). 6 unit tests. TSC clean.
- [x] Test Suite Cleanup: Fixed 8 pre-existing test failures (path errors, missing imports, schema drift, flaky Windows file locks). Deleted orphaned `changelog_trim.test.ts`. **43/43 files, 394/394 tests green.**
- [x] Publisher Commit Integration: `publish()`/`publishIfNeeded()` now return written file paths. All 3 git commit flows (`commitPatch`, `quickSave`, `rollbackPatch`) stage changelog/timeline files. Fixed double `.json.json` timeline extension. 3 new regression tests. **43/43 files, 397/397 tests.**
- [x] Sync Script Safety: Fixed `sync.ts` to properly preserve `patches.json`, `audit.jsonl`, stringently avoid copying live API dirty states during normal syncs, and clear queues and patches only on `--clean`. Added AppSidebar UI tooltip clarification. Passed TSC build.
- [x] Mobile Responsive Layout: 8 files updated (CSS-only). PreviewPanel full-screen overlay, TableEditor single-col, HistoryGrid wrapped toolbar, compact AppHeader, stacked ScribePanel dialog. 397/397 tests, TSC clean.
- [x] Network Access: Updated `vite.config.ts` (host: true) and `server/index.ts` (listen 0.0.0.0) to allow local network connections. Server now logs LAN IP on startup.
- [x] Tooling: Installed dependency-cruiser for dependency analysis & visualization.

### Planned

- [x] Add backend integration tests for TYPE GUARD type-mismatch scenarios (guard + report)

### Ready for Release 🚀

- [x] Manual smoke test: Quick Fix, Patch Publish, Entity Create flows (QA Guide created)
- [x] Environment Tidy: Audited configs, dependencies, secrets. Removed temporary build/lint artifacts.
- [x] UI Wiring Audit: Verified all buttons/workflows. Added missing feedback to `DiffCard`. Cleaned up orphaned dialogs.
- [x] Final Cleanup (Release Polish): Removed stale `scripts/`, `dist/`. Fixed all lint errors (strict mode). Updated codebase patterns.
- [x] Final Audit (/cleanup-5): Passed (Lint clean, Tests passing, Build verified). Regressions in DataService fixed.
- [x] Dirty State Fix: Reverting changes now correctly clears "unsaved changes" warning (replaced strict equality with deep comparison in `useEditorForm`).
- [x] Test Audit (/test-audit): Grade B+. 2 critical (setTimeout flakiness, misplaced test), 10 coverage gaps (zero frontend component tests, 5 untested services/hooks), 4 cleanup items. Remediation plan produced.
- [x] Test Remediation Phase 1: Stabilization complete. Fixed flakiness (fake timers), moved FileService.test.ts to integration, removed @ts-ignore. 16/16 tests passing.
- [x] Test Remediation Phase 2: Backend coverage complete. Added DevController (8), ImportService (11), PublisherService (8) = 27 new tests. Suite total: 152 passing.
- [x] Test Remediation Phase 3: Frontend logic complete. Added useEntityMutation (5), useEditorActions (5), useEntitySelection (6) = 16 new tests. Suite total: 168 passing.
- [x] Test Remediation Phase 4: Frontend smoke tests complete. Added TableEditor (2) and AppSidebar (3). Suite total: 173 passing. Mission Accomplished.
- [x] Test Infra: Added `@testing-library/react`, `jsdom` testing dependencies. Created `src/hooks/useEditorForm.test.tsx` regression suite.
- [x] Deployment Verification (v1.0.3): TSC clean, Lint clean, 173/173 tests, secrets scan clear, CHANGELOG updated, CI branch fixed.
- [x] HeroAbilitiesPanel Optimization: Refactored to remove top-level useWatch, extracted memoized AbilityItem, added regression test. Performance bottleneck resolved.
- [x] Patch Manager Diff Fix: `JsonDiff.tsx` now displays inner property paths (e.g., `cooldown:`) for array-type diffs (`kind: 'A'`) from slim patches. TSC clean.
- [x] Hero Abilities Save Fix: Backend TYPE GUARD in `dataService.ts` was reverting `object → array` normalization (e.g., legacy abilities), silently discarding user edits. Fixed to allow known normalization. TSC clean, 4/4 DataService tests.
- [x] Slim Patch Normalization: `buildSlimChange` in `slimChange.ts` now normalizes legacy Object abilities → Array via `normalizeForDiff` before `deep-diff`. Prevents bloated patches recording entire abilities list. 3 regression tests. TSC clean.
- [x] Entity Changelog Optimization: `dataService.ts` now trims the per-file `changelog` array to the last 5 entries on save. Full history is preserved in `patches.json`, preventing unbounded growth of entity files. Verified with unit test.
- [x] MechanicsPanel Comprehensive Update: Added `waves`, `interval`, `capture_speed_modifier`, `stagger_modifier`, `pierce`, `auto_capture_altars` scalar fields and `bonus_damage` array editor. Tests: 4→8. 401/401 tests, TSC clean.
- [x] HeroAbilitiesPanel Combat Fields: Added `damage`, `duration`, `charges` numeric inputs and collapsible Mechanics section (`cleave` toggle + dynamic `features` list) to each ability card. Fixes Scribe's missing primary damage/knockback/cleave. 401/401 tests, TSC clean.
- [x] Form Dirty State Fix: `normalizeHero` now initializes `mechanics: { features: [] }` on every ability so form defaults match `useFieldArray` render state. `denormalizeAbilities` strips empty `mechanics.features` and empty `mechanics` to prevent normalization artifacts leaking to disk. Fixes false dirty on Fire Elementalist open and phantom `features: []` mutation on Iron Sorcerer edits. 401/401 tests, TSC clean.
- [x] Cleanup-11 (cleanup-5): Final audit passed (401 tests, TSC clean, lint 0 errors). Verified form dirty state fixes. README verified.
- [x] Modernization Audit #4: Generated modernization report focusing on God Objects (ScribePanel), old Promise syntax (.then), and outstanding loose typings (any).
- [x] Phase 1 Execution (Type Safety & Syntax): Converted `usePatchQueue`, `useEntityData`, `useAppData` to `async/await`. Replaced `any` with strict typing in `diff-utils.ts`, `useEditorActions`, and `useEntitySelection`. 401 tests passed, TSC clean.
- [x] Phase 2 Execution (ScribePanel Decomposition): Extracted queue and publisher logic into `ScribeQueueView.tsx` and refactored `ScribePanel.tsx` from 417 lines into a thin 70-line orchestrator. TabBar DOM placement preserved for mobile-responsive CSS. 401 tests passed, TSC/Lint clean.
- [x] Phase 3 Execution (Normalization Consolidation): Centralized inline shape translation logic from `editorConfig.ts` and `diff-utils.ts` into a unified `abilityTransformer.ts` to prevent shotgun surgery bugs. 154 shape-preservation tests cleanly passed ensuring 1:1 save fidelity.
- [x] Consolidated Data Path: Merged `useEntityMutation` + `useDiffLogic` into single `useDataMutation` hook.
- [x] Phase 5: Eliminated `no-explicit-any` suppressions (48 instances across 12 files removed).
- [x] Editor Refactoring: Migrated 5 panels to `useFormContext`, extracted `AbilityItem`/`AbilityFeatures` into `abilities/` subfolder. Removed unused props/imports. 415/415 tests, TSC clean, lint 0 errors.
- [x] Release v1.0.5: CHANGELOG, version bump, git tag.
