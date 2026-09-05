"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon, type IconName } from "@/components/icon";
import { AboutClearing } from "@/components/about-clearing";

/**
 * 14 · About (BUILD-SPEC §10·14). The source icon + status-badge matrix is the public statement
 * of data honesty (design §10) — buses live, metro scheduled, platform/gate curated demo. The
 * "pre-launch — no fabricated traction" line stays verbatim. The brand block has its own distinct
 * animation (AboutClearing) — not ClearingSplash, which is reserved for Login/Verify — a static
 * underlined wordmark, and its own tagline (design §9). Reduced motion settles it, never blank.
 */

function Badge({ cls, children }: { cls: "live" | "sched"; children: ReactNode }) {
  return (
    <span className={`tl ${cls}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

const SOURCES: { icon: IconName; nm: string; d: string; badge: ReactNode }[] = [
  { icon: "bus", nm: "Buses", d: "Live GPS from 1,700+ Delhi buses — arrival is an estimate.", badge: <Badge cls="live">Live · est.</Badge> },
  { icon: "metro", nm: "Metro", d: "DMRC timetable — no live-train feed exists.", badge: <Badge cls="sched">Scheduled</Badge> },
  { icon: "route", nm: "Routes & fares", d: "Real GTFS routes and line colours; fares approximate.", badge: <span className="meta">Reference</span> },
  { icon: "pin", nm: "Gurgaon · Gurugaman", d: "Static routes only — no live positions yet.", badge: <Badge cls="sched">Scheduled</Badge> },
  { icon: "gate", nm: "Platform & gate", d: "Hand-checked for the demo corridor; not citywide yet.", badge: <span className="meta">Demo only</span> },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <AppShell scrollClassName="pb-[30px]">
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back to home" onClick={() => router.push("/")}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <div className="brand">
        <AboutClearing />
        <span className="wordmark">
          Clearline
          <span className="wordmark-line" />
        </span>
        <div className="tag">Your commute, confirmed.</div>
        <p className="lede">
          One honest timetable for your Delhi commute — <b>Metro, bus, auto and walk</b>, and when to
          leave.
        </p>
      </div>

      <div className="sh">
        <h2>Where our times come from</h2>
      </div>
      <div className="rule" />
      <div className="src">
        {SOURCES.map((s) => (
          <div key={s.nm} className="row">
            <span className="ic">
              <Icon name={s.icon} size={22} />
            </span>
            <div>
              <div className="nm">{s.nm}</div>
              <div className="d">{s.d}</div>
            </div>
            {s.badge}
          </div>
        ))}
      </div>

      <div className="sh">
        <h2>What Clearline can&rsquo;t do</h2>
      </div>
      <div className="rule" />
      <ul className="limits">
        <li>
          <span className="dash">&mdash;</span>
          <span>
            We don&rsquo;t run any bus or train. <b>Times can be stale and are never a guarantee.</b>
          </span>
        </li>
        <li>
          <span className="dash">&mdash;</span>
          <span>No tickets, passes or wallet yet — buy your fare the usual way.</span>
        </li>
        <li>
          <span className="dash">&mdash;</span>
          <span>
            The first &amp; last stretch (walk, auto) is <b>yours to arrange.</b>
          </span>
        </li>
        <li>
          <span className="dash">&mdash;</span>
          <span>We&rsquo;re pre-launch — no users, partners or press we don&rsquo;t have.</span>
        </li>
      </ul>

      <div className="colophon">
        <p>Clearline · Journey 1 preview · Delhi NCR</p>
        <p>
          Destination photography: DLF Cyber Hub by Slyronit, Wikimedia Commons, CC BY-SA 4.0. Map
          data © OpenStreetMap contributors, via OpenFreeMap.
        </p>
      </div>
    </AppShell>
  );
}
