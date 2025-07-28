/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        sage: {
          50: '#f4f7f1',
          100: '#e5eadf',
          200: '#cbd4c2',
          300: '#a8b99a',
          400: '#87A96B',
          500: '#6b8c52',
          600: '#547040',
          700: '#425835',
          800: '#36462c',
          900: '#2d3a25',
          950: '#171f12',
        },
        // Secondary colors
        warm: {
          gray: '#8B8680',
          'gray-light': '#A39E98',
          'gray-dark': '#6D6862',
        },
        // Accent colors
        lavender: {
          50: '#f7f5f9',
          100: '#ebe8f1',
          200: '#d9d3e5',
          300: '#bfb3d3',
          400: '#A294B8',
          500: '#8775a0',
          600: '#6f5c86',
          700: '#5c4b70',
          800: '#4d3f5d',
          900: '#40344d',
          950: '#2a2234',
        },
        // Background
        background: '#FAFAFA',
        // Text colors
        text: {
          primary: '#2D3748',
          secondary: '#718096',
          light: '#A0AEC0',
        },
        // Status colors
        status: {
          success: '#68D391',
          warning: '#F6E05E',
          error: '#FC8181',
          info: '#63B3ED',
        },
        // Specific UI colors
        period: {
          active: '#FC8181',
          predicted: '#FCA5A5',
          light: '#FED7D7',
        },
        fertile: {
          window: '#C6F6D5',
          ovulation: '#68D391',
          light: '#C6F6D5',
          dark: '#276749',
        },
        ovulation: '#9F7AEA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'heading-1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'heading-2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'heading-3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'body': ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'caption': ['0.75rem', { lineHeight: '1rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        'large': '0 8px 24px -8px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}