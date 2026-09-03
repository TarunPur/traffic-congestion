/**
 * Clearline design tokens — the single source of truth for the build.
 *
 * Ported verbatim (2026-09-04) from the FROZEN prototype
 * `../design/journey1-timetable/16screensjourney1-working/` (clearline.css :root,
 * 09-plandetail.html LINECOL, 15-feedback.html --tone). ERD §2 is the authoritative
 * spec; tests/tokens.test.ts guards against drift. Do not restyle — port only.
 */

export const TOKENS = {
  paper: "#efece2",
  paper2: "#f4efe1",
  ink: "#1b1a16",
  grey: "#5f5a4e",
  grey2: "#877f6e",
  hair: "color-mix(in srgb, var(--ink) 20%, transparent)",
  accent: "#8f342a", // oxblood — risk-only, wins any clash (ERD §1)
  accentTint: "color-mix(in srgb, var(--accent) 10%, transparent)",
  press: "0 1px 0 rgba(255,253,247,.6), 0 -0.5px 0 rgba(0,0,0,.045)",
  m: "20px",
  ease: "cubic-bezier(.16,1,.3,1)",
  serif: '"Source Serif 4", Georgia, "Times New Roman", serif',
  grot: '"Archivo", "Helvetica Neue", Arial, sans-serif',
} as const;

export type TokenName = keyof typeof TOKENS;

/**
 * Metro line palette (ERD §1a) — muted printed overprints, transit graphics ONLY.
 * Never selection/status/positive/decoration. Lines with no entry fall back to `var(--ink)`.
 * Rapid Metro + Airport Express: assign on first use in the same muted family (ERD §1a open item).
 */
export const LINECOL = {
  yellow: "#b8801a",
  blue: "#3f5d78",
  red: "#a8452f", // deliberately warmer/lighter than oxblood so the two never read the same
  green: "#4f6b3a",
  violet: "#5f4b78",
  magenta: "#8a3d5e",
  pink: "#a75570",
  aqua: "#3f6f70",
} as const;

export type MetroLine = keyof typeof LINECOL;

/** Colour for a named line, or ink fallback for unmapped lines (ERD §1a). */
export function lineColour(line: string): string {
  return (LINECOL as Record<string, string>)[line] ?? "var(--ink)";
}

/**
 * Feedback rating diverging scale (ERD §1c), index 0→4 = rating 1→5.
 * The ONLY sanctioned diverging status colour; kept clearly off oxblood. Screen 15 only.
 */
export const FEEDBACK_TONES = [
  "#a8452f", // 1 Rough
  "#c06a4a", // 2 Stressful
  "#b8801a", // 3 Okay (light amber → ink text when selected)
  "#7d9455", // 4 Good
  "#4f6b3a", // 5 Smooth
] as const;

/** Map TOKENS to their CSS custom-property names (kebab, `--` prefixed). */
const CSS_VAR_NAMES: Record<TokenName, string> = {
  paper: "--paper",
  paper2: "--paper2",
  ink: "--ink",
  grey: "--grey",
  grey2: "--grey2",
  hair: "--hair",
  accent: "--accent",
  accentTint: "--accent-tint",
  press: "--press",
  m: "--m",
  ease: "--ease",
  serif: "--serif",
  grot: "--grot",
};

/** The `:root` custom-property declarations as a single string (no selector wrapper). */
export function cssVarBlock(): string {
  return (Object.keys(TOKENS) as TokenName[])
    .map((k) => `${CSS_VAR_NAMES[k]}:${TOKENS[k]}`)
    .join("; ");
}
