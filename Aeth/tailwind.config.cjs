/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111318',
        primary: '#fbbf24',
        'text-primary': '#e5e7eb',
        'text-secondary': '#9ca3af',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 30px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};


