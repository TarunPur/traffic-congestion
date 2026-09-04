import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { stubPlanner } from "@/lib/planner/stub";
import type { PlaceRef } from "@/lib/planner/types";
import type { Json } from "@/lib/supabase/types";

/**
 * POST /api/plan — the Planner data spine (ERD §5/§7). Auth required. Creates the trip (owner),
 * runs the Planner (stub until Mappls, P4.2), caches the results to `plans` (service-role, since
 * plans has no client-insert policy), and returns Plan[]. The planner engine is swappable behind
 * the typed Planner interface — nothing here or in the screens changes when the real engine lands.
 */

interface PlanRequest {
  origin: PlaceRef;
  dest: PlaceRef;
  arriveBy?: string; // HH:MM
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: PlanRequest;
  try {
    body = (await request.json()) as PlanRequest;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body?.origin?.name || !body?.dest?.name) {
    return NextResponse.json({ error: "origin and dest required" }, { status: 400 });
  }

  // Create the trip as the owner (RLS enforces auth.uid = user_id).
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      origin_place: body.origin as unknown as Json,
      dest_place: body.dest as unknown as Json,
      arrive_by: null,
    })
    .select("id")
    .single();
  if (tripErr || !trip) {
    return NextResponse.json({ error: "trip_create_failed" }, { status: 500 });
  }

  const plans = await stubPlanner.plan(body.origin, body.dest, { arriveBy: body.arriveBy });

  // Cache the plans server-side (plans is server-write-only).
  const admin = createServiceRoleClient();
  const rows = plans.map((p) => ({
    trip_id: trip.id,
    name: p.name,
    total_min: p.totalMin,
    fare: p.fare,
    time_vs_car_min: p.timeVsCarMin,
    co2_vs_car: p.co2VsCar,
    legs: p.legs as unknown as Json,
    projected_arrival: null, // HH:MM lives in the payload; precise timestamp wired with the real engine
    on_time: p.onTime,
  }));
  await admin.from("plans").insert(rows);

  return NextResponse.json({ tripId: trip.id, plans });
}
