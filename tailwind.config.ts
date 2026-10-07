import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

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
          navy: "#050A14",
          blue: "#2F6BFF",
          blueAccent: "#4D8DFF",
          teal: "#0D9488",
        },
        navy: { DEFAULT: "#050A14", light: "#07111F" },
        teal: { DEFAULT: "#0D9488", light: "#14B8A6", dark: "#0F766E" },

        // Neutral System (Semantic custom properties via globals.css)
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-sidebar": "rgb(var(--color-surface-sidebar) / <alpha-value>)",
        "surface-secondary": "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        "card-hover": "rgb(var(--color-card-hover) / <alpha-value>)",
        input: "rgb(var(--color-input) / <alpha-value>)",
        
        border: "rgba(148, 163, 184, 0.18)",
        "border-subtle": "rgba(148, 163, 184, 0.12)",

        // Text Colors
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-secondary": "rgb(var(--color-ink-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        disabled: "rgb(var(--color-disabled) / <alpha-value>)",

        // Primary Buttons / Accents
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
        },

        // Semantic Status Colors
        status: {
          success: { DEFAULT: "rgb(var(--color-success) / <alpha-value>)", bg: "rgb(var(--color-success-bg) / 0.1)" },
          warning: { DEFAULT: "rgb(var(--color-warning) / <alpha-value>)", bg: "rgb(var(--color-warning-bg) / 0.1)" },
          error: { DEFAULT: "rgb(var(--color-error) / <alpha-value>)", bg: "rgb(var(--color-error-bg) / 0.1)" },
          info: { DEFAULT: "rgb(var(--color-info) / <alpha-value>)", bg: "rgb(var(--color-info-bg) / 0.1)" },
          red: "rgb(var(--color-error) / <alpha-value>)",
          yellow: "rgb(var(--color-warning) / <alpha-value>)",
          green: "rgb(var(--color-success) / <alpha-value>)",
        },
        notebg: "rgb(var(--color-notebg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      borderRadius: {
        badge: "0.375rem",   // 6px
        input: "0.75rem",    // 12px
        button: "0.75rem",   // 12px
        card: "1rem",        // 16px
        dialog: "1.25rem",   // 20px
      },
      boxShadow: {
        "soft": "0 2px 8px -2px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 10px 40px -10px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.1)",
        "card-elevated": "0 20px 60px -15px rgba(0, 0, 0, 0.3)",
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
  plugins: [animate],
};

export default config;
