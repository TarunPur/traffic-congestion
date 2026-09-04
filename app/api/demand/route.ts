import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { recordDemandSignal } from "@/lib/demand";

/**
 * POST /api/demand — record ONE anonymous demand signal (BUILD-SPEC §7·Demand).
 * Auth required only to check the caller's opt-out preference; the signal itself carries no user
 * linkage. Raw `demand_signals` rows are never client-readable (RLS, no policies) — the only way
 * out is the k-anon N>=5 `demand_aggregate()` function. Home is never in a signal (generalised
 * OD only). `/api/plan` also records a signal server-side on every plan.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { odPair?: string; mode?: string | null; timeWindow?: string | null; preferredRoute?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.odPair || typeof body.odPair !== "string") {
    return NextResponse.json({ error: "odPair required" }, { status: 400 });
  }

  const recorded = await recordDemandSignal(supabase, createServiceRoleClient(), user.id, {
    odPair: body.odPair,
    mode: body.mode ?? null,
    timeWindow: body.timeWindow ?? null,
    preferredRoute: body.preferredRoute ?? null,
  });
  return NextResponse.json({ ok: true, recorded });
}
