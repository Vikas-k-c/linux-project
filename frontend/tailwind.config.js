/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "monospace"],
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      },
      colors: {
        terminal: "#07110f",
        panel: "rgba(13, 24, 28, 0.72)"
      },
      boxShadow: {
        glow: "0 0 30px rgba(34, 211, 238, 0.16)",
        emerald: "0 0 26px rgba(16, 185, 129, 0.18)"
      }
    }
  },
  plugins: []
};

