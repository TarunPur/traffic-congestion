/**
 * Planner adapter (ERD §5) — the swap seam. Screens 08/09 depend only on this shape, so the
 * engine (stub → Mappls → OTP2 fallback) can change without touching UI. Honesty fields are
 * first-class: live-vs-scheduled per leg, "you arrange this" on first/last mile.
 */

export type LegMode = "Walk" | "Metro" | "Bus" | "Auto";

export interface Leg {
  mode: LegMode;
  /** true = a ride we surface a schedule for (Metro/Bus); false = you-arrange leg (Walk/Auto). */
  ride: boolean;
  place: string;
  depTime: string; // HH:MM (local)
  durMin: number;
  /** first/last-mile leg the commuter arranges themselves (auto/e-rickshaw/walk). */
  arrangeYourself: boolean;
  /** metro line key (LINECOL) for the transit graphic; undefined for non-metro. */
  line?: string;
  /** honesty: metro = scheduled only (never live); bus = live estimate. Exactly one is true for a ride. */
  scheduled?: boolean;
  live?: boolean;
  /** frequency note for the leg detail expander (e.g. "every 3–4 min"). */
  freq?: string;
  /** platform/gate detail lines (screen 09 expander). Hand-curated demo-corridor only. */
  detail?: string[];
  /** intermediate stops (screen 09 expander). */
  stops?: string[];
}

export type PlanName = "fastest" | "recommended" | "cheapest" | "greenest";

export interface Plan {
  name: PlanName;
  totalMin: number;
  /** payable transit fare (₹). Auto/walk legs are you-arrange and not fared by us. null if unknown. */
  fare: number | null;
  /** minutes faster than driving (negative = slower). */
  timeVsCarMin: number;
  /** kg CO₂ saved vs driving. null if unknown. */
  co2VsCar: number | null;
  legs: Leg[];
  projectedArrival: string; // HH:MM
  onTime: boolean;
}

export interface PlanOptions {
  /** arrive-by deadline HH:MM; drives onTime. Defaults to 09:30 (the sample). */
  arriveBy?: string;
}

export interface PlaceRef {
  name: string;
  lat?: number;
  lng?: number;
}

/** The swap seam. All implementations return the 08/09 shape. */
export interface Planner {
  plan(origin: PlaceRef, dest: PlaceRef, opts?: PlanOptions): Promise<Plan[]>;
}

/** Car baseline for the locked sample OD (PRODUCT.md): 52 min · ₹430 · 4.6 kg CO₂. */
export const CAR_BASELINE = { min: 52, fare: 430, co2: 4.6 } as const;

/** HH:MM → minutes since midnight. */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(":").map((n) => Number.parseInt(n, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}
