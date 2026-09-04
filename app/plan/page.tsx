"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { getTrip } from "@/lib/trip-state";
import { saveCommute } from "@/lib/save-commute";
import { lineColour } from "@/lib/tokens";
import { useCountUp } from "@/lib/use-count-up";
import { hmToMin, type Plan, type Leg, type PlanName } from "@/lib/planner/types";

function fmtMin(m: number): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

function VsCar({ mins, co2 }: { mins: number; co2: number }) {
  const m = useCountUp(Math.abs(mins), { decimals: 0 });
  const kg = useCountUp(co2, { decimals: 1 });
  return (
    <p className="vscar">
      <span className="fig">{m}</span> min {mins >= 0 ? "faster" : "slower"} than driving
      <br />
      <span className="fig">{kg}</span> kg CO₂ saved
    </p>
  );
}

function JourneyBar({ legs }: { legs: Leg[] }) {
  return (
    <div className="jbar">
      <div className="jbar-head">
        <span className="lab">The journey at a glance</span>
        <span className="jbar-key">
          <i />
          you arrange
        </span>
      </div>
      <div className="jbar-track">
        {legs.map((l, i) => (
          <span
            key={i}
            className={`sg ${l.ride ? "ride" : "self"}`}
            style={{ flexGrow: l.durMin, ...(l.ride && l.line ? { background: lineColour(l.line) } : {}) }}
          />
        ))}
      </div>
      <div className="jbar-labs">
        {legs.map((l, i) => (
          <span key={i} className="lb" style={{ flexGrow: l.durMin }}>
            <span className="m">{l.mode}</span>
            <span className="d">
              {l.durMin}
              <small>m</small>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function LegRow({ leg }: { leg: Leg }) {
  const [open, setOpen] = useState(false);
  const arrive = fmtMin(hmToMin(leg.depTime) + leg.durMin);
  const hasDetail = (leg.detail?.length ?? 0) > 0 || (leg.stops?.length ?? 0) > 0;
  return (
    <div className={`r${leg.ride ? " ride" : ""}`}>
      <span className="mode">{leg.mode}</span>
      <span className="place">
        {leg.place}
        {leg.arrangeYourself ? (
          <span className="tagself lab" style={{ color: "var(--grey2)" }}>
            you arrange this
          </span>
        ) : null}
        {leg.scheduled ? (
          <div className="schedrow" style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span className="stamp">
              <span className="dot" />
              <span className="st">Scheduled</span>
            </span>
            {leg.freq ? <span className="freq" style={{ fontFamily: "var(--grot)", fontSize: 10.5, color: "var(--grey)" }}>{leg.freq}</span> : null}
          </div>
        ) : null}
        {hasDetail ? (
          <>
            <button className="stops-t" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <span>Platform, gate &amp; {leg.stops?.length ?? 0} stops</span>
              <span className="cx">
                <Icon name="chev" size={15} />
              </span>
            </button>
            <div className={`stops-wrap${open ? " open" : ""}`}>
              <div className="stops-in">
                <div className="stops">
                  {leg.detail?.map((d, i) => (
                    <span className="det" key={i}>
                      {d}
                    </span>
                  ))}
                  {leg.stops && leg.stops.length > 0 ? (
                    <ol>
                      {leg.stops.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </span>
      <span className="fq">
        <span className="dep">{leg.depTime}</span>
        <span className="dur">{leg.durMin} min</span>
        <span className="ar">→ {arrive}</span>
      </span>
    </div>
  );
}

function PlanDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const name = (params.get("name") ?? "recommended") as PlanName;
  const trip = useMemo(() => getTrip(), []);
  const [plans, setPlans] = useState<Plan[] | null>(null);

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
        const data = (await res.json()) as { plans: Plan[] };
        if (!cancelled) setPlans(data.plans);
      } catch {
        if (!cancelled) setPlans([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.origin, trip.dest, trip.arriveBy]);

  const plan = plans?.find((p) => p.name === name) ?? plans?.[0] ?? null;
  const originName = trip.origin?.name ?? "Hauz Khas Enclave";
  const destName = trip.dest?.name ?? "DLF Cyber Hub · Bldg 10";

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function onSavePlan() {
    if (!plan) return;
    setSaveState("saving");
    const ok = await saveCommute({
      origin: trip.origin ?? { name: originName },
      dest: trip.dest ?? { name: destName },
      arriveBy: trip.arriveBy ?? "09:30",
      preferredMode: plan.legs.find((l) => l.ride)?.mode ?? null,
    });
    if (!ok) {
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    setTimeout(() => router.push("/"), 800);
  }

  return (
    <AppShell
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: saveState === "error" ? "var(--accent)" : "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            {saveState === "error"
              ? "Couldn’t save that — check your connection and try again."
              : "Times from Delhi transit data · updated 2 min ago · not guaranteed"}
          </div>
          <div className="upsell">
            <div className="u-l">
              Tired of arranging the autos? <b>Clearline can run this daily.</b>
            </div>
            <button className="u-b" type="button" onClick={() => router.push("/eligibility")}>
              <span>See the pass</span>
              <Icon name="arrow" size={15} />
            </button>
          </div>
          <Cta
            disabled={!plan}
            loading={saveState === "saving"}
            loadingLabel="Saving…"
            onClick={onSavePlan}
          >
            {saveState === "saved" ? "Saved as your commute" : "Save this plan"}
          </Cta>
        </>
      }
    >
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/ways")}>
          <Icon name="back" size={22} />
        </button>
        <span className="step" style={{ textTransform: "capitalize" }}>{name} way</span>
      </div>

      {!plan ? (
        <p style={{ fontFamily: "var(--grot)", fontSize: 13, color: "var(--grey)", marginTop: 40, textAlign: "center" }}>Loading the plan…</p>
      ) : (
        <>
          <div className="trip-line">
            <b>{originName}</b> → {destName}
          </div>

          <div className="hero">
            <div className="big">
              <span className="n">{plan.totalMin}</span>
              <span className="un">min door-to-door</span>
            </div>
            <div className="stats">
              <div className="s">
                <div className="n">{plan.legs[0]?.depTime}</div>
                <div className="l">leave</div>
              </div>
              <div className="s">
                <div className="n">{plan.projectedArrival}</div>
                <div className="l">arrive</div>
              </div>
              <div className="s">
                <div className="n">{Math.max(0, plan.legs.length - 1)}</div>
                <div className="l">changes</div>
              </div>
            </div>
            <VsCar mins={plan.timeVsCarMin} co2={plan.co2VsCar ?? 0} />
          </div>

          <JourneyBar legs={plan.legs} />

          <div className="legs-h">
            <span className="lab">Leg by leg</span>
            {plan.fare != null ? (
              <span className="fare">
                Fare <b>₹{plan.fare}</b>
              </span>
            ) : null}
          </div>
          <div className="itin">
            {plan.legs.map((l, i) => (
              <LegRow key={i} leg={l} />
            ))}
          </div>
          <div style={{ height: 8 }} />
        </>
      )}
    </AppShell>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanDetail />
    </Suspense>
  );
}
