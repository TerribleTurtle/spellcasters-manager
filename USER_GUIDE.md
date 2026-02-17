# The Grimoire: User Guide

## 1. Getting Started

1. Run `npm install` to install dependencies.
2. Start the application:
   ```bash
   npm run dev:all
   ```
   This starts the React frontend (port 5173) and Express backend (port 3001).

### The Interface

- **Sidebar**: Browse and search entities by category (Heroes, Creatures, Buildings, Spells, Consumables).
- **Studio**: The editor area — select an entity to edit its fields.
- **Patch Manager**: Review queued changes, tag them, and publish patches.
- **Header**: Shows system health and version info.

---

## 2. Editing Entities

### Creating a New Entity

1. Click the **+** button in the sidebar.
2. Fill in the required fields (Name is mandatory).
3. **Save** (`Ctrl+S`) to create the file on disk.

### Editing an Existing Entity

1. Select an entity from the sidebar.
2. Modify fields in the **Studio**.
3. **Save** (`Ctrl+S`) — writes the JSON file to disk. An automatic audit entry is recorded in `patches.json`.
4. **Queue** — stages the change for batching into a larger patch release.

### Deleting an Entity

1. Open the entity.
2. Click the **Delete** button and confirm.

---

## 3. Patch Workflow

1. **Make changes** to one or more entities.
2. **Review Queue** — go to the Patch Manager tab to see pending changes as DiffCards.
3. **Tag changes** — add tags like `balance`, `fix`, or `rework`.
4. **Commit Patch** — enter a Title, select a Type (Patch/Hotfix/Content), and publish.
   - This writes to `patches.json` and creates a git commit.

### Patch History

- Switch to the **History** tab to view past patches.
- **Rollback**: Click the rollback icon on a patch to create a reverting patch.

---

## 4. Keyboard Shortcuts

| Shortcut   | Action                          |
| ---------- | ------------------------------- |
| **Ctrl+S** | Save                            |
| **Escape** | Clear selection / Close dialogs |

---

## 5. Data Management

- **Switch Data Source**: Use the Data Path Switcher in the sidebar to change data directories.
  - **Switch**: Point to a different `DATA_DIR`.
  - **Sync**: Merge live data into dev (preserves your queue).
  - **Wipe & Copy**: Clean reset from live data (auto-backs up dev data first).

---

## 6. Troubleshooting

- **Red dot in header**: Backend server not running. Start with `npm run server`.
- **File Upload Error**: Images must be under 5MB. Files larger than this will be rejected by the server.
