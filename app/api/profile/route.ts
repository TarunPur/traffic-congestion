import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/profile — the progressive profile store (BUILD-SPEC §10·11, ERD §3 `profile_fields`).
 * Auth required, owner-only: `user_id` from the SSR session, RLS `profile_fields_owner_all`
 * backstop. Every field is optional ("Not set" until filled); home/work are sensitive and never
 * leave the owner's rows. Feeds the saved commute + the J2 setup prefill (§11·19).
 */

const KEYS = ["home", "work", "arrival", "return", "preferred_mode"] as const;
type Key = (typeof KEYS)[number];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("profile_fields").select("key, value");
  if (error) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  const fields: Record<Key, string | null> = {
    home: null,
    work: null,
    arrival: null,
    return: null,
    preferred_mode: null,
  };
  for (const row of data ?? []) {
    if ((KEYS as readonly string[]).includes(row.key)) fields[row.key as Key] = row.value;
  }
  return NextResponse.json({ fields });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { key?: string; value?: string | null };
  try {
    body = (await request.json()) as { key?: string; value?: string | null };
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.key || !(KEYS as readonly string[]).includes(body.key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }
  const raw = typeof body.value === "string" ? body.value.trim().slice(0, 120) : null;
  const value = raw ? raw : null; // empty string clears the field

  const { error } = await supabase
    .from("profile_fields")
    .upsert({ user_id: user.id, key: body.key, value }, { onConflict: "user_id,key" });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, key: body.key, value });
}
