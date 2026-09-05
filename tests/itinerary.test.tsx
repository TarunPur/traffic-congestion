import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/split-flap", () => ({
  SplitFlap: ({ value }: { value: string }) => <div data-testid="split-flap">{value}</div>,
}));

const PLAN = {
  legs: [
    { mode: "Auto", contracted: true, place: "Hauz Khas Enclave gate", note: "Contracted pickup", depTime: "7:58", durMin: 6, windowLabel: "Clearline auto" },
    { mode: "Shuttle", contracted: true, place: "Hauz Khas shuttle point", note: "Reserved AC shuttle", depTime: "8:07", durMin: 42, windowLabel: "Clearline AC shuttle · committed window" },
    { mode: "Auto", contracted: true, place: "Cyber City · staged transfer", note: "Last-mile auto held", depTime: "8:51", durMin: 4, windowLabel: "Clearline · held 0–5 min" },
    { mode: "Walk", contracted: false, place: "DLF Cyber City, Bldg 10", note: "Verified walk", depTime: "8:55", durMin: 2 },
  ],
  leaveBy: "7:58",
  doorToDoorMin: 59,
  transfers: 1,
  walkM: 120,
  perDayFare: 185,
  monthlyFare: 3400,
  committedWindow: "committed window",
  reliability: "≥85% on-time",
};

function mockFetch(plan: unknown) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => ({ setup: { home: "Hauz Khas Enclave", tower: "DLF Cyber City, Bldg 10" }, plan }),
  }) as Response);
}

import ItineraryPage from "@/app/itinerary/page";

describe("20 Itinerary card", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("renders the boarding-pass stub, all contracted legs and the stats", async () => {
    vi.stubGlobal("fetch", mockFetch(PLAN));
    render(<ItineraryPage />);
    expect(await screen.findByTestId("split-flap")).toHaveTextContent("7:58");
    expect(screen.getAllByText(/door.to.door/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Reserved AC shuttle")).toBeInTheDocument();
    expect(screen.getAllByText(/Clearline/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("120 m")).toBeInTheDocument();
    // committed-window honesty, never "guaranteed"
    expect(screen.getAllByText(/committed window/i).length).toBeGreaterThan(0);
  });

  it("Accept → /booking", async () => {
    vi.stubGlobal("fetch", mockFetch(PLAN));
    render(<ItineraryPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Accept & save this commute/ }));
    expect(push).toHaveBeenCalledWith("/booking");
  });

  it("with no plan, offers to set one up", async () => {
    vi.stubGlobal("fetch", mockFetch(null));
    render(<ItineraryPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Set up my commute" }));
    expect(push).toHaveBeenCalledWith("/setup");
  });
});

describe("20 operator tag — plain sentence case, not the leg-list eyebrow's uppercase", () => {
  it("overrides .r .place .tl's uppercase for .mgd-legs specifically (PIXEL-AUDIT.md §20)", () => {
    const css = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");
    const rule = /\.mgd-legs \.r \.place \.tl\.mgd\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toMatch(/text-transform:\s*none/);
    expect(rule).toMatch(/letter-spacing:\s*0\.02em/);
  });
});
