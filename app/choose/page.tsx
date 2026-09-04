"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { setTrip, type ServiceChoice } from "@/lib/trip-state";

/**
 * 03 · Choose service (BUILD-SPEC §7·03). Free → 04 (Where from); Managed → 17a (eligibility).
 * Managed CTA becomes "Join the waitlist"; the uncovered-corridor sub-line stays honest.
 */
export default function ChoosePage() {
  const router = useRouter();
  const [choice, setChoice] = useState<ServiceChoice>("free");

  function onContinue() {
    setTrip({ service: choice });
    router.push(choice === "free" ? "/from" : "/eligibility");
  }

  return (
    <AppShell
      foot={
        <Cta onClick={onContinue}>{choice === "managed" ? "Join the waitlist" : "Continue"}</Cta>
      }
    >
      <div className="topbar">
        <span className="step">Step 2 of 4</span>
      </div>
      <h1 className="h1">How should we help today?</h1>
      <div className="said">Start with free planning. Upgrade when your route is covered.</div>

      <div className="modes" role="radiogroup" aria-label="Service">
        <button
          className="mode"
          type="button"
          role="radio"
          aria-checked={choice === "free"}
          onClick={() => setChoice("free")}
        >
          <div className="top">
            <span className="ttl">I&rsquo;ll plan it myself</span>
            <span className="tag">Free</span>
          </div>
          <div className="desc">Plan with live and scheduled public-transport data. You travel on your own.</div>
          <span className="radio" aria-hidden />
        </button>

        <button
          className="mode"
          type="button"
          role="radio"
          aria-checked={choice === "managed"}
          onClick={() => setChoice("managed")}
        >
          <div className="top">
            <span className="ttl">Clearline manages it</span>
            <span className="tag">Managed</span>
          </div>
          <div className="desc">A reserved commute, door-to-door — when your corridor opens.</div>
          <span className="note">
            <Icon name="pin" size={13} />
            <span>Available only on covered corridors</span>
          </span>
          <span className="radio" aria-hidden />
        </button>
      </div>
    </AppShell>
  );
}
