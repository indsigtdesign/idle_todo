import { useGameStore } from '../store';
import TaskCard from './TaskCard';
import GenerateButton from './GenerateButton';
import { useEffect, useRef } from 'react';

export default function Inbox() {
	const tasks = useGameStore((s) => s.tasks);
	const prestige = useGameStore((s) => s.prestige);
	const dismissInboxGuide = useGameStore((s) => s.dismissInboxGuide);
	const pendingScrollToTask = useGameStore((s) => s.pendingScrollToTask);
	const clearPendingScroll = useGameStore((s) => s.clearPendingScroll);
	const setVisibleTaskRange = useGameStore((s) => s.setVisibleTaskRange);
	const containerRef = useRef<HTMLDivElement>(null);

	// Calculate and update visible task range whenever tasks change or on scroll
	useEffect(() => {
		const updateVisibleRange = () => {
			if (!containerRef.current) return;

			const container = containerRef.current;
			const taskElements =
				container.querySelectorAll('[data-task-index]');

			if (taskElements.length === 0) {
				setVisibleTaskRange(0, 0);
				return;
			}

			const containerRect = container.getBoundingClientRect();
			let firstVisibleIndex = -1;
			let lastVisibleIndex = -1;

			for (let i = 0; i < taskElements.length; i++) {
				const element = taskElements[i] as HTMLElement;
				const rect = element.getBoundingClientRect();
				const isVisible =
					rect.top < containerRect.bottom &&
					rect.bottom > containerRect.top;

				if (isVisible) {
					if (firstVisibleIndex === -1) {
						firstVisibleIndex = i;
					}
					lastVisibleIndex = i;
				}
			}

			if (firstVisibleIndex !== -1 && lastVisibleIndex !== -1) {
				setVisibleTaskRange(firstVisibleIndex, lastVisibleIndex + 1);
			} else {
				setVisibleTaskRange(0, 0);
			}
		};

		// Update on initial render and when tasks change
		updateVisibleRange();

		// Update on scroll
		const container = containerRef.current;
		if (container) {
			container.addEventListener('scroll', updateVisibleRange);
			return () => {
				container.removeEventListener('scroll', updateVisibleRange);
			};
		}
	}, [tasks, setVisibleTaskRange]);

	// Scroll to newest manually-created task
	useEffect(() => {
		if (!pendingScrollToTask || !containerRef.current) return;

		// Try to find the element and scroll to it
		const element = containerRef.current.querySelector(
			`[data-task-id="${pendingScrollToTask}"]`,
		);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			clearPendingScroll();
		}
	}, [pendingScrollToTask, clearPendingScroll]);

	return (
		<div className="flex flex-col flex-1 overflow-hidden relative">
			<div
				ref={containerRef}
				className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-2"
			>
				{tasks.length === 0 && (
					<div className="flex items-center justify-center h-full">
						{prestige.inboxGuideDismissed ? (
							<div className="text-sm text-slate-400 text-center space-y-1">
								<p>Currently no tasks.</p>
								<p>
									{' '}
									Hit <span className="font-bold">+</span> to
									generate some new ones.
								</p>
							</div>
						) : (
							<div className="w-full max-w-sm space-y-3">
								<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
									<p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-400">
										Start here
									</p>
									<p className="mt-1 text-sm font-medium text-slate-700">
										Press generate. Complete tasks. Earn
										dopamine.
									</p>
									<p className="mt-1.5 text-xs text-slate-400">
										Each task has a badge telling you how to
										complete it. Harder badges pay more.
									</p>
								</div>

								<div className="grid grid-cols-4 gap-1.5">
									{[
										{ label: 'tap', desc: 'mark complete' },
										{ label: 'x2', desc: 'double-confirm' },
										{ label: 'hold', desc: 'deep work' },
										{ label: 'swipe', desc: 'file away' },
									].map((chip) => (
										<div
											key={chip.label}
											className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center"
										>
											<p className="text-xs font-semibold text-slate-700">
												{chip.label}
											</p>
											<p className="mt-0.5 text-[10px] text-slate-400 leading-tight">
												{chip.desc}
											</p>
										</div>
									))}
								</div>

								<div className="flex items-center justify-between">
									<p className="text-[11px] text-slate-400">
										More unlocks appear as milestones stack.
									</p>
									<button
										type="button"
										onClick={dismissInboxGuide}
										className="rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-600"
									>
										Dismiss
									</button>
								</div>
							</div>
						)}
					</div>
				)}
				{tasks.map((task, index) => (
					<div
						key={task.id}
						data-task-id={task.id}
						data-task-index={index}
					>
						<TaskCard
							taskId={task.id}
							name={task.name}
							interaction={task.interaction}
							holdProgress={task.holdProgress}
							isResolving={task.isResolving}
							resolvedPayout={task.resolvedPayout}
						/>
					</div>
				))}
			</div>
			<GenerateButton />
		</div>
	);
}
