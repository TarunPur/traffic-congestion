/**
 * Arrive-by control helpers (screen 05). Minutes since midnight, clamped 05:00–23:45, ±15 step,
 * default 09:30. Ported from 05-whereto. Pure + testable.
 */

export const ARRIVE_MIN = 5 * 60; // 05:00
export const ARRIVE_MAX = 23 * 60 + 45; // 23:45
export const ARRIVE_DEFAULT = 9 * 60 + 30; // 09:30
export const ARRIVE_STEP = 15;

export function clampArrive(mins: number): number {
  return Math.max(ARRIVE_MIN, Math.min(ARRIVE_MAX, mins));
}

export function stepArrive(mins: number, dir: 1 | -1): number {
  return clampArrive(mins + dir * ARRIVE_STEP);
}

/** 24h HH:MM for storage / the planner. */
export function toHM(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** 12h display parts: { t: "9:30", mer: "AM" }. */
export function to12h(mins: number): { t: string; mer: "AM" | "PM" } {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const mer = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { t: `${h12}:${String(m).padStart(2, "0")}`, mer };
}
