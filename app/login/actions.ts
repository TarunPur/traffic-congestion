"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isValidMobile, toE164 } from "@/lib/phone";

/**
 * Auth server actions (ERD §4). Phone OTP via Supabase Auth. The pending phone is held in an
 * httpOnly cookie between screens 01→02 — NEVER in a URL query (privacy rule). Errors return a
 * typed code the screen maps to honest copy; success on verify sets the SSR session cookies.
 */

const PENDING_PHONE = "cl_otp_phone";

export type SendResult = { ok: true } | { ok: false; error: "invalid" | "send_failed" | "rate_limited" };
export type VerifyResult =
  | { ok: true }
  | { ok: false; error: "no_pending" | "wrong_code" | "expired" | "verify_failed" };

export async function sendOtp(rawPhone: string): Promise<SendResult> {
  if (!isValidMobile(rawPhone)) return { ok: false, error: "invalid" };
  const phone = toE164(rawPhone);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) {
    return { ok: false, error: error.status === 429 ? "rate_limited" : "send_failed" };
  }
  const store = await cookies();
  store.set(PENDING_PHONE, phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 min
  });
  return { ok: true };
}

export async function resendOtp(): Promise<SendResult> {
  const store = await cookies();
  const phone = store.get(PENDING_PHONE)?.value;
  if (!phone) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { ok: false, error: error.status === 429 ? "rate_limited" : "send_failed" };
  return { ok: true };
}

export async function verifyOtp(token: string): Promise<VerifyResult> {
  const store = await cookies();
  const phone = store.get(PENDING_PHONE)?.value;
  if (!phone) return { ok: false, error: "no_pending" };
  if (!/^\d{6}$/.test(token)) return { ok: false, error: "wrong_code" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired")) return { ok: false, error: "expired" };
    if (msg.includes("invalid") || error.status === 403) return { ok: false, error: "wrong_code" };
    return { ok: false, error: "verify_failed" };
  }
  store.delete(PENDING_PHONE);
  return { ok: true };
}

// Sanctioned test number (PARKED.md — configured with a fixed test OTP both locally and on the
// production Supabase project, `auth.sms.test_otp`; never reaches a real SMS provider). Reusing
// it here just automates the two real steps below into one click for people previewing the live
// link — it is not a separate auth path, and it fails closed (same as any wrong code) if that
// test-OTP config is ever removed on either project.
const DEMO_PHONE = "9812345678";
const DEMO_OTP = "424242";

export type DemoLoginResult = { ok: true } | { ok: false; error: "unavailable" };

/** One-click preview login for people who don't have the test credentials (screen 01's "Try the demo"). */
export async function demoLogin(): Promise<DemoLoginResult> {
  const sent = await sendOtp(DEMO_PHONE);
  if (!sent.ok) return { ok: false, error: "unavailable" };
  const verified = await verifyOtp(DEMO_OTP);
  if (!verified.ok) return { ok: false, error: "unavailable" };
  return { ok: true };
}

/** Masked pending phone for the "Sent to …" line on screen 02 (server-read of the httpOnly cookie). */
export async function getPendingPhoneMasked(): Promise<string | null> {
  const store = await cookies();
  const phone = store.get(PENDING_PHONE)?.value;
  if (!phone) return null;
  // +919824017722 → +91 98240 17722
  const nat = phone.replace(/^\+91/, "");
  return `+91 ${nat.slice(0, 5)} ${nat.slice(5)}`;
}
