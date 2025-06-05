import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ultima-red': '#f31260',
        'ultima-dark': '#121826',
        'ultima-navy': '#1a2032',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        dividerWeight: "1px", 
        disabledOpacity: 0.45, 
        fontSize: {
          tiny: "0.75rem",
          small: "0.875rem",
          medium: "0.9375rem",
          large: "1.125rem",
        },
        lineHeight: {
          tiny: "1rem", 
          small: "1.25rem", 
          medium: "1.5rem", 
          large: "1.75rem", 
        },
        radius: {
          small: "6px", 
          medium: "8px", 
          large: "12px", 
        },
        borderWidth: {
          small: "1px", 
          medium: "1px", 
          large: "2px", 
        },
      },
      themes: {
        light: {
          colors: {
            primary: {
              50: "#fee7ef",
              100: "#fdd0df",
              200: "#faa0bf",
              300: "#f871a0",
              400: "#f54180",
              500: "#f31260",
              600: "#c20e4d",
              700: "#920b3a",
              800: "#610726",
              900: "#310413",
              DEFAULT: "#f31260",
              foreground: "#ffffff"
            }
          }
        },
        dark: {
          colors: {
            primary: {
              50: "#310413",
              100: "#610726",
              200: "#920b3a",
              300: "#c20e4d",
              400: "#f31260",
              500: "#f54180",
              600: "#f871a0",
              700: "#faa0bf",
              800: "#fdd0df",
              900: "#fee7ef",
              DEFAULT: "#f31260",
              foreground: "#ffffff"
            }
          }
        }
      }
    })
  ]
}
