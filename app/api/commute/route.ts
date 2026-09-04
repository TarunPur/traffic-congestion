import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlaceRef } from "@/lib/planner/types";
import type { Json } from "@/lib/supabase/types";

/**
 * /api/commute — the saved-commute store (BUILD-SPEC §7·10, ERD §3 `saved_commutes`).
 * Auth required. Owner-only: `user_id` is taken from the SSR session, never the request body,
 * and RLS (`saved_commutes_owner_all`) is the backstop. Home (screen 10) reads GET; screens
 * 08/09 "Set as my commute" / "Save this plan" write POST. Home is sensitive — it lives only in
 * the owner's rows and is never exposed to employers.
 */

interface CommuteBody {
  origin: PlaceRef;
  dest: PlaceRef;
  arriveBy?: string | null; // HH:MM
  preferredMode?: string | null;
  label?: string | null;
}

const DEFAULT_LABEL = "Morning · to work";

/** HH:MM → an ISO timestamp (today, UTC) so the time round-trips through the timestamptz column. */
function hmToTimestamp(hm: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setUTCHours(h, min, 0, 0);
  return d.toISOString();
}

/** ISO timestamp → "H:MM" (UTC), the shape screens 08/09/10 render. */
function timestampToHm(ts: string | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_commutes")
    .select("id, origin_place, dest_place, arrive_by, preferred_mode, label, created_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  const commutes = (data ?? []).map((r) => ({
    id: r.id,
    origin: r.origin_place as unknown as PlaceRef,
    dest: r.dest_place as unknown as PlaceRef,
    arriveBy: timestampToHm(r.arrive_by),
    preferredMode: r.preferred_mode,
    label: r.label ?? DEFAULT_LABEL,
    createdAt: r.created_at,
  }));
  return NextResponse.json({ commutes });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: CommuteBody;
  try {
    body = (await request.json()) as CommuteBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body?.origin?.name || !body?.dest?.name) {
    return NextResponse.json({ error: "origin and dest required" }, { status: 400 });
  }

  const label = (body.label ?? DEFAULT_LABEL).slice(0, 80);
  const arriveBy = body.arriveBy ? hmToTimestamp(body.arriveBy) : null;
  const preferredMode = body.preferredMode ? String(body.preferredMode).slice(0, 20) : null;

  // One commute per label per user: replace an existing same-label row rather than piling up.
  await supabase.from("saved_commutes").delete().eq("user_id", user.id).eq("label", label);

  const { data, error } = await supabase
    .from("saved_commutes")
    .insert({
      user_id: user.id,
      origin_place: { name: body.origin.name, lat: body.origin.lat, lng: body.origin.lng } as unknown as Json,
      dest_place: { name: body.dest.name, lat: body.dest.lat, lng: body.dest.lng } as unknown as Json,
      arrive_by: arriveBy,
      preferred_mode: preferredMode,
      label,
    })
    .select("id")
    .single();
  if (error || !data) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id });
}
