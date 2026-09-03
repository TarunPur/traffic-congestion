import { describe, it, expect, afterEach, vi } from "vitest";
import { serverEnv, hasSupabaseCredentials, publicEnv } from "@/lib/env";

/**
 * P0.4 secrets discipline (ERD §1/§8). The server-only accessor must refuse to run in a browser
 * context, so the service-role / Mappls keys can never be pulled into a client bundle.
 */
describe("env — secrets discipline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serverEnv() throws if a window exists (never runs client-side)", () => {
    vi.stubGlobal("window", {});
    expect(() => serverEnv()).toThrow(/server-only/i);
  });

  it("serverEnv() returns secrets on the server (no window)", () => {
    // jsdom defines window; remove it to simulate the server runtime.
    vi.stubGlobal("window", undefined);
    expect(() => serverEnv()).not.toThrow();
    const env = serverEnv();
    expect(env).toHaveProperty("supabaseServiceRoleKey");
    expect(env).toHaveProperty("mapplsClientId");
  });

  it("publicEnv exposes only browser-safe values (no service role field)", () => {
    expect(Object.keys(publicEnv)).not.toContain("supabaseServiceRoleKey");
    expect(Object.keys(publicEnv)).not.toContain("mapplsClientSecret");
  });

  it("hasSupabaseCredentials() is false for the parked placeholder keys", () => {
    // .env.local ships REPLACE_WITH_* placeholders during the parked window.
    expect(hasSupabaseCredentials()).toBe(false);
  });
});
