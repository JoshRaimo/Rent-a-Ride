/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all frontend source files
    "./public/index.html",        // Include your public HTML file
  ],
  theme: {
    extend: {}, // Add custom Tailwind configuration here
  },
  plugins: [],
};