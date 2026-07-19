/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f1f5',
          100: '#d1d5e1',
          200: '#b3b9cd',
          300: '#949eb9',
          400: '#7682a5',
          500: '#5d6990',
          600: '#4a5371',
          700: '#363e53',
          800: '#232834',
          900: '#111318',
        },
        secondary: {
          50: '#f6f2f0',
          100: '#e3d5cd',
          200: '#d0b8aa',
          300: '#bd9b87',
          400: '#aa7e64',
          500: '#976141',
          600: '#794e34',
          700: '#5b3a27',
          800: '#3c271a',
          900: '#1e130d',
        },
        accent: {
          50: '#f0f6f3',
          100: '#d1e3db',
          200: '#b3d0c3',
          300: '#94bdab',
          400: '#76aa93',
          500: '#57977b',
          600: '#467962',
          700: '#345a4a',
          800: '#233c31',
          900: '#111e19',
        },
        /* Monza / Pinterest crimson — accents only */
        royal: {
          50: '#fff1f2',
          100: '#ffe0e4',
          200: '#ffc7ce',
          300: '#ff9aa6',
          400: '#ff6175',
          500: '#f51232',
          600: '#E60023',
          700: '#c0001c',
          800: '#9e001a',
          900: '#82071c',
        },
        /*
         * Pinterest 4-tier dark layers (no pure black):
         * 900/800 = Canvas | 700/600 = Widget L1 | 500 = Widget L2 | 200 = muted text
         */
        dark: {
          50: '#f5f5f5',
          100: '#e8e9eb',
          200: '#9BA3B2',
          300: '#6b7280',
          400: '#3a3d45',
          500: '#252830',
          600: '#1A1B20',
          700: '#16171b',
          800: '#121214',
          900: '#0D0F14',
        },
        light: '#F5F5F5',
      },
      borderRadius: {
        widget: '16px',
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        sans: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      backgroundColor: {
        'dark-gradient': 'linear-gradient(to right, #121214, #1A1B20)',
      },
      keyframes: {
        'dock-pop': {
          '0%': { transform: 'scale(0.86)', opacity: '0.6' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'nav-in': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'dock-pop': 'dock-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'nav-in': 'nav-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 15, 20, 0.12), inset 0 1px 0 rgba(255,255,255,0.35)',
        'glass-dark': '0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        dock: '0 10px 40px rgba(230, 0, 35, 0.18), 0 4px 16px rgba(15, 15, 20, 0.1)',
        'dock-dark': '0 12px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        widget: '0 8px 28px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
