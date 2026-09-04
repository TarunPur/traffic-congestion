/**
 * Live managed trip — steps + driver (BUILD-SPEC §11·22, design §11 step tracker).
 *
 * The real feed is driver-GPS → Supabase Realtime → the screen (Tookan 14-day trial first, then
 * DIY). `LIVE_FULFILMENT_SOURCE` (server env) picks the source; until a real driver is on the
 * corridor, the `stub` source derives step state from the schedule (the committed windows) — it
 * NEVER fabricates a moving GPS position. Driver / vehicle strings are documented placeholders
 * (design §5c real-vs-placeholder) and labelled as such in the UI.
 */

export type StepState = "done" | "now" | "upcoming";

export interface TripStep {
  label: string;
  sub: string;
  time: string; // H:MM
  min: number; // minutes since midnight (for schedule-derived state)
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

const BASE_STEPS: Omit<TripStep, "state">[] = [
  { label: "Pickup · Hauz Khas Enclave", sub: "Clearline auto arriving", time: "7:58", min: 7 * 60 + 58 },
  { label: "AC shuttle · Hauz Khas → Cyber City", sub: "Reserved · committed window", time: "8:07", min: 8 * 60 + 7 },
  { label: "Staged transfer · Cyber City", sub: "Last-mile auto held for you", time: "8:51", min: 8 * 60 + 51 },
  { label: "DLF Cyber City, Bldg 10", sub: "Verified walk to lobby", time: "8:57", min: 8 * 60 + 57 },
];

/** Schedule-derived step states: the step whose window contains `nowMin` is "now". */
export function deriveSteps(nowMin: number): TripStep[] {
  let activeIdx = BASE_STEPS.findIndex((s, i) => {
    const next = BASE_STEPS[i + 1];
    return nowMin < s.min || !next || nowMin < next.min;
  });
  if (activeIdx < 0) activeIdx = BASE_STEPS.length - 1;
  return BASE_STEPS.map((s, i) => ({
    ...s,
    state: i < activeIdx ? "done" : i === activeIdx ? "now" : "upcoming",
  }));
}

export function etaMinutes(nowMin: number, steps: TripStep[]): number {
  const active = steps.find((s) => s.state === "now") ?? steps[0]!;
  return Math.max(0, active.min - nowMin);
}

export const DEMO_DRIVER = { name: "Ramesh K.", vehicle: "Silver WagonR · DL 1C AB 2345" };

export function buildLiveTrip(tripId: string, nowMin: number, source: string): LiveTrip {
  const steps = deriveSteps(nowMin);
  const active = steps.find((s) => s.state === "now") ?? steps[0]!;
  return {
    tripId,
    driver: DEMO_DRIVER.name,
    vehicle: DEMO_DRIVER.vehicle,
    etaMin: etaMinutes(nowMin, steps),
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
