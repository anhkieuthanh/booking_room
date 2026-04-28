/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Hoàng Long Group palette — sourced from the company logo.
        brand: {
          50: "#eef2fb",
          100: "#d6dff5",
          200: "#a8bce8",
          300: "#6f8cd2",
          400: "#3f63b6",
          500: "#1f4598",
          600: "#0e3a8a",
          700: "#0a2f72",
          800: "#08265d",
          900: "#061d49",
        },
        sun: {
          50: "#fffbe6",
          100: "#fff5c0",
          200: "#ffec80",
          300: "#ffe14d",
          400: "#ffd61f",
          500: "#ffd400",
          600: "#d9b300",
          700: "#a88800",
          800: "#7a6300",
          900: "#4d3e00",
        },
        flag: {
          50: "#fdeaec",
          100: "#f9c5ca",
          200: "#f08e98",
          300: "#e45b69",
          400: "#db2f44",
          500: "#cc1729",
          600: "#b61023",
          700: "#94091b",
          800: "#700614",
          900: "#4d040d",
        },
      },
    },
  },
  plugins: [],
};
