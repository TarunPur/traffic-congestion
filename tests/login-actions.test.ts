import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * demoLogin (screen 01's "Try the demo") — proves it just runs the real
 * signInWithOtp + verifyOtp calls with the sanctioned test number, and fails
 * closed (never a separate access path) if either real call errors.
 */

let signInError: { status?: number } | null = null;
let verifyError: { status?: number; message: string } | null = null;
const cookieStore = new Map<string, string>();
const signInWithOtp = vi.fn(async () => ({ error: signInError }));
const verifyOtpMock = vi.fn(async () => ({ error: verifyError }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name)! } : undefined),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithOtp, verifyOtp: verifyOtpMock },
  }),
}));

import { demoLogin } from "@/app/login/actions";

describe("demoLogin", () => {
  beforeEach(() => {
    signInError = null;
    verifyError = null;
    cookieStore.clear();
    signInWithOtp.mockClear();
    verifyOtpMock.mockClear();
  });

  it("runs the real send-then-verify flow for the sanctioned test number and returns ok", async () => {
    const res = await demoLogin();
    expect(res).toEqual({ ok: true });
    expect(signInWithOtp).toHaveBeenCalledWith({ phone: "+919812345678" });
    expect(verifyOtpMock).toHaveBeenCalledWith({ phone: "+919812345678", token: "424242", type: "sms" });
  });

  it("fails closed when the OTP send fails, instead of granting access another way", async () => {
    signInError = { status: 500 };
    const res = await demoLogin();
    expect(res).toEqual({ ok: false, error: "unavailable" });
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("fails closed when verification fails (e.g. the test_otp config is missing)", async () => {
    verifyError = { status: 403, message: "invalid otp" };
    const res = await demoLogin();
    expect(res).toEqual({ ok: false, error: "unavailable" });
  });
});
