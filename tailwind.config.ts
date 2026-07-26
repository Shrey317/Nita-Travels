import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F2540", light: "#1A3557" },
        teal: { DEFAULT: "#0D9488", light: "#14B8A6" },
        surface: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        ink: "#0F172A",
        muted: "#64748B",
        status: {
          green: "#16A34A",
          yellow: "#CA8A04",
          red: "#DC2626",
        },
        notebg: "#FEF9C3",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
