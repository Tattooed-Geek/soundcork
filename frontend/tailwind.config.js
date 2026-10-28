/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050208',
          900: '#0b0612',
          800: '#140b20',
          700: '#1d1130',
          600: '#2b1a47',
          500: '#43276b',
          400: '#a08cc0',
          300: '#cbbbe4',
          200: '#e6dcf5',
          100: '#f6f1fd',
        },
        accent: {
          DEFAULT: '#c084fc',
          deep: '#a855f7',
          bright: '#e9d5ff',
          dim: '#7c3aed',
        },
        gold: {
          DEFAULT: '#d4af37',
          bright: '#f5d76e',
          soft: '#e9c96a',
          dim: '#9c7c1e',
        },
      },
      boxShadow: {
        glow: '0 0 18px rgba(192, 132, 252, 0.28)',
        'glow-lg': '0 0 34px rgba(168, 85, 247, 0.38)',
        'glow-sm': '0 0 10px rgba(192, 132, 252, 0.22)',
        'gold-glow': '0 0 14px rgba(212, 175, 55, 0.40)',
        'gold-glow-sm': '0 0 7px rgba(212, 175, 55, 0.30)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)',
        'gold-gradient': 'linear-gradient(135deg, #b8912c 0%, #d4af37 35%, #f5d76e 65%, #d4af37 100%)',
        'hero-gradient': 'linear-gradient(160deg, rgba(43, 26, 71, 0.55) 0%, rgba(11, 6, 18, 0.92) 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
