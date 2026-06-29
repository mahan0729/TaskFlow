/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep blue brand palette
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Dark navy used for the sidebar
        navy: {
          800: '#0f1f3d',
          900: '#0a1628',
          950: '#060e1a',
        },
      },
      // Subtle gradient background for the main content area
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #ede9fe 100%)',
        'auth-gradient': 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #4338ca 100%)',
        'card-glass': 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(30, 58, 138, 0.12)',
        'card':  '0 4px 24px rgba(30, 58, 138, 0.08)',
        'nav':   '4px 0 24px rgba(6, 14, 26, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
