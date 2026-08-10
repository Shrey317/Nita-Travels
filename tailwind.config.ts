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
        // Semantic colors — driven by CSS custom properties in globals.css so they auto-switch
        // between light/dark modes. Uses the rgb(var(...) / <alpha-value>) pattern for opacity.
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        status: {
          green: "#12843C",
          yellow: "#9D6B03",
          red: "#DC2626",
        },
        notebg: "rgb(var(--color-notebg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
      boxShadow: {
        glow: "0 0 15px -3px rgba(11,129,119,0.3)",
        "card-hover": "0 10px 40px -10px rgba(15,37,64,0.15), 0 4px 12px -2px rgba(15,37,64,0.08)",
        "card-elevated": "0 20px 60px -15px rgba(15,37,64,0.2)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { from: { opacity: "0", transform: "translateX(-16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.9)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        "pulse-dot": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out both",
        "slide-up": "slide-up 0.5s ease-out both",
        "slide-in-left": "slide-in-left 0.4s ease-out both",
        "scale-in": "scale-in 0.4s ease-out both",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
