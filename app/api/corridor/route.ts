import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/corridor — the demo managed corridor + this user's commitment state
 * (BUILD-SPEC §11·17). `corridors` is public-read; `committed_count` / `status` only ever move
 * server-side (via /api/commit). Never fabricates the count — it is the real `commitments`
 * aggregate held on the row.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: corridor, error } = await supabase
    .from("corridors")
    .select("id, name, threshold, committed_count, status")
    .eq("demo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !corridor) return NextResponse.json({ error: "no_corridor" }, { status: 404 });

  const { data: mine } = await supabase
    .from("commitments")
    .select("id")
    .eq("user_id", user.id)
    .eq("corridor_id", corridor.id)
    .maybeSingle();

  return NextResponse.json({
    id: corridor.id,
    name: corridor.name,
    threshold: corridor.threshold,
    committedCount: corridor.committed_count,
    status: corridor.status,
    committed: mine != null,
  });
}
