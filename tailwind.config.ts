import type { Config } from "tailwindcss";

/**
 * Tailwind mirrors the frozen token set (ERD §2). Utility names resolve to the CSS custom
 * properties defined in app/globals.css :root, so classes and raw CSS always agree — one
 * source of truth. Metro line + feedback colours live in lib/tokens.ts (transit graphics /
 * screen 15 only), deliberately NOT exposed as general Tailwind utilities.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // No radius on content (design §3). Device frame + split-flap tiles opt in explicitly.
    borderRadius: {
      none: "0",
      sm: "4px", // text-field inset only (design §6)
      DEFAULT: "0",
    },
    extend: {
      colors: {
        paper: "var(--paper)",
        paper2: "var(--paper2)",
        ink: "var(--ink)",
        grey: "var(--grey)",
        grey2: "var(--grey2)",
        accent: "var(--accent)", // oxblood — risk only
        "accent-tint": "var(--accent-tint)",
      },
      borderColor: {
        hair: "var(--hair)",
        DEFAULT: "var(--hair)",
      },
      fontFamily: {
        serif: "var(--serif)",
        grot: "var(--grot)",
      },
      boxShadow: {
        press: "var(--press)",
      },
      spacing: {
        m: "var(--m)",
      },
      transitionTimingFunction: {
        ease: "var(--ease)",
      },
    },
  },
  plugins: [],
};

export default config;
