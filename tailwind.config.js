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
        dcs: {
          bg: '#05070a',
          card: '#0c1017',
          panel: '#151b26',
          border: '#232f3e',
          text: '#d1d5db',
          muted: '#6b7280',
          cyan: '#00e5ff',
          green: '#00e676',
          yellow: '#ffd600',
          orange: '#ff9100',
          red: '#ff1744',
          magenta: '#e040fb',
          blue: '#2979ff'
        }
      },
      fontFamily: {
        mono: ['"Consolas"', '"Courier New"', 'monospace'],
        sans: ['"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      }
    },
  },
  plugins: [],
}
