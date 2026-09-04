import { describe, it, expect } from "vitest";
import { stubPlanner } from "@/lib/planner/stub";
import { CAR_BASELINE } from "@/lib/planner/types";

const OD = { origin: { name: "Hauz Khas Enclave" }, dest: { name: "DLF Cyber Hub, Bldg 10" } };

describe("StubPlanner — shape", () => {
  it("returns the four locked plans", async () => {
    const plans = await stubPlanner.plan(OD.origin, OD.dest);
    expect(plans.map((p) => p.name)).toEqual(["fastest", "recommended", "cheapest", "greenest"]);
  });

  it("every plan has the full 08/09 shape", async () => {
    const plans = await stubPlanner.plan(OD.origin, OD.dest);
    for (const p of plans) {
      expect(p).toMatchObject({
        name: expect.any(String),
        totalMin: expect.any(Number),
        timeVsCarMin: expect.any(Number),
        projectedArrival: expect.stringMatching(/^\d{1,2}:\d{2}$/),
        onTime: expect.any(Boolean),
      });
      expect(Array.isArray(p.legs)).toBe(true);
      for (const leg of p.legs) {
        expect(leg).toMatchObject({
          mode: expect.any(String),
          ride: expect.any(Boolean),
          place: expect.any(String),
          depTime: expect.stringMatching(/^\d{1,2}:\d{2}$/),
          durMin: expect.any(Number),
          arrangeYourself: expect.any(Boolean),
        });
      }
    }
  });

  it("computes timeVsCar from the car baseline (52 min)", async () => {
    const plans = await stubPlanner.plan(OD.origin, OD.dest);
    const byName = Object.fromEntries(plans.map((p) => [p.name, p]));
    expect(byName.fastest!.timeVsCarMin).toBe(CAR_BASELINE.min - 41); // 11
    expect(byName.recommended!.timeVsCarMin).toBe(3);
    expect(byName.cheapest!.timeVsCarMin).toBe(-8); // slower than driving
    expect(byName.greenest!.timeVsCarMin).toBe(5);
  });

  it("projects arrivals from the legs", async () => {
    const byName = Object.fromEntries((await stubPlanner.plan(OD.origin, OD.dest)).map((p) => [p.name, p]));
    expect(byName.fastest!.projectedArrival).toBe("9:16");
    expect(byName.recommended!.projectedArrival).toBe("9:26");
    expect(byName.cheapest!.projectedArrival).toBe("9:35");
    expect(byName.greenest!.projectedArrival).toBe("9:22");
  });
});

describe("StubPlanner — honesty fields (ERD §0)", () => {
  it("first/last-mile legs are you-arrange; rides are not", async () => {
    const plans = await stubPlanner.plan(OD.origin, OD.dest);
    for (const p of plans) {
      for (const leg of p.legs) {
        if (leg.mode === "Walk" || leg.mode === "Auto") {
          expect(leg.arrangeYourself, `${p.name} ${leg.mode}`).toBe(true);
          expect(leg.ride).toBe(false);
        } else {
          expect(leg.arrangeYourself, `${p.name} ${leg.mode}`).toBe(false);
          expect(leg.ride).toBe(true);
        }
      }
    }
  });

  it("metro legs are scheduled (never live); bus legs are live estimates", async () => {
    const plans = await stubPlanner.plan(OD.origin, OD.dest);
    const rides = plans.flatMap((p) => p.legs).filter((l) => l.ride);
    for (const leg of rides) {
      if (leg.mode === "Metro") {
        expect(leg.scheduled).toBe(true);
        expect(leg.live).toBeFalsy();
      }
      if (leg.mode === "Bus") {
        expect(leg.live).toBe(true);
        expect(leg.scheduled).toBeFalsy();
      }
    }
  });
});

describe("StubPlanner — onTime vs arrive-by", () => {
  it("at the default 9:30 deadline, only Cheapest is late", async () => {
    const byName = Object.fromEntries((await stubPlanner.plan(OD.origin, OD.dest)).map((p) => [p.name, p]));
    expect(byName.fastest!.onTime).toBe(true);
    expect(byName.recommended!.onTime).toBe(true);
    expect(byName.greenest!.onTime).toBe(true);
    expect(byName.cheapest!.onTime).toBe(false); // arrives 9:35
  });

  it("a tighter 9:20 deadline flips the slower plans late", async () => {
    const byName = Object.fromEntries(
      (await stubPlanner.plan(OD.origin, OD.dest, { arriveBy: "9:20" })).map((p) => [p.name, p]),
    );
    expect(byName.fastest!.onTime).toBe(true); // 9:16
    expect(byName.recommended!.onTime).toBe(false); // 9:26
    expect(byName.greenest!.onTime).toBe(false); // 9:22
  });
});
