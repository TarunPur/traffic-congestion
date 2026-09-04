"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon, type IconName } from "@/components/icon";
import { Duotone } from "@/components/duotone";

/**
 * 17 · Corridor & waitlist (BUILD-SPEC §11·17) — the not-partnered path. Reads the real corridor
 * (committed_count / threshold / status). Commit = INTENT, NOT MONEY — creates a `commitment` and
 * the count is recomputed server-side. The count is never fabricated. If the corridor is already
 * open (real threshold met), this screen forwards straight to 18.
 */

interface Corridor {
  id: string;
  name: string;
  threshold: number;
  committedCount: number;
  status: "waitlisted" | "open";
  committed: boolean;
}

const GETS: { icon: IconName; t: string; d: string }[] = [
  {
    icon: "check",
    t: "Door-to-door, arranged for you",
    d: "Contracted pickup, one staged transfer, and a last-mile drop at your tower — no hailing or negotiating.",
  },
  {
    icon: "clock",
    t: "≥85% on-time, or we make it right",
    d: "A published reliability target. If a contracted leg fails, an auto fallback cab is dispatched and that fare is credited back.",
  },
  {
    icon: "shield",
    t: "One transfer, zero walk, no second fare gate",
    d: "The connecting vehicle is held against live ETA so you step straight across.",
  },
];

export default function CorridorPage() {
  const router = useRouter();
  const [c, setC] = useState<Corridor | null>(null);
  const [state, setState] = useState<"idle" | "committing" | "committed">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/corridor");
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as Corridor;
      if (data.status === "open") {
        router.replace("/corridor-live");
        return;
      }
      setC(data);
      if (data.committed) setState("committed");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function commit() {
    if (!c) return;
    setState("committing");
    const res = await fetch("/api/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corridorId: c.id }),
    });
    if (!res.ok) {
      setState("idle");
      return;
    }
    const { committedCount, status } = (await res.json()) as { committedCount: number; status: Corridor["status"] };
    setC({ ...c, committedCount, status, committed: true });
    setState("committed");
    if (status === "open") setTimeout(() => router.push("/corridor-live"), 1400);
  }

  const pct = c ? Math.min(100, Math.round((c.committedCount / c.threshold) * 100)) : 0;
  const remaining = c ? Math.max(0, c.threshold - c.committedCount) : 0;

  return (
    <AppShell
      scrollClassName="!px-0"
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            No payment now · fully managed once the corridor opens
          </div>
          <Cta
            disabled={!c}
            loading={state === "committing"}
            loadingLabel="Committing…"
            onClick={commit}
          >
            {state === "committed" ? "You’re on the waitlist" : "Commit my seat"}
          </Cta>
        </>
      }
    >
      <div className="topbar" style={{ position: "absolute", zIndex: 3, left: "var(--m)" }}>
        <button className="iconbtn" type="button" aria-label="Back" style={{ background: "color-mix(in srgb, var(--paper) 72%, transparent)" }} onClick={() => router.push("/")}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <div className="mast">
        <Duotone
          src="/img/dlf-cyberhub.jpg"
          alt="DLF Cyber City, Gurgaon"
          canvasWidth={440}
          canvasHeight={300}
          crop={{ sxf: 0, syf: 0, swf: 1, shf: 0.62 }}
          options={{ contrast: 1.9, max: 0.86 }}
          vignette={false}
        />
      </div>

      <div style={{ padding: "0 var(--m)" }}>
        <div className="masthead">
          <div className="k">Clearline · managed corridor</div>
          <div className="rt">{c?.name ?? "Sikanderpur → DLF Cyber City"}</div>
        </div>

        <p className="said">
          Your workplace isn&rsquo;t a Clearline partner yet — so this corridor runs on commitment. A
          reserved, door-to-door commute on a contracted AC shuttle, with contracted first and last
          mile and one staged transfer. Commit and we take the demand to your employer; it opens when
          enough people commit.
        </p>

        <div className="act">
          <div className="row">
            <span className="n">
              {c?.committedCount ?? 0}
              <span className="of"> / {c?.threshold ?? 250} committed</span>
            </span>
            <span className="lab">{c?.status === "open" ? "Open" : "Opening soon"}</span>
          </div>
          <div className="prog">
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="note">
            {remaining > 0
              ? `${remaining} more commitments open this corridor — and strengthen the case we take to your employer.`
              : "The threshold is met — this corridor is opening."}
          </div>
        </div>

        <div className="sh">
          <h2>What you get</h2>
        </div>
        <div className="rule" />
        <div className="gets">
          {GETS.map((g) => (
            <div key={g.t} className="get">
              <span className="ic">
                <Icon name={g.icon} size={20} />
              </span>
              <span>
                <span className="t">{g.t}</span>
                <div className="d">{g.d}</div>
              </span>
            </div>
          ))}
        </div>

        <div className="dep">
          <div className="t">Commit your seat — no payment</div>
          <div className="d">
            You&rsquo;re committing intent, not money. Nothing is charged during the pilot.
            We&rsquo;ll notify you when the corridor opens — then you choose per-day or a monthly
            pass.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
