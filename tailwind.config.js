/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d9e89',
        'primary-dark': '#0c5b4c',
        accent: '#8ae1d6',
        neutral: '#b9c3c0',
        'text-main': '#1d1d1d',
        background: '#ffffff',
      },
    },
  },
  plugins: [],
}
