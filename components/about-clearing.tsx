"use client";

import { useEffect, useRef } from "react";

/**
 * AboutClearing — the About screen's own brand animation, ported from 14-about.html. Distinct
 * from ClearingSplash (used on Login/Verify): 20 flat dash segments scatter (random Y-offset +
 * rotation) then resolve left-to-right into one clear line, with a node traveling it — not the
 * curved-strand/fading-wordmark animation. Reduced motion settles to the final state instantly.
 */

const N = 20;

export function AboutClearing({ className = "" }: { className?: string }) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.querySelectorAll(".bc-seg, .node").forEach((n) => n.remove()); // StrictMode re-mount safe

    const segs: HTMLSpanElement[] = [];
    for (let i = 0; i < N; i++) {
      const s = document.createElement("span");
      s.className = "bc-seg";
      s.style.left = `${i * (100 / N)}%`;
      s.style.width = `${100 / N}%`;
      strip.appendChild(s);
      segs.push(s);
    }
    const node = document.createElement("span");
    node.className = "node";
    strip.appendChild(node);

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // CSS defaults already show the settled clear line + node at the end

    segs.forEach((s) => {
      const dy = (Math.random() * 26 - 13).toFixed(1);
      const rot = (Math.random() * 54 - 27).toFixed(1);
      s.style.transition = "none";
      s.style.opacity = "0";
      s.style.transform = `translateY(${dy}px) rotate(${rot}deg)`;
    });
    node.style.transition = "none";
    node.style.left = "0";
    void strip.offsetWidth; // commit the scattered start before animating in
    segs.forEach((s, i) => {
      s.style.transition = "opacity .45s ease, transform .9s var(--ease)";
      s.style.transitionDelay = `${i * 20}ms`;
      s.style.opacity = "1";
      s.style.transform = "translateY(0) rotate(0)";
    });
    node.style.transition = "left 1.15s var(--ease) .4s";
    node.style.left = "100%";
  }, []);

  return <div ref={stripRef} className={`brand-clearing ${className}`.trim()} aria-hidden="true" />;
}
