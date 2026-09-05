"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, Segmented, TabBar } from "@/components/controls";
import { Duotone } from "@/components/duotone";
import { SplitFlap } from "@/components/split-flap";
import type { ManagedPlan } from "@/lib/managed-plan";

// Same duotone crop/treatment as Home's ride-head thumbnail (design's own "signature reuse").
const DEST_THUMB_CROP = { sxf: 0.18, syf: 0.1, swf: 0.5, shf: 0.52 };
const DEST_THUMB_OPTIONS = { contrast: 1.9, max: 0.9 };

/** Documented sample starting value for the "until pickup" countdown — matches the locked
 * design's own 23-managed-home.html script (`let mins=18`), which ticks down independent of
 * the real clock rather than deriving it from `plan.leaveBy` (a fixed demo time unrelated to
 * today's actual time-of-day — see PIXEL-AUDIT.md's countdown bug). */
const INITIAL_COUNTDOWN_MIN = 18;

/**
 * 23 · Managed home (BUILD-SPEC §11·23) — the post-activation home. Mirrors the J1 home so the
 * Myself/Clearline switch is seamless. The assigned managed ride leads (`.tl.mgd` "Assigned",
 * "Pilot — reserved, no charge yet"). Reschedule/modify → setup. Myself → J1 home (/).
 */

interface Setup {
  home: string | null;
  tower: string | null;
}

function greeting(h: number): string {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function ManagedHomePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<ManagedPlan | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none">("loading");
  const [leftMin, setLeftMin] = useState<number | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!plan) return;
    setLeftMin(INITIAL_COUNTDOWN_MIN);
    tick.current = setInterval(() => {
      setLeftMin((m) => (m == null ? m : Math.max(0, m - 1)));
    }, 60_000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [plan]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/managed");
      if (cancelled) return;
      if (!res.ok) {
        setState("none");
        return;
      }
      const data = (await res.json()) as { setup: Setup | null; plan: ManagedPlan | null };
      if (!data.plan) {
        setState("none");
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

  const tabs = [
    { key: "home" as const, label: "Home", icon: "home" as const },
    { key: "plan" as const, label: "Plan", icon: "search" as const },
    { key: "you" as const, label: "You", icon: "user" as const },
  ];
  const foot = (
    <TabBar
      ariaLabel="Main"
      items={tabs}
      current="home"
      onChange={(k) => router.push(k === "home" ? "/managed" : k === "plan" ? "/from" : "/you")}
    />
  );

  const whoSeg = (
    <Segmented
      className="mt-[2px]"
      ariaLabel="Who runs it"
      value="clearline"
      onChange={(v) => {
        if (v === "myself") router.push("/");
      }}
      options={[
        { value: "myself", label: "Myself" },
        { value: "clearline", label: "Clearline" },
      ]}
    />
  );

  if (state !== "ready" || !plan) {
    return (
      <AppShell scrollClassName="pb-[20px]" foot={foot}>
        <div className="htop">
          <span className="greet">
            <div className="k">{greeting(today.getHours())}</div>
            <div className="d">
              {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
            </div>
          </span>
          {whoSeg}
        </div>
        {state === "loading" ? (
          <p className="home-note">Loading your managed commute…</p>
        ) : (
          <section className="onboard">
            <div className="t">No managed commute yet.</div>
            <div className="d">
              The managed commute is a reserved, door-to-door ride on covered corridors. Check
              whether yours is one.
            </div>
            <Cta className="mt-[24px]" onClick={() => router.push("/eligibility")}>
              Explore the managed commute
            </Cta>
          </section>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell scrollClassName="pb-[20px]" foot={foot}>
      <div className="htop">
        <span className="greet">
          <div className="k">{greeting(today.getHours())}</div>
          <div className="d">
            {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
          </div>
        </span>
        {whoSeg}
      </div>

      <section className="ride">
        <div className="head">
          <span className="thumb">
            <Duotone
              src="/img/dlf-cyberhub.jpg"
              alt={setup?.tower ?? "DLF Cyber City"}
              canvasWidth={110}
              canvasHeight={110}
              crop={DEST_THUMB_CROP}
              options={DEST_THUMB_OPTIONS}
              vignette={false}
            />
          </span>
          <span>
            <div className="k">Managed · to work</div>
            <div className="route">
              {setup?.home ?? "Hauz Khas Enclave"} <span className="t">&rarr; {setup?.tower ?? "DLF Cyber City"}</span>
            </div>
          </span>
        </div>

        <div className="instrument">
          <div className="lab">Be ready by</div>
          <div className="flapline">
            <SplitFlap value={plan.leaveBy} aria-label={`Be ready by ${plan.leaveBy}`} />
            <div className="cd">
              <div className="n g">{leftMin == null ? "—" : leftMin <= 0 ? "be ready" : `${leftMin} min`}</div>
              <div className="u">until pickup</div>
            </div>
          </div>
          <div className="board">
            <span>
              Your <b>Clearline auto</b> picks you up at the gate
            </span>
            <span className="tl mgd">
              <span className="dot" />
              Assigned
            </span>
          </div>
          <div className="verdict">
            <b>{plan.doorToDoorMin} min</b> door-to-door · ≥85% on-time · fallback covered
          </div>
        </div>

        <Cta className="mt-[24px]" onClick={() => router.push("/trip")}>
          Start today&rsquo;s trip
        </Cta>
        <button className="otherways" type="button" onClick={() => router.push("/setup")}>
          Change pickup, time or mode &rarr;
        </button>
      </section>

      <div className="rowh">Your commute</div>
      <div className="line">
        <span>
          <span className="nm">Evening · home</span>
          <div className="sub">Reserved shuttle · leaves after 18:30</div>
        </span>
        <button className="line-a" type="button" onClick={() => router.push("/setup")}>
          Reschedule
        </button>
      </div>
      <div className="line">
        <span>
          <span className="nm">Monthly pass</span>
          <div className="sub">Pilot — reserved, no charge yet</div>
        </span>
        <button className="line-a" type="button" onClick={() => router.push("/booking")}>
          Manage
        </button>
      </div>
    </AppShell>
  );
}
