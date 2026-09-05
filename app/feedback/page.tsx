"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { FEEDBACK_TONES } from "@/lib/tokens";

/**
 * 15 · Feedback (BUILD-SPEC §10·15). The 1–5 diverging scale is the ONE control that carries a
 * sentiment colour (design §1c) — muted printed overprints, "tone underline" at rest, solid tone
 * fill when selected (ink text on the light amber). Still NOT oxblood. Writes `feedback` via
 * POST /api/feedback — INTERNAL-ONLY, never shown to other users. Send is disabled until rated.
 */

const SCALE = [
  { v: 1, w: "Rough" },
  { v: 2, w: "Stressful" },
  { v: 3, w: "Okay" },
  { v: 4, w: "Good" },
  { v: 5, w: "Smooth" },
] as const;

function FeedbackForm() {
  const router = useRouter();
  const params = useSearchParams();
  const origin = params.get("origin");
  const dest = params.get("dest");
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const chosen = SCALE.find((s) => s.v === rating);

  async function send() {
    if (!rating || sent) return;
    setSent(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, note: note.trim() || null }),
      });
    } finally {
      setTimeout(() => router.push("/"), 1400);
    }
  }

  return (
    <AppShell
      scrollClassName="pb-[24px]"
      foot={
        <Cta disabled={!rating} onClick={send}>
          {sent ? "Thanks — noted" : "Send feedback"}
        </Cta>
      }
    >
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.back()}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <h1 className="h1">
        How was your
        <br />
        commute?
      </h1>
      <p className="said">A quick, honest read on how the trip felt — it tells us what to fix first.</p>

      {origin && dest ? (
        <div className="ctx">
          <div className="k">Rating this ride</div>
          <div className="nm">
            {origin} <span className="t">→ {dest}</span>
          </div>
        </div>
      ) : null}

      <div className="qh">How did the ride feel?</div>
      <div className="scale" role="group" aria-label="Ride rating from 1, rough, to 5, smooth">
        {SCALE.map((s, i) => (
          <button
            key={s.v}
            className={`sc${s.v === 3 ? " lite" : ""}`}
            type="button"
            aria-pressed={rating === s.v}
            aria-label={`Rate ${s.v} out of 5 — ${s.w}`}
            style={{ ["--tone" as string]: FEEDBACK_TONES[i] }}
            onClick={() => setRating(s.v)}
          >
            {s.v}
          </button>
        ))}
      </div>
      <div className="scends">
        <span>Rough</span>
        <span>Smooth</span>
      </div>
      <div className={`chosen${chosen ? " show" : ""}`}>{chosen ? `${chosen.v} · ${chosen.w}` : ""}</div>

      <label className="flab" htmlFor="fb-note">
        Anything to add? (optional)
      </label>
      <textarea
        id="fb-note"
        className="tf"
        placeholder="Too crowded, the bus never came, the walk felt unsafe…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="priv">
        <span className="ic">
          <Icon name="shield" size={16} />
        </span>
        <span className="t">
          Only the Clearline team sees this. We pool it to decide what to fix and which corridors to
          open next — never linked to you.
        </span>
      </div>
    </AppShell>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackForm />
    </Suspense>
  );
}
