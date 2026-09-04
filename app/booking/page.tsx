"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, Segmented, RuledRows } from "@/components/controls";
import { Icon, type IconName } from "@/components/icon";
import type { ManagedPlan } from "@/lib/managed-plan";

/**
 * 21 · Booking & pass (BUILD-SPEC §11·21). Pricing is shown; BILLING IS OFF — "₹0 · pilot",
 * reserve now, pay nothing until billing is switched on. NO payment SDK, ever. Confirm creates a
 * `bookings` row with billing_on = false (RLS independently rejects true) → 23.
 */

type Trip = "round" | "morning";
type PlanType = "monthly" | "per_day";

const TERMS: { icon: IconName; h: string; d: string }[] = [
  { icon: "shield", h: "Fallback cab if a contracted leg fails", d: " — that fare is credited to you." },
  { icon: "clock", h: "Skip a day or pause the pass", d: " within policy — no charge for skipped days." },
  { icon: "check", h: "Cancel any time before your first ride", d: " — nothing is charged during the pilot." },
];

export default function BookingPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>("round");
  const [planType, setPlanType] = useState<PlanType>("monthly");
  const [fares, setFares] = useState<{ perDay: number; monthly: number }>({ perDay: 185, monthly: 3400 });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/managed");
      if (cancelled || !res.ok) return;
      const { plan } = (await res.json()) as { plan: ManagedPlan | null };
      if (plan) setFares({ perDay: plan.perDayFare, monthly: plan.monthlyFare });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    setState("saving");
    const res = await fetch("/api/managed/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripType: trip,
        planType,
        price: planType === "monthly" ? fares.monthly : fares.perDay,
      }),
    });
    if (!res.ok) {
      setState("idle");
      return;
    }
    setState("saved");
    setTimeout(() => router.push("/managed"), 1400);
  }

  const PLANS: { key: PlanType; nm: string; sub: string; price: string; u: string }[] = [
    { key: "monthly", nm: "Monthly pass", sub: "Best for a daily commute · pause any time", price: `₹${fares.monthly.toLocaleString("en-IN")}`, u: "per month" },
    { key: "per_day", nm: "Per day", sub: "Pay only the days you ride", price: `₹${fares.perDay}`, u: "per day" },
  ];

  return (
    <AppShell
      scrollClassName="pb-[24px]"
      foot={
        <Cta loading={state === "saving"} loadingLabel="Saving…" onClick={confirm}>
          {state === "saved" ? "Commute saved" : "Confirm commute"}
        </Cta>
      }
    >
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/itinerary")}>
          <Icon name="back" size={22} />
        </button>
        <span className="step">Booking</span>
      </div>

      <h1 className="h1">Book your commute</h1>
      <p className="said">
        Start per-day, switch to a pass any time. Skip a day or pause the pass within policy.
      </p>

      <div className="sh">
        <h2>How you pay</h2>
      </div>
      <div className="rule" />
      <RuledRows className="plan">
        {PLANS.map((p) => (
          <button
            key={p.key}
            className="rowline"
            type="button"
            role="option"
            aria-selected={planType === p.key}
            data-selected={planType === p.key}
            onClick={() => setPlanType(p.key)}
          >
            <span className="lines">
              <span className="nm">{p.nm}</span>
              <span className="sub">{p.sub}</span>
            </span>
            <span className="price">
              {p.price}
              <span className="u">{p.u}</span>
            </span>
            <span className="tick">
              <Icon name="check" size={20} />
            </span>
          </button>
        ))}
      </RuledRows>

      <div className="sh">
        <h2>Trip</h2>
      </div>
      <div className="rule" />
      <Segmented
        className="mt-[16px]"
        ariaLabel="Trip type"
        value={trip}
        onChange={setTrip}
        options={[
          { value: "round", label: "Round trip" },
          { value: "morning", label: "Morning only" },
        ]}
      />

      <div className="sh">
        <h2>What&rsquo;s covered</h2>
      </div>
      <div className="rule" />
      <div className="terms">
        {TERMS.map((t) => (
          <div key={t.h} className="term">
            <span className="ic">
              <Icon name={t.icon} size={18} />
            </span>
            <span>
              <b>{t.h}</b>
              {t.d}
            </span>
          </div>
        ))}
      </div>

      <div className="sumrow">
        <span className="l">Due today</span>
        <span className="v">₹0 · pilot</span>
      </div>
      <div className="pilot-credit">
        No payment is collected during the pilot — reserve your seat now, pay nothing until billing
        is switched on.
      </div>
    </AppShell>
  );
}
