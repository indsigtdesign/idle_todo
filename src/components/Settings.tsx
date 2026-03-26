import { useState } from 'react';
import {
	useGameStore,
	upgradeCost,
	upgradeMaxLevel,
	isUpgradeVisible,
	ALL_HABITS,
	getHabitEffectSummary,
} from '../store';
import type { UpgradeLevels } from '../store';

const UPGRADE_META: {
	id: keyof UpgradeLevels;
	label: string;
	tree: string;
	desc: string;
}[] = [
	{
		id: 'spawnRate',
		label: 'Spawn Rate',
		tree: 'Generation',
		desc: 'Reduces generate cooldown',
	},
	{
		id: 'batchSpawn',
		label: 'Batch Spawn',
		tree: 'Generation',
		desc: 'Chance to spawn multiple tasks',
	},
	{
		id: 'autoGenerate',
		label: 'Auto Generate',
		tree: 'Generation',
		desc: 'Tasks spawn automatically',
	},
	{
		id: 'clickSpeed',
		label: 'Click Speed',
		tree: 'Completion',
		desc: 'Speeds up auto-complete interval',
	},
	{
		id: 'autoComplete',
		label: 'Auto Completers',
		tree: 'Completion',
		desc: 'Run additional task completers in parallel',
	},
	{
		id: 'holdReduction',
		label: 'Hold Reduction',
		tree: 'Completion',
		desc: 'Shortens long-click hold time',
	},
	{
		id: 'chainBonus',
		label: 'Chain Bonus',
		tree: 'Completion',
		desc: 'Multiplies payout for quick chains',
	},
];

export default function Settings() {
	const dopamine = useGameStore((s) => s.dopamine);
	const upgrades = useGameStore((s) => s.upgrades);
	const purchaseUpgrade = useGameStore((s) => s.purchaseUpgrade);
	const prestige = useGameStore((s) => s.prestige);
	const prestigeCount = useGameStore((s) => s.prestige.prestigeCount);
	const openOnboarding = useGameStore((s) => s.openOnboarding);
	const habitCountdowns = useGameStore((s) => s.habitCountdowns);
	const [showGuide, setShowGuide] = useState(false);

	return (
		<div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
			{/* Upgrade Trees */}
			<section>
				<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
					Specialisations
				</h2>
				<div className="space-y-2">
					{/*<div className="px-4 py-3 bg-white rounded-lg border border-slate-100">
						<p className="text-sm font-medium text-slate-800">
							Task Variety
						</p>
						<p className="text-xs text-slate-500 mt-0.5">
							Unlocked automatically by milestone progress with
							jitter.
						</p>
						<p className="text-xs text-slate-500 mt-0.5 tabular-nums">
							Level {taskVarietyLevel} / 3
						</p>
						<p className="text-xs text-indigo-500 mt-1">
							{varietyAtMax
								? 'All interaction types are unlocked.'
								: `Next unlock around milestone ${taskVarietyNextUnlockMilestone} (current ${milestonesReached})`}
						</p>
					</div>*/}

					{UPGRADE_META.map((u) => {
						const visible = isUpgradeVisible(
							u.id,
							upgrades,
							prestige.habitLevels,
						);
						if (!visible) return null;
						const level = upgrades[u.id];
						const max = upgradeMaxLevel(u.id);
						const isMaxed = max !== null && level >= max;
						const cost = upgradeCost(u.id, level);
						const canAfford = dopamine >= cost && !isMaxed;
						return (
							<div
								key={u.id}
								className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-100"
							>
								<div className="min-w-0 flex-1 mr-3">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium text-slate-800">
											{u.label}
										</span>
										<span className="text-[10px] font-medium text-slate-400 uppercase">
											{u.tree}
										</span>
									</div>
									<p className="text-xs text-slate-400 mt-0.5">
										{u.desc}
									</p>
									<p className="text-xs text-slate-500 mt-0.5 tabular-nums">
										Level {level}
										{max !== null ? ` / ${max}` : ''}
									</p>
								</div>
								{isMaxed ? (
									<span className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-green-500">
										MAX
									</span>
								) : (
									<button
										onClick={() => purchaseUpgrade(u.id)}
										disabled={!canAfford}
										className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-500 text-white hover:bg-indigo-600"
									>
										{cost}D
									</button>
								)}
							</div>
						);
					})}
				</div>
			</section>

			{/* Habits (only show owned) */}
			{Object.keys(prestige.habitLevels).length > 0 && (
				<section>
					<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
						Habits
						<span className="ml-2 text-indigo-500 font-bold">
							{prestige.habitPoints}H
						</span>
					</h2>
					<div className="space-y-2">
						{ALL_HABITS.filter(
							(h) => (prestige.habitLevels[h.id] ?? 0) >= 1,
						).map((h) => {
							const lvl = prestige.habitLevels[h.id] ?? 0;
							const effect = getHabitEffectSummary(
								h.id,
								lvl,
								prestigeCount,
							);
							return (
								<div
									key={h.id}
									className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-100"
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
									<span className="text-xs font-semibold text-indigo-500">
										Lv {lvl}
									</span>
								</div>
							);
						})}
					</div>
					{habitCountdowns.length > 0 && (
						<p className="text-xs text-slate-400 mt-2 px-1">
							{habitCountdowns.length} countdown
							{habitCountdowns.length !== 1 ? 's' : ''} active
						</p>
					)}
				</section>
			)}

			{/* Info */}
			{/*<section>
				<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
					Settings
				</h2>
				<div className="space-y-2">
					<div className="px-4 py-3 bg-white rounded-lg border border-slate-100">
						<span className="text-sm text-slate-600">
							Version 0.4.0 — Phase 4
						</span>
					</div>
				</div>
			</section>*/}

			<section>
				<h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
					Guide
				</h2>
				<div className="space-y-2">
					<div className="px-4 py-3 bg-white rounded-lg border border-slate-100">
						<p className="text-sm font-medium text-slate-800">
							How it works
						</p>
						<p className="text-xs text-slate-500 mt-0.5">
							Generate tasks. Complete them the way they ask.
							Spend dopamine on upgrades.
						</p>
						{prestige.habitPointGuideUnlocked && (
							<p className="text-xs text-slate-500 mt-1">
								Habit Points accumulate over time. Spend them
								before you Archive Everything.
							</p>
						)}
						<div className="mt-3 flex items-center gap-2">
							<button
								type="button"
								onClick={() => openOnboarding('intro')}
								className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
							>
								Replay intro
							</button>
							{prestige.habitPointGuideUnlocked && (
								<button
									type="button"
									onClick={() => openOnboarding('prestige')}
									className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
								>
									Habit Points
								</button>
							)}
							<button
								type="button"
								onClick={() => setShowGuide((v) => !v)}
								className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-700"
							>
								{showGuide ? 'Hide details' : 'Show details'}
							</button>
						</div>
						{showGuide && (
							<ul className="mt-3 space-y-1.5 text-xs text-slate-500">
								<li>
									Each task badge tells you the required
									interaction.
								</li>
								<li>
									Generation and Completion upgrades work best
									together.
								</li>
								<li>
									Task Variety unlocks passively as milestone
									progress increases.
								</li>
								<li>
									Dopamine milestones start countdowns that
									become Habit Points.
								</li>
								<li>
									Automation tiers are purchased in Archive
									using Habit Points.
								</li>
								<li>
									Habit levels are uncapped and each level
									stacks its effect.
								</li>
								<li>
									Archiving from the Archive tab resets your
									run. Purchased Habits carry over.
								</li>
							</ul>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
