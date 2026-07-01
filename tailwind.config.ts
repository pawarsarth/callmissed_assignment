import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D10",
        surface: "#14171C",
        raised: "#1B1F26",
        border: "#252A32",
        signal: "#FF6B35",
        "signal-dim": "#B84E26",
        ring: "#3ED9C7",
        text: "#E8EAED",
        muted: "#8B93A1",
        faint: "#5B6270",
        danger: "#F2545B",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        ringIn: {
          "0%": { transform: "scaleY(0.3)", opacity: "0" },
          "100%": { transform: "scaleY(1)", opacity: "1" },
        },
        rise: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.1s ease-in-out infinite",
        ringIn: "ringIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        rise: "rise 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
