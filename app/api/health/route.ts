import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseCredentials } from "@/lib/env";

/**
 * P0.4 smoke read — a server route that reads the public `places` reference table via the
 * anon client (RLS: public read). Honest about the parked-keys state: reports `connected:false`
 * with `reason:"credentials_parked"` until Tarun pastes the real keys, rather than faking success.
 */
export async function GET() {
  if (!hasSupabaseCredentials()) {
    return NextResponse.json({
      ok: true,
      connected: false,
      reason: "credentials_parked",
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("places").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: true, connected: false, reason: error.message }, { status: 200 });
    }
    return NextResponse.json({ ok: true, connected: true, placesReachable: Array.isArray(data) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: true, connected: false, reason: message }, { status: 200 });
  }
}
