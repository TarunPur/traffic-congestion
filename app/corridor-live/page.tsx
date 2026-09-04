"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";

/**
 * 18 · Corridor is live (BUILD-SPEC §11·18) — the one reserved dramatic moment (design §5/§9).
 * Fires on REAL activation (the demand threshold met, or a partnered employer signs) — never on a
 * timer. "Set up my commute" → 19. "Later" → home (never a one-way trap). The "clearing line"
 * resolves; reduced motion settles it, never blank.
 */
export default function CorridorLivePage() {
  const router = useRouter();

  return (
    <AppShell
      scrollClassName="flex flex-col justify-center"
      foot={
        <Cta onClick={() => router.push("/setup")}>Set up my commute</Cta>
      }
    >
      <button className="later" type="button" onClick={() => router.push("/")}>
        Later
      </button>
      <div className="wrap">
        <div className="k">Clearline · now running</div>
        <h1 className="big">
          Your corridor
          <br />
          is live.
        </h1>
        <p className="sub">
          Sikanderpur → DLF Cyber City is now a <b>managed commute</b>. We&rsquo;ve contracted the
          first and last mile and timed the waves — set yours up and we&rsquo;ll build your daily
          plan.
        </p>

        <svg className="clearing" viewBox="0 0 372 40" preserveAspectRatio="none" aria-hidden="true">
          <path className="strand" d="M0 8 C 90 8, 120 30, 200 20 S 320 6, 372 20" />
          <path className="strand" d="M0 32 C 90 32, 120 12, 200 20 S 320 34, 372 20" />
          <path className="strand" d="M0 20 C 120 20, 160 26, 240 20 S 330 16, 372 20" />
          <line className="rail" x1="0" y1="20" x2="360" y2="20" />
          <circle className="node" cx="360" cy="20" r="5" />
        </svg>

        <div className="credit">
          Your <b>commitment held the corridor open</b>. No payment was taken during the pilot — you
          choose how you pay when you book.
        </div>
      </div>
    </AppShell>
  );
}
