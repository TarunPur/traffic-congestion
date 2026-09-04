import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/commit — commit a seat on the demo corridor (BUILD-SPEC §11·17).
 * INTENT, NOT MONEY — nothing is charged. Creates a `commitment` (owner, RLS), then recomputes
 * `corridors.committed_count` server-side from the real `commitments` count (service-role, since
 * `corridors` has no client-write policy) and flips `status` to 'open' once the threshold is met.
 * The live moment (screen 18) fires on that real flip, never on a timer.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { corridorId?: string };
  try {
    body = (await request.json()) as { corridorId?: string };
  } catch {
    body = {};
  }

  const admin = createServiceRoleClient();

  // Resolve the target corridor (explicit id, else the demo corridor).
  const { data: corridor } = body.corridorId
    ? await admin.from("corridors").select("id, threshold, status").eq("id", body.corridorId).maybeSingle()
    : await admin.from("corridors").select("id, threshold, status").eq("demo", true).limit(1).maybeSingle();
  if (!corridor) return NextResponse.json({ error: "no_corridor" }, { status: 404 });

  // Create the commitment as the owner (unique per user+corridor — a repeat is a no-op).
  const { error: cErr } = await supabase
    .from("commitments")
    .upsert({ user_id: user.id, corridor_id: corridor.id }, { onConflict: "user_id,corridor_id" });
  if (cErr) return NextResponse.json({ error: "commit_failed" }, { status: 500 });

  // Recompute the count from the real rows; open the corridor if the threshold is met.
  const { count } = await admin
    .from("commitments")
    .select("id", { count: "exact", head: true })
    .eq("corridor_id", corridor.id);
  const committedCount = count ?? 0;
  const status = committedCount >= corridor.threshold ? "open" : corridor.status;

  await admin
    .from("corridors")
    .update({ committed_count: committedCount, status })
    .eq("id", corridor.id);

  return NextResponse.json({ committedCount, threshold: corridor.threshold, status });
}
