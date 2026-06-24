import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shaina's signature — angelic rose (the hero of the palette)
        brand: {
          50: "#fdf6f7",
          100: "#fbe9ed",
          200: "#f6d4dc",
          300: "#eeb4c1",
          400: "#e293a4",
          500: "#d4738a",
          600: "#bd5c77",
          700: "#9d4a62",
          800: "#824053",
          900: "#6e3848",
        },
        // Wildewood brand accents (lightened green per the brand sheet)
        wild: {
          green: "#86bf92",
          greenDk: "#5b9059",
          blue: "#1e6396",
          sky: "#69a0e8",
          gold: "#f2c94c",
          plum: "#9f3f73",
          teal: "#2b7765",
          grey: "#5b6770",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Marcellus", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(110, 56, 72, 0.04), 0 8px 24px rgba(110, 56, 72, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
