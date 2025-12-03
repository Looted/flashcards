/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: '#3B82F6', // Blue-500
        neutral: {
          quaternary: '#F3F4F6', // Gray-100
        },
      },
    },
  },
}
