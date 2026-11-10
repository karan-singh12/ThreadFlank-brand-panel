import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#010214",
        "canvas-subtle": "#070818",
        ink: {
          DEFAULT: "#ffffff",
          soft: "#f2f3f4",
          muted: "#8d90a5",
        },
        surface: {
          DEFAULT: "#090b1e",
          elevated: "#12142b",
          border: "rgba(255, 255, 255, 0.1)",
        },
        subtle: "#babbc4",
        muted: "#8d90a5",
        dim: "#585463",
        accent: {
          DEFAULT: "#6645eb",
          bright: "#7f62f6",
          deep: "#3f20be",
        },
        cyan: "#1fc5db",
        green: "#28e69d",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        panel: "20px",
        frame: "24px",
        pill: "88px",
      },
      boxShadow: {
        "btn-primary": "0 4px 56px 3px rgba(98, 29, 237, 0.35)",
        "btn-light": "0 4px 56px 3px rgba(200, 176, 247, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
