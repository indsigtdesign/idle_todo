# Idle ToDo

Idle ToDo is a small React + TypeScript + Zustand idle game wrapped in realistic todo-app UI chrome.

You generate tasks, complete them using different interactions, earn Dopamine, and invest in upgrades. Over time you unlock Habit Points, archive runs, and buy permanent Habits that shape future runs.

## Stack

- React 19 + TypeScript
- Vite 6
- Zustand (with selector subscriptions)
- Tailwind CSS
- localStorage persistence

## Core Loop

1. Generate tasks in the Inbox.
2. Complete each task using its required interaction.
3. Earn Dopamine (D).
4. Spend Dopamine on Specialisations in Settings.
5. Hit milestones to queue Habit countdowns.
6. Earn Habit Points (H) from completed countdowns.
7. Archive the run and spend Habit Points on permanent Habits.

## Interactions

Each task card has a badge showing the required completion method:

- tap: single click
- x2: double click
- hold: long click with progress ring
- swipe: drag right past threshold

Base payouts:

- single-click: 1D
- double-click: 2D
- long-click: 3D
- drag: 4D

## Upgrade Trees (Settings)

### Generation

- Spawn Rate: lowers manual generate cooldown
- Batch Spawn: chance to spawn extra tasks
- Task Variety: unlocks richer interaction pool
- Auto Generate: periodic automatic task spawning

### Completion

- Click Speed: faster auto-complete interval
- Hold Reduction: lowers required hold duration
- Auto Complete: automatically resolves eligible task types
- Chain Bonus: larger/faster chain multipliers

## Prestige + Habits

Archive ("End of Day") resets run progress and keeps meta progression.

Permanent Habit system highlights:

- Starting habits: Early Riser, Muscle Memory, Routine, Patience, Journaling
- Unlock-driven habits: Flow State, Hyperfocus, Inbox Zero, Compounding
- Habit levels stack and are uncapped
- Habit Points are spent in the Archive flow before reset

## Notable Mechanics

- Milestone system queues Habit countdown timers as Dopamine increases
- Chain window and chain multiplier reward rapid completions
- Auto Complete prioritizes tasks around the visible middle of the list
- Task naming includes contextual sequences for flavor continuity
- Onboarding overlays for intro and first Habit Point unlock

## Persistence

State is persisted to localStorage under key:

- idle-todo-save

Saved data includes run state, upgrades, countdowns, prestige stats, habits, and onboarding flags.

## Run Locally

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Scripts

- dev: starts Vite dev server
- build: type-checks and builds production bundle
- preview: serves built output locally

## Project Structure

```text
src/
	App.tsx                 # layout + tab routing + onboarding gates
	store.ts                # game state, progression logic, persistence
	hooks/useGameLoop.ts    # RAF game loop + visibility handling
	components/
		Inbox.tsx             # task list + guide state + generate button
		TaskCard.tsx          # interaction-specific completion UX
		Settings.tsx          # upgrades, habits, and guide replay
		Archive.tsx           # run stats, lifetime stats, prestige flow
		Header.tsx            # realistic app chrome + dopamine/streak display
		TabBar.tsx            # tab nav + habit countdown badge
```

## Current Version

- In-app label: 0.4.0 (Phase 4)

## Notes

- Audio feedback is generated with Web Audio API in src/farts.ts.
- This is designed mobile-first but also presents as a centered card on desktop.
