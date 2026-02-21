# Contributing to Spellcasters Manager

Thank you for your interest in contributing to the **Spellcasters Manager**!

## Getting Started

1.  **Fork** the repository and clone it locally.
2.  **Install dependencies**: `npm install`
3.  **Start development server**: `npm run dev:all` (Frontend: port 5173, Backend: port 3001)

## Data Architecture

This project reads and writes all JSON data and assets to the directory specified by your `DATA_DIR` environment variable. By default, this is your `../spellcasters-community-api/data` fork, but you can set it to `./mock_data` to work in a local sandbox without affecting your fork.

## Project Structure

- `src/`: Frontend React application (EntityList, ForgePage, ScribePanel).
- `server/`: Express backend for file system operations.
- `tests/unit/`: Vitest unit tests for services and controllers.

## Testing

We use **Vitest** for all tests.

- Run all tests: `npm test`
- Run in watch mode: `npm run test:watch`
- Run specific test: `npx vitest tests/unit/DataService.test.ts`

### Test Location Convention

| Location                      | Environment | Purpose                                                     |
| ----------------------------- | ----------- | ----------------------------------------------------------- |
| `src/**/*.test.tsx`           | `jsdom`     | Client-side component & hook tests                          |
| `tests/unit/*.test.ts`        | `node`      | Server-side unit tests (services, controllers, utils)       |
| `tests/integration/*.test.ts` | `node`      | Server-side integration tests (real file I/O via `tempEnv`) |
| `tests/helpers/`              | `node`      | Test environment and mocking utilities                      |
| `tests/audit/`                | `node`      | Bulk schema/data validations                                |
| `tests/repro/`                | `node`      | Tests for specific bug reproduction                         |

> **Do not** move `.tsx` tests from `src/` to `tests/` — the Vitest `environmentMatchGlobs` in `vite.config.ts` routes them to `jsdom` based on their `src/` path.

### Integration Test Helpers

For tests that need real file system operations (no mocks), use the `tempEnv` helper:

```ts
import { createTempEnv, TempEnv } from "../helpers/tempEnv";

let env: TempEnv;
beforeEach(async () => {
  env = await createTempEnv();
});
afterEach(async () => {
  await env.cleanup();
});

// Seed fixtures
await env.seedFile("units", "archer.json", { id: "u1", name: "Archer" });
```

**Requirement:** All new features must include tests. Ensure `npm test` passes before submitting a PR.

## Code Style

- Use **TypeScript** for all new logic.
- Follow the existing **folder-by-feature** structure in `src/components`.
- Use **TailwindCSS** for styling (avoid inline styles).

## Submitting Changes

1.  Create a feature branch: `git checkout -b feature/my-cool-feature`
2.  Commit your changes: `git commit -m "feat: Add cool feature"`
3.  Push to your fork: `git push origin feature/my-cool-feature`
4.  Open a **Pull Request**.
