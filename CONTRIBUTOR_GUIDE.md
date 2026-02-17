# 🧙 The Grimoire: Contributor's Guide

> **No coding experience required.** This guide walks you through contributing to the Spellcasters Community API using **The Grimoire** — a visual editor that handles validation, diffing, and git commits for you.

---

## What You'll Need

You need two free programs. Neither requires any technical knowledge to install.

| Program            | Why                 | Download                                                     |
| ------------------ | ------------------- | ------------------------------------------------------------ |
| **Node.js** (v18+) | Runs The Grimoire   | [nodejs.org](https://nodejs.org/) — click the **LTS** button |
| **Git**            | Tracks your changes | [git-scm.com](https://git-scm.com/) — click **Download**     |

> [!TIP]
> During the Git installer, you can accept all defaults. Just keep clicking **Next**.

You also need a free **GitHub account**. Sign up at [github.com](https://github.com/signup) if you don't have one.

---

## Step 1: Fork the API

A "fork" creates your own copy of the community database on GitHub. You'll make changes to your copy, then submit them for review.

1. Go to **[github.com/TerribleTurtle/spellcasters-community-api](https://github.com/TerribleTurtle/spellcasters-community-api)**
2. Click the **Fork** button (top right)
3. On the next page, click **Create fork**
4. You now have your own copy at `github.com/YOUR-USERNAME/spellcasters-community-api`

---

## Step 2: Set Up Your Workspace

Open a terminal:

- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Mac**: Open **Terminal** from Applications → Utilities

Copy and paste these commands one at a time, pressing Enter after each:

```bash
mkdir spellcasters-workspace
cd spellcasters-workspace
```

### Clone your fork of the API

Replace `YOUR-USERNAME` with your actual GitHub username:

```bash
git clone https://github.com/YOUR-USERNAME/spellcasters-community-api.git
```

### Clone The Grimoire

```bash
git clone https://github.com/TerribleTurtle/spellcasters-manager.git
```

### Install The Grimoire

```bash
cd spellcasters-manager
npm install
```

> [!NOTE]
> `npm install` downloads all the dependencies. It may take a minute or two. You only need to do this once.

Your folder structure should look like this:

```
spellcasters-workspace/
├── spellcasters-community-api/   ← Your fork (the data)
└── spellcasters-manager/         ← The Grimoire (the tool)
```

---

## Step 3: Configure The Grimoire

The Grimoire needs to know where your fork's data lives. Inside the `spellcasters-manager` folder, create a file called `.env`:

**Windows (cmd):**

```cmd
echo DEV_DATA_DIR=./mock_data > .env
echo LIVE_DATA_DIR=../spellcasters-community-api/data >> .env
```

**Mac / Linux:**

```bash
echo 'DEV_DATA_DIR=./mock_data' > .env
echo 'LIVE_DATA_DIR=../spellcasters-community-api/data' >> .env
```

---

## Step 4: Start The Grimoire

From inside the `spellcasters-manager` folder, run:

```bash
npm run dev:all
```

You'll see some output in the terminal. After a few seconds, open your browser and go to:

**[http://localhost:5173](http://localhost:5173)**

🎉 **You're in!** You should see the Grimoire interface with a sidebar listing categories.

> [!IMPORTANT]
> Keep the terminal open while using The Grimoire. To stop it later, press `Ctrl + C` in the terminal.

---

## Step 5: Switch to LIVE Mode

When the app first opens, you're in **DEV Mode** (blue badge in the header). This is a safe sandbox for practice.

When you're ready to make real changes:

1. Click the **DEV** badge in the top header
2. Switch to **LIVE**
3. The theme turns **red** as a reminder — you're now editing the real API data in your fork

> [!TIP]
> Practice in DEV mode first! You can freely experiment without affecting your fork.

---

## Step 6: Make a Change

### Editing an Existing Entity (Most Common)

1. Use the **sidebar** to pick a category (e.g., **Creatures**)
2. Click on the entity you want to edit (e.g., a unit)
3. The **Studio** opens with a form — update the value you want to change (damage, health, etc.)
4. Press **Ctrl + Shift + S** (Save + Tag)
   - Optionally type a reason, like "Buffed health from 100 to 120"
   - This saves the file AND creates a tracked change entry

### Adding a New Entity

1. Click the **+** button at the top of the sidebar
2. Fill in the required fields (**Name** is mandatory)
3. To add an image: use the image upload field in the editor
   - Images must be under **5 MB**
4. Press **Ctrl + Shift + S** to save

---

## Step 7: Review Your Changes

1. Switch to the **Patch Manager** tab (the scroll icon)
2. You'll see **DiffCards** — visual summaries of what you changed
   - Each card shows the entity name, which fields changed, and the old → new values
3. Add **tags** if needed (e.g., `balance`, `fix`, `new-unit`)
4. Remove any changes you don't want to submit

---

## Step 8: Publish Your Patch

1. Click **Create Patch** at the bottom of the Patch Manager
2. Fill in the details:
   - **Version**: A version number (e.g., `0.5.1`)
   - **Type**: Pick one — `balance`, `content`, `fix`, `hotfix`, or `rule`
   - **Title**: Brief summary (e.g., "Archer damage buff")
   - **Tags**: Optional keywords
3. Click **Publish Patch**

This bundles your changes, writes them to `patches.json`, and creates a **git commit** automatically.

---

## Step 9: Push to GitHub

Go back to your terminal. Press `Ctrl + C` to stop The Grimoire if you're done editing, then:

```bash
cd ../spellcasters-community-api
git push
```

> [!NOTE]
> If this is your first time pushing, Git may ask you to log in. Follow the prompts — it will open a browser window to authenticate with GitHub.

---

## Step 10: Open a Pull Request

1. Go to **your fork** on GitHub: `github.com/YOUR-USERNAME/spellcasters-community-api`
2. You'll see a banner: **"This branch is X commits ahead"** — click **Contribute** → **Open pull request**
3. Add a title and description explaining your changes
4. Click **Create pull request**

A maintainer will review your changes and merge them if everything looks good. 🎉

---

## Quick Reference

| Action                  | How                           |
| ----------------------- | ----------------------------- |
| Save (no tracking)      | `Ctrl + S`                    |
| Save + Tag (tracked)    | `Ctrl + Shift + S`            |
| Close dialog / deselect | `Escape`                      |
| Switch DEV ↔ LIVE       | Click the badge in the header |
| Stop The Grimoire       | `Ctrl + C` in the terminal    |

---

## Troubleshooting

| Problem                             | Solution                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| **Red dot in header**               | The backend isn't running. Make sure you ran `npm run dev:all` (not just `npm run dev`) |
| **"Connection refused" in browser** | Wait 5–10 seconds after running `npm run dev:all`, then refresh                         |
| **Can't push to GitHub**            | Make sure you cloned **your fork**, not the original repo                               |
| **Image upload fails**              | Images must be under 5 MB                                                               |
| **Data looks wrong after editing**  | Switch to DEV mode and use `Reset Data` in the sidebar footer to restore defaults       |

---

## Updating Your Fork

Before starting new work, sync your fork with the latest data:

1. Go to your fork on GitHub
2. Click **Sync fork** → **Update branch**
3. In your terminal, from the `spellcasters-community-api` folder:

```bash
git pull
```

Then start The Grimoire and continue editing!
