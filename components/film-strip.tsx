"use client";

import { useEffect, useRef } from "react";
import { duotonePixels } from "@/lib/duotone";

/**
 * FilmStrip (design §5b variant) — N duotone photo thumbnails laid out edge to edge in one
 * canvas, each cover-cropped into its own column. Ported from 01-login.html's inline `.strip`
 * script (contrast 1.72 / pivot 0.5 / max 0.86 — a slightly flatter treatment than the single-photo
 * masthead default, tuned for a strip of small thumbnails).
 */

export interface FilmStripProps {
  images: string[];
  canvasWidth?: number;
  canvasHeight?: number;
  gutter?: number;
  alt: string;
  className?: string;
}

export function FilmStrip({
  images,
  canvasWidth = 824,
  canvasHeight = 376,
  gutter = 8,
  alt,
  className = "",
}: FilmStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const n = images.length;
    const cw = Math.round((W - gutter * (n - 1)) / n);
    const ch = H;

    ctx.fillStyle = "#efece2";
    ctx.fillRect(0, 0, W, H);

    images.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const off = document.createElement("canvas");
        off.width = cw;
        off.height = ch;
        const octx = off.getContext("2d");
        if (!octx) return;
        const ar = img.width / img.height;
        const cr = cw / ch;
        let dw: number, dh: number, dx: number, dy: number;
        if (ar > cr) {
          dh = ch;
          dw = ch * ar;
          dx = (cw - dw) / 2;
          dy = 0;
        } else {
          dw = cw;
          dh = cw / ar;
          dx = 0;
          dy = (ch - dh) / 2;
        }
        octx.drawImage(img, dx, dy, dw, dh);
        const d = octx.getImageData(0, 0, cw, ch);
        const transformed = duotonePixels(d.data, { contrast: 1.72, pivot: 0.5, max: 0.86 });
        ctx.putImageData(new ImageData(transformed, cw, ch), i * (cw + gutter), 0);
      };
      img.src = src;
    });
  }, [images, gutter]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      role="img"
      aria-label={alt}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
