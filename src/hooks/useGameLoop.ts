import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';

/**
 * Drives the game loop via requestAnimationFrame.
 * Pauses all timers when the tab loses visibility.
 */
export function useGameLoop() {
	const tick = useGameStore((s) => s.tick);
	const setPaused = useGameStore((s) => s.setPaused);
	const lastTimestamp = useRef<number | null>(null);
	const hiddenAt = useRef<number | null>(null);
	const rafId = useRef<number>(0);

	useEffect(() => {
		function loop(timestamp: number) {
			if (lastTimestamp.current !== null) {
				const delta = timestamp - lastTimestamp.current;
				// Cap delta to prevent huge jumps if the browser throttled us
				tick(Math.min(delta, 200));
			}
			lastTimestamp.current = timestamp;
			rafId.current = requestAnimationFrame(loop);
		}

		rafId.current = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(rafId.current);
		};
	}, [tick]);

	// Pause when tab becomes hidden, resume when visible
	useEffect(() => {
		function handleVisibility() {
			const hidden = document.hidden;
			if (hidden) {
				hiddenAt.current = performance.now();
				setPaused(true);
				return;
			}

			setPaused(false);
			if (hiddenAt.current !== null) {
				// Credit elapsed hidden time once on resume so countdown-based systems progress.
				const hiddenDelta = Math.max(
					0,
					performance.now() - hiddenAt.current,
				);
				tick(hiddenDelta);
				hiddenAt.current = null;
			}

			if (!hidden) {
				// Reset timestamp so we don't get a huge delta after un-hiding
				lastTimestamp.current = null;
			}
		}

		document.addEventListener('visibilitychange', handleVisibility);
		return () =>
			document.removeEventListener('visibilitychange', handleVisibility);
	}, [setPaused]);
}
