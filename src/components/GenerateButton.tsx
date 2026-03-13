import { useGameStore, getAutoGenInterval } from '../store';

export default function GenerateButton() {
	const generateTask = useGameStore((s) => s.generateTask);
	const isCoolingDown = useGameStore((s) => s.isCoolingDown);
	const cooldownRemaining = useGameStore((s) => s.cooldownRemaining);
	const cooldownDuration = useGameStore((s) => s.cooldownDuration);
	const autoGenLevel = useGameStore((s) => s.upgrades.autoGenerate);
	const autoGenTimer = useGameStore((s) => s.autoGenTimer);

	const progress = isCoolingDown
		? 1 - cooldownRemaining / cooldownDuration
		: 0;
	const circumference = 2 * Math.PI * 18; // radius 18

	// Auto-generate ring
	const isAutoGen = autoGenLevel > 0;
	const autoGenInterval = isAutoGen ? getAutoGenInterval(autoGenLevel) : 0;
	const autoGenProgress =
		isAutoGen && autoGenInterval > 0
			? 1 - autoGenTimer / autoGenInterval
			: 0;
	const outerR = 24;
	const outerCirc = 2 * Math.PI * outerR;

	return (
		<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
			<div className="relative">
				{/* Auto-generate ring (outer, with padding) */}
				{isAutoGen && (
					<svg
						className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] -rotate-90"
						viewBox="0 0 56 56"
					>
						<circle
							cx="28"
							cy="28"
							r={outerR}
							fill="none"
							stroke="rgba(99,102,241,0.15)"
							strokeWidth="2"
						/>
						<circle
							cx="28"
							cy="28"
							r={outerR}
							fill="none"
							stroke="rgb(99,102,241)"
							strokeWidth="2"
							strokeDasharray={outerCirc}
							strokeDashoffset={outerCirc * (1 - autoGenProgress)}
							strokeLinecap="round"
							className="transition-[stroke-dashoffset] duration-75 ease-linear"
						/>
					</svg>
				)}
				<button
					onClick={generateTask}
					disabled={isCoolingDown}
					className="relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500 text-white shadow-md hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
					aria-label="Generate new task"
				>
					{/* Radial cooldown overlay */}
					{isCoolingDown && (
						<svg
							className="absolute inset-0 w-full h-full -rotate-90"
							viewBox="0 0 40 40"
						>
							<circle
								cx="20"
								cy="20"
								r="18"
								fill="none"
								stroke="rgba(255,255,255,0.3)"
								strokeWidth="2.5"
								strokeDasharray={circumference}
								strokeDashoffset={
									circumference * (1 - progress)
								}
								strokeLinecap="round"
								className="transition-[stroke-dashoffset] duration-75 ease-linear"
							/>
						</svg>
					)}

					{/* Plus icon */}
					<svg
						className="w-6 h-6 relative z-10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
				</button>
			</div>
		</div>
	);
}
