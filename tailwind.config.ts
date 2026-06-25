import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shaina's signature — soft "baby girl" pink (the hero of the palette)
        brand: {
          50: "#fff5fb",
          100: "#ffe7f6",
          200: "#ffcfec",
          300: "#fbb3e0",
          400: "#f590cf",
          500: "#ec6fbb",
          600: "#d94fa1",
          700: "#b23d83",
          800: "#8d3167",
          900: "#6e2651",
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
