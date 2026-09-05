import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Plan } from "@/lib/planner/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/split-flap", () => ({
  SplitFlap: ({ value }: { value: string }) => <div data-testid="split-flap">{value}</div>,
}));
vi.mock("@/components/duotone", () => ({ Duotone: () => <div data-testid="duotone" /> }));

import Home from "@/app/page";

const PLANS: Plan[] = [
  {
    name: "recommended",
    totalMin: 49,
    fare: 55,
    timeVsCarMin: 3,
    co2VsCar: 3.4,
    projectedArrival: "9:24",
    onTime: true,
    legs: [
      { mode: "Walk", ride: false, place: "Green Park Metro", depTime: "8:35", durMin: 8, arrangeYourself: true },
      { mode: "Metro", ride: true, place: "Yellow Line, Sikanderpur", depTime: "8:43", durMin: 26, arrangeYourself: false, line: "yellow", scheduled: true },
      { mode: "Walk", ride: false, place: "Bldg 10 lobby", depTime: "9:19", durMin: 5, arrangeYourself: true },
    ],
  },
  {
    name: "fastest",
    totalMin: 41,
    fare: 55,
    timeVsCarMin: 11,
    co2VsCar: 3.6,
    projectedArrival: "9:16",
    onTime: true,
    legs: [
      { mode: "Auto", ride: false, place: "Hauz Khas Metro", depTime: "8:35", durMin: 6, arrangeYourself: true },
      { mode: "Metro", ride: true, place: "Yellow Line, Sikanderpur", depTime: "8:43", durMin: 24, arrangeYourself: false, line: "yellow", scheduled: true },
      { mode: "Auto", ride: false, place: "DLF Cyber Hub, Bldg 10", depTime: "9:07", durMin: 9, arrangeYourself: true },
    ],
  },
];

function mockFetch(commutes: unknown[]) {
  return vi.fn(async (url: string) => {
    if (String(url).includes("/api/commute")) {
      return { ok: true, json: async () => ({ commutes }) } as Response;
    }
    if (String(url).includes("/api/managed")) {
      return { ok: true, json: async () => ({ setup: null, plan: null }) } as Response;
    }
    if (String(url).includes("/api/plan")) {
      return { ok: true, json: async () => ({ plans: PLANS }) } as Response;
    }
    throw new Error(`unexpected fetch ${url}`);
  });
}

const SAVED = [
  {
    id: "c1",
    origin: { name: "Hauz Khas Enclave" },
    dest: { name: "DLF Cyber Hub" },
    arriveBy: "9:30",
    preferredMode: "Metro",
    label: "Morning · to work",
  },
];

describe("10 Saved / home", () => {
  beforeEach(() => {
    push.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows a small, sane 'until you go' countdown no matter what time it actually is", async () => {
    // Regression for the countdown bug (PIXEL-AUDIT.md): it used to be computed as
    // hmToMin(leaveBy) - realWallClockNow(), so at 2am it showed "312 min" instead of the
    // locked design's fixed "12 min". The countdown must not depend on the real clock at all.
    vi.setSystemTime(new Date("2026-09-05T02:00:00"));
    vi.stubGlobal("fetch", mockFetch(SAVED));
    render(<Home />);
    expect(await screen.findByText("12 min")).toBeInTheDocument();
  });

  it("ticks the countdown down by one minute per minute, down to 'leave now'", async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal("fetch", mockFetch(SAVED));
      render(<Home />);
      await vi.waitFor(() => expect(screen.getByText("12 min")).toBeInTheDocument());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(screen.getByText("11 min")).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000 * 11);
      });
      expect(screen.getByText("leave now")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the saved commute hero with the leave-by board and today's-plan CTA", async () => {
    vi.stubGlobal("fetch", mockFetch(SAVED));
    render(<Home />);
    expect(await screen.findByText("Leave by")).toBeInTheDocument();
    expect(screen.getByTestId("split-flap")).toHaveTextContent("8:35");
    expect(screen.getByText(/Hauz Khas Enclave/)).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: /See today’s plan|See today's plan/ });
    await userEvent.click(cta);
    expect(push).toHaveBeenCalledWith("/plan?name=recommended");
  });

  it("routes 'Other ways to go' to /ways", async () => {
    vi.stubGlobal("fetch", mockFetch(SAVED));
    render(<Home />);
    const other = await screen.findByRole("button", { name: /Other ways to go/ });
    await userEvent.click(other);
    expect(push).toHaveBeenCalledWith("/ways");
  });

  it("routes the feedback nudge to /feedback, naming the specific trip being rated", async () => {
    vi.stubGlobal("fetch", mockFetch(SAVED));
    render(<Home />);
    const fb = await screen.findByRole("button", { name: /yesterday’s commute|yesterday's commute/ });
    await userEvent.click(fb);
    expect(push).toHaveBeenCalledWith("/feedback?origin=Hauz%20Khas%20Enclave&dest=DLF%20Cyber%20Hub");
  });

  it("with no saved commute shows the onboarding nudge and routes to /choose", async () => {
    vi.stubGlobal("fetch", mockFetch([]));
    render(<Home />);
    const plan = await screen.findByRole("button", { name: /Plan a commute/ });
    await userEvent.click(plan);
    expect(push).toHaveBeenCalledWith("/choose");
  });

  it("Clearline mode reveals the managed upsell and routes it to /eligibility", async () => {
    vi.stubGlobal("fetch", mockFetch(SAVED));
    render(<Home />);
    await screen.findByText("Leave by");
    await userEvent.click(screen.getByRole("button", { name: "Clearline" }));
    expect(screen.getByText(/don’t run your corridor yet|don't run your corridor yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Add my commute to the list/ }));
    expect(push).toHaveBeenCalledWith("/eligibility");
  });

  it("renders the bottom tab bar with Home current", async () => {
    vi.stubGlobal("fetch", mockFetch(SAVED));
    render(<Home />);
    await screen.findByText("Leave by");
    const home = screen.getByRole("button", { name: /Home/ });
    expect(home).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: /^You$/ }));
    expect(push).toHaveBeenCalledWith("/you");
  });
});
