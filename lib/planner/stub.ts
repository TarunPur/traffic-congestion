import {
  type Planner,
  type Plan,
  type PlanOptions,
  type PlaceRef,
  CAR_BASELINE,
  hmToMin,
} from "@/lib/planner/types";

/**
 * StubPlanner (P4.1) — returns the LOCKED sample plans for the canonical OD (Hauz Khas Enclave →
 * DLF Cyber Hub, Bldg 10), ported verbatim from the frozen prototype (08-waystogo / 09-plandetail)
 * and PRODUCT.md. Times, durations, legs and the Fastest CO₂ (3.6) are documented sample values.
 * Fares/CO₂ for the other plans are sample placeholders — replaced by a real engine + the cited
 * DMRC fare matrix / CO₂ model in P4.2 (ERD §12). This is demo route data, never live traction.
 *
 * onTime is computed against the arrive-by deadline (default 09:30), so the same fixture correctly
 * flips "on time"/"late" as the deadline changes — Cheapest (arrives 09:35) is the demo's late plan.
 */

interface StubPlanSpec {
  name: Plan["name"];
  totalMin: number;
  fare: number | null;
  co2VsCar: number | null;
  legs: Plan["legs"];
}

// Ported from 08-waystogo PLANS + 09 legs. Auto/Walk = arrangeYourself; Metro = scheduled; Bus = live.
const SAMPLE: StubPlanSpec[] = [
  {
    name: "fastest",
    totalMin: 41,
    fare: 55, // metro fare (09); autos you-arrange
    co2VsCar: 3.6, // documented (09 count-up)
    legs: [
      { mode: "Auto", ride: false, place: "Hauz Khas Metro", depTime: "8:35", durMin: 6, arrangeYourself: true },
      { mode: "Metro", ride: true, place: "Yellow Line, Sikanderpur", depTime: "8:43", durMin: 24, arrangeYourself: false, line: "yellow", scheduled: true },
      { mode: "Auto", ride: false, place: "DLF Cyber Hub, Bldg 10", depTime: "9:07", durMin: 9, arrangeYourself: true },
    ],
  },
  {
    name: "recommended",
    totalMin: 49,
    fare: 55, // cheapest fare at ₹55 (PRODUCT.md)
    co2VsCar: 3.4, // sample — real value from the CO₂ model (P4.2/§12)
    legs: [
      { mode: "Walk", ride: false, place: "Green Park Metro", depTime: "8:35", durMin: 8, arrangeYourself: true },
      { mode: "Metro", ride: true, place: "Yellow Line, Sikanderpur", depTime: "8:43", durMin: 26, arrangeYourself: false, line: "yellow", scheduled: true },
      { mode: "Bus", ride: true, place: "Gurugaman 118, Shankar Chowk", depTime: "9:11", durMin: 10, arrangeYourself: false, live: true },
      { mode: "Walk", ride: false, place: "Bldg 10 lobby", depTime: "9:21", durMin: 5, arrangeYourself: true },
    ],
  },
  {
    name: "cheapest",
    totalMin: 60,
    fare: 30, // sample — DTC bus fare (P4.2/§12)
    co2VsCar: 2.8, // sample
    legs: [
      { mode: "Auto", ride: false, place: "Aurobindo Marg", depTime: "8:35", durMin: 5, arrangeYourself: true },
      { mode: "Bus", ride: true, place: "DTC 715, Shankar Chowk", depTime: "8:40", durMin: 48, arrangeYourself: false, live: true },
      { mode: "Walk", ride: false, place: "Bldg 10 lobby", depTime: "9:28", durMin: 7, arrangeYourself: true },
    ],
  },
  {
    name: "greenest",
    totalMin: 47,
    fare: 60, // sample — 2 metro legs incl. Rapid Metro (P4.2/§12)
    co2VsCar: 4.0, // sample — greenest saves the most
    legs: [
      { mode: "Walk", ride: false, place: "Green Park Metro", depTime: "8:35", durMin: 8, arrangeYourself: true },
      { mode: "Metro", ride: true, place: "Yellow Line, Sikanderpur", depTime: "8:43", durMin: 26, arrangeYourself: false, line: "yellow", scheduled: true },
      { mode: "Metro", ride: true, place: "Rapid Metro, Belvedere Twrs", depTime: "9:09", durMin: 4, arrangeYourself: false, line: "rapid", scheduled: true },
      { mode: "Walk", ride: false, place: "Bldg 10 lobby", depTime: "9:13", durMin: 9, arrangeYourself: true },
    ],
  },
];

function lastArrival(legs: Plan["legs"]): string {
  const last = legs[legs.length - 1]!;
  const end = hmToMin(last.depTime) + last.durMin;
  const h = Math.floor(end / 60);
  const m = end % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export class StubPlanner implements Planner {
  async plan(_origin: PlaceRef, _dest: PlaceRef, opts?: PlanOptions): Promise<Plan[]> {
    const deadline = hmToMin(opts?.arriveBy ?? "9:30");
    return SAMPLE.map((s) => {
      const projectedArrival = lastArrival(s.legs);
      return {
        name: s.name,
        totalMin: s.totalMin,
        fare: s.fare,
        timeVsCarMin: CAR_BASELINE.min - s.totalMin,
        co2VsCar: s.co2VsCar,
        legs: s.legs,
        projectedArrival,
        onTime: hmToMin(projectedArrival) <= deadline,
      };
    });
  }
}

export const stubPlanner = new StubPlanner();
