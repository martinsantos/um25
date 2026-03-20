/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// V5 Light Sofisticado Design System
				'um-primary': '#DC2626',
				'um-primary-dark': '#B91C1C',
				'um-primary-light': '#FEF2F2',
				'um-primary-bg': '#FEF2F2',

				// Legacy alias (accent = primary in V5)
				'um-accent': '#DC2626',
				'um-accent-dark': '#B91C1C',

				// Surfaces
				'um-bg': '#FFFFFF',
				'um-surface': '#FAFBFC',
				'um-elevated': '#F1F5F9',

				// Text hierarchy
				'um-text': '#0F172A',
				'um-text-secondary': '#334155',
				'um-text-tertiary': '#64748B',
				'um-text-muted': '#94A3B8',

				// Borders
				'um-border': '#E2E8F0',
				'um-border-subtle': '#F1F5F9',
				'um-border-strong': '#CBD5E1',

				// Dark sections
				'um-dark': '#0F172A',
				'um-slate': '#1E293B',

				// Legacy compatibility
				'um-gray': '#64748B',
				'um-gray-light': '#F1F5F9',

				// Info/links
				'um-info': '#1E40AF',
				'um-info-light': '#DBEAFE',
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
				'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
				'medium': '0 4px 16px rgba(0, 0, 0, 0.06)',
				'elevated': '0 8px 32px rgba(0, 0, 0, 0.08)',
				'prominent': '0 16px 48px rgba(0, 0, 0, 0.12)',
				'red': '0 8px 24px rgba(220, 38, 38, 0.2)',
				'red-lg': '0 12px 32px rgba(220, 38, 38, 0.25)',
			},
		},
	},
	plugins: [],
}
