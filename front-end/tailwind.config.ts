import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// theme tokens live in app/globals.css as RGB triplets so alpha modifiers (bg-primary/50) work
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        popover: { DEFAULT: token("popover"), foreground: token("popover-foreground") },
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("accent-foreground") },
        destructive: { DEFAULT: token("destructive"), foreground: token("destructive-foreground") },
        success: { DEFAULT: token("success"), foreground: token("success-foreground") },
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        // the itours palette: white ground, #f7f4ef sections, brand blue (still named copper), eco green (sage), gold CTA in globals.css
        ink: { DEFAULT: token("ink"), soft: token("ink-soft"), muted: token("ink-muted") },
        stone: "#777a7d",
        sand: {
          50: token("sand-50"),
          100: token("sand-100"),
          200: token("sand-200"),
          300: token("sand-300"),
          500: token("sand-500"),
          700: token("sand-700"),
          900: token("sand-900"),
        },
        cream: token("cream"),
        copper: { DEFAULT: token("copper"), light: token("copper-light"), dark: token("copper-dark"), deep: token("copper-deep") },
        sage: { DEFAULT: "#2d5a27", 50: "#eaeee9", light: "#abbda9", dark: "#1c3818" },
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "var(--font-cyr-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-caprasimo)", "var(--font-cyr-heading)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.5rem", field: "0.75rem" },
      boxShadow: { card: "0 2px 3px rgba(0, 0, 0, 0.07)" },
    },
  },
  plugins: [animate],
};

export default config;
