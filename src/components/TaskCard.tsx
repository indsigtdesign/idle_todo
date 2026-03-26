import { useCallback, useRef, useState } from 'react';
import {
	useGameStore,
	getEffectiveHoldMs,
	getAutoCompleteInterval,
	DOUBLE_CLICK_WINDOW_MS,
} from '../store';
import type { InteractionType } from '../store';
import { playFart } from '../farts';

interface TaskCardProps {
	taskId: string;
	name: string;
	interaction: InteractionType;
	holdProgress: number;
	isResolving?: boolean;
	resolvedPayout?: number;
}

const SWIPE_THRESHOLD = 0.6; // 60% of card width

function badgeLabel(interaction: InteractionType): string {
	switch (interaction) {
		case 'single-click':
			return 'tap';
		case 'double-click':
			return '×2';
		case 'long-click':
			return 'hold';
		case 'drag':
			return 'swipe';
	}
}

export default function TaskCard({
	taskId,
	name,
	interaction,
	holdProgress,
	isResolving = false,
	resolvedPayout = 0,
}: TaskCardProps) {
	const completeTask = useGameStore((s) => s.completeTask);
	const startHold = useGameStore((s) => s.startHold);
	const cancelHold = useGameStore((s) => s.cancelHold);
	const holdReductionLevel = useGameStore((s) => s.upgrades.holdReduction);
	const autoCompleteTargetIds = useGameStore((s) => s.autoCompleteTargetIds);
	const autoCompleteTimer = useGameStore((s) => s.autoCompleteTimer);
	const clickSpeedLevel = useGameStore((s) => s.upgrades.clickSpeed);
	const isHolding = useRef(false);

	// Double-click state
	const lastTapTime = useRef(0);
	const [firstTapDone, setFirstTapDone] = useState(false);
	const firstTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Drag state
	const dragStartX = useRef<number | null>(null);
	const [translateX, setTranslateX] = useState(0);
	const cardRef = useRef<HTMLDivElement>(null);

	const effectiveHold = getEffectiveHoldMs(holdReductionLevel);

	// --- Single click ---
	const handleClick = useCallback(() => {
		if (isResolving) return;
		if (interaction === 'single-click') {
			playFart('single-click');
			completeTask(taskId);
		}
	}, [interaction, completeTask, isResolving, taskId]);

	// --- Double click ---
	const handleDoubleClick = useCallback(() => {
		if (isResolving) return;
		if (interaction !== 'double-click') return;
		const now = Date.now();
		if (now - lastTapTime.current <= DOUBLE_CLICK_WINDOW_MS) {
			lastTapTime.current = 0;
			if (firstTapTimer.current) clearTimeout(firstTapTimer.current);
			setFirstTapDone(false);
			playFart('double-click');
			completeTask(taskId);
		} else {
			lastTapTime.current = now;
			setFirstTapDone(true);
			if (firstTapTimer.current) clearTimeout(firstTapTimer.current);
			firstTapTimer.current = setTimeout(() => {
				setFirstTapDone(false);
			}, DOUBLE_CLICK_WINDOW_MS);
		}
	}, [interaction, completeTask, isResolving, taskId]);

	// --- Long click ---
	const handlePointerDown = useCallback(() => {
		if (isResolving) return;
		if (interaction === 'long-click') {
			isHolding.current = true;
			startHold(taskId);
		}
	}, [interaction, isResolving, startHold, taskId]);

	const handlePointerUp = useCallback(() => {
		if (isResolving) return;
		if (interaction === 'long-click' && isHolding.current) {
			isHolding.current = false;
			if (holdProgress >= effectiveHold) {
				playFart('long-click');
				completeTask(taskId);
			} else {
				cancelHold(taskId);
			}
		}
	}, [
		interaction,
		holdProgress,
		effectiveHold,
		completeTask,
		cancelHold,
		isResolving,
		taskId,
	]);

	const handlePointerLeave = useCallback(() => {
		if (isResolving) return;
		if (interaction === 'long-click' && isHolding.current) {
			isHolding.current = false;
			cancelHold(taskId);
		}
	}, [interaction, isResolving, cancelHold, taskId]);

	// --- Drag / Swipe ---
	const handleDragPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (isResolving) return;
			if (interaction !== 'drag') return;
			dragStartX.current = e.clientX;
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		},
		[interaction, isResolving],
	);

	const handleDragPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (isResolving) return;
			if (interaction !== 'drag' || dragStartX.current === null) return;
			const dx = e.clientX - dragStartX.current;
			setTranslateX(Math.max(0, dx));
		},
		[interaction, isResolving],
	);

	const handleDragPointerUp = useCallback(() => {
		if (isResolving) return;
		if (interaction !== 'drag' || dragStartX.current === null) return;
		dragStartX.current = null;
		const cardWidth = cardRef.current?.offsetWidth ?? 300;
		if (translateX >= cardWidth * SWIPE_THRESHOLD) {
			playFart('drag');
			completeTask(taskId);
		}
		setTranslateX(0);
	}, [interaction, isResolving, translateX, completeTask, taskId]);

	const isLongClick = interaction === 'long-click';
	const isDrag = interaction === 'drag';
	const isDouble = interaction === 'double-click';
	const holdFraction = isLongClick
		? Math.min(holdProgress / effectiveHold, 1)
		: 0;
	const holdComplete = holdFraction >= 1;

	// Progress ring dimensions
	const ringSize = 20;
	const ringR = 7.5;
	const ringCirc = 2 * Math.PI * ringR;

	// Drag progress fraction for visual feedback
	const cardWidth = cardRef.current?.offsetWidth ?? 300;
	const dragFraction = isDrag
		? Math.min(translateX / (cardWidth * SWIPE_THRESHOLD), 1)
		: 0;

	// Auto-complete ring
	const isAutoTarget = autoCompleteTargetIds.includes(taskId) && !isResolving;
	const autoInterval = getAutoCompleteInterval(clickSpeedLevel);
	const autoProgress =
		isAutoTarget && autoInterval > 0
			? 1 - autoCompleteTimer / autoInterval
			: 0;

	return (
		<div className="relative">
			{isResolving && (
				<span className="pointer-events-none absolute right-3 -top-2 z-10 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 animate-victory-pop">
					+{resolvedPayout} DONE!
				</span>
			)}
			{/* Swipe reveal layer shown behind card */}
			{isDrag && (
				<div
					className={`absolute inset-0 rounded-lg flex items-center justify-end pr-4 transition-colors duration-75 ${
						dragFraction >= 1 ? 'bg-emerald-400' : 'bg-emerald-200'
					}`}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						className={`transition-opacity duration-75 ${
							dragFraction >= 1 ? 'opacity-100' : 'opacity-40'
						}`}
					>
						<path
							d="M4 10l4 4 8-8"
							stroke="white"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			)}
			<div
				ref={cardRef}
				style={
					isDrag && !isResolving
						? {
								transform: `translateX(${translateX}px)`,
								opacity: 1 - dragFraction * 0.4,
							}
						: undefined
				}
				onClick={
					isDouble
						? handleDoubleClick
						: !isLongClick && !isDrag
							? handleClick
							: undefined
				}
				onPointerDown={
					isDrag
						? handleDragPointerDown
						: isLongClick
							? handlePointerDown
							: undefined
				}
				onPointerMove={isDrag ? handleDragPointerMove : undefined}
				onPointerUp={
					isDrag
						? handleDragPointerUp
						: isLongClick
							? handlePointerUp
							: undefined
				}
				onPointerLeave={isLongClick ? handlePointerLeave : undefined}
				className={`relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm border animate-fade-in transition-colors duration-150 ${isDrag ? 'touch-none select-none' : ''} ${isLongClick ? 'touch-none' : isResolving ? 'cursor-default' : 'cursor-pointer'} ${
					isResolving ? 'bg-[#4ADE80] border-emerald-500' : 'bg-white'
				} ${
					isResolving
						? 'border-emerald-500'
						: isDrag && dragFraction >= 1
							? 'border-emerald-400'
							: 'border-slate-100'
				}`}
			>
				{/* Auto-complete progress bar */}
				{isAutoTarget && (
					<div
						className="absolute bottom-0 left-0 h-0.5 bg-indigo-400 transition-[width] duration-75 ease-linear"
						style={{ width: `${autoProgress * 100}%` }}
					/>
				)}
				{isLongClick ? (
					<div
						className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors duration-200 ${
							holdComplete
								? 'border-indigo-500 bg-indigo-500'
								: 'border-indigo-400'
						}`}
					>
						<svg
							width={ringSize}
							height={ringSize}
							viewBox={`0 0 ${ringSize} ${ringSize}`}
							className="-rotate-90"
						>
							<circle
								cx={ringSize / 2}
								cy={ringSize / 2}
								r={ringR}
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeDasharray={ringCirc}
								strokeDashoffset={ringCirc * (1 - holdFraction)}
								strokeLinecap="round"
								className="text-indigo-400 transition-[stroke-dashoffset] duration-75 ease-linear"
							/>
						</svg>
					</div>
				) : isDrag ? (
					<span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400">
						⇢
					</span>
				) : isDouble ? (
					<div className="flex-shrink-0 w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center">
						<span
							className={`block w-2.5 h-2.5 rounded-sm border transition-colors duration-150 ${
								firstTapDone
									? 'border-indigo-500 bg-indigo-500'
									: 'border-slate-300'
							}`}
						/>
					</div>
				) : (
					<div className="flex-shrink-0 w-5 h-5 rounded border-2 border-slate-300" />
				)}
				<span
					className={`text-sm leading-snug ${
						isResolving
							? 'text-emerald-800 font-semibold'
							: 'text-slate-700'
					}`}
				>
					{name}
				</span>
				<span
					className={`ml-auto text-[10px] font-medium uppercase tracking-wider ${
						isResolving ? 'text-emerald-600' : 'text-slate-400'
					}`}
				>
					{badgeLabel(interaction)}
				</span>
			</div>
		</div>
	);
}
