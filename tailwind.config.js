/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        sanaa: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4',
          700: '#0e7490'
        },
        manelle: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          700: '#c2410c'
        }
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};
