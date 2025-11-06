/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'./dist/**/*.{html,js}'
	],
	safelist: [
		'from-sky-900',
		'via-blue-900',
		'to-indigo-900',
		'from-teal-900',
		'to-cyan-900',
		'bg-gradient-to-br',
		'text-white',
		'py-20',
		'md:py-32',
		'overflow-hidden',
		'text-sky-400',
		'text-gray-300',
		'bg-sky-500/20',
		'text-sky-300',
		'border-sky-500/30',
		'bg-gradient-to-r',
		'from-white',
		'via-sky-100',
		'to-blue-100',
		'bg-clip-text',
		'text-transparent',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49',
				},
			},
		},
	},
	plugins: [],
}
