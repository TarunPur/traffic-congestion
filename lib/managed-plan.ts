/**
 * Managed plan shape + the LOCKED demo-corridor sample (BUILD-SPEC §11·20, design §11).
 *
 * Every leg is CONTRACTED by Clearline (`mgd` marker = filled ink square) — first mile, the
 * paid AC-shuttle trunk (NOT public transit), one staged transfer, last mile. No `.sched`/`.live`
 * public leg appears in a managed plan. Honesty holds: each leg is a "committed window," never
 * "guaranteed"; a failed leg → fallback cab auto-dispatched + that day credited.
 *
 * Times / durations / fares are documented sample values for the one pilot corridor (Hauz Khas
 * Enclave → DLF Cyber City, Bldg 10). Real pricing lands with the pilot; billing stays OFF.
 */

export type ManagedLegMode = "Auto" | "Shuttle" | "Walk";

export interface ManagedLeg {
  mode: ManagedLegMode;
  /** true = a contracted ride (`.tl.mgd`); false = a verified walk with no marker. */
  contracted: boolean;
  place: string;
  note: string;
  depTime: string; // H:MM
  durMin: number;
  /** the committed-window label under the leg (contracted legs only). */
  windowLabel?: string;
}

export interface ManagedPlan {
  legs: ManagedLeg[];
  leaveBy: string; // H:MM — the boarding-pass hero
  doorToDoorMin: number;
  transfers: number;
  walkM: number;
  perDayFare: number;
  monthlyFare: number;
  committedWindow: string;
  reliability: string;
}

const SAMPLE_LEGS: ManagedLeg[] = [
  {
    mode: "Auto",
    contracted: true,
    place: "Hauz Khas Enclave gate",
    note: "Contracted pickup to the shuttle point",
    depTime: "7:58",
    durMin: 6,
    windowLabel: "Clearline auto",
  },
  {
    mode: "Shuttle",
    contracted: true,
    place: "Hauz Khas shuttle point",
    note: "Reserved AC shuttle → DLF Cyber City",
    depTime: "8:07",
    durMin: 42,
    windowLabel: "Clearline AC shuttle · committed window",
  },
  {
    mode: "Auto",
    contracted: true,
    place: "Cyber City · staged transfer",
    note: "Last-mile auto held on your arrival → Bldg 10",
    depTime: "8:51",
    durMin: 4,
    windowLabel: "Clearline · held 0–5 min",
  },
  {
    mode: "Walk",
    contracted: false,
    place: "DLF Cyber City, Bldg 10",
    note: "Verified walk to the lobby",
    depTime: "8:55",
    durMin: 2,
  },
];

/**
 * Build the managed plan. Demo corridor only — a locked sample (legs + stats), independent of the
 * setup values for now; the real engine will vary it by home/tower/time (P4.2-style swap seam).
 */
export function buildManagedPlan(): ManagedPlan {
  return {
    legs: SAMPLE_LEGS,
    leaveBy: SAMPLE_LEGS[0]!.depTime,
    doorToDoorMin: 59,
    transfers: 1,
    walkM: 120,
    perDayFare: 185,
    monthlyFare: 3400,
    committedWindow: "committed window",
    reliability: "≥85% on-time · auto fallback cab + fare credit if a leg fails",
  };
}
