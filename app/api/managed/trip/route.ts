import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { buildLiveTrip, deriveSteps, etaMinutes, DEMO_DRIVER, type LiveTrip } from "@/lib/managed-trip";
import type { Json } from "@/lib/supabase/types";

/**
 * GET /api/managed/trip — today's live managed trip for the caller (BUILD-SPEC §11·22).
 * Creates the `managed_trips` row on first call (service-role — the table is client read-only and
 * is a Realtime source). Until a real driver feed is on the corridor, step state is SCHEDULE-
 * DERIVED (the committed windows) — never a fabricated GPS position; driver/vehicle are labelled
 * placeholders. The screen also subscribes to Realtime UPDATEs on this row for the real feed.
 */

function nowMinUTCLocal(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const source = serverEnv().liveFulfilmentSource || "stub";

  // The caller's latest booking → the trip is owned via booking→setup (RLS).
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "no_booking" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const admin = createServiceRoleClient();

  let { data: row } = await supabase
    .from("managed_trips")
    .select("id, steps, driver, vehicle, eta_min, share_link, status")
    .eq("booking_id", booking.id)
    .eq("date", today)
    .maybeSingle();

  if (!row) {
    const seedSteps = deriveSteps(nowMinUTCLocal());
    const { data: created } = await admin
      .from("managed_trips")
      .insert({
        booking_id: booking.id,
        date: today,
        steps: seedSteps as unknown as Json,
        driver: DEMO_DRIVER.name,
        vehicle: DEMO_DRIVER.vehicle,
        eta_min: etaMinutes(nowMinUTCLocal(), seedSteps),
        status: "en_route",
      })
      .select("id, steps, driver, vehicle, eta_min, share_link, status")
      .single();
    row = created ?? null;
  }
  if (!row) return NextResponse.json({ error: "trip_unavailable" }, { status: 500 });

  // stub source: re-derive step state from the schedule on every read so the tracker advances
  // over the morning even with no live feed. A real feed instead drives it via Realtime UPDATEs.
  const live: LiveTrip =
    source === "stub" || source === "diy"
      ? buildLiveTrip(row.id, nowMinUTCLocal(), source)
      : {
          tripId: row.id,
          driver: row.driver ?? DEMO_DRIVER.name,
          vehicle: row.vehicle ?? DEMO_DRIVER.vehicle,
          etaMin: row.eta_min ?? 0,
          legLabel: "En route · Clearline",
          heldNote: "Your last-mile auto is held at the Cyber City transfer — waits 0–5 min for you.",
          steps: (row.steps as unknown as LiveTrip["steps"]) ?? [],
          source,
          placeholder: true,
        };

  return NextResponse.json(live);
}
