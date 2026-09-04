import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const ROWS = [
  { id: "c1", kind: "commute", nm: "Hauz Khas Enclave → DLF Cyber Hub", sub: "Saved commute · morning" },
  { id: "t1", kind: "trip", nm: "DLF Cyber Hub → Home", sub: "Trip · yesterday" },
];

function mkFetch() {
  const calls: { url: string; method: string }[] = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ url: String(url), method });
    if (String(url).includes("/api/privacy") && method === "GET") {
      return { ok: true, json: async () => ({ rows: ROWS, demand: true }) } as Response;
    }
    return { ok: true, json: async () => ({ ok: true }) } as Response;
  });
  return { fn, calls };
}

import PrivacyPage from "@/app/privacy/page";

describe("13 Privacy & data", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("renders the what-we-keep list and the demand toggle from GET", async () => {
    const { fn } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<PrivacyPage />);
    expect(await screen.findByText(/Your home stays yours/)).toBeInTheDocument();
    const sw = screen.getByRole("button", { name: /Contribute anonymised demand/ });
    expect(sw).toHaveAttribute("aria-pressed", "true");
  });

  it("toggling demand PATCHes the preference", async () => {
    const { fn, calls } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<PrivacyPage />);
    const sw = await screen.findByRole("button", { name: /Contribute anonymised demand/ });
    await userEvent.click(sw);
    await waitFor(() => expect(calls.some((c) => c.url.includes("/api/privacy") && c.method === "PATCH")).toBe(true));
    expect(sw).toHaveAttribute("aria-pressed", "false");
  });

  it("per-row Delete calls DELETE with id and kind", async () => {
    const { fn, calls } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<PrivacyPage />);
    await screen.findByText(/DLF Cyber Hub → Home/);
    const delButtons = screen.getAllByRole("button", { name: /^Delete$/ });
    await userEvent.click(delButtons[0]!);
    await waitFor(() =>
      expect(calls.some((c) => c.method === "DELETE" && c.url.includes("id=c1") && c.url.includes("kind=commute"))).toBe(true),
    );
  });

  it("delete-all is a two-step accent confirm", async () => {
    const { fn, calls } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<PrivacyPage />);
    const del = await screen.findByRole("button", { name: /Delete all trip history/ });
    await userEvent.click(del);
    expect(calls.some((c) => c.method === "DELETE" && c.url.includes("all=1"))).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: /Tap again to delete everything/ }));
    await waitFor(() => expect(calls.some((c) => c.method === "DELETE" && c.url.includes("all=1"))).toBe(true));
  });
});
