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
				'um-primary': '#DC2626',
				'um-primary-dark': '#DC2626',
				'um-primary-light': '#DC2626',
				'um-primary-bg': '#F5F5F5',
				'um-accent': '#DC2626',
				'um-accent-dark': '#DC2626',
				'um-dark': '#000000',
				'um-slate': '#333333',
				'um-gray': '#666666',
				'um-gray-light': '#F5F5F5',
			},
			fontFamily: {
				sans: ['"Open Sans"', 'system-ui', '-apple-system', 'sans-serif'],
				display: ['"Poppins"', '"Futura PT"', '"Century Gothic"', 'sans-serif'],
				logo: ['"Futura PT"', '"Futura"', 'sans-serif'],
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms'),
		require('@tailwindcss/aspect-ratio'),
	],
}
