/**
 * Duotone pixel transform (design §5b) — ported from CL.duotone (clearline.js). Maps an RGBA
 * buffer to a smooth two-tone paper↔ink map, contrast-lifted so the subject stays recognisable
 * while remaining monochrome ink. Pure + framework-free so it's unit-testable without a canvas.
 */

export interface DuotoneOptions {
  contrast?: number; // default 1.9
  pivot?: number; // default 0.46
  max?: number; // default 0.86 (darkest ink mix)
}

// paper #efece2, ink #1b1a16 (ERD §2)
const PAPER = { r: 0xef, g: 0xec, b: 0xe2 } as const;
const INK = { r: 0x1b, g: 0x1a, b: 0x16 } as const;

/** Transform an RGBA buffer in place-safe fashion, returning a new buffer of paper↔ink pixels. */
export function duotonePixels(
  src: Uint8ClampedArray,
  { contrast = 1.9, pivot = 0.46, max = 0.86 }: DuotoneOptions = {},
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const lum = (0.299 * src[i]! + 0.587 * src[i + 1]! + 0.114 * src[i + 2]!) / 255;
    let v = (lum - pivot) * contrast + pivot;
    v = Math.min(1, Math.max(0, v));
    const dk = (1 - v) * max; // 0 = paper, max = darkest ink
    out[i] = PAPER.r + (INK.r - PAPER.r) * dk;
    out[i + 1] = PAPER.g + (INK.g - PAPER.g) * dk;
    out[i + 2] = PAPER.b + (INK.b - PAPER.b) * dk;
    out[i + 3] = 255;
  }
  return out;
}

/** design §5b default crop for the masthead framing. */
export const DEFAULT_CROP = { sxf: 0.02, syf: 0.06, swf: 0.96, shf: 0.6 } as const;
