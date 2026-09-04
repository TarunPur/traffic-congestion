import { describe, it, expect } from "vitest";
import { duotonePixels } from "@/lib/duotone";

/** P1.4 — the duotone pixel math (design §5b). Pure function, tested without a canvas. */

const PAPER = [0xef, 0xec, 0xe2];
const INK = [0x1b, 0x1a, 0x16];

function px(...rgba: number[]): Uint8ClampedArray {
  return new Uint8ClampedArray(rgba);
}

describe("duotonePixels", () => {
  it("maps a bright pixel toward paper", () => {
    const out = duotonePixels(px(255, 255, 255, 255));
    expect(out[0]).toBeGreaterThanOrEqual(PAPER[0]! - 1);
    expect(out[1]).toBeGreaterThanOrEqual(PAPER[1]! - 1);
    expect(out[3]).toBe(255);
  });

  it("maps a dark pixel toward ink (but never past the max mix)", () => {
    const out = duotonePixels(px(0, 0, 0, 255));
    // darkest is paper + (ink-paper)*max, max=0.86 → not pure ink, but clearly inky
    expect(out[0]!).toBeLessThan(0x80);
    expect(out[0]!).toBeGreaterThan(INK[0]! - 1);
  });

  it("is monochrome: output stays on the paper→ink ramp for any input hue", () => {
    // a saturated colour should still resolve to a grey on the ramp (r>g>b ordering of paper/ink)
    const out = duotonePixels(px(200, 30, 30, 255));
    // channels follow the paper→ink interpolation, so r >= g >= b always holds
    expect(out[0]!).toBeGreaterThanOrEqual(out[1]!);
    expect(out[1]!).toBeGreaterThanOrEqual(out[2]!);
  });

  it("respects a lower max (lighter darkest tone)", () => {
    const dark = duotonePixels(px(0, 0, 0, 255), { max: 0.5 });
    const darker = duotonePixels(px(0, 0, 0, 255), { max: 0.86 });
    expect(dark[0]!).toBeGreaterThan(darker[0]!); // higher value = lighter
  });

  it("preserves buffer length", () => {
    const out = duotonePixels(px(10, 20, 30, 255, 40, 50, 60, 255));
    expect(out.length).toBe(8);
  });
});
