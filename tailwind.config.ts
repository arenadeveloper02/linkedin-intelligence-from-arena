import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F3F8FE',
          100: '#DCEAFB',
          200: '#B9D5F8',
          300: '#8FBBF3',
          400: '#5D9BEE',
          500: '#3585EB',
          600: '#1A73E8',
          700: '#155DC2',
          800: '#10479C',
          900: '#0A2E5D',
        },
        grey: {
          50: '#F7F8F9',
          100: '#EFF0F2',
          200: '#E2E4E8',
          300: '#C6C8CE',
          400: '#A8ABB4',
          500: '#8B8E99',
          600: '#6D717F',
          700: '#55585F',
          800: '#3F4148',
          900: '#2C2D33',
        },
        success: {
          50: '#EBFAF3',
          300: '#9FE4C6',
          600: '#3BC884',
          700: '#2FA76D',
          800: '#237F53',
        },
        warning: {
          50: '#FFF4EC',
          300: '#FDC4A3',
          600: '#FB8145',
          700: '#D9662E',
          800: '#B04E1F',
        },
        error: {
          50: '#FEECEC',
          300: '#F9A8A8',
          600: '#F31A1A',
          700: '#C81515',
          800: '#A31010',
        },
        purple: {
          50: '#F8F1FC',
          200: '#E3C8F2',
          600: '#B364D7',
          700: '#8F4BB0',
        },
        pink: {
          50: '#FEF0F5',
          200: '#FBC4DA',
          600: '#F8528F',
          700: '#CE3C74',
        },
        seablue: {
          50: '#EBF9FD',
          200: '#A8E4F3',
          600: '#00A7D6',
          700: '#0086AC',
        },
      },
      boxShadow: {
        'ds-sm': '0 1px 2px rgba(44,45,51,0.08)',
        'ds-md': '0 2px 8px rgba(44,45,51,0.10)',
        'ds-lg': '0 4px 16px rgba(44,45,51,0.12)',
        'ds-xl': '0 8px 32px rgba(44,45,51,0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
