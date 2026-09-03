"use client";

import { useEffect, useRef } from "react";

/**
 * SplitFlap (Solari board) — P1.3, ported from CL.splitflap/buildFlaps/flipTo (clearline.js).
 * The ONE treatment for a hero departure/arrival time. Digit tiles flip on mount and on any
 * change; the colon is a plain glyph. Honours prefers-reduced-motion (sets the final value with
 * no animation). Structure is React-rendered; the flip is driven imperatively to preserve the
 * exact prototype timing (fold rotateX -90deg, .13s linear per step).
 */

const GLYPHS = "0123456789".split("");

export interface SplitFlapProps {
  /** e.g. "08:35". Digits animate; ":" renders as a plain colon. */
  value: string;
  /** hero (default, 44×62) or compact (33×47, lists/countdowns). */
  size?: "hero" | "compact";
  className?: string;
  "aria-label"?: string;
}

interface Cell {
  isColon: boolean;
  top: HTMLSpanElement;
  bot: HTMLSpanElement;
  fold: HTMLDivElement;
  foldSpan: HTMLSpanElement;
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function SplitFlap({ value, size = "hero", className = "", ...aria }: SplitFlapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<Cell[]>([]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Structure is rebuilt whenever the character count changes.
  const chars = value.split("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Collect the rendered cells (React owns the DOM structure).
    const flapEls = Array.from(container.querySelectorAll<HTMLDivElement>(".flap"));
    cellsRef.current = flapEls.map((el) => ({
      isColon: el.classList.contains("colon"),
      top: el.querySelector<HTMLSpanElement>(".top span")!,
      bot: el.querySelector<HTMLSpanElement>(".bot span")!,
      fold: el.querySelector<HTMLDivElement>(".fold")!,
      foldSpan: el.querySelector<HTMLSpanElement>(".fold span")!,
    }));

    const cells = cellsRef.current;
    const targetChars = value.split("");
    const reduced = reducedMotion();

    const clearTimeouts = () => {
      for (const t of timeouts.current) clearTimeout(t);
      timeouts.current = [];
    };
    clearTimeouts();

    const setCell = (cell: Cell, c: string) => {
      cell.top.textContent = c;
      cell.bot.textContent = c;
      cell.foldSpan.textContent = c;
    };

    const flipTo = (cell: Cell, finalChar: string) => {
      if (cell.isColon || reduced) {
        setCell(cell, finalChar);
        return;
      }
      const start = Math.floor(Math.random() * 10);
      const end = GLYPHS.indexOf(finalChar);
      let steps = (((end - start) % 10) + 10) % 10;
      if (steps < 3) steps += 10;
      const seq: string[] = [];
      for (let i = 0; i <= steps; i++) seq.push(GLYPHS[(start + i) % 10]!);
      let idx = 0;
      setCell(cell, seq[0]!);
      const step = () => {
        if (idx >= seq.length - 1) {
          setCell(cell, finalChar);
          cell.fold.classList.remove("animate");
          return;
        }
        const next = seq[idx + 1]!;
        cell.foldSpan.textContent = seq[idx]!;
        cell.fold.classList.remove("animate");
        void cell.fold.offsetWidth;
        cell.fold.classList.add("animate");
        timeouts.current.push(setTimeout(() => (cell.top.textContent = next), 65));
        timeouts.current.push(
          setTimeout(() => {
            setCell(cell, next);
            cell.fold.classList.remove("animate");
            idx++;
            step();
          }, 130),
        );
      };
      step();
    };

    container.setAttribute("aria-label", aria["aria-label"] ?? value);
    targetChars.forEach((c, i) => {
      const cell = cells[i];
      if (!cell) return;
      if (reduced) {
        setCell(cell, c);
      } else {
        timeouts.current.push(setTimeout(() => flipTo(cell, c), i * 85));
      }
    });

    return clearTimeouts;
    // Re-run whenever the value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`flaps${size === "compact" ? " sm" : ""} ${className}`.trim()}
      role="img"
      aria-label={aria["aria-label"] ?? value}
    >
      {chars.map((ch, i) => {
        const isColon = ch === ":";
        return (
          <div key={`${i}-${isColon ? "c" : "d"}`} className={`flap${isColon ? " colon" : ""}`}>
            <div className="card">
              <div className="half top">
                <span>{isColon ? ":" : ""}</span>
              </div>
              <div className="half bot">
                <span>{isColon ? ":" : ""}</span>
              </div>
            </div>
            <div className="hinge" />
            <div className="fold">
              <span />
            </div>
          </div>
        );
      })}
    </div>
  );
}
