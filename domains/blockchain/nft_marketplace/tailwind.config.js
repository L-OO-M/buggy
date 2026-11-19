/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#08090d',
          card: '#0f1118',
          border: '#1f2438',
          accent: '#6366f1',
          neon: '#00f0ff',
          pink: '#ff007f',
          gold: '#ffd700',
          purple: '#a855f7'
        }
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, filter: 'drop-shadow(0 0 15px rgba(0,240,255,0.4))' },
          '50%': { opacity: 1, filter: 'drop-shadow(0 0 25px rgba(255,0,127,0.7))' },
        }
      }
    },
  },
  plugins: [],
}
