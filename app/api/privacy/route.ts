import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlaceRef } from "@/lib/planner/types";

/**
 * /api/privacy — the "Privacy & data" control surface (BUILD-SPEC §10·13).
 * Auth required; every write is scoped to `user.id` from the SSR session and RLS is the backstop.
 * GET  → the user's saved commutes + trips, and their demand-contribution preference.
 * PATCH{demand} → sets `demand_prefs.contribute_anonymised`.
 * DELETE ?id=&kind= → removes one row.  DELETE ?all=1 → clears all trip history + commutes +
 *   the demand preference. `demand_signals` has NO user linkage by design (k-anon aggregation
 *   source), so there is nothing user-identifying to purge there.
 */

function relativeDay(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return then.toLocaleDateString("en-GB", { weekday: "long" });
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: commutes }, { data: trips }, { data: pref }] = await Promise.all([
    supabase.from("saved_commutes").select("id, origin_place, dest_place, label, created_at").order("created_at", { ascending: true }),
    supabase.from("trips").select("id, origin_place, dest_place, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("demand_prefs").select("contribute_anonymised").maybeSingle(),
  ]);

  const rows = [
    ...(commutes ?? []).map((c) => ({
      id: c.id,
      kind: "commute" as const,
      nm: `${(c.origin_place as unknown as PlaceRef)?.name ?? "—"} → ${(c.dest_place as unknown as PlaceRef)?.name ?? "—"}`,
      sub: `Saved commute · ${c.label ?? "morning"}`,
    })),
    ...(trips ?? []).map((t) => ({
      id: t.id,
      kind: "trip" as const,
      nm: `${(t.origin_place as unknown as PlaceRef)?.name ?? "—"} → ${(t.dest_place as unknown as PlaceRef)?.name ?? "—"}`,
      sub: `Trip · ${relativeDay(t.created_at)}`,
    })),
  ];

  return NextResponse.json({ rows, demand: pref?.contribute_anonymised ?? true });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { demand?: boolean };
  try {
    body = (await request.json()) as { demand?: boolean };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof body.demand !== "boolean") {
    return NextResponse.json({ error: "demand boolean required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("demand_prefs")
    .upsert({ user_id: user.id, contribute_anonymised: body.demand }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, demand: body.demand });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  if (url.searchParams.get("all") === "1") {
    await Promise.all([
      supabase.from("trips").delete().eq("user_id", user.id),
      supabase.from("saved_commutes").delete().eq("user_id", user.id),
      supabase.from("demand_prefs").delete().eq("user_id", user.id),
    ]);
    return NextResponse.json({ ok: true, cleared: "all" });
  }

  const id = url.searchParams.get("id");
  const kind = url.searchParams.get("kind");
  if (!id || (kind !== "commute" && kind !== "trip")) {
    return NextResponse.json({ error: "id and kind required" }, { status: 400 });
  }
  const table = kind === "commute" ? "saved_commutes" : "trips";
  const { error } = await supabase.from(table).delete().eq("user_id", user.id).eq("id", id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: id });
}
