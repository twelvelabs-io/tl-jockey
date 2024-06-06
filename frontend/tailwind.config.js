/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      'aeonik': ['Aeonik', 'sans-serif'],
      'aeonikBold': ['AeonikBold', 'sans-serif'],
      'dentonBold': ['DentonBold', 'sans-serif'],
      'dentonLight': ['DentonLight', 'sans-serif']
    },
    extend: {},
  },
  plugins: [],
}