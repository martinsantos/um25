/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// V6 Dark Premium + White Content Design System
				'um-primary': '#DC2626',
				'um-primary-dark': '#B91C1C',
				'um-primary-light': '#FEE2E2',
				'um-primary-bg': '#FEF2F2',

				// Legacy alias
				'um-accent': '#DC2626',
				'um-accent-dark': '#B91C1C',

				// Surfaces — warm neutrals, ZERO sky-blue
				'um-bg': '#FFFFFF',
				'um-surface': '#FAFAFA',
				'um-elevated': '#F5F5F5',

				// Text hierarchy — warm grays
				'um-text': '#111827',
				'um-text-secondary': '#4B5563',
				'um-text-tertiary': '#6B7280',
				'um-text-muted': '#9CA3AF',

				// Borders — neutral grays
				'um-border': '#E5E7EB',
				'um-border-subtle': '#F3F4F6',
				'um-border-strong': '#D1D5DB',

				// Dark sections
				'um-dark': '#111827',
				'um-slate': '#1F2937',

				// Legacy compatibility
				'um-gray': '#6B7280',
				'um-gray-light': '#F5F5F5',
			},
			fontFamily: {
				'inter': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
				'brand': ['Futura PT', 'Futura', 'sans-serif'],
			},
			borderRadius: {
				'4xl': '2rem',
			},
			boxShadow: {
				'soft': '0 1px 3px rgba(0, 0, 0, 0.08)',
				'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
				'elevated': '0 8px 24px rgba(0, 0, 0, 0.1)',
				'prominent': '0 16px 40px rgba(0, 0, 0, 0.14)',
				'red': '0 8px 24px rgba(220, 38, 38, 0.2)',
				'red-lg': '0 12px 32px rgba(220, 38, 38, 0.25)',
			},
		},
	},
	plugins: [],
}
