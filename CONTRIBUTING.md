# Contributing to Spellcasters Manager

Thank you for your interest in contributing to the **Spellcasters Manager**!

## Getting Started

1.  **Fork** the repository and clone it locally.
2.  **Install dependencies**: `npm install`
3.  **Start development server**: `npm run dev:all` (Frontend: port 5173, Backend: port 3001)

## Data Architecture

This project uses a dual-mode data system:

- **DEV Mode (Blue)**: Reads/Writes to `./mock_data` (Local sandbox).
- **LIVE Mode (Red)**: Reads/Writes to `../spellcasters-community-api/data` (Production).

**Note:** Do not commit changes to `mock_data` unless you are intentionally updating the test fixtures.

## Project Structure

- `src/`: Frontend React application (EntityList, ForgePage, ScribePanel).
- `server/`: Express backend for file system operations.
- `tests/unit/`: Vitest unit tests for services and controllers.

## Testing

We use **Vitest** for unit testing.

- Run all tests: `npm test`
- Run specific test: `npx vitest tests/unit/UnitService.test.ts`

**Requirement:** All new features must include unit tests. Ensure `npm test` passes before submitting a PR.

## Code Style

- Use **TypeScript** for all new logic.
- Follow the existing **folder-by-feature** structure in `src/components`.
- Use **TailwindCSS** for styling (avoid inline styles).

## Submitting Changes

1.  Create a feature branch: `git checkout -b feature/my-cool-feature`
2.  Commit your changes: `git commit -m "feat: Add cool feature"`
3.  Push to your fork: `git push origin feature/my-cool-feature`
4.  Open a **Pull Request**.
