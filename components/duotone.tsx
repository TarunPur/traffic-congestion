"use client";

import { useEffect, useRef } from "react";
import { duotonePixels, DEFAULT_CROP, type DuotoneOptions } from "@/lib/duotone";

/**
 * Duotone (design §5b) — inked two-tone image on <canvas>. Real licensed photography only,
 * rendered as a smooth paper↔ink map. Vignettes into paper (top/bottom) so it reads printed,
 * not pasted. Ships dlf-cyberhub.jpg (Wikimedia Commons, CC BY-SA 4.0, credit "Slyronit").
 */

export interface DuotoneCrop {
  sxf: number;
  syf: number;
  swf: number;
  shf: number;
}

export interface DuotoneProps {
  src: string;
  alt: string;
  /** Canvas backing resolution (px). Default 784×300 (masthead). */
  canvasWidth?: number;
  canvasHeight?: number;
  crop?: DuotoneCrop;
  options?: DuotoneOptions;
  /** Top/bottom fade into paper (masthead). Off for square thumbs. */
  vignette?: boolean;
  /** Attribution line, e.g. 'Photo: Slyronit · CC BY-SA 4.0'. */
  credit?: string;
  className?: string;
  style?: React.CSSProperties;
}

const VIGNETTE =
  "linear-gradient(to bottom, color-mix(in srgb,var(--paper) 30%,transparent) 0%, transparent 26%, transparent 44%, color-mix(in srgb,var(--paper) 55%,transparent) 72%, var(--paper) 100%)";

export function Duotone({
  src,
  alt,
  canvasWidth = 784,
  canvasHeight = 300,
  crop = DEFAULT_CROP,
  options,
  vignette = true,
  credit,
  className = "",
  style,
}: DuotoneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.drawImage(
        img,
        crop.sxf * img.width,
        crop.syf * img.height,
        crop.swf * img.width,
        crop.shf * img.height,
        0,
        0,
        W,
        H,
      );
      const d = octx.getImageData(0, 0, W, H);
      const transformed = duotonePixels(d.data, options);
      ctx.putImageData(new ImageData(transformed, W, H), 0, 0);
    };
    img.src = src;
  }, [src, crop, options]);

  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
      role="img"
      aria-label={alt}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {vignette ? (
        <span
          aria-hidden
          style={{ position: "absolute", inset: 0, background: VIGNETTE, pointerEvents: "none" }}
        />
      ) : null}
      {credit ? (
        <span
          style={{
            position: "absolute",
            right: 6,
            bottom: 4,
            fontFamily: "var(--grot)",
            fontSize: 8.5,
            letterSpacing: "0.04em",
            color: "var(--grey2)",
            mixBlendMode: "multiply",
          }}
        >
          {credit}
        </span>
      ) : null}
    </div>
  );
}
