import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mkFetch() {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ url: String(url), method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (String(url).includes("/api/managed/booking")) {
      return { ok: true, json: async () => ({ ok: true, bookingId: "b1", billingOn: false }) } as Response;
    }
    return { ok: true, json: async () => ({ plan: { perDayFare: 185, monthlyFare: 3400 } }) } as Response;
  });
  return { fn, calls };
}

import BookingPage from "@/app/booking/page";

describe("21 Booking & pass", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("shows both plans, the trip toggle and the billing-OFF copy", async () => {
    const { fn } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<BookingPage />);
    expect(await screen.findByText("Monthly pass")).toBeInTheDocument();
    expect(screen.getByText("Per day")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Round trip" })).toBeInTheDocument();
    expect(screen.getByText("₹0 · pilot")).toBeInTheDocument();
    expect(screen.getByText(/pay nothing until billing is switched on/i)).toBeInTheDocument();
  });

  it("Confirm reserves with billing off and goes to /managed", async () => {
    const { fn, calls } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<BookingPage />);
    await screen.findByText("Monthly pass");
    await userEvent.click(screen.getByRole("button", { name: "Morning only" }));
    await userEvent.click(screen.getByRole("button", { name: /Confirm commute/ }));
    await waitFor(() =>
      expect(calls.some((c) => c.url.includes("/api/managed/booking") && c.method === "POST")).toBe(true),
    );
    const post = calls.find((c) => c.url.includes("/booking") && c.method === "POST")!;
    expect(post.body).toMatchObject({ tripType: "morning", planType: "monthly" });
    expect((post.body as Record<string, unknown>).billingOn).toBeUndefined();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/managed"), { timeout: 2000 });
  });
});
