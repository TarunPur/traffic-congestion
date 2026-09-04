import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { buildManagedPlan, type ManagedPlan } from "@/lib/managed-plan";
import { hmToTimestamp, timestampToHm } from "@/lib/hm-time";
import type { Json } from "@/lib/supabase/types";

/**
 * /api/managed — the J2 managed-setup + plan (BUILD-SPEC §11·19–20).
 * Auth required; `user_id` from the SSR session. `managed_setups` is owner-only (home/tower are
 * sensitive). The plan is derived server-side (locked demo sample) and written to `managed_plans`
 * via service-role (that table is client read-only). GET returns the caller's latest setup + plan
 * — used by 19 (prefill / history), 20, 21, 23.
 */

interface SetupBody {
  home: string;
  tower: string;
  arriveBy: string;
  returnAfter: string;
  days: string[];
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: setup } = await supabase
    .from("managed_setups")
    .select("id, home, tower, arrive_by, return_after, days, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!setup) return NextResponse.json({ setup: null, plan: null });

  const { data: plan } = await supabase
    .from("managed_plans")
    .select("legs, door_to_door_min, transfers, walk_m, per_day_fare, monthly_fare, committed_window")
    .eq("setup_id", setup.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    setup: {
      id: setup.id,
      home: setup.home,
      tower: setup.tower,
      arriveBy: timestampToHm(setup.arrive_by),
      returnAfter: timestampToHm(setup.return_after),
      days: setup.days ?? [],
    },
    plan: plan
      ? ({
          legs: (plan.legs as unknown as ManagedPlan["legs"]) ?? [],
          leaveBy: ((plan.legs as unknown as ManagedPlan["legs"])?.[0]?.depTime) ?? "7:58",
          doorToDoorMin: plan.door_to_door_min ?? 59,
          transfers: plan.transfers ?? 1,
          walkM: plan.walk_m ?? 120,
          perDayFare: plan.per_day_fare ?? 185,
          monthlyFare: plan.monthly_fare ?? 3400,
          committedWindow: plan.committed_window ?? "committed window",
          reliability: "≥85% on-time · auto fallback cab + fare credit if a leg fails",
        } satisfies ManagedPlan)
      : null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: SetupBody;
  try {
    body = (await request.json()) as SetupBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const days = Array.isArray(body.days) ? body.days.filter((d) => typeof d === "string").slice(0, 7) : [];
  if (days.length === 0) return NextResponse.json({ error: "at least one day" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: corridor } = await admin.from("corridors").select("id").eq("demo", true).limit(1).maybeSingle();

  const { data: setup, error: sErr } = await supabase
    .from("managed_setups")
    .insert({
      user_id: user.id,
      corridor_id: corridor?.id ?? null,
      home: (body.home ?? "").trim().slice(0, 160) || null,
      tower: (body.tower ?? "").trim().slice(0, 160) || null,
      arrive_by: body.arriveBy ? hmToTimestamp(body.arriveBy) : null,
      return_after: body.returnAfter ? hmToTimestamp(body.returnAfter) : null,
      days,
    })
    .select("id")
    .single();
  if (sErr || !setup) return NextResponse.json({ error: "setup_failed" }, { status: 500 });

  const plan = buildManagedPlan();

  // managed_plans is client read-only — write it with the service role.
  await admin.from("managed_plans").insert({
    setup_id: setup.id,
    legs: plan.legs as unknown as Json,
    door_to_door_min: plan.doorToDoorMin,
    transfers: plan.transfers,
    walk_m: plan.walkM,
    per_day_fare: plan.perDayFare,
    monthly_fare: plan.monthlyFare,
    committed_window: plan.committedWindow,
  });

  return NextResponse.json({ setupId: setup.id, plan });
}
