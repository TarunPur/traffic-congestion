"use client";

import { useEffect, useRef } from "react";

/**
 * ClearingSplash (P1.5) — the brand animation, ported from 01-login.html. Nine tangled strands
 * straighten into one clear line; a node travels the line; the wordmark (Space Grotesk) then the
 * tagline resolve. Reduced motion settles to the final state instantly (never blank). Appears
 * only on entry / brand surfaces (design §9).
 */

const NS = "http://www.w3.org/2000/svg";
const X0 = 6;
const X1 = 314;
const YC = 37;
const CX1 = 112;
const CX2 = 208;
const N = 9;

export interface ClearingSplashProps {
  word?: string;
  tagline?: string;
  /** Fires once the sequence finishes (or immediately under reduced motion). */
  onDone?: () => void;
  className?: string;
}

interface Strand {
  el: SVGPathElement;
  sy: number;
  c1: number;
  c2: number;
  ey: number;
  c1x: number;
  c2x: number;
  o: number;
}

export function ClearingSplash({
  word = "Clearline",
  tagline = "Your commute, confirmed.",
  onDone,
  className = "",
}: ClearingSplashProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const svg = svgRef.current;
    const wm = wordmarkRef.current;
    const tl = taglineRef.current;
    if (!svg || !wm || !tl) return;

    // reset (StrictMode re-mount safe)
    svg.querySelectorAll("path, circle").forEach((n) => n.remove());
    wm.classList.remove("in");
    tl.classList.remove("in");

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const strands: Strand[] = [];
    for (let i = 0; i < N; i++) {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("stroke-width", i === 0 ? "2.4" : "2");
      svg.appendChild(p);
      strands.push({
        el: p,
        sy: rand(6, 68),
        c1: rand(2, 72),
        c2: rand(2, 72),
        ey: rand(6, 68),
        c1x: CX1 + rand(-40, 40),
        c2x: CX2 + rand(-40, 40),
        o: rand(0.4, 0.85),
      });
    }
    const node = document.createElementNS(NS, "circle");
    node.setAttribute("r", "4.5");
    node.setAttribute("cx", String(X0));
    node.setAttribute("cy", String(YC));
    node.setAttribute("class", "node");
    svg.appendChild(node);

    const draw = (s: Strand, p: number) => {
      const sy = lerp(s.sy, YC, p);
      const c1 = lerp(s.c1, YC, p);
      const c2 = lerp(s.c2, YC, p);
      const ey = lerp(s.ey, YC, p);
      const c1x = lerp(s.c1x, CX1, p);
      const c2x = lerp(s.c2x, CX2, p);
      s.el.setAttribute("d", `M ${X0} ${sy} C ${c1x} ${c1}, ${c2x} ${c2}, ${X1} ${ey}`);
    };

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const settle = () => {
      strands.forEach((s, i) => {
        draw(s, 1);
        s.el.style.opacity = i === 0 ? "1" : "0";
      });
      node.setAttribute("cx", String(X1));
      node.style.opacity = "1";
      wm.classList.add("in");
      tl.classList.add("in");
    };

    if (reduced) {
      settle();
      onDoneRef.current?.();
      return;
    }

    let raf = 0;
    strands.forEach((s) => {
      draw(s, 0);
      s.el.style.opacity = String(s.o);
    });
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const HOLD = 350;
    const DUR = 1500;
    const t0 = performance.now();
    let wmShown = false;

    const frame = (now: number) => {
      const elapsed = now - t0;
      const raw = Math.min(1, Math.max(0, (elapsed - HOLD) / DUR));
      const p = easeOut(raw);
      strands.forEach((s, i) => {
        draw(s, p);
        s.el.style.opacity = i > 0 ? String(s.o * (1 - Math.min(1, p * 1.25))) : "1";
      });
      if (p > 0.55 && !wmShown) {
        wmShown = true;
        wm.classList.add("in");
      }
      if (raw >= 1) {
        const t2 = performance.now();
        const nodeRun = (n2: number) => {
          const q = easeOut(Math.min(1, (n2 - t2) / 450));
          node.setAttribute("cx", String(lerp(X0, X1, q)));
          node.style.opacity = "1";
          if (q < 1) {
            raf = requestAnimationFrame(nodeRun);
          } else {
            tl.classList.add("in");
            onDoneRef.current?.();
          }
        };
        raf = requestAnimationFrame(nodeRun);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`clearing-splash ${className}`.trim()}>
      <svg ref={svgRef} className="mark" viewBox="0 0 320 74" role="img" aria-label={word} />
      <div className="wordmark" ref={wordmarkRef}>
        <span className="word">{word}</span>
      </div>
      <div className="tagline" ref={taglineRef}>
        {tagline}
      </div>
    </div>
  );
}
