import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * /api/eligibility — the J2 OR-gate (BUILD-SPEC §11·17a, design §11).
 *
 * The client sends only name / employee-ID / company / work-email. `partnered` is decided
 * ENTIRELY SERVER-SIDE by matching the work-email DOMAIN against `partner_domains` (a table with
 * NO client policies — the client can't read it, let alone forge a match). Any `partnered` field
 * in the request body is ignored. The employee ID is CAPTURED, NOT VERIFIED ("we don't validate
 * it here"). A personal / unknown domain is valid input → routes to the waitlist, not an error.
 *
 * The `eligibility` row is written with the service-role client (the table has an owner-READ
 * policy but no insert policy), after the auth check, scoped to this user only.
 */

const EMAIL_RE = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("eligibility")
    .select("partnered, company, domain")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ eligibility: data ?? null });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { fullName?: string; employeeId?: string; company?: string; workEmail?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const email = (body.workEmail ?? "").trim().toLowerCase();
  const m = EMAIL_RE.exec(email);
  if (!m) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const domain = m[1]!;

  // Server-side partnership decision — the ONLY source of truth for `partnered`.
  const admin = createServiceRoleClient();
  const { data: partner } = await admin
    .from("partner_domains")
    .select("corridor_id")
    .eq("domain", domain)
    .maybeSingle();
  const partnered = partner != null;

  await admin.from("eligibility").upsert(
    {
      user_id: user.id,
      full_name: (body.fullName ?? "").trim().slice(0, 120) || null,
      employee_id: (body.employeeId ?? "").trim().slice(0, 60) || null, // captured, NOT verified
      company: (body.company ?? "").trim().slice(0, 120) || null,
      work_email: email.slice(0, 160),
      domain,
      partnered,
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ partnered, corridorId: partner?.corridor_id ?? null });
}
