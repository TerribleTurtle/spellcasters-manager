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

**Phase:** Phase 8: Release Readiness
**Focus:** Final Polish & Security Hardening
**Test Coverage:** 98 Tests Passing (100% Backend Unit/Integration/Security + Client Services)

## Sources of Truth

- **Project Definitions:** `project_definitions.md` (in Gemini brain)
- **Design Guidelines:** `docs/DESIGN.md`
- **Schemas:** `src/domain/schemas.ts` (Zod schemas)

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

### Planned

### Ready for Release 🚀

- [ ] Manual smoke test: Quick Fix, Patch Publish, Entity Create flows
- [ ] Deployment to staging/prod environment
