"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, Segmented, FilterTabs } from "@/components/controls";
import { Icon } from "@/components/icon";
import { SplitFlap } from "@/components/split-flap";
import { getTrip } from "@/lib/trip-state";
import { hmToMin, type Plan, type Leg } from "@/lib/planner/types";

/**
 * 08 · Ways to go — LOCKED v8 (BUILD-SPEC §7·08). Renders the 4 plans from /api/plan. Leave-by
 * split-flap board, filters, recommended itinerary + expandable alternatives. Honesty: metro =
 * Scheduled, DTC bus = Live·est, first/last-mile shown; late → oxblood + demoted, on-time → grey.
 * Do not restyle.
 */

type Filter = "All" | "Metro" | "Bus" | "No auto-rickshaw";
type Basis = "now" | "arrive";

function fmtMin(m: number): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

function statusText(p: Plan, deadline: number): { late: boolean; text: string } {
  const arr = hmToMin(p.projectedArrival);
  const late = arr - deadline;
  return late > 0
    ? { late: true, text: `Arrives ${fmtMin(arr)} · ${late} min late` }
    : { late: false, text: `Arrives ${fmtMin(arr)} · on time` };
}

function legStamp(l: Leg) {
  if (!l.ride) return null;
  let cls = "";
  let txt = "";
  if (l.mode === "Metro") {
    cls = "sched";
    txt = "Scheduled";
  } else if (l.mode === "Bus") {
    if (/^DTC\b/.test(l.place)) {
      cls = "live";
      txt = "Live · est.";
    } else {
      cls = "sched";
      txt = "Scheduled";
    }
  } else return null;
  return (
    <span className={`tl ${cls}`}>
      <span className="dot" />
      {txt}
    </span>
  );
}

function LegRows({ legs }: { legs: Leg[] }) {
  return (
    <div className="itin">
      {legs.map((l, i) => (
        <div key={i} className={`r${l.ride ? " ride" : ""}`}>
          <span className="mode">{l.mode}</span>
          <span className="place">
            {l.place}
            {legStamp(l)}
          </span>
          <span className="fq">
            <span className="dep">{l.depTime}</span>
            <span className="dur">{l.durMin} min</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function matchesFilter(p: Plan, f: Filter): boolean {
  if (f === "All") return true;
  if (f === "Metro") return p.legs.some((l) => l.mode === "Metro");
  if (f === "Bus") return p.legs.some((l) => l.mode === "Bus");
  return !p.legs.some((l) => l.mode === "Auto"); // No auto-rickshaw
}

export default function WaysPage() {
  const router = useRouter();
  const trip = useMemo(() => getTrip(), []);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [basis, setBasis] = useState<Basis>("now");
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<string | null>(null);

  const deadline = trip.arriveBy ? hmToMin(trip.arriveBy) : 9 * 60 + 30;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: trip.origin ?? { name: "Hauz Khas Enclave" },
            dest: trip.dest ?? { name: "DLF Cyber Hub, Building 10" },
            arriveBy: trip.arriveBy ?? "09:30",
          }),
        });
        if (!res.ok) throw new Error("plan failed");
        const data = (await res.json()) as { plans: Plan[] };
        if (!cancelled) setPlans(data.plans);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.origin, trip.dest, trip.arriveBy]);

  const recommended = plans?.find((p) => p.name === "recommended") ?? plans?.[0] ?? null;
  const leaveBy = recommended?.legs[0]?.depTime ?? "8:35";
  const boardValue = basis === "arrive" ? fmtMin(deadline) : leaveBy;

  const others = (plans ?? [])
    .filter((p) => p !== recommended && matchesFilter(p, filter))
    .map((p) => ({ p, st: statusText(p, deadline) }))
    .sort((a, b) => (a.st.late ? 1 : 0) - (b.st.late ? 1 : 0) || a.p.totalMin - b.p.totalMin);

  return (
    <AppShell
      scrollClassName="!px-0"
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            Times from Delhi transit data · updated 2 min ago
          </div>
          <Cta disabled={!recommended} onClick={() => router.push("/plan?name=recommended")}>
            Set as my commute
          </Cta>
        </>
      }
    >
      <div style={{ padding: "0 var(--m)" }}>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/to")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Ways to go</span>
        </div>

        {loading ? (
          <p style={{ fontFamily: "var(--grot)", fontSize: 13, color: "var(--grey)", marginTop: 40, textAlign: "center" }}>
            Finding ways to go…
          </p>
        ) : failed || !recommended ? (
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)" }}>No ways found for this trip yet.</p>
            <p style={{ fontFamily: "var(--grot)", fontSize: 12.5, color: "var(--grey)", marginTop: 8 }}>
              This corridor isn&rsquo;t covered by our data yet. Try another origin or destination.
            </p>
          </div>
        ) : (
          <>
            <div className="leaveby">
              <div className="k">{basis === "arrive" ? "Arrive by" : "Leave by"}</div>
              <SplitFlap value={boardValue} aria-label={`${basis === "arrive" ? "Arrive by" : "Leave by"} ${boardValue}`} />
              <div className="row2">
                <div className="latest">
                  {basis === "arrive" ? `Leave ${leaveBy} earliest` : `Arrive ${fmtMin(deadline)} latest`}
                </div>
                <Segmented
                  ariaLabel="Departure basis"
                  value={basis}
                  onChange={setBasis}
                  options={[
                    { value: "now", label: "Leave now" },
                    { value: "arrive", label: "Arrive by" },
                  ]}
                />
              </div>
            </div>

            <FilterTabs
              ariaLabel="Filter"
              className="mt-[26px]"
              value={filter}
              onChange={(f) => {
                setFilter(f);
                setOpen(null);
              }}
              options={[
                { value: "All", label: "All" },
                { value: "Metro", label: "Metro" },
                { value: "Bus", label: "Bus" },
                { value: "No auto-rickshaw", label: "No auto-rickshaw" },
              ]}
            />

            <button className="sh" type="button" style={{ width: "100%", cursor: "pointer", background: "none", border: 0 }} onClick={() => router.push("/plan?name=recommended")}>
              <h2>Recommended</h2>
              <span className="tot">{recommended.totalMin} min</span>
            </button>
            <div className="rule" />
            <div className="subline">
              {recommended.timeVsCarMin > 0
                ? `${recommended.timeVsCarMin} min faster than driving`
                : `${Math.abs(recommended.timeVsCarMin)} min slower than driving`}
            </div>
            <div className={`subline ${statusText(recommended, deadline).late ? "late" : ""}`}>
              {statusText(recommended, deadline).text}
            </div>
            <LegRows legs={recommended.legs} />

            <div className="sh" style={{ marginTop: 34 }}>
              <h2>Other ways</h2>
            </div>
            <div className="rule" />
            {others.map(({ p, st }) => {
              const isOpen = open === p.name;
              return (
                <div key={p.name}>
                  <button className="alt" type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.name)}>
                    <span className="a-name" style={{ textTransform: "capitalize" }}>{p.name}</span>
                    <span className="a-tot">{p.totalMin} min</span>
                    <span className={`a-when ${st.late ? "late" : "ontime"}`}>{st.text}</span>
                    <span className="a-chev">
                      <Icon name="chev" size={13} />
                    </span>
                  </button>
                  <div className="altbody">
                    <div>
                      <LegRows legs={p.legs} />
                      <button className="linkbtn" type="button" style={{ margin: "0 0 12px" }} onClick={() => router.push(`/plan?name=${p.name}`)}>
                        See this plan
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ height: 12 }} />
          </>
        )}
      </div>
    </AppShell>
  );
}
