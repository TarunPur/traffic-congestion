import type { ReactNode } from "react";

/**
 * AppShell — the real mobile shell (P0.6). Replaces the prototype's 412×812 device frame.
 *
 * design §4 adapted for a live PWA: a 100dvh flex column, content centred at max-w 480 on the
 * paper ground (never a desktop layout), a scrolling content region with the one 20px side
 * margin, and an optional sticky foot (the full-bleed CTA lives here) honouring the safe-area
 * inset. The faint paper-grain ground (design §5c) sits behind all content on every screen.
 */

export interface AppShellProps {
  children: ReactNode;
  /** Pinned, non-scrolling foot — the full-bleed CTA bar or bottom tab bar. */
  foot?: ReactNode;
  /** Extra classes on the scroll region (e.g. remove side padding for full-bleed media). */
  scrollClassName?: string;
}

export function AppShell({ children, foot, scrollClassName = "" }: AppShellProps) {
  return (
    <div
      data-testid="app-frame"
      className="relative mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col bg-paper text-ink"
    >
      <PaperGrain />
      <div
        data-testid="app-scroll"
        className={`relative z-[1] flex-1 overflow-y-auto px-m ${scrollClassName}`}
      >
        {children}
      </div>
      {foot ? (
        <div
          data-testid="app-foot"
          className="relative z-[1] shrink-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {foot}
        </div>
      ) : null}
    </div>
  );
}

/** design §5c — faint feTurbulence grain, multiply-blended, behind all content, non-interactive. */
function PaperGrain() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{ opacity: 0.5, mixBlendMode: "multiply" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="clearline-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#clearline-grain)" />
    </svg>
  );
}
