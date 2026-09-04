import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * 17a · /api/eligibility — proves `partnered` is decided SERVER-SIDE from `partner_domains`
 * and the client can NEVER forge it (BUILD-SPEC §11·17a).
 */

let partnerRow: { corridor_id: string } | null = null;
const upsert = vi.fn(async () => ({ error: null }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
  }),
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table === "partner_domains") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: partnerRow }) }) }),
        };
      }
      // eligibility
      return { upsert };
    },
  }),
}));

import { POST } from "@/app/api/eligibility/route";

function req(body: unknown) {
  return new Request("http://test/api/eligibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/eligibility", () => {
  beforeEach(() => {
    partnerRow = null;
    upsert.mockClear();
  });

  it("a personal domain is NOT partnered — even when the body tries to inject partnered:true", async () => {
    partnerRow = null; // domain not in partner_domains
    const res = await POST(req({ workEmail: "me@gmail.com", partnered: true, company: "x" }));
    const json = (await res.json()) as { partnered: boolean };
    expect(res.status).toBe(200);
    expect(json.partnered).toBe(false);
    // the row persisted must also carry the server verdict, not the injected value
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ partnered: false, domain: "gmail.com" }),
      expect.anything(),
    );
  });

  it("a domain present in partner_domains IS partnered and returns the corridor id", async () => {
    partnerRow = { corridor_id: "c1" };
    const res = await POST(req({ workEmail: "aarav@nexusgcc.in" }));
    const json = (await res.json()) as { partnered: boolean; corridorId: string | null };
    expect(json.partnered).toBe(true);
    expect(json.corridorId).toBe("c1");
  });

  it("rejects a malformed work email", async () => {
    const res = await POST(req({ workEmail: "not-an-email" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_email");
  });
});
