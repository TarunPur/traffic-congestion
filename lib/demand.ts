import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Demand instrumentation (BUILD-SPEC §7·Demand, ERD §3 `demand_signals`).
 *
 * A demand signal is an anonymous "someone wants to travel this corridor" record. It carries a
 * GENERALISED origin→destination pair (place names only — never coordinates, never the exact
 * home/building), plus coarse mode + time-window. `demand_signals` has RLS enabled with NO client
 * policies, so only the service-role client (which bypasses RLS) may write it; nothing here is
 * linked to a user. Aggregation is k-anon N>=5 (the `demand_aggregate()` definer function).
 *
 * Recording is opt-out: if the user has set `demand_prefs.contribute_anonymised = false`, we skip.
 */

export interface DemandSignalInput {
  /** GENERALISED "Origin area → Dest area" — call generaliseOdPair() to build it. */
  odPair: string;
  mode?: string | null;
  timeWindow?: string | null;
  preferredRoute?: string | null;
}

/** Strip building/gate/number specifics so a home address can't be reconstructed from a signal. */
export function generalisePlace(name: string): string {
  return name.split(",")[0]!.trim().replace(/\s+\d.*$/, "").trim() || name.trim();
}

export function generaliseOdPair(originName: string, destName: string): string {
  return `${generalisePlace(originName)} → ${generalisePlace(destName)}`;
}

/** Coarse arrive-by time → a named window (keeps the aggregate low-cardinality). */
export function timeWindowFor(hhmm: string | null | undefined): string {
  if (!hhmm) return "unspecified";
  const h = Number(hhmm.split(":")[0] ?? "9");
  if (h < 7) return "early (before 7)";
  if (h < 10) return "morning peak (7–10)";
  if (h < 16) return "midday (10–16)";
  if (h < 20) return "evening peak (16–20)";
  return "late (after 20)";
}

export async function recordDemandSignal(
  userClient: SupabaseClient<Database>,
  serviceClient: SupabaseClient<Database>,
  userId: string,
  signal: DemandSignalInput,
): Promise<boolean> {
  // Opt-out check (default is contribute = true when no row exists).
  const { data: pref } = await userClient
    .from("demand_prefs")
    .select("contribute_anonymised")
    .eq("user_id", userId)
    .maybeSingle();
  if (pref && pref.contribute_anonymised === false) return false;

  const { error } = await serviceClient.from("demand_signals").insert({
    od_pair: signal.odPair.slice(0, 160),
    mode: signal.mode ? String(signal.mode).slice(0, 24) : null,
    time_window: signal.timeWindow ? String(signal.timeWindow).slice(0, 40) : null,
    preferred_route: signal.preferredRoute ? String(signal.preferredRoute).slice(0, 80) : null,
  });
  return !error;
}
