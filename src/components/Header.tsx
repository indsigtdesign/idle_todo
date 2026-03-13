import { useGameStore } from '../store';

export default function Header() {
	const dopamine = useGameStore((s) => s.dopamine);
	const chain = useGameStore((s) => s.chain);
	const chainBonusLevel = useGameStore((s) => s.upgrades.chainBonus);

	const showFlow =
		chain.count > 1 && chain.timeLeft > 0 && chainBonusLevel > 0;
	const mult = showFlow
		? 1 + 0.1 * chainBonusLevel * (Math.min(chain.count, 10) - 1)
		: 1;
	const streakProgress = Math.min(chain.count, 10) / 10;

	return (
		<header className="px-4 py-3 border-b border-slate-200 bg-white">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
						Workspace
					</p>
					<h1 className="text-base font-semibold text-slate-900 truncate">
						Inbox
					</h1>
				</div>
				<div className="flex items-center gap-1.5">
					<ChromeButton label="Search tasks">
						<SearchIcon className="w-4 h-4" />
					</ChromeButton>
					<ChromeButton label="Filter tasks">
						<FilterIcon className="w-4 h-4" />
					</ChromeButton>
					<ChromeButton label="Sort tasks">
						<SortIcon className="w-4 h-4" />
					</ChromeButton>
					<button
						type="button"
						className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600"
						aria-label="Profile"
					>
						PD
					</button>
				</div>
			</div>
			<div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
				<div className="inline-flex items-center gap-2 min-w-0">
					<StreakBadge
						progress={streakProgress}
						active={showFlow}
						multiplier={mult}
					/>
					<span className="truncate">
						{showFlow
							? 'Focus session active'
							: 'All changes saved'}
					</span>
				</div>
				<div className="inline-flex items-center gap-1.5">
					<span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 tabular-nums">
						Dopamine {dopamine}
					</span>
					<button
						type="button"
						className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
					>
						Today
					</button>
				</div>
			</div>
		</header>
	);
}

function ChromeButton({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors duration-150 hover:text-slate-700"
			aria-label={label}
		>
			{children}
		</button>
	);
}

function StreakBadge({
	progress,
	active,
	multiplier,
}: {
	progress: number;
	active: boolean;
	multiplier: number;
}) {
	const size = 24;
	const ringStroke = 1.8;
	const r = size / 2 - ringStroke / 2;
	const cx = size / 2;
	const cy = size / 2;
	const angle = Math.max(0.02, progress) * 360;
	const rad = (angle - 90) * (Math.PI / 180);
	const x = cx + r * Math.cos(rad);
	const y = cy + r * Math.sin(rad);
	const largeArc = angle > 180 ? 1 : 0;
	const multiplierLabel = `${multiplier.toFixed(1)}x`;

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			role="img"
			aria-label={`Multiplier ${multiplierLabel}`}
		>
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke={active ? '#bfdbfe' : '#d1d5db'}
				strokeWidth={ringStroke}
			/>
			<path
				d={`M${cx},${cy - r} A${r},${r} 0 ${largeArc},1 ${x},${y}`}
				fill="none"
				stroke={active ? '#2563eb' : '#9ca3af'}
				strokeWidth={ringStroke}
				strokeLinecap="round"
			/>
			<text
				x={cx}
				y={cy + 2.2}
				textAnchor="middle"
				fontSize="7"
				fontWeight="700"
				fill={active ? '#1d4ed8' : '#64748b'}
			>
				{multiplierLabel}
			</text>
		</svg>
	);
}

function SearchIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="11" cy="11" r="7" />
			<line x1="16.65" y1="16.65" x2="21" y2="21" />
		</svg>
	);
}

function FilterIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3" />
		</svg>
	);
}

function SortIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="6" y1="7" x2="18" y2="7" />
			<line x1="9" y1="12" x2="15" y2="12" />
			<line x1="11" y1="17" x2="13" y2="17" />
		</svg>
	);
}
