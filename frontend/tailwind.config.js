/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bcd0ff",
          300: "#90b1ff",
          400: "#6088ff",
          500: "#3a63f5",
          600: "#2748d8",
          700: "#1f37ab",
          800: "#1d3185",
          900: "#1c2c69",
        },
      },
    },
  },
  plugins: [],
};
