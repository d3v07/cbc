import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        "serif-edge": ["Playfair Display", "Georgia", "serif"],
        "sans-edge": ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm static palette (Figma spec)
        warm: {
          50: "#FAF8F4",
          100: "#F2EDE4",
          200: "#E5DDD0",
          300: "#D3D1C7",
          400: "#EF9F27",
          500: "#D98C1A",
          600: "#BA7517",
        },
        // CSS-var-backed runtime tokens
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
      },
      borderRadius: {
        chip: "12px",
        card: "16px",
        btn: "var(--radius-btn)",
      },
    },
  },
  plugins: [],
};

export default config;
