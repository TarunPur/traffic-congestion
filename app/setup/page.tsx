"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, TextField } from "@/components/controls";
import { Icon } from "@/components/icon";

/**
 * 19 · Managed setup (BUILD-SPEC §11·19). Home / tower prefill from the J1 profile where set
 * (the progressive-profile payoff). Arrival + return steppers (±15). Mon–Fri chips (≥1 required).
 * Reached from BOTH 18 (demand path) and 17a (partnered path) — back is history-aware. Generate →
 * writes `managed_setups`, builds the `ManagedPlan` → /itinerary.
 */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

function fmt(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

export default function SetupPage() {
  const router = useRouter();
  const [home, setHome] = useState("");
  const [tower, setTower] = useState("");
  const [arrive, setArrive] = useState(9 * 60 + 30);
  const [ret, setRet] = useState(18 * 60 + 30);
  const [days, setDays] = useState<Set<string>>(new Set(DAYS));
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pRes, mRes] = await Promise.all([fetch("/api/profile"), fetch("/api/managed")]);
      if (cancelled) return;
      if (mRes.ok) {
        const { setup } = (await mRes.json()) as { setup: { home: string | null; tower: string | null } | null };
        if (setup?.home) setHome(setup.home);
        if (setup?.tower) setTower(setup.tower);
      }
      if (pRes.ok) {
        const { fields } = (await pRes.json()) as { fields: { home: string | null; work: string | null } };
        setHome((h) => h || fields.home || "");
        setTower((t) => t || fields.work || "");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleDay(d: string) {
    setDays((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });
  }

  async function generate() {
    if (days.size === 0) return;
    setBuilding(true);
    const res = await fetch("/api/managed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        home,
        tower,
        arriveBy: fmt(arrive),
        returnAfter: fmt(ret),
        days: DAYS.filter((d) => days.has(d)),
      }),
    });
    if (!res.ok) {
      setBuilding(false);
      return;
    }
    router.push("/itinerary");
  }

  return (
    <AppShell
      scrollClassName="pb-[24px]"
      foot={
        <Cta disabled={days.size === 0} loading={building} loadingLabel="Building your plan…" onClick={generate}>
          Generate my plan
        </Cta>
      }
    >
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.back()}>
          <Icon name="back" size={22} />
        </button>
        <span className="step">Managed setup</span>
      </div>

      <h1 className="h1">
        Set up your
        <br />
        daily commute
      </h1>
      <p className="said">One reliable plan, every weekday. You can change pickup, timing or mode later.</p>

      <div className="fl">
        <TextField label="Home area" iconLeft="home" value={home} onChange={setHome} aria-label="Home area" />
      </div>
      <div className="fl">
        <TextField label="Your tower" iconLeft="work" value={tower} onChange={setTower} aria-label="Tower" />
      </div>

      <div className="fl">
        <span className="lab">Reach the office by</span>
        <div className="step2">
          <span className="t">{fmt(arrive)}</span>
          <span className="btns">
            <button type="button" aria-label="Earlier arrival" onClick={() => setArrive((m) => m - 15)}>
              &ndash;
            </button>
            <button type="button" aria-label="Later arrival" onClick={() => setArrive((m) => m + 15)}>
              +
            </button>
          </span>
        </div>
      </div>

      <div className="fl">
        <span className="lab">Head home after</span>
        <div className="step2">
          <span className="t">{fmt(ret)}</span>
          <span className="btns">
            <button type="button" aria-label="Earlier return" onClick={() => setRet((m) => m - 15)}>
              &ndash;
            </button>
            <button type="button" aria-label="Later return" onClick={() => setRet((m) => m + 15)}>
              +
            </button>
          </span>
        </div>
        <div className="hint">
          We plan the evening around this time. Running late? Reschedule from your home screen before
          the return leg is planned — no charge.
        </div>
      </div>

      <div className="fl">
        <span className="lab">Days</span>
        <div className="days">
          {DAYS.map((d) => (
            <button key={d} type="button" aria-pressed={days.has(d)} onClick={() => toggleDay(d)}>
              {d}
            </button>
          ))}
        </div>
        <div className="hint">We build one plan for these days. Skip any day later without charge.</div>
      </div>
    </AppShell>
  );
}
