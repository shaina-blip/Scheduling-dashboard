import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6f4",
          100: "#d4e9e3",
          200: "#a9d3c8",
          300: "#74b6a6",
          400: "#479484",
          500: "#2f7a6a",
          600: "#236156",
          700: "#1d4e46",
          800: "#173e38",
          900: "#13332e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
