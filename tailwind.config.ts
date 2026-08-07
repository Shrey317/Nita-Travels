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
        // teal.DEFAULT and status.green/yellow were measured at 3.30-3.74:1 white-text contrast
        // (fails WCAG AA's 4.5:1 for normal text — see README's "Accessibility" section for the
        // full before/after table). Values below are the same hue, minimally darkened to clear
        // 4.5:1. teal.light is unchanged (it's only ever used for focus rings, not text, and
        // already passes the 3:1 non-text threshold against its actual backgrounds); teal.dark is
        // new, used for hover/active states so they don't regress below teal.DEFAULT's contrast.
        teal: { DEFAULT: "#0B8177", light: "#14B8A6", dark: "#09655D" },
        surface: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        ink: "#0F172A",
        muted: "#64748B",
        status: {
          green: "#12843C",
          yellow: "#9D6B03",
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
