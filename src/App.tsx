import { useState } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameStore } from './store';
import Header from './components/Header';
import TabBar from './components/TabBar';
import Inbox from './components/Inbox';
import Archive from './components/Archive';
import Settings from './components/Settings';
import OnboardingOverlay from './components/OnboardingOverlay';

export default function App() {
	const [activeTab, setActiveTab] = useState('inbox');
	const prestige = useGameStore((s) => s.prestige);
	const activeOnboarding = useGameStore((s) => s.activeOnboarding);
	const completeIntroOnboarding = useGameStore(
		(s) => s.completeIntroOnboarding,
	);
	const completePrestigeOnboarding = useGameStore(
		(s) => s.completePrestigeOnboarding,
	);
	useGameLoop();

	const showPrestigeGuide =
		activeOnboarding === 'prestige' ||
		(prestige.habitPointGuideUnlocked && !prestige.prestigeGuideSeen);
	const showIntroGuide = activeOnboarding === 'intro';

	return (
		<div className="relative flex flex-col h-full sm:h-dvh sm:max-h-[90vh] bg-slate-50 text-slate-900 max-w-md w-full mx-auto sm:rounded-2xl sm:shadow-2xl sm:overflow-hidden">
			<Header />
			<main className="flex flex-col flex-1 overflow-hidden">
				{activeTab === 'inbox' && <Inbox />}
				{activeTab === 'archive' && <Archive />}
				{activeTab === 'settings' && <Settings />}
			</main>
			<TabBar activeTab={activeTab} onTabChange={setActiveTab} />
			{showIntroGuide && (
				<OnboardingOverlay
					variant="intro"
					onComplete={completeIntroOnboarding}
				/>
			)}
			{!showIntroGuide && showPrestigeGuide && (
				<OnboardingOverlay
					variant="prestige"
					onComplete={completePrestigeOnboarding}
				/>
			)}
		</div>
	);
}
