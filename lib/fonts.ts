import { Source_Serif_4, Archivo, Space_Grotesk } from "next/font/google";

/**
 * P0.3 — self-hosted fonts via next/font (fetched + inlined at BUILD time, no runtime CDN).
 *  - Source Serif 4 : prose — place names, headers, the hero departure time, the wordmark.
 *  - Archivo (tabular lining) : the schedule apparatus — labels, tags, figures, times, buttons.
 *  - Space Grotesk : the wordmark glyphs only, on brand surfaces (design §9).
 * Each exposes a CSS variable; globals.css feeds --font-serif/--font-grot into --serif/--grot.
 */

export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-grot",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-wordmark",
  display: "swap",
});

/** All three font variable classes, for the <html> element. */
export const fontVariables = `${sourceSerif.variable} ${archivo.variable} ${spaceGrotesk.variable}`;
