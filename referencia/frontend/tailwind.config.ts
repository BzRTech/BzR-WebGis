import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#FFD500",
        ink: { DEFAULT: "#1a1a1a", 2: "#555" },
        paper: { DEFAULT: "#FAFAF7", 2: "#F3F1EA" },
        line: { DEFAULT: "#e5e1d6", 2: "#d7d3c6" },
        muted: "#7a7a7a",
        ok: "#3E7D44",
        warn: "#A36A10",
        danger: "#B4351E",
      },
      fontFamily: {
        sans: ["Inter Tight", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { none: "0", DEFAULT: "0", md: "0", lg: "0" },
    },
  },
  plugins: [],
} satisfies Config;
