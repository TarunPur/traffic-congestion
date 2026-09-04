import { describe, it, expect } from "vitest";
import { buildLiveTrip, deriveSteps, etaMinutes } from "@/lib/managed-trip";

/**
 * Regression for the countdown bug (PIXEL-AUDIT.md §22/§10/§23): the live-trip step schedule
 * used to be derived from a fixed absolute clock time (7:58am) compared against the real
 * wall-clock time, so opening the trip screen outside a narrow morning window showed a
 * nonsensical multi-hour ETA. It's now anchored to when the trip was actually created
 * (`managed_trips.created_at`), so the schedule is always relative to a real, recent moment —
 * matching the locked `22-livetrip.html`'s "Pickup · 3 min away" snapshot at trip creation.
 */
describe("lib/managed-trip", () => {
  it("shows the locked design's exact 'Pickup, 3 min away' snapshot right at trip creation, regardless of wall-clock time of day", () => {
    const anchor = new Date("2026-09-05T02:00:00"); // 2am — well outside any "real" morning commute
    const trip = buildLiveTrip("t1", 0, anchor, "stub");
    expect(trip.etaMin).toBe(3);
    expect(trip.legLabel).toBe("First mile · Clearline auto");
    expect(trip.steps[0]!.state).toBe("now");
  });

  it("never produces a huge ETA no matter what real time it is, because it's anchored to trip creation, not the wall clock", () => {
    for (const hour of [2, 14, 23]) {
      const anchor = new Date(`2026-09-05T${String(hour).padStart(2, "0")}:00:00`);
      const trip = buildLiveTrip("t1", 0, anchor, "stub");
      expect(trip.etaMin).toBeLessThanOrEqual(3);
    }
  });

  it("advances through steps as elapsed time increases, preserving the original relative spacing (9 / 44 / 6 min apart)", () => {
    const anchor = new Date("2026-09-05T07:00:00");
    expect(deriveSteps(0, anchor).map((s) => s.state)).toEqual(["now", "upcoming", "upcoming", "upcoming"]);
    expect(deriveSteps(5, anchor).map((s) => s.state)).toEqual(["now", "upcoming", "upcoming", "upcoming"]);
    expect(deriveSteps(15, anchor).map((s) => s.state)).toEqual(["done", "now", "upcoming", "upcoming"]);
    expect(deriveSteps(60, anchor).map((s) => s.state)).toEqual(["done", "done", "now", "upcoming"]);
    expect(deriveSteps(65, anchor).map((s) => s.state)).toEqual(["done", "done", "done", "now"]);
  });

  it("stamps each step's clock-time relative to the real trip-creation anchor, not a hardcoded morning", () => {
    const evening = deriveSteps(0, new Date("2026-09-05T20:15:00")); // 8:15pm trip
    expect(evening[0]!.time).toBe("20:18"); // +3 min
    expect(evening[3]!.time).toBe("21:17"); // +62 min

    // No leading zero on the hour, matching this codebase's existing H:MM convention
    // (lib/planner/stub.ts's lastArrival(), lib/hm-time.ts's timestampToHm()).
    const morning = deriveSteps(0, new Date("2026-09-05T07:00:00"));
    expect(morning[0]!.time).toBe("7:03");
  });

  it("etaMinutes never goes negative", () => {
    const anchor = new Date("2026-09-05T07:00:00");
    const steps = deriveSteps(500, anchor); // way past the last step
    expect(etaMinutes(500, steps)).toBe(0);
  });
});
