import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  TOKENS,
  LINECOL,
  FEEDBACK_TONES,
  cssVarBlock,
} from "@/lib/tokens";

/**
 * P0.2 token fidelity.
 *
 * Two layers, per the plan's "unit test asserts token values equal the prototype's":
 *  1. Ground-truth assertions (always run, incl. CI) — lib/tokens.ts must equal the exact
 *     values ported from the frozen prototype (clearline.css / 09-plandetail.html / 15-feedback.html).
 *  2. Drift guard (local only, skipped when the sibling prototype folder is absent, e.g. CI) —
 *     re-parses the real prototype files so a future edit to the frozen CSS can never diverge
 *     silently from lib/tokens.ts.
 */

// ── Ground truth (ported 2026-09-04 from 16screensjourney1-working) ──
const EXPECTED_TOKENS = {
  paper: "#efece2",
  paper2: "#f4efe1",
  ink: "#1b1a16",
  grey: "#5f5a4e",
  grey2: "#877f6e",
  hair: "color-mix(in srgb, var(--ink) 20%, transparent)",
  accent: "#8f342a",
  accentTint: "color-mix(in srgb, var(--accent) 10%, transparent)",
  press: "0 1px 0 rgba(255,253,247,.6), 0 -0.5px 0 rgba(0,0,0,.045)",
  m: "20px",
  ease: "cubic-bezier(.16,1,.3,1)",
  serif: '"Source Serif 4", Georgia, "Times New Roman", serif',
  grot: '"Archivo", "Helvetica Neue", Arial, sans-serif',
} as const;

const EXPECTED_LINECOL = {
  yellow: "#b8801a",
  blue: "#3f5d78",
  red: "#a8452f",
  green: "#4f6b3a",
  violet: "#5f4b78",
  magenta: "#8a3d5e",
  pink: "#a75570",
  aqua: "#3f6f70",
} as const;

const EXPECTED_FEEDBACK_TONES = ["#a8452f", "#c06a4a", "#b8801a", "#7d9455", "#4f6b3a"] as const;

describe("tokens — ground truth", () => {
  it("TOKENS match the ported prototype values exactly", () => {
    expect(TOKENS).toEqual(EXPECTED_TOKENS);
  });

  it("LINECOL matches the prototype metro-line palette (ERD §1a)", () => {
    expect(LINECOL).toEqual(EXPECTED_LINECOL);
  });

  it("FEEDBACK_TONES match the §1c diverging scale in order 1→5", () => {
    expect(FEEDBACK_TONES).toEqual(EXPECTED_FEEDBACK_TONES);
  });

  it("oxblood accent is distinct from the warmer red line (never read the same, ERD §1a)", () => {
    expect(TOKENS.accent).not.toEqual(LINECOL.red);
  });

  it("cssVarBlock emits every token as a --var declaration", () => {
    const block = cssVarBlock();
    expect(block).toContain("--paper:#efece2");
    expect(block).toContain("--ink:#1b1a16");
    expect(block).toContain("--accent:#8f342a");
    expect(block).toContain("--m:20px");
  });
});

// ── Drift guard against the real frozen prototype ──
// process.cwd() is the clearline-app repo root when `pnpm test` runs; the frozen prototype
// is a sibling of the repo. Absent in CI (repo cloned alone) → drift guard is skipped.
const PROTO_DIR = resolve(
  process.cwd(),
  "../design/journey1-timetable/16screensjourney1-working",
);
const protoFile = (name: string): string => resolve(PROTO_DIR, name);
const hasProto = existsSync(protoFile("clearline.css"));

describe.runIf(hasProto)("tokens — drift guard vs frozen prototype", () => {
  const css = hasProto ? readFileSync(protoFile("clearline.css"), "utf8") : "";
  const plan = hasProto ? readFileSync(protoFile("09-plandetail.html"), "utf8") : "";
  const feedback = hasProto ? readFileSync(protoFile("15-feedback.html"), "utf8") : "";

  const cssVar = (name: string): string => {
    const m = css.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
    if (!m || m[1] === undefined) throw new Error(`--${name} not found in prototype clearline.css`);
    return m[1].trim();
  };

  it("core colour + spacing tokens still equal the prototype :root", () => {
    expect(TOKENS.paper).toBe(cssVar("paper"));
    expect(TOKENS.paper2).toBe(cssVar("paper2"));
    expect(TOKENS.ink).toBe(cssVar("ink"));
    expect(TOKENS.grey).toBe(cssVar("grey"));
    expect(TOKENS.grey2).toBe(cssVar("grey2"));
    expect(TOKENS.accent).toBe(cssVar("accent"));
    expect(TOKENS.m).toBe(cssVar("m"));
    expect(TOKENS.ease).toBe(cssVar("ease"));
  });

  it("LINECOL still equals the inline palette in 09-plandetail.html", () => {
    for (const [line, hex] of Object.entries(LINECOL)) {
      expect(plan).toContain(`${line}:'${hex}'`);
    }
  });

  it("FEEDBACK_TONES still equal the inline --tone values in 15-feedback.html", () => {
    for (const hex of FEEDBACK_TONES) {
      expect(feedback).toContain(`--tone:${hex}`);
    }
  });
});
