# Idle ToDo Game Logic (Implementation Spec)

This document reflects the currently implemented gameplay systems.

Primary source of truth:

- `src/store.ts`
- `src/hooks/useGameLoop.ts`

## Balance Snapshot (Quick)

Use this as a fast read before tuning. Exact behavior is defined in later sections.

| Phase        | Player feel target                | Main drivers                                                                                                                      |
| ------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Early run    | Frequent wins, visible momentum   | Starter tasks, high payout gaps (1/10/25/100), first variety unlock in 1-2 milestones                                             |
| Mid run      | Noticeable build acceleration     | Chain scaling, Flow/Hyperfocus multipliers, milestone ramp (`+25` per milestone up to `+300`)                                     |
| Late run     | Strong push toward Archive        | Steeper run-upgrade walls, widening variety unlock gaps (up to 3-6 milestones), countdown-to-HP conversion                        |
| Post-Archive | Faster reboot with stronger floor | Early Riser retained level 3 core upgrades, habit multipliers (`2^level` for Hyperfocus/Compounding), Automation tiers (2H/4H/8H) |

Quick checkpoints:

- Run upgrades should feel impactful early but expensive by mid-late.
- Harder interaction types should remain meaningfully more rewarding than easier ones.
- Archive should feel like a power spike, not just a reset.

## 1) Core Loop

1. Generate tasks manually (or via auto-generate).
2. Complete tasks using each task's required interaction.
3. Earn Dopamine (D) from base payout times multipliers.
4. Spend Dopamine on run upgrades.
5. Reach milestone thresholds to spawn Habit countdowns.
6. Countdown completions grant Habit Points (H).
7. Archive (prestige) to reset run state while preserving meta progress.

## 2) Base Constants

- Manual generate base cooldown: 3000 ms
- Base payouts:
    - Single-click: 1D
    - Double-click: 10D
    - Long-click: 25D
    - Drag: 100D
- Long-click base hold requirement: 2000 ms
- Double-click window: 400 ms
- Chain base window: 3000 ms
- Chain stack cap used in multiplier: 10
- Milestone base step: 100D
- Milestone growth per milestone reached: +25D (capped)
- Milestone growth cap component: +300D
- Habit countdown base duration: 30000 ms
- Hold reduction per level: 150 ms
- Minimum long-click hold: 400 ms
- Auto-generate base interval: 10000 ms
- Auto-generate minimum interval: 2000 ms
- Auto-complete base interval: 3000 ms
- Auto-complete minimum interval: 500 ms
- Inbox Zero bonus per level: +10D
- Completed-task resolve delay (visual): 600 ms

## 3) Task Generation

### 3.1 Manual Generate

Manual generation is blocked when:

- cooldown is active, or
- the game is paused.

On generate:

- Spawn count uses Batch Spawn logic.
- Cooldown starts from effective cooldown formula.

### 3.2 Effective Generate Cooldown

Cooldown reduction is multiplicative from:

- Routine habit level (meta)
- Spawn Rate upgrade level (run)

Formula:

- `base = floor(3000 * 0.91^routineLevel)`
- `effective = max(500, floor(base * 0.91^spawnRateLevel))`

### 3.3 Batch Spawn Probability

At Batch Spawn level `L`:

- Start with `count = 1`
- `maxExtra = min(L, 4)`
- Run `maxExtra` independent checks
- Each check succeeds with probability `0.1 * L`
- Each success adds `+1` task

Notes:

- Hard max of 5 tasks per generate.
- Probability is not clamped, so very high `L` can guarantee checks.

Expected value:

- `E[count] = 1 + min(L, 4) * (0.1 * L)`

### 3.4 Task Name Selection

- 80% chance to continue a predefined sequence from the previous task name.
- Otherwise selects random task name while avoiding:
    - the immediate previous name
    - up to the most recent 8 names

### 3.5 Starter Tasks (Fresh Profile)

A brand-new profile starts with:

- Enjoy some dopamine (single-click)
- Decide to add a new task (single-click)
- Master the long-press (long-click)

## 4) Interaction Types and Variety

Task interaction type is selected by current Task Variety level.

### 4.1 Variety Level 0

Distribution:

- single-click: 60%
- long-click: 40%

### 4.2 Variety Level >= 1

Uniform random from unlocked pool:

- L1: single-click, long-click, double-click
- L2: single-click, long-click, double-click
- L3: single-click, long-click, double-click, drag

Hard cap: `TASK_VARIETY_MAX = 3`

## 5) Passive Task Variety Unlocks

Task Variety is not purchased directly in run upgrades.

Unlock progression is milestone-driven and jittered:

- Next unlock milestone is computed from current variety level:
    - `minGap = 1 + level`
    - `maxGap = 2 + 2*level`
    - `next = currentMilestones + randomInt(minGap, maxGap)`

So typical gaps are:

- From L0 to L1: 1-2 milestones
- From L1 to L2: 2-4 milestones
- From L2 to L3: 3-6 milestones

When dopamine gains cross milestones, unlock processing loops until all due unlocks are applied, then schedules the next unlock milestone.

## 6) Completion and Payout Pipeline

For both manual and auto-complete task resolution:

1. Start with base payout by interaction type.
2. If Hyperfocus owned: multiply by `2^hyperfocusLevel`.
3. Compute new chain count:
    - if chain timer active: `count + 1`
    - else: reset to 1
4. If chain >= 2 and Flow State owned: multiply by `1 + flowStateLevel`.
5. Apply chain multiplier.
6. Floor to integer.
7. Apply compounding multiplier (`2^compoundingLevel`).
8. Floor to integer.
9. If queue is newly cleared and Inbox Zero owned: add `10 * inboxZeroLevel`.

### 6.1 Chain Multiplier

- `effectiveChain = min(chainCount, 10)`
- `multiplier = 1 + 0.1 * chainBonusLevel * (effectiveChain - 1)`

### 6.2 Chain Window Refresh

- `chainWindow = min(3000 + 300 * chainBonusLevel, 6000)`

### 6.3 Victory Delay Behavior

Completed tasks are marked as resolving and remain visible for 600 ms:

- `isResolving = true`
- `resolveDelayMs = 600`
- `resolvedPayout` stores payout for visual feedback

Resolving tasks are removed by tick once timer expires.

## 7) Milestones and Habit Countdowns

When dopamine reaches/exceeds `nextMilestone`:

- `milestonesReached += 1`
- enqueue a countdown timer
- advance `nextMilestone` by:
    - `100 + min(milestonesReached * 25, 300)`

Initial milestone target: `100D`.

Countdown duration:

- base: `30000 ms`
- with Patience level `P`:
    - `duration = max(floor(30000 * 0.2), floor(30000 * (1 - 0.2 * P)))`

Patience examples:

- L0: 30s
- L1: 24s
- L2: 18s
- L3: 12s
- L4+: 6s floor

On countdown completion:

- +1 Habit Point
- countdown removed

Guard:

- While `isPrestiging` is true, milestone crossing does not enqueue new countdowns.

## 8) Run Upgrades

### 8.1 Cost Formula

- `cost = floor(baseCost * exponent^level)`

Base costs:

- spawnRate: 10
- batchSpawn: 25
- taskVariety: 45
- autoGenerate: 100
- clickSpeed: 15
- holdReduction: 20
- autoComplete: 120
- chainBonus: 20

Exponents:

- spawnRate: 1.35
- batchSpawn: 1.45
- taskVariety: 1.1
- autoGenerate: 1.6
- clickSpeed: 1.45
- holdReduction: 1.35
- autoComplete: 1.13
- chainBonus: 1.12

### 8.2 Caps and Purchasability

Caps:

- taskVariety max: 3
- autoComplete max: 3

Purchasing rules in current implementation:

- `purchaseUpgrade` blocks direct purchase of:
    - taskVariety
    - autoComplete

So in practice, run upgrade purchases currently include:

- spawnRate
- batchSpawn
- autoGenerate
- clickSpeed
- holdReduction
- chainBonus

### 8.3 Muscle Memory Discount

If Muscle Memory level is `M`:

- First `M` run-upgrade purchases each run cost 50% (floored)
- Uses tracked by `muscleMemoryUses`
- Resets on Archive

## 9) Habits (Meta)

## 9.1 Habit Cost Model

Default habit cost progression:

- `cost = baseCost * (currentLevel + 1)`

Special case: Automation habit (`autoComplete`)

- Fixed tier costs by level-up:
    - 0 -> 1: 2H
    - 1 -> 2: 4H
    - 2 -> 3: 8H
- Max level 3

## 9.2 Always Unlocked Habits

- earlyRiser
- muscleMemory
- routine
- autoComplete (Automation)
- patience
- journaling

## 9.3 Conditional Habit Unlocks

- flowState: max chain this run >= 5
- hyperfocus: long-clicks this run >= 50
- inboxZero: queue cleared in this run
- compounding: prestige count >= 2

## 9.4 Habit Effects

- Early Riser:
    - If owned (level >= 1), next run starts with level 3 in:
        - spawnRate
        - batchSpawn
        - autoGenerate
        - holdReduction
- Muscle Memory:
    - first N purchases each run at 50% cost (N = level)
- Routine:
    - permanent multiplicative reduction to base generate cooldown
- Automation (`autoComplete` habit):
    - L1: auto single-click
    - L2: auto single + double
    - L3: auto all interaction types
- Flow State:
    - if chain >= 2, multiply payout by `1 + level`
- Hyperfocus:
    - all interaction payout multiplier `2^level`
- Inbox Zero:
    - flat `+10 * level` dopamine when queue is newly cleared
- Patience:
    - countdown duration reduction as defined above
- Compounding:
    - global payout multiplier `2^level`
- Journaling:
    - unlocks additional archive detail in UI

## 10) Auto Systems

### 10.1 Auto Generate

Active when `autoGenerate` run-upgrade level > 0.

Interval:

- `max(2000, floor(10000 * 0.91^autoGenerateLevel))`

Behavior per trigger:

- Spawn tasks using current Batch Spawn and Task Variety behavior
- Dismisses inbox guide if it is still shown

### 10.2 Auto Complete

Driven by Automation habit level, not by run-upgrade level.

Eligibility tiers:

- L1: single-click
- L2: single-click + double-click
- L3: single-click + double-click + drag + long-click

Interval uses Click Speed run upgrade:

- `max(500, 3000 - 200 * clickSpeedLevel)`

Targeting strategy:

- Filters out resolving tasks
- Prioritizes tasks near the middle of visible range
- Falls back to visible matching task
- Falls back to middle of whole active list
- Falls back to first matching task

## 11) Archive (Prestige)

Archive resets run-state systems and preserves meta systems.

Resets:

- dopamine
- task list and next task id
- cooldown state
- run upgrades (reinitialized from Early Riser)
- chain state
- milestone state and countdown queue
- run counters and interaction counters
- auto timers and auto target
- muscleMemoryUses

Persists/updates:

- prestigeCount +1
- lifetime dopamine/tasks/long-clicks/interaction counts
- longest run tasks
- habit points and habit levels
- unlocked habits
- onboarding/meta flags

Additional logic:

- Ensures compounding is in unlocked list once prestigeCount >= 2
- Recomputes next task variety unlock milestone on reset

## 12) Pause and Time Progression

The game loop is driven by `requestAnimationFrame`.

Runtime behavior:

- Frame delta is capped to 200 ms during active rendering ticks.
- On tab hidden:
    - game is paused
    - hidden timestamp recorded
- On tab visible:
    - game unpauses
    - one catch-up tick is applied with hidden elapsed time
    - frame timestamp is reset to avoid a huge immediate delta

## 13) Persistence

Storage key:

- `idle-todo-save`

Persisted domains include:

- run resources and upgrades
- task list and task resolving fields
- milestone and countdown state
- task variety next unlock milestone
- prestige and lifetime stats
- onboarding flags

## 14) Quick Formula Sheet

- Effective generate cooldown:
    - `max(500, floor(floor(3000 * 0.91^routine) * 0.91^spawnRate))`

- Long-click hold threshold:
    - `max(400, 2000 - 150 * holdReduction)`

- Auto-generate interval:
    - `max(2000, floor(10000 * 0.91^autoGenerate))`

- Auto-complete interval:
    - `max(500, 3000 - 200 * clickSpeed)`

- Chain multiplier:
    - `1 + 0.1 * chainBonus * (min(chainCount, 10) - 1)`

- Chain window:
    - `min(3000 + 300 * chainBonus, 6000)`

- Compounding multiplier:
    - `2^compoundingLevel`

- Milestone increment:
    - `100 + min(milestonesReached * 25, 300)`

- Upgrade cost:
    - `floor(baseCost * exponent^level)`

- Interaction base payouts:
    - `single=1, double=10, long=25, drag=100`

- Hyperfocus multiplier:
    - `2^hyperfocusLevel`

- Default habit upgrade cost:
    - `baseCost * (currentLevel + 1)`

- Automation habit tier costs:
    - `[2, 4, 8]`

- Task variety unlock gap by current level `v`:
    - `randomInt(1 + v, 2 + 2*v)`
