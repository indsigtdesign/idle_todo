import type { InteractionType } from './store';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	return ctx;
}

/** Short, tight "pff" — single-click */
function playSingleClickFart() {
	const ac = getCtx();
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(120, ac.currentTime);
	osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.12);
	gain.gain.setValueAtTime(0.25, ac.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
	osc.connect(gain).connect(ac.destination);
	osc.start(ac.currentTime);
	osc.stop(ac.currentTime + 0.15);
}

/** Double "pffpff" — double-click */
function playDoubleClickFart() {
	const ac = getCtx();
	for (let i = 0; i < 2; i++) {
		const offset = i * 0.12;
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(150, ac.currentTime + offset);
		osc.frequency.exponentialRampToValueAtTime(
			70,
			ac.currentTime + offset + 0.1,
		);
		gain.gain.setValueAtTime(0.2, ac.currentTime + offset);
		gain.gain.exponentialRampToValueAtTime(
			0.001,
			ac.currentTime + offset + 0.12,
		);
		osc.connect(gain).connect(ac.destination);
		osc.start(ac.currentTime + offset);
		osc.stop(ac.currentTime + offset + 0.12);
	}
}

/** Low rumbling tuba fart — long-click */
function playLongClickFart() {
	const ac = getCtx();
	const osc = ac.createOscillator();
	const lfo = ac.createOscillator();
	const lfoGain = ac.createGain();
	const gain = ac.createGain();

	osc.type = 'sawtooth';
	osc.frequency.setValueAtTime(80, ac.currentTime);
	osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.5);

	lfo.type = 'sine';
	lfo.frequency.setValueAtTime(25, ac.currentTime);
	lfoGain.gain.setValueAtTime(30, ac.currentTime);
	lfo.connect(lfoGain).connect(osc.frequency);

	gain.gain.setValueAtTime(0.3, ac.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);

	osc.connect(gain).connect(ac.destination);
	osc.start(ac.currentTime);
	lfo.start(ac.currentTime);
	osc.stop(ac.currentTime + 0.5);
	lfo.stop(ac.currentTime + 0.5);
}

/** Slide-whistle squeaker fart — drag */
function playDragFart() {
	const ac = getCtx();
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.type = 'triangle';
	osc.frequency.setValueAtTime(200, ac.currentTime);
	osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.3);
	osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.35);
	osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.5);
	gain.gain.setValueAtTime(0.25, ac.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
	osc.connect(gain).connect(ac.destination);
	osc.start(ac.currentTime);
	osc.stop(ac.currentTime + 0.5);
}

export function playFart(interaction: InteractionType) {
	switch (interaction) {
		case 'single-click':
			return playSingleClickFart();
		case 'double-click':
			return playDoubleClickFart();
		case 'long-click':
			return playLongClickFart();
		case 'drag':
			return playDragFart();
	}
}
