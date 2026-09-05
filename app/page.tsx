"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, Segmented, TabBar } from "@/components/controls";
import { Duotone } from "@/components/duotone";
import { Icon } from "@/components/icon";
import { SplitFlap } from "@/components/split-flap";
import { hmToMin, type Plan, type Leg, type PlaceRef } from "@/lib/planner/types";

// Same duotone crop/treatment as the locked design's homethumb (10-savedhome.html) — also
// reused verbatim on Profile's saved-commute row and Managed Home (design's own "signature
// reuse" note).
const DEST_THUMB_CROP = { sxf: 0.18, syf: 0.1, swf: 0.5, shf: 0.52 };
const DEST_THUMB_OPTIONS = { contrast: 1.9, max: 0.9 };

/**
 * 10 · Saved / home (BUILD-SPEC §7·10). The retention surface — morning-open rate is the product
 * success metric (PRODUCT.md). Reads the saved commute (GET /api/commute, RLS owner-only), plans
 * it live (POST /api/plan), and shows the leave-by split-flap + next departures. Honesty: every
 * time carries a Scheduled/Live label; a late recommended way raises the oxblood disruption banner.
 * Empty (no saved commute) → onboarding nudge. Myself/Clearline toggle reveals the J2 upsell.
 * Home is sensitive — never exposed to employers (RLS).
 */

interface SavedCommute {
  id: string;
  origin: PlaceRef;
  dest: PlaceRef;
  arriveBy: string | null;
  preferredMode: string | null;
  label: string;
}

type Who = "myself" | "clearline";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}
function greeting(h: number): string {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
/** Documented sample starting value for the "until you go" countdown — matches the locked
 * design's own 10-savedhome.html script (`let mins=12`), which ticks down independent of the
 * real clock rather than being derived from it. */
const INITIAL_COUNTDOWN_MIN = 12;
function firstRide(legs: Leg[]): Leg | undefined {
  return legs.find((l) => l.ride);
}
function legStamp(l: Leg): { cls: string; txt: string } {
  if (l.mode === "Bus" && /^DTC\b/.test(l.place)) return { cls: "live", txt: "Live · est." };
  return { cls: "sched", txt: "Scheduled" };
}
function vsCar(mins: number): string {
  return mins >= 0 ? `${mins} min faster than driving` : `${Math.abs(mins)} min slower than driving`;
}

export default function Home() {
  const router = useRouter();
  const [who, setWho] = useState<Who>("myself");
  const [commute, setCommute] = useState<SavedCommute | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [hasManaged, setHasManaged] = useState(false);
  const [leftMin, setLeftMin] = useState<number | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        fetch("/api/managed")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { plan: unknown } | null) => {
            if (!cancelled && d?.plan) setHasManaged(true);
          })
          .catch(() => {});
        const res = await fetch("/api/commute");
        if (!res.ok) throw new Error("commute failed");
        const { commutes } = (await res.json()) as { commutes: SavedCommute[] };
        if (cancelled) return;
        const first = commutes[0] ?? null;
        if (!first) {
          setState("empty");
          return;
        }
        setCommute(first);
        const planRes = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: first.origin,
            dest: first.dest,
            arriveBy: first.arriveBy ?? "09:30",
          }),
        });
        if (!planRes.ok) throw new Error("plan failed");
        const { plans: p } = (await planRes.json()) as { plans: Plan[] };
        if (cancelled) return;
        setPlans(p);
        setState("ready");
      } catch {
        if (!cancelled) setState((s) => (s === "empty" ? s : "error"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recommended = plans?.find((p) => p.name === "recommended") ?? plans?.[0] ?? null;
  const leaveBy = recommended?.legs[0]?.depTime ?? null;

  // Ticking "until you go" countdown (info, not motion — runs under reduced-motion too).
  // This is a documented sample countdown (matching the locked design's own 10-savedhome.html
  // script), not derived from the real wall clock against the stub's fixed depTime — the stub's
  // depTime is a locked demo value (e.g. "8:35") that has no relationship to today's actual
  // time-of-day, so comparing it against the real clock produced a nonsensical multi-hour
  // countdown outside the narrow morning window the demo data implies (see PIXEL-AUDIT.md).
  useEffect(() => {
    if (!leaveBy) return;
    setLeftMin(INITIAL_COUNTDOWN_MIN);
    tick.current = setInterval(() => {
      setLeftMin((m) => (m == null ? m : Math.max(0, m - 1)));
    }, 60_000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [leaveBy]);

  const others = (plans ?? []).filter((p) => p !== recommended);
  const disrupted = recommended != null && !recommended.onTime;

  const tabs = [
    { key: "home" as const, label: "Home", icon: "home" as const },
    { key: "plan" as const, label: "Plan", icon: "search" as const },
    { key: "you" as const, label: "You", icon: "user" as const },
  ];

  return (
    <AppShell
      scrollClassName="pb-[20px]"
      foot={
        <TabBar
          ariaLabel="Main"
          items={tabs}
          current="home"
          onChange={(k) => router.push(k === "home" ? "/" : k === "plan" ? "/from" : "/you")}
        />
      }
    >
      <div className="htop">
        <span className="greet">
          <div className="k">{greeting(today.getHours())}</div>
          <div className="d">{fmtDate(today)}</div>
        </span>
        <Segmented
          className="mt-[2px]"
          ariaLabel="Who runs it"
          value={who}
          onChange={setWho}
          options={[
            { value: "myself", label: "Myself" },
            { value: "clearline", label: "Clearline" },
          ]}
        />
      </div>

      {who === "clearline" ? (
        <section className="j2">
          <div className="k">Clearline · managed</div>
          <div className="t">We don&rsquo;t run your corridor yet.</div>
          <div className="d">
            {hasManaged
              ? "Your managed commute is set up — open it to see today’s pickup and start your trip."
              : "Clearline manages a reserved, door-to-door commute — corridor by corridor, as enough people opt in. Add yours and we’ll tell you the day it opens on your route."}
          </div>
          <Cta
            className="mt-[26px]"
            onClick={() => router.push(hasManaged ? "/managed" : "/eligibility")}
          >
            {hasManaged ? "Open my managed commute" : "Add my commute to the list"}
          </Cta>
        </section>
      ) : state === "loading" ? (
        <p className="home-note">Loading this morning&rsquo;s times…</p>
      ) : state === "empty" ? (
        <section className="onboard">
          <div className="t">No commute saved yet.</div>
          <div className="d">
            Plan a trip and save it as your commute — Clearline opens on it every morning, with the
            time to leave and the next departures.
          </div>
          <Cta className="mt-[24px]" onClick={() => router.push("/choose")}>
            Plan a commute
          </Cta>
        </section>
      ) : (
        <section className="ride">
          {disrupted ? (
            <div className="disrupt" role="status">
              <Icon name="info" size={16} />
              <span>
                Heads up — the recommended way is running late against your{" "}
                {commute?.arriveBy ?? "9:30"} arrival. Check other ways below.
              </span>
            </div>
          ) : null}

          <div className="head">
            <span className="thumb">
              <Duotone
                src="/img/dlf-cyberhub.jpg"
                alt={commute?.dest.name ?? "Destination"}
                canvasWidth={110}
                canvasHeight={110}
                crop={DEST_THUMB_CROP}
                options={DEST_THUMB_OPTIONS}
                vignette={false}
              />
            </span>
            <span>
              <div className="k">{commute?.label ?? "Morning · to work"}</div>
              <div className="route">
                {commute?.origin.name} <span className="t">→ {commute?.dest.name}</span>
              </div>
            </span>
          </div>

          {state === "error" || !recommended ? (
            <p className="home-note">
              Couldn&rsquo;t load this morning&rsquo;s times. Your saved commute is still here — try
              other ways.
            </p>
          ) : (
            <>
              <div className="instrument">
                <div className="lab">Leave by</div>
                <div className="flapline">
                  <SplitFlap value={leaveBy ?? "—"} aria-label={`Leave by ${leaveBy ?? "unknown"}`} />
                  <div className="cd">
                    <div className="n g">
                      {leftMin == null ? "—" : leftMin <= 0 ? "leave now" : `${leftMin} min`}
                    </div>
                    <div className="u">until you go</div>
                  </div>
                </div>
                {firstRide(recommended.legs) ? (
                  <div className="board">
                    <span>
                      Board the <b>{firstRide(recommended.legs)!.depTime} {firstRide(recommended.legs)!.place}</b>
                    </span>
                    <span className={`tl ${legStamp(firstRide(recommended.legs)!).cls}`}>
                      <span className="dot" />
                      {legStamp(firstRide(recommended.legs)!).txt}
                    </span>
                  </div>
                ) : null}
                <div className="verdict">
                  <b>Recommended</b> · {recommended.totalMin} min · {vsCar(recommended.timeVsCarMin)}
                </div>
              </div>

              <Cta className="mt-[24px]" onClick={() => router.push("/plan?name=recommended")}>
                See today&rsquo;s plan
              </Cta>
              <button className="otherways" type="button" onClick={() => router.push("/ways")}>
                Other ways to go &rarr;
              </button>

              {others.length > 0 ? (
                <>
                  <div className="later-h">Later departures</div>
                  <div className="laters">
                    {others.map((p) => {
                      const dep = p.legs[0]?.depTime ?? "";
                      // Relative to the recommended plan's own ticking countdown, not the real
                      // clock — same fix as the primary countdown above (PIXEL-AUDIT.md).
                      const inMin =
                        dep && leaveBy && leftMin != null
                          ? leftMin + (hmToMin(dep) - hmToMin(leaveBy))
                          : null;
                      const rl = firstRide(p.legs);
                      return (
                        <button
                          key={p.name}
                          className="later"
                          type="button"
                          onClick={() => router.push(`/plan?name=${p.name}`)}
                        >
                          <span className="tm g">{dep}</span>
                          <span className="via">
                            {p.legs.map((l) => l.mode).join(" → ")}
                            {rl ? (
                              <span className={`tl ${legStamp(rl).cls}`}>
                                <span className="dot" />
                                {legStamp(rl).txt}
                              </span>
                            ) : null}
                          </span>
                          <span className="in g">
                            {inMin == null ? "" : inMin <= 0 ? "now" : `in ${inMin} min`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </>
          )}

          <div className="evening">
            <div className="k">Evening · home</div>
            <button className="addrow" type="button" onClick={() => router.push("/from")}>
              <span className="ic">
                <Icon name="moon" size={18} />
              </span>
              <span className="tx">
                <span className="t">Add your evening commute</span>
                <span className="d">We&rsquo;ll show when to leave the office</span>
              </span>
              <span className="pl">
                <Icon name="plus" size={18} />
              </span>
            </button>
          </div>

          <button
            className="fbline"
            type="button"
            onClick={() =>
              router.push(
                commute
                  ? `/feedback?origin=${encodeURIComponent(commute.origin.name)}&dest=${encodeURIComponent(commute.dest.name)}`
                  : "/feedback",
              )
            }
          >
            <span className="t">How was yesterday&rsquo;s commute?</span>
            <span className="go">
              Rate it <Icon name="chevR" size={14} />
            </span>
          </button>
        </section>
      )}
    </AppShell>
  );
}
