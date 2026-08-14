/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fdf2f3',
          100: '#fbe5e6',
          200: '#f7ccd0',
          300: '#f0a4a9',
          400: '#e7747b',
          500: '#d84e55',
          600: '#c4242b',
          700: '#a71920',
          800: '#8a181d',
          900: '#731a1e',
          950: '#40080a',
        },
        surface: {
          DEFAULT: '#f8fafc', // light gray
          card: '#ffffff',    // white
          elevated: '#f1f5f9',
          border: '#e2e8f0',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #d84e55 0%, #c4242b 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(99,102,241,0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(99,102,241,0.9)' },
        },
      },
    },
  },
  plugins: [],
}
