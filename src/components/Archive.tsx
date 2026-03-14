import { useState } from 'react';
import {
	useGameStore,
	ALL_HABITS,
	getHabitUpgradeCost,
	getHabitEffectSummary,
} from '../store';
import type { InteractionType } from '../store';

const INTERACTION_LABELS: Record<InteractionType, string> = {
	'single-click': 'Single Click',
	'double-click': 'Double Click',
	'long-click': 'Long Click',
	drag: 'Drag',
};

function favouriteInteraction(counts: Record<InteractionType, number>): string {
	let best: InteractionType = 'single-click';
	let max = 0;
	for (const [key, val] of Object.entries(counts)) {
		if (val > max) {
			max = val;
			best = key as InteractionType;
		}
	}
	return max === 0 ? '—' : INTERACTION_LABELS[best];
}

export default function Archive() {
	const dopamine = useGameStore((s) => s.dopamine);
	const tasksCompleted = useGameStore((s) => s.tasksCompletedThisRun);
	const longClicks = useGameStore((s) => s.longClicksCompletedThisRun);
	const milestones = useGameStore((s) => s.milestonesReached);
	const maxChain = useGameStore((s) => s.maxChainThisRun);
	const interactionCounts = useGameStore((s) => s.interactionCountsThisRun);
	const habitCountdowns = useGameStore((s) => s.habitCountdowns);
	const prestige = useGameStore((s) => s.prestige);
	const prestigeCount = useGameStore((s) => s.prestige.prestigeCount);
	const purchaseHabit = useGameStore((s) => s.purchaseHabit);
	const doPrestige = useGameStore((s) => s.doPrestige);
	const setIsPrestiging = useGameStore((s) => s.setIsPrestiging);

	const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
	const [prestigeStep, setPrestigeStep] = useState<'confirm' | 'shop'>(
		'confirm',
	);
	const compoundingDef = ALL_HABITS.find(
		(habit) => habit.id === 'compounding',
	);
	const currentCompoundingLevel = prestige.habitLevels.compounding ?? 0;
	const currentCompoundingMultiplier = Math.pow(2, currentCompoundingLevel);
	let projectedCompoundingLevel = currentCompoundingLevel;
	let projectedPoints = prestige.habitPoints;
	if (compoundingDef) {
		while (
			projectedPoints >=
			getHabitUpgradeCost(compoundingDef, projectedCompoundingLevel)
		) {
			projectedPoints -= getHabitUpgradeCost(
				compoundingDef,
				projectedCompoundingLevel,
			);
			projectedCompoundingLevel += 1;
		}
	}
	const projectedCompoundingMultiplier = Math.pow(
		2,
		projectedCompoundingLevel,
	);
	const projectedSpeedBoostPct = Math.max(
		0,
		Math.round(
			(projectedCompoundingMultiplier / currentCompoundingMultiplier -
				1) *
				100,
		),
	);
	const potentialHabitPoints = prestige.habitPoints;

	const startPrestige = () => {
		setPrestigeStep('confirm');
		setShowPrestigeConfirm(true);
	};

	const finishPrestige = () => {
		doPrestige();
		setShowPrestigeConfirm(false);
	};

	const hasJournaling = (prestige.habitLevels['journaling'] ?? 0) >= 1;

	const runStats = [
		{ label: 'Tasks Completed', value: tasksCompleted },
		{ label: 'Dopamine Earned', value: dopamine },
		{ label: 'Best Chain', value: maxChain },
		{ label: 'Long Clicks Done', value: longClicks },
		{ label: 'Milestones Reached', value: milestones },
	];

	if (hasJournaling) {
		runStats.push({
			label: 'Favourite Interaction',
			value: favouriteInteraction(interactionCounts) as unknown as number,
		});
	}

	// Combine lifetime + current run for total counts
	const totalInteractions: Record<InteractionType, number> = {
		...prestige.lifetimeInteractionCounts,
	};
	for (const [k, v] of Object.entries(interactionCounts)) {
		totalInteractions[k as InteractionType] =
			(totalInteractions[k as InteractionType] || 0) + v;
	}

	const lifetimeStats: { label: string; value: number | string }[] = [
		{
			label: 'Lifetime Dopamine',
			value: prestige.lifetimeDopamine + dopamine,
		},
		{
			label: 'Lifetime Tasks',
			value: prestige.lifetimeTasksCompleted + tasksCompleted,
		},
		{ label: 'Prestige Runs', value: prestige.prestigeCount },
		{
			label: 'Longest Run',
			value: Math.max(prestige.longestRunTasks || 0, tasksCompleted),
		},
		{
			label: 'Favourite Interaction',
			value: favouriteInteraction(totalInteractions),
		},
		{
			label: 'Habits Discovered',
			value: `${prestige.unlockedHabits?.length ?? 0} / ${ALL_HABITS.length}`,
		},
		{
			label: 'Habits Owned',
			value: Object.values(prestige.habitLevels).filter(
				(v) => (v ?? 0) >= 1,
			).length,
		},
	];

	return (
		<div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
			<section>
				<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
					Current Run
				</h2>
				<div className="space-y-2">
					{runStats.map((stat) => (
						<div
							key={stat.label}
							className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-100"
						>
							<span className="text-sm text-slate-600">
								{stat.label}
							</span>
							<span className="text-sm font-semibold text-slate-900 tabular-nums">
								{stat.value}
							</span>
						</div>
					))}
				</div>
			</section>

			<section>
				<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
					Archive Run
				</h2>
				<div className="space-y-2">
					<div className="px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-100">
						<p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
							Potential Power
						</p>
						<p className="text-sm font-medium text-indigo-900 mt-1">
							Archiving now secures +{potentialHabitPoints} Habit
							Point
							{potentialHabitPoints === 1 ? '' : 's'} and can
							speed up your next run by about{' '}
							{projectedSpeedBoostPct}%.
						</p>
						{habitCountdowns.length > 0 && (
							<p className="text-xs text-indigo-600 mt-1">
								{habitCountdowns.length} countdown
								{habitCountdowns.length === 1 ? '' : 's'} still
								running in this run.
							</p>
						)}
					</div>
					<div className="px-4 py-3 bg-white rounded-lg border border-slate-100">
						<p className="text-sm font-medium text-slate-800">
							Reset this run, keep your Habits
						</p>
						<p className="text-xs text-slate-500 mt-0.5">
							Spend your Habit Points before archiving.
						</p>
						<p className="text-xs text-slate-500 mt-1">
							Available:{' '}
							<span className="font-semibold text-indigo-500">
								{prestige.habitPoints}H
							</span>
						</p>
					</div>
					<button
						className="w-full px-4 py-3 bg-white rounded-lg border border-slate-100 text-left text-sm text-red-500 hover:bg-red-50 transition-colors duration-200"
						onClick={startPrestige}
					>
						End of Day
					</button>
				</div>
			</section>

			<section>
				<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
					Lifetime
				</h2>
				<div className="space-y-2">
					{lifetimeStats.map((stat) => (
						<div
							key={stat.label}
							className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-100"
						>
							<span className="text-sm text-slate-600">
								{stat.label}
							</span>
							<span className="text-sm font-semibold text-slate-900 tabular-nums">
								{stat.value}
							</span>
						</div>
					))}
				</div>
			</section>

			{showPrestigeConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className="bg-white rounded-xl shadow-lg p-6 mx-6 max-w-sm w-full space-y-4">
						{prestigeStep === 'confirm' ? (
							<>
								<h3 className="text-base font-semibold text-slate-900">
									Archive Everything?
								</h3>
								<p className="text-sm text-slate-500">
									All progress will be reset. You'll be able
									to spend your{' '}
									<span className="font-semibold text-indigo-500">
										{prestige.habitPoints}H
									</span>{' '}
									on Habits before the reset.
								</p>
								<div className="flex gap-3">
									<button
										onClick={() =>
											setShowPrestigeConfirm(false)
										}
										className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={() => {
											setIsPrestiging(true);
											setPrestigeStep('shop');
										}}
										className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
									>
										Continue
									</button>
								</div>
							</>
						) : (
							<>
								<h3 className="text-base font-semibold text-slate-900">
									Spend Habit Points
								</h3>
								<p className="text-xs text-slate-400">
									Available:{' '}
									<span className="font-semibold text-indigo-500">
										{prestige.habitPoints}H
									</span>
								</p>
								<div className="space-y-2 max-h-60 overflow-y-auto">
									{ALL_HABITS.filter(
										(h) =>
											h.alwaysUnlocked ||
											prestige.unlockedHabits.includes(
												h.id,
											),
									).map((h) => {
										const currentLvl =
											prestige.habitLevels[h.id] ?? 0;
										const effect = getHabitEffectSummary(
											h.id,
											currentLvl,
											prestigeCount,
										);
										const upgradeCostH =
											getHabitUpgradeCost(h, currentLvl);
										const canAfford =
											prestige.habitPoints >=
											upgradeCostH;
										return (
											<div
												key={h.id}
												className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100"
											>
												<div className="min-w-0 flex-1 mr-3">
													<span className="text-sm font-medium text-slate-800">
														{h.name}
													</span>
													<p className="text-xs text-slate-500 mt-0.5">
														{effect.current}
													</p>
													<p className="text-xs text-slate-400 mt-0.5">
														{effect.next}
													</p>
												</div>
												<div className="flex-shrink-0 flex flex-col items-end gap-1">
													{currentLvl > 0 && (
														<span className="text-[10px] font-medium text-indigo-400">
															Lv {currentLvl}
														</span>
													)}
													<button
														onClick={() =>
															purchaseHabit(h.id)
														}
														disabled={!canAfford}
														className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-500 text-white hover:bg-indigo-600"
													>
														{upgradeCostH}H
													</button>
												</div>
											</div>
										);
									})}
								</div>
								<button
									onClick={finishPrestige}
									className="w-full py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
								>
									Archive &amp; Reset
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
