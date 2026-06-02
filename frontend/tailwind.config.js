/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#000000',
          800: '#0a0a0a',
          700: '#171717',
          600: '#262626',
          500: '#404040',
          400: '#a3a3a3',
          300: '#d4d4d4',
          100: '#fafafa',
        },
        accent: '#ffffff',
      },
    },
  },
  plugins: [],
}
