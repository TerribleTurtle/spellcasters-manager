# Changelog

All notable changes to this project will be documented in this file.

## [1.0.6] - 2026-02-20

### Changed

- **Refactoring Audit (7 items):** Full codebase cleanup pass.
  - Eliminated duplicate `pathUtils.ts` (server/src) — single canonical copy in `src/lib/`.
  - Removed dead `stripInternalFields` (shallow) from `server/utils/requestHelpers.ts` — all callers use recursive version from `src/domain/utils.ts`.
  - Removed `PatchService` pass-through methods (`readQueueSafe`, `enqueueEntityChange`) — callers now import `queueService` directly.
  - Consolidated `importService.ts` double-iteration into single-pass with inline change collection.
  - Split `server/index.ts` (193 lines) into `routes.ts`, `middleware.ts`, and `config/multer.ts` (~90 lines entry point).
  - Added RHF generic variance workaround comments to type casts.
- **Cleanup-5:** Final audit pass. Removed unused import, verified 0 ESLint errors baseline.
- **Docs:** Fixed stale `balance_index.json` reference in README Patch History API table.

## [1.0.5] - 2026-02-20

### Changed

- **Code Modernization (Phases 1–5):** Full codebase modernization arc.
  - Phase 1: Converted `usePatchQueue`, `useEntityData`, `useAppData` to `async/await`. Replaced `any` with strict typing in `diff-utils.ts`, `useEditorActions`, `useEntitySelection`.
  - Phase 2: Decomposed `ScribePanel` (417→70 lines) by extracting `ScribeQueueView.tsx`.
  - Phase 3: Centralized ability normalization into `abilityTransformer.ts` (eliminates shotgun surgery bugs).
  - Phase 4: Consolidated `useEntityMutation` + `useDiffLogic` into single `useDataMutation` hook.
  - Phase 5: Eliminated 48 `no-explicit-any` suppressions across 12 files.
- **Editor Component Refactoring:** Migrated 5 editor panels (`TableEditor`, `GenericEntityEditor`, `TagsPanel`, `UnitHeaderPanel`, `MechanicsPanel`) to `useFormContext` — eliminated prop drilling of `control`.
- **HeroAbilitiesPanel:** Extracted `AbilityItem` and `AbilityFeatures` into `src/components/editors/panels/abilities/`.
- **Test Count:** 397→415 tests passing (44 files).

### Fixed

- **Lint:** Removed unused props/imports from `MechanicsPanel`, `TagsPanel` after `useFormContext` migration. 0 errors baseline.

## [1.0.4] - 2026-02-18

### Added

- **Ordered JSON Output:** Deterministic key ordering for all entity and patch files (`$schema`→`id`→`name`→alpha→`last_modified`→`changelog`). `sortKeys` utility in `server/utils/jsonUtils.ts`.
- **Publisher Commit Integration:** `publish()`/`publishIfNeeded()` return written file paths. All git commit flows now stage changelog/timeline files.
- **Schema Alignment (Phase 11):** Editor fields/types now match community API schemas exactly. Removed phantom fields (`tier`, `cost`, `rarity`). Added conformance tests.
- **SpellcastersDB Migration:** Paginated changelog API, removed balance_index/PatchType code, added `InspectorHistory`, `PatchHistorySection`, `useEntityHistory` hook.
- **Data Pipeline Fixes:** Delete patches use slim diffs, batch saves pass real `oldData`, standard save reads disk once.
- **Live Asset Path Fix:** `ASSETS_DIR` resolves dynamically for both mock and live folder structures.
- **Mock Data Restructure:** Aligned mock environment with live repo structure (sibling `data`/`assets`).

### Fixed

- **Tests:** Fixed 8 pre-existing test failures (path errors, missing imports, schema drift, flaky Windows file locks). Deleted orphaned test. **43 files, 397 tests green.**
- **Publisher:** Fixed double `.json.json` timeline extension bug.
- **Lint:** Fixed 11 lint errors (eliminated `any` types, removed unused imports/vars) across 4 files. 0 errors baseline.
- **Entity Changelog Trim:** Per-file `changelog` array capped at 5 entries to prevent unbounded growth.
- **Slim Patch Normalization:** `buildSlimChange` normalizes legacy Object abilities → Array before diff.

### Changed

- **Slim Commit Pipeline:** `commitPatch` now slims queue changes (full→diffs) before writing to `patches.json`.
- **Test Count:** 344→397 tests passing.

## [1.0.3] - 2026-02-17

### Added

- **Tests:** Full test remediation — 173 tests passing (backend: DevController, ImportService, PublisherService; frontend: useEntityMutation, useEditorActions, useEntitySelection, TableEditor, AppSidebar).
- **Backend:** Extracted `ImportService` from `DataService` (365→210 lines).
- **Safety:** Dirty state tracking fix — reverting changes now correctly clears "unsaved changes" warning.

### Fixed

- **CI:** Fixed workflow branch mismatch (`main` → `master`).
- **Lint:** ESLint config now covers co-located `src/**/*.test.tsx` files.
- **UX:** Skip Diff toggle for faster patch queuing.
- **UX:** Entity duplication flow — fixed blank page, auto-category switch, identity field clearing.
- **Windows:** `devController.ts` uses `tsx.cmd` + `shell: true` for Windows compatibility.

### Changed

- **Audit Trail:** All save paths now write to `patches.json`. Removed Quick Save (3rd button).
- **Toolbar:** Simplified to Save + Queue only.
- **Refactoring:** `useEditorForm` deep comparison for dirty state detection.

## [1.0.2] - 2026-02-17

### Fixed

- **Deploy:** Resolved 27 TypeScript errors (strict type narrowing).
- **Tests:** Stabilized flaky backup integration test.
- **Code:** Removed dead "Quick Save" legacy code.
- **Docs:** Comprehensive update to `USER_GUIDE.md` and `.env.example`.

## [1.0.1] - 2026-02-16

### Fixed

- **Docs:** Corrected `README.md` to reflect that Live mode uses a **Green** theme (not Red).

## [1.0.0] - 2026-02-16

### Added

- **Safety:** Added "Delete" functionality for Units with confirmation dialogs.
- **Visuals:** Added category badges to DiffCards in Patch Manager/History.
- **Visuals:** Added "Ghost" icon for empty states in Entity List.
- **UX:** Added sliding pill animation to Studio view switcher.
- **UX:** Added slide-in animation for mobile sidebar.
- **UX:** Added `Loader2` spinners for loading states.
- **Accessibility:** Added global focus rings to interactive elements.
- **Assets:** Added skeleton loading state to Asset Picker.
- **Features:** Live Preview Mock with Archive Card & Detail Page views.
- **Features:** "Silent Save" (Ctrl+S) vs "Save + Tag" (Ctrl+Shift+S) workflow.
- **UI:** New `TabBar` component used across all editors.
- **UI:** Compact 2-column layout for editor fields.

### Changed

- **Renaming:** "The Scribe" is formally renamed to "Patch Manager".
- **Styling:** Migrated all hardcoded colors to semantic tokens (`success`, `info`, `destructive`, `env-dev`, `env-live`).
- **Components:** Replaced raw HTML `<select>` and `<button>` with Shadcn UI components.
- **Mobile:** Fixed `BulkEditor` table horizontal scrolling on mobile devices.
- **Refactor:** Unified all builders into `HeroEditor`, `UnitEditor`, `ConsumableEditor`.
- **Refactor:** Removed `react-dropzone` in favor of native file input.
- **Logic:** "Building" type units now sort correctly as Structures.
- **Performance:** Optimized Field visibility logic.

### Fixed

- **Build:** Resolved duplicate IIFE in `ForgePage.tsx`.
- **Build:** Fixed missing closing tags in `AppSidebar.tsx`.
- **Build:** Fixed `target_id` type mismatches in Editors.
- **Code:** Sanitized `console.log` usage and removed unused imports.

### Code Quality (v1.0.0 Hardening)

- **Strict Typing:** Eliminated `any` types across all core editors and components.
- **Validation:** Implemented robust Zod schema validation for all entity types.
- **Stability:** Fixed Fast Refresh warnings by isolating variants from component files.
- **Architecture:** Refactored `TableEditor` as a generic component for better type safety.
- **Build:** Verified clean build with `tsc` and Vite.

## [0.1.0] - 2026-02-15

### Initial Release

- Basic Studio, Patch Manager, and Sidebar functionality.
