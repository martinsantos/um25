/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
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
				// V4 Design System Colors
				'um-primary': '#0ea5e9',
				'um-primary-dark': '#0284c7',
				'um-primary-light': '#38bdf8',
				'um-primary-bg': '#f0f9ff',
				'um-accent': '#dc2626',
				'um-accent-dark': '#b91c1c',
				'um-dark': '#111827',
				'um-slate': '#1e293b',
				'um-gray': '#6b7280',
				'um-gray-light': '#f3f4f6',
			},
			fontFamily: {
				'opensans': ['Open Sans', 'sans-serif'],
			},
		},
	},
	plugins: [],
}
