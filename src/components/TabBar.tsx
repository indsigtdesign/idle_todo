import { useGameStore } from '../store';

interface TabBarProps {
	activeTab: string;
	onTabChange: (tab: string) => void;
}

const tabs = [
	{ id: 'inbox', label: 'Inbox' },
	{ id: 'archive', label: 'Archive' },
	{ id: 'settings', label: 'Settings' },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
	const habitPoints = useGameStore((s) => s.prestige.habitPoints);
	const habitCountdowns = useGameStore((s) => s.habitCountdowns);

	// Badge: progress of the most advanced countdown, or static dot when HP > 0
	const activeCD =
		habitCountdowns.length > 0
			? habitCountdowns.reduce((best, cd) => {
					const progress = 1 - cd.remaining / cd.duration;
					const bestProgress = 1 - best.remaining / best.duration;
					return progress > bestProgress ? cd : best;
				})
			: null;
	const badgeProgress = activeCD
		? 1 - activeCD.remaining / activeCD.duration
		: 0;
	const showBadge = habitCountdowns.length > 0 || habitPoints > 0;

	return (
		<nav className="flex items-stretch border-t border-slate-200 bg-white">
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;
				const Icon =
					tab.id === 'inbox'
						? InboxIcon
						: tab.id === 'archive'
							? ArchiveIcon
							: SettingsIcon;
				return (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-200 ${
							isActive
								? 'text-indigo-500'
								: 'text-slate-400 hover:text-slate-600'
						}`}
					>
						<div className="relative">
							<Icon className="w-5 h-5" />
							{tab.id === 'archive' && showBadge && (
								<span className="absolute -top-1 -right-1.5">
									<HabitBadge
										progress={badgeProgress}
										hasPoints={habitPoints > 0}
										countdownActive={
											habitCountdowns.length > 0
										}
									/>
								</span>
							)}
						</div>
						<span className="text-[11px] font-medium">
							{tab.label}
						</span>
					</button>
				);
			})}
		</nav>
	);
}

// Habit badge — small SVG circle that fills via arc
function HabitBadge({
	progress,
	hasPoints,
	countdownActive,
}: {
	progress: number;
	hasPoints: boolean;
	countdownActive: boolean;
}) {
	const size = 12;
	const r = size / 2 - 1.5 / 2; // radius minus half stroke width for proper fit
	const cx = size / 2;
	const cy = size / 2;

	// When no active countdown but HP earned: solid indigo dot
	if (!countdownActive && hasPoints) {
		return (
			<svg width={size} height={size}>
				<circle cx={cx} cy={cy} r={r} fill="#6366f1" />
			</svg>
		);
	}

	// Arc path for countdown progress
	const angle = progress * 360;
	const rad = (angle - 90) * (Math.PI / 180);
	const x = cx + r * Math.cos(rad);
	const y = cy + r * Math.sin(rad);
	const largeArc = angle > 180 ? 1 : 0;

	return (
		<svg width={size} height={size}>
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke="#c7d2fe"
				strokeWidth={1.5}
			/>
			{progress > 0.01 && (
				<path
					d={`M${cx},${cy - r} A${r},${r} 0 ${largeArc},1 ${x},${y}`}
					fill="none"
					stroke="#6366f1"
					strokeWidth={1.5}
					strokeLinecap="round"
				/>
			)}
		</svg>
	);
}

// --- Inline SVG icons (keeps deps minimal) ---

function InboxIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
			<path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
		</svg>
	);
}

function ArchiveIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="2" y="3" width="20" height="5" rx="1" />
			<path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
			<line x1="10" y1="12" x2="14" y2="12" />
		</svg>
	);
}

function SettingsIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	);
}
