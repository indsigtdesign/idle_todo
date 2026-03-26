import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { playFart } from './farts';

// --- Types ---

export type InteractionType =
	| 'single-click'
	| 'long-click'
	| 'double-click'
	| 'drag';

export interface Task {
	id: string;
	name: string;
	interaction: InteractionType;
	holdProgress: number;
	isResolving?: boolean;
	resolveDelayMs?: number;
	resolvedPayout?: number;
}

export interface UpgradeLevels {
	// Generation tree
	spawnRate: number;
	batchSpawn: number;
	taskVariety: number;
	autoGenerate: number;
	// Completion tree
	clickSpeed: number;
	holdReduction: number;
	autoComplete: number;
	chainBonus: number;
}

export interface ChainState {
	count: number;
	timeLeft: number;
}

// --- Habit System ---

export type HabitId =
	| 'earlyRiser'
	| 'muscleMemory'
	| 'patience'
	| 'routine'
	| 'autoComplete'
	| 'flowState'
	| 'hyperfocus'
	| 'inboxZero'
	| 'compounding'
	| 'journaling';

export interface HabitDef {
	id: HabitId;
	name: string;
	description: string;
	cost: number;
	alwaysUnlocked: boolean;
}

export interface HabitEffectSummary {
	current: string;
	next: string;
}

export const ALL_HABITS: HabitDef[] = [
	// Starting Advantages
	{
		id: 'earlyRiser',
		name: 'Early Riser',
		description: 'Keep core speed upgrades after archiving',
		cost: 1,
		alwaysUnlocked: true,
	},
	{
		id: 'muscleMemory',
		name: 'Muscle Memory',
		description: 'Your first upgrades each run are discounted',
		cost: 1,
		alwaysUnlocked: true,
	},
	{
		id: 'routine',
		name: 'Routine',
		description: 'Begin each run with a faster generation cadence',
		cost: 1,
		alwaysUnlocked: true,
	},
	// Amplifiers
	{
		id: 'autoComplete',
		name: 'Automation',
		description: 'Auto-complete tiers are bought with Habit Points',
		cost: 2,
		alwaysUnlocked: true,
	},
	{
		id: 'flowState',
		name: 'Flow State',
		description: 'Chain streaks become much more rewarding',
		cost: 2,
		alwaysUnlocked: false,
	},
	{
		id: 'hyperfocus',
		name: 'Hyperfocus',
		description: 'Long Click payouts scale up hard',
		cost: 2,
		alwaysUnlocked: false,
	},
	{
		id: 'inboxZero',
		name: 'Inbox Zero',
		description: 'Clearing the queue grants a flat bonus',
		cost: 2,
		alwaysUnlocked: false,
	},
	// Meta / Prestige
	{
		id: 'patience',
		name: 'Patience',
		description: 'Habit Point countdowns finish faster',
		cost: 2,
		alwaysUnlocked: true,
	},
	{
		id: 'compounding',
		name: 'Compounding',
		description: 'Each level doubles all dopamine gain',
		cost: 3,
		alwaysUnlocked: false,
	},
	{
		id: 'journaling',
		name: 'Journaling',
		description: 'Archive displays additional run detail',
		cost: 1,
		alwaysUnlocked: true,
	},
];

export interface HabitCountdown {
	id: string;
	remaining: number;
	duration: number;
}

export interface PrestigeData {
	habitPoints: number;
	habitLevels: Partial<Record<HabitId, number>>;
	prestigeCount: number;
	lifetimeDopamine: number;
	lifetimeTasksCompleted: number;
	lifetimeLongClicks: number;
	longestRunTasks: number;
	lifetimeInteractionCounts: Record<InteractionType, number>;
	unlockedHabits: HabitId[];
	introSeen: boolean;
	inboxGuideDismissed: boolean;
	habitPointGuideUnlocked: boolean;
	prestigeGuideSeen: boolean;
}

export type OnboardingOverlay = 'none' | 'intro' | 'prestige';

// --- State & Actions ---

export interface GameState {
	dopamine: number;
	tasks: Task[];
	nextTaskId: number;
	cooldownRemaining: number;
	cooldownDuration: number;
	isCoolingDown: boolean;
	upgrades: UpgradeLevels;
	chain: ChainState;
	taskVarietyNextUnlockMilestone: number;
	nextMilestone: number;
	milestonesReached: number;
	isPaused: boolean;
	tasksCompletedThisRun: number;
	longClicksCompletedThisRun: number;
	habitCountdowns: HabitCountdown[];
	prestige: PrestigeData;
	muscleMemoryUses: number;
	maxChainThisRun: number;
	queueClearedThisRun: boolean;
	interactionCountsThisRun: Record<InteractionType, number>;
	autoGenTimer: number;
	autoCompleteTimer: number;
	autoCompleteTargetIds: string[];
	pendingScrollToTask: string | null;
	visibleTaskRange: { startIdx: number; endIdx: number };
	isPrestiging: boolean;
	activeOnboarding: OnboardingOverlay;
}

export interface GameActions {
	generateTask: () => void;
	completeTask: (taskId: string) => void;
	startHold: (taskId: string) => void;
	cancelHold: (taskId: string) => void;
	purchaseUpgrade: (upgradeId: keyof UpgradeLevels) => void;
	purchaseHabit: (habitId: HabitId) => void;
	doPrestige: () => void;
	tick: (deltaMs: number) => void;
	setPaused: (paused: boolean) => void;
	setIsPrestiging: (isPrestiging: boolean) => void;
	clearPendingScroll: () => void;
	setVisibleTaskRange: (startIdx: number, endIdx: number) => void;
	dismissInboxGuide: () => void;
	openOnboarding: (overlay: Exclude<OnboardingOverlay, 'none'>) => void;
	completeIntroOnboarding: () => void;
	completePrestigeOnboarding: () => void;
}

// --- Constants ---

const TASK_NAMES = [
	// Original flavour
	'Review notes',
	'Organise inbox',
	'File report',
	'Update spreadsheet',
	'Check calendar',
	'Draft email',
	'Sort bookmarks',
	'Clear notifications',
	'Tidy desktop',
	'Archive thread',
	'Rename files',
	'Backup photos',
	'Update contacts',
	'Log expenses',
	'Set reminder',
	'Plan agenda',
	'Proofread doc',
	'Close old tabs',
	'Sync folder',
	'Tag items',

	// Mundane corporate despair
	'Reply to Kevin',
	'Reschedule the reschedule',
	'Find the attachment',
	'Unsubscribe again',
	'Update the update',
	'Forward to the right person',
	'Locate the correct form',
	'Fill in the form',
	'Submit the form',
	'Download the other form',
	'Read the memo',
	'Acknowledge the memo',
	'Print something',
	'Find the printer',
	'Unjam the printer',
	'Refill the printer',
	'Pretend to read report',
	'Look busy',
	'Nod in meeting',
	'Find mute button',
	'Turn camera off',
	'Leave meeting early',
	'Join wrong meeting',
	'Decline meeting politely',
	'Decline meeting impolitely',
	'Write passive aggressive email',
	'Delete passive aggressive email',
	'Write it again',
	'Send it',
	'Regret sending it',

	// Slightly unhinged productivity
	'Optimise the optimisation',
	'Reorganise the reorganisation',
	'Document the documentation',
	'Automate the automation',
	'Sync the sync',
	'Archive the archive',
	'Schedule time to schedule',
	'Plan the planning session',
	"Review yesterday's review",
	'Follow up on the follow up',
	'Circle back to the circle back',
	'Touch base about touching base',
	'Ping someone',
	'Await the ping',
	'Chase the chaser',
	'Escalate the escalation',
	'Deprioritise the priority',

	// Digital hoarding
	'Close 47 tabs',
	'Open 12 new tabs',
	'Bookmark something to read later',
	'Never read it',
	'Clear downloads folder',
	'Move everything to desktop',
	'Create folder called "NEW FOLDER (2)"',
	'Create folder called "FINAL"',
	'Create folder called "FINAL FINAL"',
	'Create folder called "USE THIS ONE"',
	'Delete nothing',
	'Empty trash (eventually)',
	'Ignore the storage warning',
	'Buy more storage',
	'Fill it immediately',

	// Existential todo list
	'Question the system',
	'Trust the process',
	'Embrace the backlog',
	'Confront the inbox',
	'Make peace with unread emails',
	'Accept the notifications',
	'Transcend the todo list',
	'Become the productivity',
	'Achieve inbox zero',
	'Immediately ruin inbox zero',
	'Start fresh',
	'Start fresh again',
	'This time for real',
];

const TASK_NAME_SEQUENCES: string[][] = [
	[
		'Print something',
		'Find the printer',
		'Unjam the printer',
		'Refill the printer',
	],
	[
		'Write passive aggressive email',
		'Delete passive aggressive email',
		'Write it again',
		'Send it',
		'Regret sending it',
	],
	[
		'Create folder called "FINAL"',
		'Create folder called "FINAL FINAL"',
		'Create folder called "USE THIS ONE"',
	],
	['Achieve inbox zero', 'Immediately ruin inbox zero'],
	['Start fresh', 'Start fresh again', 'This time for real'],
	// Form bureaucracy
	[
		'Locate the correct form',
		'Fill in the form',
		'Submit the form',
		'Download the other form',
	],

	// The meeting spiral
	[
		'Nod in meeting',
		'Find mute button',
		'Turn camera off',
		'Leave meeting early',
	],

	// The Kevin arc
	[
		'Reply to Kevin',
		'Follow up on the follow up',
		'Chase the chaser',
		'Escalate the escalation',
	],

	// The optimisation paradox
	[
		'Optimise the optimisation',
		'Automate the automation',
		'Document the documentation',
		'Reorganise the reorganisation',
	],

	// The passive aggressive arc (extends your existing one)
	[
		'Write passive aggressive email',
		'Delete passive aggressive email',
		'Write it again',
		'Send it',
		'Regret sending it',
	],

	// Storage doom loop
	['Ignore the storage warning', 'Buy more storage', 'Fill it immediately'],

	// Existential crescendo (extends your existing ones)
	[
		'Question the system',
		'Trust the process',
		'Embrace the backlog',
		'Transcend the todo list',
		'Become the productivity',
	],
	[
		'subscribe to newsletter',
		'Ignore newsletter',
		'Unsubscribe from newsletter',
		'Subscribe again',
	],
];

const TASK_NAME_NEXT_BY_CURRENT: Partial<Record<string, string>> =
	TASK_NAME_SEQUENCES.reduce<Partial<Record<string, string>>>(
		(acc, sequence) => {
			for (let i = 0; i < sequence.length - 1; i++) {
				acc[sequence[i]] = sequence[i + 1];
			}
			return acc;
		},
		{},
	);

const TASK_CHAIN_CONTINUE_CHANCE = 0.8;
const TASK_NAME_RECENT_AVOID_COUNT = 8;

const BASE_COOLDOWN = 3000;
const SINGLE_CLICK_DOPAMINE = 1;
const DOUBLE_CLICK_DOPAMINE = 10;
const LONG_CLICK_DOPAMINE = 25;
const DRAG_DOPAMINE = 100;
const LONG_CLICK_HOLD_MS = 2000;
const DOUBLE_CLICK_WINDOW_MS = 400;
const CHAIN_WINDOW_MS = 3000;
const CHAIN_MAX_STACK = 10;
const MILESTONE_STEP = 100;
const MILESTONE_GROWTH_PER_MILESTONE = 25;
const HABIT_COUNTDOWN_BASE_MS = 30000;
const MILESTONE_GROWTH_CAP = 300;
const TASK_VARIETY_MAX = 3;
const AUTO_COMPLETE_MAX = 3;
const AUTO_GEN_BASE_INTERVAL = 10000;
const AUTO_COMPLETE_BASE_INTERVAL = 3000;
const HOLD_REDUCTION_PER_LEVEL = 150;
const MIN_HOLD_MS = 400;
const INBOX_ZERO_BONUS = 10;
const TASK_VICTORY_DELAY_MS = 250;

// --- Upgrade costs ---

const UPGRADE_BASE_COSTS: Record<keyof UpgradeLevels, number> = {
	spawnRate: 10,
	batchSpawn: 25,
	taskVariety: 45,
	autoGenerate: 100,
	clickSpeed: 15,
	holdReduction: 20,
	autoComplete: 120,
	chainBonus: 20,
};

const CAPPED_UPGRADES: Partial<Record<keyof UpgradeLevels, number>> = {
	taskVariety: TASK_VARIETY_MAX,
	autoComplete: AUTO_COMPLETE_MAX,
};

export function upgradeCost(
	upgradeId: keyof UpgradeLevels,
	level: number,
): number {
	const expByUpgrade: Record<keyof UpgradeLevels, number> = {
		spawnRate: 1.35,
		batchSpawn: 1.45,
		taskVariety: 1.1,
		autoGenerate: 1.6,
		clickSpeed: 1.45,
		holdReduction: 1.35,
		autoComplete: 1.13,
		chainBonus: 1.12,
	};
	return Math.floor(
		UPGRADE_BASE_COSTS[upgradeId] *
			Math.pow(expByUpgrade[upgradeId], level),
	);
}

export function upgradeMaxLevel(upgradeId: keyof UpgradeLevels): number | null {
	return CAPPED_UPGRADES[upgradeId] ?? null;
}

export function isUpgradeVisible(
	upgradeId: keyof UpgradeLevels,
	currentLevels: UpgradeLevels,
	habitLevels: Partial<Record<HabitId, number>>,
): boolean {
	if ((habitLevels.earlyRiser ?? 0) >= 3) {
		// Early Riser reveals all upgrades, but autoComplete still needs automation habit
		if (upgradeId === 'autoComplete') {
			return (habitLevels.autoComplete ?? 0) >= 1;
		}
		return true;
	}

	switch (upgradeId) {
		case 'batchSpawn':
			return currentLevels.spawnRate >= 5;
		case 'autoGenerate':
			return currentLevels.batchSpawn >= 3;
		case 'clickSpeed':
			return currentLevels.holdReduction >= 3;
		case 'autoComplete':
			return (
				currentLevels.clickSpeed >= 5 &&
				(habitLevels.autoComplete ?? 0) >= 1
			);
		case 'chainBonus':
			return currentLevels.taskVariety >= 1;
		default:
			return true;
	}
}

// --- Persistence ---

const STORAGE_KEY = 'idle-todo-save';

interface SaveData {
	dopamine: number;
	tasks: Task[];
	nextTaskId: number;
	upgrades: UpgradeLevels;
	taskVarietyNextUnlockMilestone?: number;
	nextMilestone: number;
	milestonesReached: number;
	tasksCompletedThisRun: number;
	longClicksCompletedThisRun: number;
	habitCountdowns: HabitCountdown[];
	prestige: PrestigeData;
	muscleMemoryUsed?: boolean;
	muscleMemoryUses?: number;
	maxChainThisRun: number;
	queueClearedThisRun: boolean;
	interactionCountsThisRun: Record<InteractionType, number>;
	activeOnboarding?: OnboardingOverlay;
}

function loadState(): Partial<SaveData> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as Partial<SaveData>;
	} catch {
		return null;
	}
}

function saveState(state: GameState) {
	const toSave: SaveData = {
		dopamine: state.dopamine,
		tasks: state.tasks,
		nextTaskId: state.nextTaskId,
		upgrades: state.upgrades,
		taskVarietyNextUnlockMilestone: state.taskVarietyNextUnlockMilestone,
		nextMilestone: state.nextMilestone,
		milestonesReached: state.milestonesReached,
		tasksCompletedThisRun: state.tasksCompletedThisRun,
		longClicksCompletedThisRun: state.longClicksCompletedThisRun,
		habitCountdowns: state.habitCountdowns,
		prestige: state.prestige,
		muscleMemoryUses: state.muscleMemoryUses,
		maxChainThisRun: state.maxChainThisRun,
		queueClearedThisRun: state.queueClearedThisRun,
		interactionCountsThisRun: state.interactionCountsThisRun,
		activeOnboarding: state.activeOnboarding,
	};
	localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// --- Helpers ---

const defaultInteractionCounts: Record<InteractionType, number> = {
	'single-click': 0,
	'long-click': 0,
	'double-click': 0,
	drag: 0,
};

const defaultUpgrades: UpgradeLevels = {
	spawnRate: 0,
	batchSpawn: 0,
	taskVariety: 0,
	autoGenerate: 0,
	clickSpeed: 0,
	holdReduction: 0,
	autoComplete: 0,
	chainBonus: 0,
};

const defaultPrestige: PrestigeData = {
	habitPoints: 0,
	habitLevels: {},
	prestigeCount: 0,
	lifetimeDopamine: 0,
	lifetimeTasksCompleted: 0,
	lifetimeLongClicks: 0,
	longestRunTasks: 0,
	lifetimeInteractionCounts: { ...defaultInteractionCounts },
	unlockedHabits: [],
	introSeen: false,
	inboxGuideDismissed: false,
	habitPointGuideUnlocked: false,
	prestigeGuideSeen: false,
};

function habitLevel(prestige: PrestigeData, id: HabitId): number {
	return prestige.habitLevels[id] ?? 0;
}

function hasHabit(prestige: PrestigeData, id: HabitId): boolean {
	return habitLevel(prestige, id) >= 1;
}

export function getHabitUpgradeCost(
	def: HabitDef,
	currentLevel: number,
): number {
	if (def.id === 'autoComplete') {
		const autoCompleteCosts = [2, 4, 8];
		return autoCompleteCosts[currentLevel] ?? Number.MAX_SAFE_INTEGER;
	}
	return def.cost * (currentLevel + 1);
}

function formatPercent(value: number): string {
	return `${(value * 100).toFixed(value * 100 >= 10 ? 0 : 1)}%`;
}

function formatMs(ms: number): string {
	if (ms % 1000 === 0) return `${Math.floor(ms / 1000)}s`;
	return `${(ms / 1000).toFixed(1)}s`;
}

export function getHabitEffectSummary(
	habitId: HabitId,
	level: number,
	_prestigeCount: number,
): HabitEffectSummary {
	const nextLevel = level + 1;

	switch (habitId) {
		case 'earlyRiser': {
			const keepsCoreLevels = level > 0;
			return {
				current: keepsCoreLevels
					? 'Current: Keep first 3 levels of Spawn Rate, Batch Spawn, Auto Generate, and Hold Reduction after Archive'
					: 'Current: No retained speed levels after Archive',
				next: 'Next: Keep first 3 levels of Spawn Rate, Batch Spawn, Auto Generate, and Hold Reduction after Archive',
			};
		}
		case 'muscleMemory':
			return {
				current:
					level > 0
						? `Current: First ${level} upgrade purchase${level === 1 ? '' : 's'} each run cost 50%`
						: 'Current: No upgrade discount purchases',
				next: `Next: First ${nextLevel} upgrade purchase${nextLevel === 1 ? '' : 's'} each run cost 50%`,
			};
		case 'routine': {
			const currentMs = Math.floor(BASE_COOLDOWN * Math.pow(0.91, level));
			const nextMs = Math.floor(
				BASE_COOLDOWN * Math.pow(0.91, nextLevel),
			);
			const currentReduction = 1 - Math.pow(0.91, level);
			const nextReduction = 1 - Math.pow(0.91, nextLevel);
			return {
				current:
					level > 0
						? `Current: Base generate cooldown ${formatMs(currentMs)} (${formatPercent(currentReduction)} faster)`
						: `Current: Base generate cooldown ${formatMs(BASE_COOLDOWN)}`,
				next: `Next: Base generate cooldown ${formatMs(nextMs)} (${formatPercent(nextReduction)} faster)`,
			};
		}
		case 'autoComplete': {
			const labels = [
				'No automation',
				'Single-click auto',
				'Single + Double auto',
				'All interaction auto',
			];
			return {
				current: `Current: ${labels[Math.min(level, 3)]}`,
				next:
					nextLevel <= 3
						? `Next: ${labels[nextLevel]}`
						: 'Next: Automation is maxed',
			};
		}
		case 'flowState':
			return {
				current:
					level > 0
						? `Current: Chain payouts x${1 + level} when chain >= 2`
						: 'Current: No chain payout multiplier',
				next: `Next: Chain payouts x${1 + nextLevel} when chain >= 2`,
			};
		case 'hyperfocus':
			return {
				current:
					level > 0
						? `Current: All interaction payouts x${Math.pow(2, level)}`
						: 'Current: No interaction payout multiplier',
				next: `Next: All interaction payouts x${Math.pow(2, nextLevel)}`,
			};
		case 'inboxZero':
			return {
				current:
					level > 0
						? `Current: +${INBOX_ZERO_BONUS * level}D when queue is cleared`
						: 'Current: No queue clear bonus',
				next: `Next: +${INBOX_ZERO_BONUS * nextLevel}D when queue is cleared`,
			};
		case 'patience': {
			const currentDur = Math.max(
				Math.floor(HABIT_COUNTDOWN_BASE_MS * 0.2),
				Math.floor(HABIT_COUNTDOWN_BASE_MS * (1 - 0.2 * level)),
			);
			const nextDur = Math.max(
				Math.floor(HABIT_COUNTDOWN_BASE_MS * 0.2),
				Math.floor(HABIT_COUNTDOWN_BASE_MS * (1 - 0.2 * nextLevel)),
			);
			const currentReduction = 1 - currentDur / HABIT_COUNTDOWN_BASE_MS;
			const nextReduction = 1 - nextDur / HABIT_COUNTDOWN_BASE_MS;
			return {
				current:
					level > 0
						? `Current: Countdowns ${formatMs(currentDur)} (${formatPercent(currentReduction)} shorter)`
						: `Current: Countdowns ${formatMs(HABIT_COUNTDOWN_BASE_MS)}`,
				next: `Next: Countdowns ${formatMs(nextDur)} (${formatPercent(nextReduction)} shorter)`,
			};
		}
		case 'compounding': {
			const currentMult = Math.pow(2, level);
			const nextMult = Math.pow(2, nextLevel);
			return {
				current:
					level > 0
						? `Current: All dopamine x${currentMult.toFixed(2)}`
						: 'Current: No global dopamine multiplier',
				next: `Next: All dopamine x${nextMult.toFixed(2)}`,
			};
		}
		case 'journaling':
			return {
				current:
					level > 0
						? 'Current: Archive shows additional run detail'
						: 'Current: Additional Archive detail is locked',
				next:
					nextLevel >= 1
						? 'Next: Archive shows additional run detail'
						: 'Next: Additional Archive detail unlocks',
			};
	}
}

function getStartingUpgrades(prestige: PrestigeData): UpgradeLevels {
	const ups = { ...defaultUpgrades };
	const erl = habitLevel(prestige, 'earlyRiser');
	if (erl > 0) {
		ups.spawnRate = Math.max(ups.spawnRate, 3);
		ups.batchSpawn = Math.max(ups.batchSpawn, 3);
		ups.autoGenerate = Math.max(ups.autoGenerate, 3);
		ups.holdReduction = Math.max(ups.holdReduction, 3);
	}
	return ups;
}

function getCountdownDuration(prestige: PrestigeData): number {
	const lvl = habitLevel(prestige, 'patience');
	if (lvl <= 0) return HABIT_COUNTDOWN_BASE_MS;
	return Math.max(
		Math.floor(HABIT_COUNTDOWN_BASE_MS * 0.2),
		Math.floor(HABIT_COUNTDOWN_BASE_MS * (1 - 0.2 * lvl)),
	);
}

function getEffectiveCooldown(
	spawnRateLevel: number,
	prestige?: PrestigeData,
): number {
	let base = BASE_COOLDOWN;
	if (prestige) {
		const rl = habitLevel(prestige, 'routine');
		if (rl > 0) base = Math.floor(base * Math.pow(0.91, rl));
	}
	return Math.max(500, Math.floor(base * Math.pow(0.91, spawnRateLevel)));
}

export function getEffectiveHoldMs(holdReductionLevel: number): number {
	return Math.max(
		MIN_HOLD_MS,
		LONG_CLICK_HOLD_MS - HOLD_REDUCTION_PER_LEVEL * holdReductionLevel,
	);
}

export function getAutoGenInterval(level: number): number {
	return Math.max(
		2000,
		Math.floor(AUTO_GEN_BASE_INTERVAL * Math.pow(0.91, level)),
	);
}

export function getAutoCompleteInterval(clickSpeedLevel: number): number {
	return Math.max(500, AUTO_COMPLETE_BASE_INTERVAL - clickSpeedLevel * 200);
}

function getInitialState(): GameState {
	const saved = loadState();
	const isFreshProfile = !saved;
	const prestige = saved?.prestige
		? { ...defaultPrestige, ...saved.prestige }
		: defaultPrestige;
	if (!prestige.unlockedHabits) {
		prestige.unlockedHabits = [];
	}
	// Migrate old ownedHabits array to habitLevels
	const savedPrestige = saved?.prestige as
		| (PrestigeData & { ownedHabits?: string[] })
		| undefined;
	if (!prestige.habitLevels && savedPrestige?.ownedHabits) {
		prestige.habitLevels = {};
		for (const id of savedPrestige.ownedHabits) {
			prestige.habitLevels[id as HabitId] = 1;
		}
	}
	if (!prestige.habitLevels) {
		prestige.habitLevels = {};
	}
	if (
		(prestige.habitLevels.autoComplete ?? 0) === 0 &&
		(saved?.upgrades?.autoComplete ?? 0) > 0
	) {
		prestige.habitLevels.autoComplete = Math.min(
			saved?.upgrades?.autoComplete ?? 0,
			3,
		);
	}
	if (!prestige.lifetimeInteractionCounts) {
		prestige.lifetimeInteractionCounts = { ...defaultInteractionCounts };
	}
	const ups = saved?.upgrades
		? { ...defaultUpgrades, ...saved.upgrades, autoComplete: 0 }
		: getStartingUpgrades(prestige);
	const initialTaskVarietyNextUnlockMilestone =
		ups.taskVariety >= TASK_VARIETY_MAX
			? Number.MAX_SAFE_INTEGER
			: (saved?.taskVarietyNextUnlockMilestone ??
				nextTaskVarietyUnlockMilestone(
					saved?.milestonesReached ?? 0,
					ups.taskVariety,
				));
	const starterTasks: Task[] = STARTER_TASKS.map((task, idx) => ({
		id: `task-${idx + 1}`,
		name: task.name,
		interaction: task.interaction,
		holdProgress: 0,
	}));
	const tasks = (saved?.tasks ?? (isFreshProfile ? starterTasks : [])).map(
		(t) => ({
			...t,
			holdProgress: t.holdProgress ?? 0,
			isResolving: t.isResolving ?? false,
			resolveDelayMs: t.resolveDelayMs ?? 0,
			resolvedPayout: t.resolvedPayout ?? 0,
		}),
	);
	if (
		!prestige.inboxGuideDismissed &&
		((saved?.nextTaskId ?? 1) > 1 ||
			tasks.length > 0 ||
			prestige.lifetimeTasksCompleted > 0 ||
			prestige.prestigeCount > 0)
	) {
		prestige.inboxGuideDismissed = true;
	}
	return {
		dopamine: saved?.dopamine ?? 0,
		tasks,
		nextTaskId:
			saved?.nextTaskId ??
			(isFreshProfile ? STARTER_TASKS.length + 1 : 1),
		cooldownRemaining: 0,
		cooldownDuration: getEffectiveCooldown(ups.spawnRate, prestige),
		isCoolingDown: false,
		upgrades: ups,
		taskVarietyNextUnlockMilestone: initialTaskVarietyNextUnlockMilestone,
		chain: { count: 0, timeLeft: 0 },
		nextMilestone: saved?.nextMilestone ?? MILESTONE_STEP,
		milestonesReached: saved?.milestonesReached ?? 0,
		isPaused: false,
		tasksCompletedThisRun: saved?.tasksCompletedThisRun ?? 0,
		longClicksCompletedThisRun: saved?.longClicksCompletedThisRun ?? 0,
		habitCountdowns: saved?.habitCountdowns ?? [],
		prestige,
		muscleMemoryUses:
			saved?.muscleMemoryUses ?? (saved?.muscleMemoryUsed ? 1 : 0),
		maxChainThisRun: saved?.maxChainThisRun ?? 0,
		queueClearedThisRun: saved?.queueClearedThisRun ?? false,
		interactionCountsThisRun: saved?.interactionCountsThisRun ?? {
			...defaultInteractionCounts,
		},
		autoGenTimer: 0,
		autoCompleteTimer: 0,
		autoCompleteTargetIds: [],
		pendingScrollToTask: null,
		visibleTaskRange: { startIdx: 0, endIdx: 0 },
		isPrestiging: false,
		activeOnboarding:
			saved?.activeOnboarding === 'intro' ||
			saved?.activeOnboarding === 'prestige'
				? saved.activeOnboarding
				: 'none',
	};
}

function randomTaskName(
	previousName?: string,
	recentNames: string[] = [],
): string {
	const nextInSequence = previousName
		? TASK_NAME_NEXT_BY_CURRENT[previousName]
		: undefined;
	if (nextInSequence && Math.random() < TASK_CHAIN_CONTINUE_CHANCE) {
		return nextInSequence;
	}

	const excluded = new Set<string>(recentNames);
	if (previousName) excluded.add(previousName);
	const candidates = TASK_NAMES.filter((name) => !excluded.has(name));
	const pool = candidates.length > 0 ? candidates : TASK_NAMES;
	return pool[Math.floor(Math.random() * pool.length)];
}

function pickInteraction(taskVarietyLevel: number): InteractionType {
	if (taskVarietyLevel === 0) {
		return Math.random() < 0.6 ? 'single-click' : 'long-click';
	}
	const pool: InteractionType[] = ['single-click', 'long-click'];
	if (taskVarietyLevel >= 1) pool.push('double-click');
	if (taskVarietyLevel >= 3) pool.push('drag');
	return pool[Math.floor(Math.random() * pool.length)];
}

function batchCount(batchSpawnLevel: number): number {
	if (batchSpawnLevel === 0) return 1;
	let count = 1;
	const maxExtra = Math.min(batchSpawnLevel, 4);
	for (let i = 0; i < maxExtra; i++) {
		if (Math.random() < 0.1 * batchSpawnLevel) count++;
	}
	return count;
}

function chainMultiplier(chainCount: number, chainBonusLevel: number): number {
	if (chainBonusLevel === 0 || chainCount <= 1) return 1;
	const effective = Math.min(chainCount, CHAIN_MAX_STACK);
	return 1 + 0.1 * chainBonusLevel * (effective - 1);
}

function chainWindow(chainBonusLevel: number): number {
	return Math.min(CHAIN_WINDOW_MS + chainBonusLevel * 300, 6000);
}

function compoundingMultiplier(prestige: PrestigeData): number {
	if (!hasHabit(prestige, 'compounding')) return 1;
	const level = habitLevel(prestige, 'compounding');
	return Math.pow(2, level);
}

function nextMilestoneIncrement(milestonesReached: number): number {
	return (
		MILESTONE_STEP +
		Math.min(
			milestonesReached * MILESTONE_GROWTH_PER_MILESTONE,
			MILESTONE_GROWTH_CAP,
		)
	);
}

function nextTaskVarietyUnlockMilestone(
	currentMilestones: number,
	currentVarietyLevel: number,
): number {
	// Front-load first unlocks, then widen the gap for later tiers.
	const minGap = 1 + currentVarietyLevel;
	const maxGap = 2 + currentVarietyLevel * 2;
	const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
	return currentMilestones + gap;
}

function applyTaskVarietyUnlocks(
	currentLevel: number,
	milestonesReached: number,
	nextUnlockMilestone: number,
): { level: number; nextUnlockMilestone: number } {
	let level = currentLevel;
	let unlockMilestone = nextUnlockMilestone;

	while (level < TASK_VARIETY_MAX && milestonesReached >= unlockMilestone) {
		level += 1;
		unlockMilestone =
			level >= TASK_VARIETY_MAX
				? Number.MAX_SAFE_INTEGER
				: nextTaskVarietyUnlockMilestone(unlockMilestone, level);
	}

	return { level, nextUnlockMilestone: unlockMilestone };
}

function getBasePayout(interaction: InteractionType): number {
	switch (interaction) {
		case 'single-click':
			return SINGLE_CLICK_DOPAMINE;
		case 'double-click':
			return DOUBLE_CLICK_DOPAMINE;
		case 'long-click':
			return LONG_CLICK_DOPAMINE;
		case 'drag':
			return DRAG_DOPAMINE;
	}
}

function autoCompletableTypes(level: number): InteractionType[] {
	const types: InteractionType[] = [];
	if (level >= 1) types.push('single-click');
	if (level >= 2) types.push('double-click');
	if (level >= 3) types.push('drag', 'long-click');
	return types;
}

/** Select up to `count` spread-out targets from the task list. */
function selectSpreadTargets(
	tasks: Task[],
	types: InteractionType[],
	count: number,
	visibleRange?: { startIdx: number; endIdx: number },
): Task[] {
	const activeTasks = tasks.filter((task) => !task.isResolving);
	if (activeTasks.length === 0 || count <= 0) return [];

	// Determine the pool to pick from (prefer visible tasks)
	let pool = activeTasks;
	if (visibleRange && visibleRange.endIdx > visibleRange.startIdx) {
		const visibleStart = Math.max(0, visibleRange.startIdx);
		const visibleEnd = Math.min(activeTasks.length, visibleRange.endIdx);
		const visibleTasks = activeTasks.slice(visibleStart, visibleEnd);
		if (visibleTasks.length > 0) pool = visibleTasks;
	}

	const eligible = pool.filter((t) => types.includes(t.interaction));
	if (eligible.length === 0) {
		// Fallback to full list
		const allEligible = activeTasks.filter((t) =>
			types.includes(t.interaction),
		);
		if (allEligible.length === 0) return [];
		return allEligible.length <= count
			? allEligible
			: spreadPick(allEligible, count);
	}

	if (eligible.length <= count) return eligible;

	// For a single target, pick randomly from the middle half
	if (count === 1) {
		const quarter = Math.floor(eligible.length / 4);
		const lo = Math.max(0, quarter);
		const hi = Math.min(eligible.length - 1, eligible.length - 1 - quarter);
		const idx = lo + Math.floor(Math.random() * (hi - lo + 1));
		return [eligible[idx]];
	}

	return spreadPick(eligible, count);
}

function spreadPick(eligible: Task[], count: number): Task[] {
	const step = eligible.length / count;
	const jitterRange = Math.floor(step / 2);
	const result: Task[] = [];
	const usedIndices = new Set<number>();
	for (let i = 0; i < count; i++) {
		const center = Math.floor(step * i + step / 2);
		let idx = center;
		if (jitterRange > 0) {
			idx =
				center +
				Math.floor(Math.random() * (jitterRange * 2 + 1)) -
				jitterRange;
		}
		idx = Math.max(0, Math.min(idx, eligible.length - 1));
		// Avoid duplicates from jitter overlap
		while (usedIndices.has(idx) && idx < eligible.length - 1) idx++;
		if (usedIndices.has(idx)) {
			idx = center;
			while (usedIndices.has(idx) && idx > 0) idx--;
		}
		usedIndices.add(idx);
		result.push(eligible[idx]);
	}
	return result;
}

const STARTER_TASKS: Array<Pick<Task, 'name' | 'interaction'>> = [
	{ name: 'Enjoy some dopamine', interaction: 'single-click' },
	{ name: 'Decide to add a new task', interaction: 'single-click' },
	{ name: 'Master the long-press', interaction: 'long-click' },
];

const FIRST_GENERATED_GUIDE_TASK = 'Spend Dopamine in Settings on an upgrade';

function shouldInjectFirstGeneratedGuideTask(state: GameState): boolean {
	return (
		state.prestige.prestigeCount === 0 &&
		state.nextTaskId === STARTER_TASKS.length + 1 &&
		state.tasksCompletedThisRun >= STARTER_TASKS.length
	);
}

function computeUnlocks(state: GameState): HabitId[] {
	const unlocked = new Set<HabitId>(state.prestige.unlockedHabits);
	for (const h of ALL_HABITS) {
		if (h.alwaysUnlocked) unlocked.add(h.id);
	}
	if (state.maxChainThisRun >= 5) unlocked.add('flowState');
	if (state.longClicksCompletedThisRun >= 50) unlocked.add('hyperfocus');
	if (state.queueClearedThisRun) unlocked.add('inboxZero');
	if (state.prestige.prestigeCount >= 2) unlocked.add('compounding');
	return Array.from(unlocked);
}

// --- Store ---

export const useGameStore = create<GameState & GameActions>()(
	subscribeWithSelector((set, get) => ({
		...getInitialState(),

		generateTask: () => {
			const state = get();
			if (state.isCoolingDown || state.isPaused) return;

			const count = batchCount(state.upgrades.batchSpawn);
			const injectFirstGuideTask =
				shouldInjectFirstGeneratedGuideTask(state);
			const newTasks: Task[] = [];
			let id = state.nextTaskId;
			let previousName = state.tasks[state.tasks.length - 1]?.name;
			const recentNames = state.tasks
				.slice(-TASK_NAME_RECENT_AVOID_COUNT)
				.map((t) => t.name);
			let lastTaskId = '';
			for (let i = 0; i < count; i++) {
				const name =
					injectFirstGuideTask && i === 0
						? FIRST_GENERATED_GUIDE_TASK
						: randomTaskName(previousName, recentNames);
				lastTaskId = `task-${id}`;
				newTasks.push({
					id: lastTaskId,
					name,
					interaction: pickInteraction(state.upgrades.taskVariety),
					holdProgress: 0,
				});
				recentNames.push(name);
				if (recentNames.length > TASK_NAME_RECENT_AVOID_COUNT) {
					recentNames.shift();
				}
				previousName = name;
				id++;
			}

			const cd = getEffectiveCooldown(
				state.upgrades.spawnRate,
				state.prestige,
			);
			const shouldDismissInboxGuide = !state.prestige.inboxGuideDismissed;
			set({
				tasks: [...state.tasks, ...newTasks],
				nextTaskId: id,
				isCoolingDown: true,
				cooldownRemaining: cd,
				cooldownDuration: cd,
				pendingScrollToTask: lastTaskId,
				prestige: shouldDismissInboxGuide
					? {
							...state.prestige,
							inboxGuideDismissed: true,
						}
					: state.prestige,
			});
		},

		completeTask: (taskId: string) => {
			const state = get();
			if (state.isPaused) return;

			const task = state.tasks.find((t) => t.id === taskId);
			if (!task) return;
			if (task.isResolving) return;

			const effectiveHold = getEffectiveHoldMs(
				state.upgrades.holdReduction,
			);
			if (
				task.interaction === 'long-click' &&
				task.holdProgress < effectiveHold
			)
				return;

			let pay = getBasePayout(task.interaction);

			if (hasHabit(state.prestige, 'hyperfocus')) {
				pay *= Math.pow(2, habitLevel(state.prestige, 'hyperfocus'));
			}

			const newChainCount =
				state.chain.timeLeft > 0 ? state.chain.count + 1 : 1;

			if (newChainCount >= 2 && hasHabit(state.prestige, 'flowState')) {
				pay *= 1 + habitLevel(state.prestige, 'flowState');
			}

			const mult = chainMultiplier(
				newChainCount,
				state.upgrades.chainBonus,
			);
			pay = Math.floor(pay * mult);

			pay = Math.floor(pay * compoundingMultiplier(state.prestige));

			const remainingActiveTasks = state.tasks.filter(
				(t) => t.id !== taskId && !t.isResolving,
			);
			const resolvingTasks = state.tasks.map((t) =>
				t.id === taskId
					? {
							...t,
							holdProgress: 0,
							isResolving: true,
							resolveDelayMs: TASK_VICTORY_DELAY_MS,
							resolvedPayout: pay,
						}
					: t,
			);
			let newDopamine = state.dopamine + pay;

			const justCleared =
				remainingActiveTasks.length === 0 &&
				state.tasks.some((t) => !t.isResolving);
			let cleared = state.queueClearedThisRun;
			if (justCleared) {
				cleared = true;
				if (hasHabit(state.prestige, 'inboxZero')) {
					newDopamine +=
						INBOX_ZERO_BONUS *
						habitLevel(state.prestige, 'inboxZero');
				}
			}

			let nm = state.nextMilestone;
			let mr = state.milestonesReached;
			const newCountdowns = [...state.habitCountdowns];
			while (newDopamine >= nm && !state.isPrestiging) {
				mr++;
				const dur = getCountdownDuration(state.prestige);
				newCountdowns.push({
					id: `hc-${Date.now()}-${mr}`,
					remaining: dur,
					duration: dur,
				});
				nm += nextMilestoneIncrement(mr);
			}

			const taskVarietyUnlock = applyTaskVarietyUnlocks(
				state.upgrades.taskVariety,
				mr,
				state.taskVarietyNextUnlockMilestone,
			);
			const newUpgrades =
				taskVarietyUnlock.level !== state.upgrades.taskVariety
					? {
							...state.upgrades,
							taskVariety: taskVarietyUnlock.level,
						}
					: state.upgrades;

			const isLongClick = task.interaction === 'long-click';
			const newCounts = { ...state.interactionCountsThisRun };
			newCounts[task.interaction] =
				(newCounts[task.interaction] || 0) + 1;
			const newMaxChain = Math.max(state.maxChainThisRun, newChainCount);

			const nextState = {
				...state,
				maxChainThisRun: newMaxChain,
				longClicksCompletedThisRun:
					state.longClicksCompletedThisRun + (isLongClick ? 1 : 0),
				queueClearedThisRun: cleared,
			};
			const newUnlocked = computeUnlocks(nextState);

			set({
				tasks: resolvingTasks,
				dopamine: newDopamine,
				upgrades: newUpgrades,
				taskVarietyNextUnlockMilestone:
					taskVarietyUnlock.nextUnlockMilestone,
				chain: {
					count: newChainCount,
					timeLeft: chainWindow(state.upgrades.chainBonus),
				},
				nextMilestone: nm,
				milestonesReached: mr,
				tasksCompletedThisRun: state.tasksCompletedThisRun + 1,
				longClicksCompletedThisRun:
					state.longClicksCompletedThisRun + (isLongClick ? 1 : 0),
				habitCountdowns: newCountdowns,
				maxChainThisRun: newMaxChain,
				queueClearedThisRun: cleared,
				interactionCountsThisRun: newCounts,
				prestige: {
					...state.prestige,
					unlockedHabits: newUnlocked,
				},
				visibleTaskRange: { startIdx: 0, endIdx: 0 },
			});
		},

		startHold: (taskId: string) => {
			const state = get();
			if (state.isPaused) return;
			const task = state.tasks.find((t) => t.id === taskId);
			if (!task || task.interaction !== 'long-click') return;
			set({
				tasks: state.tasks.map((t) =>
					t.id === taskId
						? {
								...t,
								holdProgress: Math.max(t.holdProgress, 0.001),
							}
						: t,
				),
			});
		},

		cancelHold: (taskId: string) => {
			const state = get();
			set({
				tasks: state.tasks.map((t) =>
					t.id === taskId ? { ...t, holdProgress: 0 } : t,
				),
			});
		},

		purchaseUpgrade: (upgradeId: keyof UpgradeLevels) => {
			const state = get();
			if (state.isPaused) return;
			if (
				!isUpgradeVisible(
					upgradeId,
					state.upgrades,
					state.prestige.habitLevels,
				)
			)
				return;
			if (upgradeId === 'taskVariety') {
				return;
			}
			if (upgradeId === 'autoComplete') {
				if (!hasHabit(state.prestige, 'autoComplete')) return;
			}
			const level = state.upgrades[upgradeId];

			const cap = CAPPED_UPGRADES[upgradeId];
			if (cap !== undefined && level >= cap) return;

			let cost = upgradeCost(upgradeId, level);

			const mmLevel = habitLevel(state.prestige, 'muscleMemory');
			const applyMM = mmLevel > 0 && state.muscleMemoryUses < mmLevel;
			if (applyMM) {
				cost = Math.floor(cost / 2);
			}

			if (state.dopamine < cost) return;

			const newUpgrades = { ...state.upgrades, [upgradeId]: level + 1 };
			const updates: Partial<GameState> = {
				dopamine: state.dopamine - cost,
				upgrades: newUpgrades,
			};

			if (applyMM) {
				updates.muscleMemoryUses = state.muscleMemoryUses + 1;
			}

			if (upgradeId === 'spawnRate') {
				updates.cooldownDuration = getEffectiveCooldown(
					newUpgrades.spawnRate,
					state.prestige,
				);
			}

			set(updates);
		},

		purchaseHabit: (habitId: HabitId) => {
			const state = get();
			const def = ALL_HABITS.find((h) => h.id === habitId);
			if (!def) return;
			const currentLevel = habitLevel(state.prestige, habitId);
			if (habitId === 'autoComplete' && currentLevel >= 3) return;
			const cost = getHabitUpgradeCost(def, currentLevel);
			if (state.prestige.habitPoints < cost) return;

			set({
				prestige: {
					...state.prestige,
					habitPoints: state.prestige.habitPoints - cost,
					habitLevels: {
						...state.prestige.habitLevels,
						[habitId]: currentLevel + 1,
					},
				},
			});
		},

		doPrestige: () => {
			const state = get();

			const newLifetimeInteractions = {
				...state.prestige.lifetimeInteractionCounts,
			};
			for (const key of Object.keys(
				state.interactionCountsThisRun,
			) as InteractionType[]) {
				newLifetimeInteractions[key] =
					(newLifetimeInteractions[key] || 0) +
					(state.interactionCountsThisRun[key] || 0);
			}

			const prestige: PrestigeData = {
				...state.prestige,
				prestigeCount: state.prestige.prestigeCount + 1,
				lifetimeDopamine:
					state.prestige.lifetimeDopamine + state.dopamine,
				lifetimeTasksCompleted:
					state.prestige.lifetimeTasksCompleted +
					state.tasksCompletedThisRun,
				lifetimeLongClicks:
					(state.prestige.lifetimeLongClicks || 0) +
					state.longClicksCompletedThisRun,
				longestRunTasks: Math.max(
					state.prestige.longestRunTasks || 0,
					state.tasksCompletedThisRun,
				),
				lifetimeInteractionCounts: newLifetimeInteractions,
			};

			if (prestige.prestigeCount >= 2) {
				if (!prestige.unlockedHabits.includes('compounding')) {
					prestige.unlockedHabits = [
						...prestige.unlockedHabits,
						'compounding',
					];
				}
			}

			const ups = getStartingUpgrades(prestige);

			set({
				dopamine: 0,
				tasks: [],
				nextTaskId: 1,
				cooldownRemaining: 0,
				cooldownDuration: getEffectiveCooldown(ups.spawnRate, prestige),
				isCoolingDown: false,
				upgrades: ups,
				taskVarietyNextUnlockMilestone: nextTaskVarietyUnlockMilestone(
					0,
					ups.taskVariety,
				),
				chain: { count: 0, timeLeft: 0 },
				nextMilestone: MILESTONE_STEP,
				milestonesReached: 0,
				tasksCompletedThisRun: 0,
				longClicksCompletedThisRun: 0,
				habitCountdowns: [],
				prestige,
				muscleMemoryUses: 0,
				maxChainThisRun: 0,
				queueClearedThisRun: false,
				interactionCountsThisRun: { ...defaultInteractionCounts },
				autoGenTimer: 0,
				autoCompleteTimer: 0,
				autoCompleteTargetIds: [],
				pendingScrollToTask: null,
				isPrestiging: false,
				activeOnboarding: 'none',
			});
		},

		tick: (deltaMs: number) => {
			const state = get();
			if (state.isPaused) return;

			const updates: Partial<GameState> = {};

			// Cooldown tick
			if (state.isCoolingDown) {
				const remaining = state.cooldownRemaining - deltaMs;
				if (remaining <= 0) {
					updates.cooldownRemaining = 0;
					updates.isCoolingDown = false;
				} else {
					updates.cooldownRemaining = remaining;
				}
			}

			// Chain decay
			if (state.chain.timeLeft > 0) {
				const ct = state.chain.timeLeft - deltaMs;
				if (ct <= 0) {
					updates.chain = { count: 0, timeLeft: 0 };
				} else {
					updates.chain = { ...state.chain, timeLeft: ct };
				}
			}

			// Keep completed tasks visible briefly before removing them.
			if (state.tasks.some((task) => task.isResolving)) {
				const currentTasks = updates.tasks ?? state.tasks;
				updates.tasks = currentTasks
					.map((task) => {
						if (!task.isResolving) return task;
						const remaining = (task.resolveDelayMs ?? 0) - deltaMs;
						if (remaining <= 0) return null;
						return { ...task, resolveDelayMs: remaining };
					})
					.filter((task): task is Task => task !== null);
			}

			// Long-click hold progress
			const effectiveHold = getEffectiveHoldMs(
				state.upgrades.holdReduction,
			);
			const hasHolding = state.tasks.some(
				(t) =>
					t.interaction === 'long-click' &&
					t.holdProgress > 0 &&
					t.holdProgress < effectiveHold,
			);
			if (hasHolding) {
				updates.tasks = (updates.tasks ?? state.tasks).map((t) => {
					if (
						t.interaction === 'long-click' &&
						t.holdProgress > 0 &&
						t.holdProgress < effectiveHold
					) {
						return {
							...t,
							holdProgress: Math.min(
								t.holdProgress + deltaMs,
								effectiveHold,
							),
						};
					}
					return t;
				});
			}

			// Auto Generate
			if (state.upgrades.autoGenerate > 0) {
				const newTimer =
					(updates.autoGenTimer ?? state.autoGenTimer) - deltaMs;
				if (newTimer <= 0) {
					const count = batchCount(state.upgrades.batchSpawn);
					const currentTasks = updates.tasks ?? state.tasks;
					const newTasks: Task[] = [];
					let previousName =
						currentTasks[currentTasks.length - 1]?.name;
					const recentNames = currentTasks
						.slice(-TASK_NAME_RECENT_AVOID_COUNT)
						.map((t) => t.name);
					let id =
						'nextTaskId' in updates
							? (updates.nextTaskId as number)
							: state.nextTaskId;
					for (let i = 0; i < count; i++) {
						const name = randomTaskName(previousName, recentNames);
						newTasks.push({
							id: `task-${id}`,
							name,
							interaction: pickInteraction(
								state.upgrades.taskVariety,
							),
							holdProgress: 0,
						});
						recentNames.push(name);
						if (recentNames.length > TASK_NAME_RECENT_AVOID_COUNT) {
							recentNames.shift();
						}
						previousName = name;
						id++;
					}
					updates.tasks = [...currentTasks, ...newTasks];
					updates.nextTaskId = id;
					if (!state.prestige.inboxGuideDismissed) {
						updates.prestige = {
							...state.prestige,
							inboxGuideDismissed: true,
						};
					}
					updates.autoGenTimer = getAutoGenInterval(
						state.upgrades.autoGenerate,
					);
				} else {
					updates.autoGenTimer = newTimer;
				}
			}

			// Auto Complete
			const autoCompleteLevel = habitLevel(
				state.prestige,
				'autoComplete',
			);
			if (autoCompleteLevel > 0) {
				const newTimer =
					(updates.autoCompleteTimer ?? state.autoCompleteTimer) -
					deltaMs;
				if (newTimer <= 0) {
					const completerCount = 1 + state.upgrades.autoComplete;
					const types = autoCompletableTypes(autoCompleteLevel);
					const currentTasks = updates.tasks ?? state.tasks;
					const targets = selectSpreadTargets(
						currentTasks,
						types,
						completerCount,
						state.visibleTaskRange,
					);

					for (const target of targets) {
						const latestTasks = updates.tasks ?? state.tasks;
						// Skip if this task was already resolved by earlier iteration
						const live = latestTasks.find(
							(t) => t.id === target.id && !t.isResolving,
						);
						if (!live) continue;

						playFart(target.interaction);
						let pay = getBasePayout(target.interaction);

						if (hasHabit(state.prestige, 'hyperfocus')) {
							pay *= Math.pow(
								2,
								habitLevel(state.prestige, 'hyperfocus'),
							);
						}

						const chainState = updates.chain ?? state.chain;
						const newChainCount =
							chainState.timeLeft > 0 ? chainState.count + 1 : 1;

						if (
							newChainCount >= 2 &&
							hasHabit(state.prestige, 'flowState')
						) {
							pay *= 1 + habitLevel(state.prestige, 'flowState');
						}

						const mult = chainMultiplier(
							newChainCount,
							state.upgrades.chainBonus,
						);
						pay = Math.floor(pay * mult);

						pay = Math.floor(
							pay * compoundingMultiplier(state.prestige),
						);

						const afterTasks = latestTasks.map((task) =>
							task.id === target.id
								? {
										...task,
										holdProgress: 0,
										isResolving: true,
										resolveDelayMs: TASK_VICTORY_DELAY_MS,
										resolvedPayout: pay,
									}
								: task,
						);
						const remainingActiveTasks = afterTasks.filter(
							(task) => !task.isResolving,
						);
						const prevDopamine =
							(updates.dopamine as number) ?? state.dopamine;
						let newDopamine = prevDopamine + pay;

						const justCleared =
							remainingActiveTasks.length === 0 &&
							latestTasks.some((task) => !task.isResolving);
						let cleared =
							(updates.queueClearedThisRun as boolean) ??
							state.queueClearedThisRun;
						if (justCleared) {
							cleared = true;
							if (hasHabit(state.prestige, 'inboxZero')) {
								newDopamine +=
									INBOX_ZERO_BONUS *
									habitLevel(state.prestige, 'inboxZero');
							}
						}

						let nm =
							(updates.nextMilestone as number) ??
							state.nextMilestone;
						let mr =
							(updates.milestonesReached as number) ??
							state.milestonesReached;
						const cds = updates.habitCountdowns
							? [...updates.habitCountdowns]
							: [...state.habitCountdowns];
						while (newDopamine >= nm && !state.isPrestiging) {
							mr++;
							const dur = getCountdownDuration(state.prestige);
							cds.push({
								id: `hc-${Date.now()}-${mr}`,
								remaining: dur,
								duration: dur,
							});
							nm += nextMilestoneIncrement(mr);
						}

						const isLong = target.interaction === 'long-click';
						const prevCompleted =
							(updates.tasksCompletedThisRun as number) ??
							state.tasksCompletedThisRun;
						const prevLong =
							(updates.longClicksCompletedThisRun as number) ??
							state.longClicksCompletedThisRun;

						const newCounts = {
							...(updates.interactionCountsThisRun ??
								state.interactionCountsThisRun),
						};
						newCounts[target.interaction] =
							(newCounts[target.interaction] || 0) + 1;

						const newMaxChain = Math.max(
							(updates.maxChainThisRun as number) ??
								state.maxChainThisRun,
							newChainCount,
						);

						updates.tasks = afterTasks;
						updates.dopamine = newDopamine;
						updates.chain = {
							count: newChainCount,
							timeLeft: chainWindow(state.upgrades.chainBonus),
						};
						updates.nextMilestone = nm;
						updates.milestonesReached = mr;
						updates.tasksCompletedThisRun = prevCompleted + 1;
						updates.longClicksCompletedThisRun =
							prevLong + (isLong ? 1 : 0);
						updates.habitCountdowns = cds;
						updates.maxChainThisRun = newMaxChain;
						updates.queueClearedThisRun = cleared;
						updates.interactionCountsThisRun = newCounts;
					}
					updates.autoCompleteTimer = getAutoCompleteInterval(
						state.upgrades.clickSpeed,
					);
					// Compute next targets for all completers
					const nextTasks = updates.tasks ?? state.tasks;
					const nextTypes = autoCompletableTypes(autoCompleteLevel);
					updates.autoCompleteTargetIds = selectSpreadTargets(
						nextTasks,
						nextTypes,
						completerCount,
						state.visibleTaskRange,
					).map((t) => t.id);
				} else {
					updates.autoCompleteTimer = newTimer;
					// Ensure targets are set (e.g. after new task generated)
					if (state.autoCompleteTargetIds.length === 0) {
						const completerCount = 1 + state.upgrades.autoComplete;
						const curTasks = updates.tasks ?? state.tasks;
						const curTypes =
							autoCompletableTypes(autoCompleteLevel);
						const spread = selectSpreadTargets(
							curTasks,
							curTypes,
							completerCount,
							state.visibleTaskRange,
						);
						if (spread.length > 0) {
							updates.autoCompleteTargetIds = spread.map(
								(t) => t.id,
							);
						}
					}
				}
			} else if (
				state.autoCompleteTargetIds.length > 0 ||
				state.autoCompleteTimer > 0
			) {
				updates.autoCompleteTargetIds = [];
				updates.autoCompleteTimer = 0;
			}

			// Habit countdowns
			if (state.habitCountdowns.length > 0) {
				let hpEarned = 0;
				const remaining: HabitCountdown[] = [];
				const cds = updates.habitCountdowns ?? state.habitCountdowns;
				for (const cd of cds) {
					const r = cd.remaining - deltaMs;
					if (r <= 0) {
						hpEarned++;
					} else {
						remaining.push({ ...cd, remaining: r });
					}
				}
				updates.habitCountdowns = remaining;
				if (hpEarned > 0) {
					const prevPrestige =
						(updates.prestige as PrestigeData) ?? state.prestige;
					const unlockedHabitGuide =
						!prevPrestige.habitPointGuideUnlocked;
					updates.prestige = {
						...prevPrestige,
						habitPoints: prevPrestige.habitPoints + hpEarned,
						habitPointGuideUnlocked:
							prevPrestige.habitPointGuideUnlocked ||
							hpEarned > 0,
					};
					if (unlockedHabitGuide && !prevPrestige.prestigeGuideSeen) {
						updates.activeOnboarding = 'prestige';
					}
				}
			}

			if (Object.keys(updates).length > 0) {
				set(updates);
			}
		},

		setPaused: (paused: boolean) => {
			set({ isPaused: paused });
		},

		setIsPrestiging: (isPrestiging: boolean) => {
			set({ isPrestiging });
		},

		clearPendingScroll: () => {
			set({ pendingScrollToTask: null });
		},

		setVisibleTaskRange: (startIdx: number, endIdx: number) => {
			set({ visibleTaskRange: { startIdx, endIdx } });
		},

		dismissInboxGuide: () => {
			const state = get();
			if (state.prestige.inboxGuideDismissed) return;
			set({
				prestige: {
					...state.prestige,
					inboxGuideDismissed: true,
				},
			});
		},

		openOnboarding: (overlay: Exclude<OnboardingOverlay, 'none'>) => {
			set({ activeOnboarding: overlay });
		},

		completeIntroOnboarding: () => {
			const state = get();
			set({
				activeOnboarding: 'none',
				prestige: {
					...state.prestige,
					introSeen: true,
				},
			});
		},

		completePrestigeOnboarding: () => {
			const state = get();
			set({
				activeOnboarding: 'none',
				prestige: {
					...state.prestige,
					prestigeGuideSeen: true,
					habitPointGuideUnlocked: true,
				},
			});
		},
	})),
);

// Export constants for components
export {
	LONG_CLICK_HOLD_MS,
	CHAIN_WINDOW_MS,
	HABIT_COUNTDOWN_BASE_MS,
	DOUBLE_CLICK_WINDOW_MS,
	TASK_VARIETY_MAX,
	AUTO_COMPLETE_MAX,
};

// Subscribe to all state changes and persist
useGameStore.subscribe(
	(state) => state,
	(state) => saveState(state),
);
