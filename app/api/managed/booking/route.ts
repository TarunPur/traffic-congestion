import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/managed/booking — reserve the managed commute (BUILD-SPEC §11·21).
 * NO MONEY IN THE PILOT. `billing_on` is NEVER set from here (defaults false), and the RLS
 * `bookings_owner_reserve` policy independently rejects any insert with `billing_on = true`.
 * price is recorded for display only — nothing is charged. Owned via the parent setup (RLS).
 */

const TRIP_TYPES = ["round", "morning"] as const;
const PLAN_TYPES = ["per_day", "monthly"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { setupId?: string; tripType?: string; planType?: string; price?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const tripType = (TRIP_TYPES as readonly string[]).includes(body.tripType ?? "") ? body.tripType! : null;
  const planType = (PLAN_TYPES as readonly string[]).includes(body.planType ?? "") ? body.planType! : null;
  if (!tripType || !planType) {
    return NextResponse.json({ error: "trip_type and plan_type required" }, { status: 400 });
  }

  // Resolve the setup — explicit id (must be the caller's, RLS enforces) else the latest.
  const { data: setup } = body.setupId
    ? await supabase.from("managed_setups").select("id").eq("id", body.setupId).maybeSingle()
    : await supabase
        .from("managed_setups")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
  if (!setup) return NextResponse.json({ error: "no_setup" }, { status: 404 });

  const price = Number.isFinite(body.price) ? Math.max(0, Math.round(body.price!)) : null;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      setup_id: setup.id,
      trip_type: tripType,
      plan_type: planType,
      price,
      // billing_on intentionally omitted — DB default false; RLS rejects true.
    })
    .select("id")
    .single();
  if (error || !booking) return NextResponse.json({ error: "booking_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, bookingId: booking.id, billingOn: false });
}
