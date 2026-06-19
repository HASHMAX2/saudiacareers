/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf5",
          100: "#d6f5e6",
          200: "#aeeacb",
          300: "#78d9aa",
          400: "#3ebe83",
          500: "#159565",
          600: "#0f7953",
          700: "#0d6044",
          800: "#0b4d38",
          900: "#083a2b",
          950: "#03251b",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
