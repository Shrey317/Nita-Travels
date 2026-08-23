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
        // Nita Travels Brand Colors
        brand: {
          navy: "#0F172A",
          blue: "#165a18ff",
          blueAccent: "#218624ff",
          teal: "#0D9488",
        },
        navy: { DEFAULT: "#0F172A", light: "#1E293B" },
        teal: { DEFAULT: "#0D9488", light: "#14B8A6", dark: "#0F766E" },

        // Neutral System (Semantic custom properties via globals.css)
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-secondary": "rgb(var(--color-surface-secondary) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        card: "rgb(var(--color-surface-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",

        // Text Colors
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-secondary": "rgb(var(--color-ink-secondary) / <alpha-value>)",
        "card-foreground": "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        disabled: "rgb(var(--color-disabled) / <alpha-value>)",

        // Semantic Status Colors
        status: {
          success: { DEFAULT: "#16A34A", bg: "rgb(var(--color-success-bg) / <alpha-value>)" },
          warning: { DEFAULT: "#D97706", bg: "rgb(var(--color-warning-bg) / <alpha-value>)" },
          error: { DEFAULT: "#DC2626", bg: "rgb(var(--color-error-bg) / <alpha-value>)" },
          info: { DEFAULT: "#218624ff", bg: "rgb(var(--color-info-bg) / <alpha-value>)" },
          red: "#DC2626",
          yellow: "#D97706",
          green: "#16A34A",
        },
        notebg: "rgb(var(--color-notebg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      borderRadius: {
        badge: "0.375rem",   // 6px
        input: "0.5rem",     // 8px
        button: "0.5rem",    // 8px
        card: "0.75rem",     // 12px
        dialog: "0.875rem",  // 14px
      },
      boxShadow: {
        "soft": "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 10px 40px -10px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.08)",
        "card-elevated": "0 20px 60px -15px rgba(15, 23, 42, 0.2)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { from: { opacity: "0", transform: "translateX(-16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-up": "slide-up 0.3s ease-out both",
        "slide-in-left": "slide-in-left 0.3s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
