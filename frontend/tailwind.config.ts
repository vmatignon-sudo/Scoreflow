import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sf: {
          "bg-primary": "#FFFFFF",
          "bg-secondary": "#F7F8FA",
          "bg-tertiary": "#EEF0F5",
          "text-primary": "#0F1923",
          "text-secondary": "#4A5568",
          "text-muted": "#8A95A3",
          "accent-blue": "#1B4FD8",
          "accent-blue-light": "#EBF0FF",
          "score-excellent": "#059669",
          "score-good": "#10B981",
          "score-average": "#F59E0B",
          "score-poor": "#EF6C00",
          "score-bad": "#DC2626",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "score-count": "scoreCount 1s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        scoreCount: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
