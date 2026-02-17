# Changelog

All notable changes to this project will be documented in this file.

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
