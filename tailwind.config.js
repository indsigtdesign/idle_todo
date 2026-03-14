/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			animation: {
				'fade-in': 'fadeIn 300ms ease-out',
				'victory-pop': 'victoryPop 250ms ease-out forwards',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				victoryPop: {
					'0%': {
						opacity: '0',
						transform: 'translateY(4px) scale(0.9)',
					},
					'20%': {
						opacity: '1',
						transform: 'translateY(0) scale(1)',
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-16px) scale(1.02)',
					},
				},
			},
		},
	},
	plugins: [],
};
