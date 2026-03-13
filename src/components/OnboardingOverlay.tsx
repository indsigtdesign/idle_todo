interface OnboardingOverlayProps {
	variant: 'intro' | 'prestige';
	onComplete: () => void;
}

const interactionChips = [
	{ label: 'tap', desc: 'mark complete' },
	{ label: 'x2', desc: 'double-confirm' },
	{ label: 'hold', desc: 'deep work required' },
	{ label: 'swipe', desc: 'file and forget' },
];

export default function OnboardingOverlay({
	variant,
	onComplete,
}: OnboardingOverlayProps) {
	const isIntro = variant === 'intro';

	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
			<div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
				<p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
					{isIntro ? 'Getting started' : 'Something has changed'}
				</p>

				<h2 className="mt-1 text-lg font-semibold text-slate-900">
					{isIntro
						? 'Your workspace is ready'
						: 'You have a Habit Point'}
				</h2>

				{isIntro ? (
					<>
						<p className="mt-2 text-sm text-slate-500">
							Generate tasks. Complete them the way they ask. Earn
							dopamine. Spend it on anything that makes this
							easier.
						</p>

						<div className="mt-3 grid grid-cols-2 gap-2">
							{interactionChips.map((chip) => (
								<div
									key={chip.label}
									className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
								>
									<p className="text-xs font-semibold text-slate-700">
										{chip.label}
									</p>
									<p className="mt-0.5 text-[11px] text-slate-500">
										{chip.desc}
									</p>
								</div>
							))}
						</div>

						<p className="mt-3 text-xs text-slate-400">
							More features surface as you go.
						</p>
					</>
				) : (
					<>
						<p className="mt-2 text-sm text-slate-500">
							Habit Points are spent when you Archive Everything.
						</p>

						<ul className="mt-3 space-y-2 text-sm text-slate-600">
							<li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
								Archiving resets your run. Your Habits stay.
							</li>
							<li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
								The Archive badge tells you when points are
								waiting.
							</li>
						</ul>
					</>
				)}

				<button
					type="button"
					onClick={onComplete}
					className="mt-4 w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-600"
				>
					{isIntro ? 'Begin' : 'Understood'}
				</button>
			</div>
		</div>
	);
}
