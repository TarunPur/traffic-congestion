import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/split-flap", () => ({
  SplitFlap: ({ value }: { value: string }) => <div data-testid="split-flap">{value}</div>,
}));

const PLAN = {
  legs: [],
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
    json: async () => ({ setup: { home: "Hauz Khas Enclave", tower: "DLF Cyber City" }, plan }),
  }) as Response);
}

import ManagedHomePage from "@/app/managed/page";

describe("23 Managed home", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("leads with the assigned managed ride", async () => {
    vi.stubGlobal("fetch", mockFetch(PLAN));
    render(<ManagedHomePage />);
    expect(await screen.findByText("Be ready by")).toBeInTheDocument();
    expect(screen.getByTestId("split-flap")).toHaveTextContent("7:58");
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.getByText(/Pilot — reserved, no charge yet/)).toBeInTheDocument();
  });

  it("Start today's trip → /trip; Myself → /", async () => {
    vi.stubGlobal("fetch", mockFetch(PLAN));
    render(<ManagedHomePage />);
    await userEvent.click(await screen.findByRole("button", { name: /Start today’s trip/ }));
    expect(push).toHaveBeenCalledWith("/trip");
    await userEvent.click(screen.getByRole("button", { name: "Myself" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("with no managed commute, offers to explore it", async () => {
    vi.stubGlobal("fetch", mockFetch(null));
    render(<ManagedHomePage />);
    await userEvent.click(await screen.findByRole("button", { name: /Explore the managed commute/ }));
    expect(push).toHaveBeenCalledWith("/eligibility");
  });
});
