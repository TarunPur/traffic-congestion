import type { PlaceRef } from "@/lib/planner/types";

/**
 * Save the current trip as the user's commute (screens 08/09 → screen 10). Thin wrapper over
 * POST /api/commute — the route takes `user_id` from the session and RLS is the backstop, so
 * nothing sensitive is trusted from here. Returns whether the write succeeded.
 */
export interface SaveCommuteInput {
  origin: PlaceRef;
  dest: PlaceRef;
  arriveBy?: string | null;
  preferredMode?: string | null;
  label?: string | null;
}

export async function saveCommute(input: SaveCommuteInput): Promise<boolean> {
  try {
    const res = await fetch("/api/commute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}
