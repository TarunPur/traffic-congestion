/**
 * Live managed trip — steps + driver (BUILD-SPEC §11·22, design §11 step tracker).
 *
 * The real feed is driver-GPS → Supabase Realtime → the screen (Tookan 14-day trial first, then
 * DIY). `LIVE_FULFILMENT_SOURCE` (server env) picks the source; until a real driver is on the
 * corridor, the `stub` source derives step state from the schedule (the committed windows) — it
 * NEVER fabricates a moving GPS position. Driver / vehicle strings are documented placeholders
 * (design §5c real-vs-placeholder) and labelled as such in the UI.
 *
 * The schedule is anchored to the trip's real creation time (`managed_trips.created_at`), not a
 * hardcoded absolute clock time — it used to be pinned to a fixed "7:58am" and compared against
 * the real wall clock, which produced a nonsensical multi-hour ETA outside that narrow window
 * (PIXEL-AUDIT.md). Anchoring to creation time reproduces the locked design's exact "Pickup ·
 * 3 min away" snapshot at the moment a trip starts, and then progresses it realistically from
 * there, regardless of what time of day it actually is.
 */

export type StepState = "done" | "now" | "upcoming";

export interface TripStep {
  label: string;
  sub: string;
  time: string; // H:MM, relative to the trip's real creation time
  min: number; // minutes elapsed since trip creation (for schedule-derived state)
  state: StepState;
}

export interface LiveTrip {
  tripId: string;
  driver: string;
  vehicle: string;
  etaMin: number;
  legLabel: string;
  heldNote: string;
  steps: TripStep[];
  source: string;
  placeholder: boolean;
}

// Same relative spacing as the original fixed schedule (7:58 / 8:07 / 8:51 / 8:57 — 9/44/6 min
// apart), now expressed as an offset from trip creation instead of an absolute morning clock
// time. Offset 3 means "Pickup is 3 min away right when the trip is created" — matching the
// locked 22-livetrip.html's "3" split-flap snapshot.
const STEP_SPECS: { label: string; sub: string; offsetMin: number }[] = [
  { label: "Pickup · Hauz Khas Enclave", sub: "Clearline auto arriving", offsetMin: 3 },
  { label: "AC shuttle · Hauz Khas → Cyber City", sub: "Reserved · committed window", offsetMin: 12 },
  { label: "Staged transfer · Cyber City", sub: "Last-mile auto held for you", offsetMin: 56 },
  { label: "DLF Cyber City, Bldg 10", sub: "Verified walk to lobby", offsetMin: 62 },
];

function fmtClock(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Schedule-derived step states: the step whose window contains `elapsedMin` (minutes since
 * `anchor`, the trip's real creation time) is "now". */
export function deriveSteps(elapsedMin: number, anchor: Date): TripStep[] {
  let activeIdx = STEP_SPECS.findIndex((s, i) => {
    const next = STEP_SPECS[i + 1];
    return elapsedMin < s.offsetMin || !next || elapsedMin < next.offsetMin;
  });
  if (activeIdx < 0) activeIdx = STEP_SPECS.length - 1;
  return STEP_SPECS.map((s, i) => ({
    label: s.label,
    sub: s.sub,
    time: fmtClock(new Date(anchor.getTime() + s.offsetMin * 60_000)),
    min: s.offsetMin,
    state: i < activeIdx ? "done" : i === activeIdx ? "now" : "upcoming",
  }));
}

/**
 * Minutes until the next thing happens, always a whole number.
 *
 * `elapsedMin` is a real-world float (ms elapsed / 60_000) — it's essentially never an exact
 * integer, so the result must be rounded before display: SplitFlap only renders digit glyphs and
 * a literal ":", with no handling for a decimal point, so a raw float like 1.7623833333333333
 * rendered as a long garbled digit row (PIXEL-AUDIT.md's "274737 min away").
 *
 * While the active step's own instant hasn't arrived yet, count down to it. Once it's passed
 * (true for almost all of an active step's display window — a step only stops being "now" once
 * the NEXT one starts), count down to the next step instead of sitting stuck at 0.
 */
export function etaMinutes(elapsedMin: number, steps: TripStep[]): number {
  const activeIdx = steps.findIndex((s) => s.state === "now");
  const active = steps[activeIdx] ?? steps[0]!;
  if (elapsedMin < active.min) return Math.round(active.min - elapsedMin);
  const next = steps[activeIdx + 1];
  return next ? Math.max(0, Math.round(next.min - elapsedMin)) : 0;
}

export const DEMO_DRIVER = { name: "Ramesh K.", vehicle: "Silver WagonR · DL 1C AB 2345" };

export function buildLiveTrip(tripId: string, elapsedMin: number, anchor: Date, source: string): LiveTrip {
  const steps = deriveSteps(elapsedMin, anchor);
  const active = steps.find((s) => s.state === "now") ?? steps[0]!;
  return {
    tripId,
    driver: DEMO_DRIVER.name,
    vehicle: DEMO_DRIVER.vehicle,
    etaMin: etaMinutes(elapsedMin, steps),
    legLabel:
      active.label.startsWith("Pickup") || active.label.startsWith("AC shuttle")
        ? "First mile · Clearline auto"
        : "En route · Clearline",
    heldNote:
      "Your last-mile auto is held at the Cyber City transfer — waits 0–5 min for you.",
    steps,
    source,
    placeholder: true,
  };
}
