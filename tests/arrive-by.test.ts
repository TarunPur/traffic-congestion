import { describe, it, expect } from "vitest";
import {
  clampArrive,
  stepArrive,
  toHM,
  to12h,
  ARRIVE_MIN,
  ARRIVE_MAX,
  ARRIVE_DEFAULT,
} from "@/lib/arrive-by";
import { isMultiPart } from "@/lib/use-places-search";

describe("arrive-by helpers (screen 05)", () => {
  it("clamps to 05:00–23:45", () => {
    expect(clampArrive(0)).toBe(ARRIVE_MIN);
    expect(clampArrive(24 * 60)).toBe(ARRIVE_MAX);
    expect(clampArrive(ARRIVE_DEFAULT)).toBe(ARRIVE_DEFAULT);
  });

  it("steps ±15 and respects the clamps", () => {
    expect(stepArrive(ARRIVE_DEFAULT, 1)).toBe(ARRIVE_DEFAULT + 15);
    expect(stepArrive(ARRIVE_DEFAULT, -1)).toBe(ARRIVE_DEFAULT - 15);
    expect(stepArrive(ARRIVE_MAX, 1)).toBe(ARRIVE_MAX); // can't exceed
    expect(stepArrive(ARRIVE_MIN, -1)).toBe(ARRIVE_MIN); // can't go below
  });

  it("formats 24h and 12h", () => {
    expect(toHM(ARRIVE_DEFAULT)).toBe("09:30");
    expect(to12h(ARRIVE_DEFAULT)).toEqual({ t: "9:30", mer: "AM" });
    expect(to12h(13 * 60 + 5)).toEqual({ t: "1:05", mer: "PM" });
    expect(to12h(12 * 60)).toEqual({ t: "12:00", mer: "PM" });
    expect(to12h(0)).toEqual({ t: "12:00", mer: "AM" });
  });
});

describe("isMultiPart (05 → 07 routing)", () => {
  it("a hub without a specific building is multi-part", () => {
    expect(isMultiPart({ type: "office_hub", name: "DLF Cyber City" })).toBe(true);
    expect(isMultiPart({ type: "landmark", name: "Select Citywalk" })).toBe(true);
  });

  it("a specific building goes straight to plans", () => {
    expect(isMultiPart({ type: "office_hub", name: "DLF Cyber Hub, Building 10" })).toBe(false);
  });

  it("areas/metro/bus are never multi-part", () => {
    expect(isMultiPart({ type: "area", name: "Hauz Khas Enclave" })).toBe(false);
    expect(isMultiPart({ type: "metro", name: "Hauz Khas Metro" })).toBe(false);
  });
});
