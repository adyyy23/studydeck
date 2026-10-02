import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-ink": "#332821",
        "espresso": "#49372D",
        "primary-brown": "#654A3A",
        "chestnut": "#805B43",
        "caramel": "#B77A45",
        "reward-gold": "#D79A45",
        "warm-paper": "#F7F3EA",
        "canvas": "#F2EEE6",
        "elevated-paper": "#FFFCF6",
        "muted-surface": "#EAE3D8",
        "warm-border": "#D6CCBF",
        "success-sage": "#3D6B4F",
        "danger-coral": "#B84A39",
        "ai-plum": "#6B4E71",

        background: "var(--background)",
        foreground: "var(--foreground)",
        "app-bg": "var(--app-bg)",
        sidebar: "var(--sidebar)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "border-strong": "var(--border-strong)",
        "brand-hover": "var(--brand-hover)",
        reward: "var(--reward)",
        surface: {
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
          muted: "var(--surface-muted)",
          subtle: "var(--surface-subtle)",
          border: "var(--border)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          muted: "var(--accent-muted)",
          text: "var(--accent-text)",
        },
        "muted-text": "var(--muted-text)",
        "progress-bar": "var(--progress-bar)",
        selection: "var(--selection)",
        brand: {
          50: "#EEF2F6",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },
        academic: {
          charcoal: "#121824",
          muted: "#64748B",
          border: "#E2E8F0",
          card: "#FFFFFF",
        },
        // Subject colors
        subject: {
          cobalt: "#1E3A8A",
          sage: "#4D7C5E",
          terracotta: "#A0522D",
          teal: "#0D7377",
          slate: "#475569",
          crimson: "#9B1C2E",
          amber: "#B45309",
          indigo: "#4338CA",
          rose: "#BE185D",
          emerald: "#065F46",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 1px rgba(0, 0, 0, 0.02)",
        lift: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-in": "bounceIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both",
        "fade-up": "fadeUp 0.3s ease both",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "80%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
