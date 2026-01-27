/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wolf': '#8B0000',
        'citizen': '#4169E1',
        'seer': '#9370DB',
        'protector': '#32CD32',
        'hunter': '#FF8C00',
      },
    },
  },
  plugins: [],
}