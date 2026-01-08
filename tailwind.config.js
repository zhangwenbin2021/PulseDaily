/** @type {import('tailwindcss').Config} */
module.exports = {
  // Keep "content" tight so Tailwind generates a small CSS file (faster on mobile).
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Use the Inter font loaded in app/layout.js via next/font.
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "Apple Color Emoji",
          "Segoe UI Emoji"
        ]
      }
    },
  },
  plugins: [],
}

