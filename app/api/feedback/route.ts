import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/feedback — the ride rating store (BUILD-SPEC §10·15, ERD §3 `feedback`).
 * Auth required; `user_id` from the SSR session. RLS lets a user insert + read only their own
 * rows and never anyone else's — feedback is INTERNAL-ONLY (feeds what-to-fix + corridor ranking),
 * never surfaced to other users.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { rating?: number; note?: string | null };
  try {
    body = (await request.json()) as { rating?: number; note?: string | null };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating 1-5 required" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) || null : null;

  const { error } = await supabase.from("feedback").insert({ user_id: user.id, rating, note });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
