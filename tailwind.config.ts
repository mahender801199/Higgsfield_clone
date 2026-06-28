import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lumora brand palette — original branding (teal/violet on near-black)
        brand: {
          50: "#eefdfb",
          100: "#d4f9f3",
          200: "#aef2e9",
          300: "#76e6d8",
          400: "#37d0c0",
          500: "#16b4a6",
          600: "#0c9087",
          700: "#0e736d",
          800: "#115b58",
          900: "#134c4a",
          950: "#042e2e",
        },
        accent: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        ink: {
          900: "#0a0b0f",
          800: "#101218",
          700: "#181b23",
          600: "#222630",
          500: "#2e333f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #16b4a6 0%, #7c3aed 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
