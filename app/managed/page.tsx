"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, Segmented, TabBar } from "@/components/controls";
import { Icon } from "@/components/icon";
import { SplitFlap } from "@/components/split-flap";
import { hmToMin } from "@/lib/planner/types";
import type { ManagedPlan } from "@/lib/managed-plan";

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
  const today = useMemo(() => new Date(), []);

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
          <section className="empty">
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

  const leftMin = hmToMin(plan.leaveBy) - (today.getHours() * 60 + today.getMinutes());

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
          <span className="thumb-i">
            <Icon name="route" size={20} />
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
              <div className="n g">{leftMin <= 0 ? "be ready" : `${leftMin} min`}</div>
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
