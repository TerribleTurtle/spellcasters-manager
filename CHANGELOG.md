# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-02-15

### Added

- **Safety:** Added "Delete" functionality for Units with confirmation dialogs.
- **Visuals:** Added category badges to DiffCards in Patch Manager/History.
- **Visuals:** Added "Ghost" icon for empty states in Entity List.
- **UX:** Added sliding pill animation to Studio view switcher.
- **UX:** Added slide-in animation for mobile sidebar.
- **UX:** Added `Loader2` spinners for loading states.
- **Accessibility:** Added global focus rings to interactive elements.
- **Assets:** Added skeleton loading state to Asset Picker.

### Changed

- **Renaming:** "The Scribe" is formally renamed to "Patch Manager".
- **Styling:** Migrated all hardcoded colors to semantic tokens (`success`, `info`, `destructive`, `env-dev`, `env-live`).
- **Components:** Replaced raw HTML `<select>` and `<button>` with Shadcn UI components.
- **Mobile:** Fixed `BulkEditor` table horizontal scrolling on mobile devices.

### Fixed

- **Build:** Resolved duplicate IIFE in `ForgePage.tsx`.
- **Build:** Fixed missing closing tags in `AppSidebar.tsx`.
- **Build:** Fixed `target_id` type mismatches in Editors.
- **Code:** Sanitized `console.log` usage and removed unused imports.

## [Unreleased] - Phases 2–7 (Complete)

### Added

- **Features:** Live Preview Mock with Archive Card & Detail Page views.
- **Features:** "Silent Save" (Ctrl+S) vs "Save + Tag" (Ctrl+Shift+S) workflow.
- **UI:** New `TabBar` component used across all editors.
- **UI:** Category badges in Patch Manager.
- **UI:** Compact 2-column layout for editor fields.

### Changed

- **Refactor:** Unified all builders into `HeroEditor`, `UnitEditor`, `ConsumableEditor`.
- **Refactor:** Removed `react-dropzone` in favor of native file input.
- **Logic:** "Building" type units now sort correctly as Structures.
- **Performance:** Optimized Field visibility logic.
