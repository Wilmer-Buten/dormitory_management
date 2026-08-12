/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    {
      pattern: /^(bg|text|border)-(oakwood)-(blue|gold)(-.*)?$/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Oakwood University Official Colors
        oakwood: {
          blue: {
            DEFAULT: '#003DA5',
            dark: '#001F5B',
            light: '#1E5BC6',
            50: '#E6EDF9',
            100: '#CCDCF3',
            200: '#99B9E7',
            300: '#6696DB',
            400: '#3373CF',
            500: '#003DA5',
            600: '#003184',
            700: '#002563',
            800: '#001842',
            900: '#000C21',
          },
          gold: {
            DEFAULT: '#D4A574',
            light: '#E4C9A8',
            dark: '#B8935F',
            50: '#FAF6F1',
            100: '#F5EDE3',
            200: '#EBDBC7',
            300: '#E1C9AB',
            400: '#D7B78F',
            500: '#D4A574',
            600: '#C8945D',
            700: '#A67A4D',
            800: '#84603D',
            900: '#62472E',
          },
        },
        // Keep brand as alias for backward compatibility
        brand: {
          50: '#E6EDF9',
          100: '#CCDCF3',
          200: '#99B9E7',
          300: '#6696DB',
          400: '#3373CF',
          500: '#003DA5',
          600: '#003184',
          700: '#002563',
          800: '#001842',
          900: '#000C21',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
        popover: '0 10px 30px -5px rgb(0 0 0 / 0.15), 0 4px 10px -4px rgb(0 0 0 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
