/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Deep Orange — energy, automotive spirit
        primary: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#E65100',
          600: '#D84315',
          700: '#BF360C',
          800: '#AC1900',
          900: '#8B1500',
        },
        // Secondary: Dark Blue — trust, professionalism
        secondary: {
          50: '#E8EAF6',
          100: '#C5CAE9',
          200: '#9FA8DA',
          300: '#7986CB',
          400: '#5C6BC0',
          500: '#1A237E',
          600: '#151B6A',
          700: '#101456',
          800: '#0B0D42',
          900: '#06062E',
        },
        // Accent: Warm Amber
        accent: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFA000',
          600: '#FF8F00',
          700: '#FF6F00',
          800: '#E65100',
          900: '#BF360C',
        },
        // Surface colors for cards and backgrounds
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Minimum touch targets for mobile
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      // Spacing for mobile-friendly layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Safe area for bottom mobile nav
      padding: {
        'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
      },
    },
  },
  plugins: [],
}
