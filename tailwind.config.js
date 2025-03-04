/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1a1a1a',
          card: '#2d2d2d',
          text: '#e5e5e5',
          muted: '#a3a3a3'
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
