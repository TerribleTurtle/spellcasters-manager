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

### Live Preview

- Click the **Eye icon** in the Studio toolbar to open a **Live Preview** panel on the right side.
- This shows how the unit will appear on SpellcastersDB — both as an **Archive Card** and a **Detail Page**. The preview updates in real-time as you edit fields.

### Deleting an Entity

1. Open the entity.
2. Click the **Delete** button and confirm.

### Mechanics (Creatures)

- **Damage Modifiers**: Creatures can have special damage multipliers against specific target types (e.g. x2.0 vs Buildings).
- Use the **Mechanics** panel in the editor to add these modifiers.

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

- **Switch Data Source**: To change data directories, update the `DATA_DIR` in your `.env` file and restart the server.
- **Syncing Data**: You can use the Terminal to sync data between environments:
  - `npm run sync-data`: Merge live data into dev (preserves your local queue).
  - `npm run sync-data:clean`: Clean reset from live data (auto-backs up dev data first).

---

## 6. Troubleshooting

- **Red dot in header**: Backend server not running. Start with `npm run server`.
- **File Upload Error**: Images must be under 5MB. Files larger than this will be rejected by the server.
