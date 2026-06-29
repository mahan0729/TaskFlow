/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names — prevents purging classes that are in use
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Brand color palette — indigo as primary to match the default project color (#6366f1)
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
}
