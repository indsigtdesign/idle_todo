# Project Specification: "Idle ToDo" – A Meditative Todo Idle Game

## 1. Project Overview

"Idle ToDo" is a meditative, idle-first todo app that functions as a game. It is designed to sit in a small window or a phone screen as a "focus companion." Unlike traditional idle games, everything pauses when the app is closed. It rewards presence and calm interaction rather than frantic clicking.

**Key Vibe:** Minimalist, "Productivity Porn," Lo-fi, tactile, and intentional.

---

## 2. Technical Stack

- **Framework:** React (Vite) or Next.js (Client-side only)
- **Styling:** Tailwind CSS (focus on whitespace, soft shadows, and muted palettes)
- **State Management:** React Context or Zustand
- **Persistence:** `localStorage` (save on every state change; no offline progress calculations needed)

---

## 3. Core Mechanics

### A. The "Pause" Philosophy

The game state is frozen when the tab is inactive or closed. Do not implement `Date.now() - lastLogin` logic. Progress only happens while the user has the app open.

### B. Currency System

**Dopamine (D)**

- Primary currency
- Earned by completing tasks
- Harder/rarer interaction types pay out more
- Spent on upgrades in the Specialisation Trees

**Habit Points (H)**

- Secondary currency, earned in discrete amounts — not a trickle
- Trigger: reaching a Dopamine milestone (e.g. every 100D) starts a countdown timer
- When the countdown reaches zero, the player earns one Habit Point
- Multiple milestones can queue multiple countdowns
- Habit Points are spent during Prestige to buy permanent Habits
- Everything stops when the app is closed — timers do not progress in the background

### C. Interaction Types

Tasks appear in the Inbox. Each task has a specific required interaction:

| Type              | Description                                            | Dopamine Payout |
| ----------------- | ------------------------------------------------------ | --------------- |
| Single Click      | Ticking a checkbox                                     | Low             |
| Double Click      | Confirming a priority                                  | Medium          |
| Long Click (Hold) | "Idle ToDo" — 2s hold with a circular progress overlay | High            |
| Click & Drag      | Filing a task by dragging to a "Done" zone             | Medium-High     |

---

## 4. Specialisation Trees

Upgrade cost scaling formula: `Cost = BaseCost × 1.15^Level`

Both trees depend on each other. A baseline investment in both is necessary even when specialising — a maxed Generation tree with no Completion drowns; a maxed Completion tree with no Generation starves.

### Generation Tree

Focused on queue volume, speed, and variety.

| Upgrade           | Description                                                                             | Max Levels |
| ----------------- | --------------------------------------------------------------------------------------- | ---------- |
| **Spawn Rate**    | Reduces cooldown on the manual Generate button                                          | Unlimited  |
| **Batch Spawn**   | Chance to generate multiple tasks at once; higher levels increase chance and batch size | Unlimited  |
| **Task Variety**  | Unlocks new interaction types entering the pool (Double Click → Long Click → Drag)      | 3 (fixed)  |
| **Auto Generate** | Tasks spawn automatically without pressing the button; upgradeable for speed            | Unlimited  |

### Completion Tree

Focused on processing speed and automation.

| Upgrade            | Description                                                                                                                                                | Max Levels               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **Click Speed**    | Reduces effort threshold on Single Click tasks                                                                                                             | Unlimited                |
| **Hold Reduction** | Shortens the duration required on Long Click tasks                                                                                                         | Unlimited                |
| **Auto Complete**  | Automatically handles task interactions — Single Click first, then Double Click, then Drag as levels increase. Requires corresponding Task Variety unlocks | 3 (tied to Task Variety) |
| **Chain Bonus**    | Completing tasks in quick succession multiplies Dopamine payout; higher levels extend the window and increase the multiplier                               | Unlimited                |

> **Key dependency:** Auto Complete can only handle interaction types that Task Variety has already unlocked. The trees are subtly linked even when specialising.

---

## 5. UI/UX Structure (Mobile-First / Sidebar Friendly)

### Header

- Dopamine counter (centered, prominent but not garish)
- Clean, minimal — looks like a real app header

### Inbox (Main Screen)

- Clean list of Task Cards with subtle fade-in entrance animations
- Each card shows the task name and a visual cue for its required interaction
- **Generate Button** — prominent but clean, at the bottom of the Inbox. Includes a radial cooldown visual.

### Footer Tab Bar

Three tabs: `[Inbox]` | `[Archive]` | `[Settings]`

- Tab icons act as the primary ambient UI element
- **Settings tab icon** has a badge that slowly fills as Habit Points accumulate
- The badge is the only progress indicator for Habit Points — it looks like a normal notification badge to anyone unfamiliar with the game
- No other progress rings or countdown UI cluttering the screen

### Archive Screen

Lifetime stats across all runs. Looks like a standard profile or activity screen.

- Total tasks completed
- Total dopamine earned (lifetime)
- Total prestige runs
- Longest run duration
- Favourite interaction type (most completed)
- Favourite specialisation (most invested tree across runs)
- Habits unlocked (X of Y total discovered)

### Settings Screen

- Standard app settings appearance
- **"Archive Everything"** — the Prestige button, styled to look like a mundane "Reset" or "Clear Data" option
- Habit selection UI appears here after prestige is triggered
- Habits purchased with accumulated Habit Points

---

## 6. Prestige — "Archive Everything"

- Resets all progress: Dopamine, upgrades, task queue, run stats
- Player spends accumulated Habit Points on permanent Habits
- One or two Habits carried forward per prestige
- New Habits unlock by experiencing specific things in a run (e.g. "Inbox Zero" only appears after fully clearing the queue once)
- Over many runs the Habit list grows, building a portrait of the player's playstyle

---

## 7. Habits System

Habits are permanent passive bonuses carried across prestiges. They are purchased with Habit Points at the moment of prestige.

### Starting Advantages

Shortcut the early game.

| Habit             | Effect                                    | Unlock Condition     |
| ----------------- | ----------------------------------------- | -------------------- |
| **Early Riser**   | Generation tree starts partially unlocked | Available from run 1 |
| **Muscle Memory** | First automation comes at half cost       | Available from run 1 |
| **Routine**       | Generate button cooldown starts reduced   | Available from run 1 |

### Amplifiers

Change how you earn Dopamine.

| Habit          | Effect                                               | Unlock Condition                            |
| -------------- | ---------------------------------------------------- | ------------------------------------------- |
| **Flow State** | Dopamine payout doubled during chains of completions | Complete a chain of 5+ tasks in one run     |
| **Hyperfocus** | Long Click tasks pay out significantly more          | Complete 50 Long Click tasks in one run     |
| **Inbox Zero** | Bonus Dopamine burst when queue is fully cleared     | Clear the full queue at least once in a run |

### Meta / Prestige

Affect the prestige loop itself.

| Habit           | Effect                                              | Unlock Condition         |
| --------------- | --------------------------------------------------- | ------------------------ |
| **Patience**    | Habit Point countdown is shorter                    | Available from run 1     |
| **Compounding** | Each prestige slightly multiplies Dopamine gain     | Complete 2 prestige runs |
| **Journaling**  | Archive screen reveals additional detail about runs | Available from run 1     |

---

## 8. Design Guidelines

- **Colors:** Slate-50 background, Slate-900 text, Indigo-500 for primary actions
- **Feedback:** Haptic feedback on mobile, soft sounds for task completion. No harsh alert sounds.
- **Transitions:** All UI changes at 200ms–300ms
- **Tone:** Everything should look like a real, slightly boring productivity app. The game lives underneath.

---

## 9. Implementation Roadmap (MVP)

### Phase 1 — The Loop

- Generate Task button with 3s cooldown and radial cooldown visual
- Single Click tasks granting 1 Dopamine
- Basic three-tab layout with Tailwind
- localStorage persistence

### Phase 2 — Scaling

- Generation tree upgrades (Spawn Rate, Batch Spawn)
- Long Click tasks with 2s hold and circular progress overlay
- Chain Bonus upgrade
- Dopamine milestone tracking

### Phase 3 — The Habit System

- Habit Point countdown timers triggered by Dopamine milestones
- Settings tab badge filling as Habit Points accumulate
- "Archive Everything" prestige flow with Habit selection
- First three Habits: Early Riser, Muscle Memory, Patience

### Phase 4 — Full Trees & Archive

- Complete both specialisation trees
- Task Variety unlocks (Double Click, Drag)
- Auto Generate and Auto Complete upgrades
- Archive screen with lifetime stats
- Remaining Habits and unlock conditions
