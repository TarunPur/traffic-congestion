"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, TextField } from "@/components/controls";
import { Icon } from "@/components/icon";

/**
 * 17a · Eligibility — the J2 OR-gate (BUILD-SPEC §11·17a). Both outcomes are stated up front.
 * The CTA POSTs name / employee-ID / company / work-email; `partnered` is decided SERVER-SIDE by
 * email-domain match (the client can never forge it). Employee ID is captured, NOT verified.
 * Partnered → /setup. Personal / unknown domain → /corridor (the waitlist — NOT an error).
 * A malformed email is the only error state here.
 */
export default function EligibilityPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [company, setCompany] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "partner" | "waitlist" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/eligibility");
      if (cancelled || !res.ok) return;
      const { eligibility } = (await res.json()) as { eligibility: { company: string | null } | null };
      if (eligibility?.company) setCompany(eligibility.company);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function check() {
    setState("checking");
    const res = await fetch("/api/eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, employeeId, company, workEmail }),
    });
    if (res.status === 400) {
      setState("error");
      return;
    }
    const { partnered } = (await res.json()) as { partnered: boolean };
    setState(partnered ? "partner" : "waitlist");
    setTimeout(() => router.push(partnered ? "/setup" : "/corridor"), 1200);
  }

  const ctaLabel =
    state === "partner"
      ? "Partner confirmed — opening setup…"
      : state === "waitlist"
        ? "Not a partner yet — opening waitlist…"
        : "Check my workplace";

  return (
    <AppShell
      scrollClassName="pb-[24px]"
      foot={
        <Cta loading={state === "checking"} loadingLabel="Checking…" onClick={check}>
          {ctaLabel}
        </Cta>
      }
    >
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.back()}>
          <Icon name="back" size={22} />
        </button>
        <span className="step">Eligibility</span>
      </div>

      <h1 className="h1">
        Where do
        <br />
        you work?
      </h1>
      <p className="said">
        The managed commute runs two ways. We check your workplace to route you the right one.
      </p>

      <div className="doors">
        <div className="door">
          <span className="ic">
            <Icon name="check" size={20} />
          </span>
          <span>
            <span className="t">Your employer has partnered</span>
            <div className="d">Your corridor is already active — you go straight to setup.</div>
          </span>
        </div>
        <div className="door">
          <span className="ic">
            <Icon name="clock" size={20} />
          </span>
          <span>
            <span className="t">Not yet a partner</span>
            <div className="d">Join the corridor waitlist; we take the demand to your employer.</div>
          </span>
        </div>
      </div>

      <div className="fl">
        <TextField label="Full name" iconLeft="user" value={fullName} onChange={setFullName} aria-label="Full name" />
      </div>
      <div className="fl">
        <TextField label="Employee ID" iconLeft="info" value={employeeId} onChange={setEmployeeId} aria-label="Employee ID" />
      </div>
      <div className="fl">
        <TextField label="Company" iconLeft="work" value={company} onChange={setCompany} aria-label="Company" />
      </div>
      <div className="fl">
        <TextField
          label="Work email"
          iconLeft="mail"
          type="email"
          inputMode="email"
          value={workEmail}
          onChange={(v) => {
            setWorkEmail(v);
            if (state === "error") setState("idle");
          }}
          error={state === "error"}
          aria-label="Work email"
        />
        {state === "error" ? (
          <div className="err-line">Enter your work email.</div>
        ) : (
          <div className="hint">
            We match your <b>email domain</b> to your employer&rsquo;s Clearline partnership. Your
            employee ID is stored for your employer to verify — we don&rsquo;t validate it here. A
            personal email routes you to the corridor waitlist.
          </div>
        )}
      </div>
    </AppShell>
  );
}
