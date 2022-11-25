/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "vs-code-blue": "#569cd6",
        "vs-code-bg": "#1e1e1e",
        "vs-code-text": "#d4d4d4",
        error: "#eb456c",
        success: "#b6df4d",
      },
    },
  },
  plugins: [],
};
