// tailwind.config.js
module.exports = {
    content: [
      './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
      './public/**/*.html'
    ],
    theme: {
      extend: {
        colors: {
          red: {
            500: '#EF4444', // Personaliza tu color rojo principal
          },
          gray: {
            100: '#F3F4F6',
            800: '#1F2937',
            900: '#111827'
          }
        },
        animation: {
          typing: 'typing 3.5s steps(40, end)'
        },
        keyframes: {
          typing: {
            from: { width: '0' },
            to: { width: '100%' }
          }
        }
      }
    },
    plugins: [
      require('@tailwindcss/typography'),
      // Puedes agregar más plugins aquí si los necesitas
    ]
  }