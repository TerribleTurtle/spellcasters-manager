# The Grimoire: Spellcasters Manager

A local data management dashboard for **Spellcasters Chronicles**.

## Features

- **The Grimoire** (Unit List): Rich, searchable unit directory with rapid filtering and status indicators.
- **The Forge** (Unit Editor): Create and modify game units with a premium, schema-validated form.
  - **Visual Stats**: Edit Health, Damage, Range, and Speed with game-like stat cards.
  - **Asset Manager**: Drag-and-drop unit icons with automatic file handling.
- **Unit Builder**: Dedicated workflow to create new units from scratch with auto-generated filenames.
- **The Scribe** (Patch Notes): Automatically detect changes in your data (via Git) and generate structured patch notes.
  - **Diff View**: Visual "Before -> After" comparison for every changed field.
  - **Dashboard**: Track your draft changes in a dedicated feed.
- **Multi-Environment**: Switch between **DEV** (Sandbox) and **LIVE** (Production API) data sources with a single click.

## Architecture

This project is built as a monorepo-style application with a shared domain core:

- **Frontend (`src/`)**: React + Vite + TailwindCSS v4.
  - **Styles**: Custom "Grimoire" dark theme with glassmorphism and CSS Grid layout.
  - **Shared Domain (`src/domain/`)**: Zod schemas acting as the single source of truth.
  - **Services (`src/services/`)**: Typed services (`UnitService`, `PatchService`) wrapping `HttpClient`.
  - **Components (`src/components/`)**: Composed UI with a focus on presentational panels.
    - **Layout**: `AppSidebar`, `AppHeader`, `AppLayout` (Grid/Glass).
    - **Grimoire**: `UnitList`, `UnitListItem`.
    - **Editors**: `UnitEditor`, `UnitStatsPanel`, `UnitMetaPanel`.
    - **Scribe**: `ScribePanel`, `DiffCard`.
- **Backend (`server/`)**: Express + Node.js.
  - **Strict Types (`server/types/`)**: TypeScript definitions for Express context.
  - **Controllers**: Validated endpoints using shared Zod schemas.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Git (must be installed and available in PATH)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/spellcasters-manager.git
    cd spellcasters-manager
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev:all
    ```
    This starts both the Vite frontend (http://localhost:5173) and the Express backend (http://localhost:3001).

## Usage

### Editing Mode (The Forge)

- Navigate to the **Unit Forge** tab.
- Select a unit from the sidebar (The Grimoire).
- Edit stats using the visual cards and click "Save Changes".
- **Blue Environment**: Edits save to `./data`.
- **Red Environment**: Edits save to `../spellcasters-community-api/data`.

### Creating a Patch (The Scribe)

1.  Make your changes in the Editor.
2.  Switch to the **The Scribe** tab.
3.  Review the "Change Feed" (visual diffs).
4.  Enter a Version Number and Title.
5.  Click **Publish Patch**.

## License

MIT
