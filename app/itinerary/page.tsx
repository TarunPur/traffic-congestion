"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { SplitFlap } from "@/components/split-flap";
import type { ManagedPlan } from "@/lib/managed-plan";

/**
 * 20 · Itinerary card — THE primary J2 surface (BUILD-SPEC §11·20, design §11).
 * The boarding-pass "stub" is ruled paper (paper2 band + dashed perforation), NOT a card; the
 * LEAVE split-flap is the one tile. Every leg is contracted (`.tl.mgd` filled ink square, incl.
 * the AC-shuttle trunk — not public transit). Legs are a "committed window," never "guaranteed";
 * a failed leg → fallback cab + that day credited.
 */

interface Setup {
  home: string | null;
  tower: string | null;
}

export default function ItineraryPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<ManagedPlan | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/managed");
      if (cancelled) return;
      if (!res.ok) {
        setState("missing");
        return;
      }
      const data = (await res.json()) as { setup: Setup | null; plan: ManagedPlan | null };
      if (!data.plan) {
        setState("missing");
        return;
      }
      setPlan(data.plan);
      setSetup(data.setup);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <AppShell>
        <div className="topbar">
          <span className="step">Your plan</span>
        </div>
        <p className="home-note">Building your plan…</p>
      </AppShell>
    );
  }

  if (state === "missing" || !plan) {
    return (
      <AppShell foot={<Cta onClick={() => router.push("/setup")}>Set up my commute</Cta>}>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/setup")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Your plan</span>
        </div>
        <p className="home-note">No managed plan yet — set up your commute first.</p>
      </AppShell>
    );
  }

  const originName = setup?.home ?? "Hauz Khas Enclave";
  const towerName = setup?.tower ?? "DLF Cyber City, Bldg 10";

  return (
    <AppShell
      scrollClassName="!px-0"
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            Per-day ₹{plan.perDayFare} · optional monthly pass at booking
          </div>
          <Cta onClick={() => router.push("/booking")}>Accept &amp; save this commute</Cta>
        </>
      }
    >
      <div style={{ padding: "0 var(--m)" }}>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/setup")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Your plan</span>
        </div>
      </div>

      <div className="ticket">
        <div className="k">Your managed commute · weekdays</div>
        <div className="flapline">
          <div>
            <div className="k" style={{ marginBottom: 8 }}>
              Leave
            </div>
            <SplitFlap value={plan.leaveBy} aria-label={`Leave ${plan.leaveBy}`} />
          </div>
          <div className="d2d">
            <div className="n">{plan.doorToDoorMin} min</div>
            <div className="u">door&#8209;to&#8209;door</div>
          </div>
        </div>
        <div className="od">
          {originName} <span className="t">&rarr; {towerName}</span>
        </div>
        <div className="perf" />
        <div className="relia">
          <Icon name="shield" size={16} />
          <span>
            <b>≥85% on-time</b> · auto fallback cab + fare credit if a leg fails
          </span>
        </div>
      </div>

      <div style={{ padding: "0 var(--m)" }}>
        <div className="sh">
          <h2>The journey</h2>
          <span className="tot" style={{ fontWeight: 400, color: "var(--grey2)" }}>
            {plan.transfers} transfer{plan.transfers === 1 ? "" : "s"}
          </span>
        </div>
        <div className="rule" />
        <div className="itin mgd-legs">
          {plan.legs.map((l, i) => (
            <div key={i} className={`r${l.contracted ? " ride" : ""}`}>
              <span className="mode">{l.mode}</span>
              <span className="place">
                {l.place}
                <span className="arr">{l.note}</span>
                {l.contracted ? (
                  <span className="tl mgd">
                    <span className="dot" />
                    {l.windowLabel}
                  </span>
                ) : null}
              </span>
              <span className="fq">
                <span className="dep">{l.depTime}</span>
                <span className="dur">{l.durMin} min</span>
              </span>
            </div>
          ))}
        </div>

        <div className="sh">
          <h2>Why this plan</h2>
        </div>
        <div className="rule" />
        <div className="why">
          <div className="cell">
            <div className="n">{plan.doorToDoorMin} min</div>
            <div className="l">door-to-door</div>
          </div>
          <div className="cell">
            <div className="n">{plan.transfers}</div>
            <div className="l">transfer</div>
          </div>
          <div className="cell">
            <div className="n">{plan.walkM} m</div>
            <div className="l">total walk</div>
          </div>
          <div className="cell">
            <div className="n">₹{plan.perDayFare}</div>
            <div className="l">per day</div>
          </div>
        </div>

        <div className="cap2">
          Managed by Clearline. Every leg — first mile, the AC-shuttle trunk, and last mile — is
          contracted and run in a committed window. If a leg fails, a fallback cab is auto-dispatched
          and that day is credited.
        </div>
      </div>
    </AppShell>
  );
}
