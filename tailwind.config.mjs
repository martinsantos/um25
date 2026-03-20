/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// V7 World-Class Dark Premium Design System
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
				'display': ['Syne', 'Inter', 'system-ui', 'sans-serif'],
				'inter': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
				'brand': ['Futura PT', 'Futura', 'sans-serif'],
			},
			borderRadius: {
				'4xl': '2rem',
			},
			boxShadow: {
				// Multi-layer shadows — ambient + directional (like Apple/Linear)
				'soft': '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
				'medium': '0 2px 4px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.06)',
				'elevated': '0 4px 6px rgba(0,0,0,0.02), 0 12px 28px rgba(0,0,0,0.08)',
				'prominent': '0 8px 12px rgba(0,0,0,0.03), 0 24px 48px rgba(0,0,0,0.12)',
				'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
				'red': '0 4px 14px rgba(220,38,38,0.25)',
				'red-lg': '0 8px 24px rgba(220,38,38,0.3)',
			},
			transitionTimingFunction: {
				'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
		},
	},
	plugins: [],
}
