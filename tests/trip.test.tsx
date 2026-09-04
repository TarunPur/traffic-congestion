import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/split-flap", () => ({
  SplitFlap: ({ value }: { value: string }) => <div data-testid="split-flap">{value}</div>,
}));
vi.mock("@/components/trip-map", () => ({ TripMap: () => <div data-testid="trip-map" /> }));

const subscribe = vi.fn(() => ({}));
const on = vi.fn(() => ({ subscribe }));
const channel = vi.fn(() => ({ on }));
const removeChannel = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ channel, removeChannel }),
}));

const TRIP = {
  tripId: "t1",
  driver: "Ramesh K.",
  vehicle: "Silver WagonR · DL 1C AB 2345",
  etaMin: 3,
  legLabel: "First mile · Clearline auto",
  heldNote: "Your last-mile auto is held at the Cyber City transfer — waits 0–5 min for you.",
  steps: [
    { label: "Pickup · Hauz Khas Enclave", sub: "Clearline auto arriving", time: "7:58", min: 478, state: "now" },
    { label: "AC shuttle · Hauz Khas → Cyber City", sub: "Reserved · committed window", time: "8:07", min: 487, state: "upcoming" },
  ],
  source: "stub",
  placeholder: true,
};

import TripPage from "@/app/trip/page";

describe("22 Live trip", () => {
  beforeEach(() => {
    push.mockClear();
    channel.mockClear();
    subscribe.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders the ETA split-flap, driver, step tracker and held line", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => TRIP }) as Response));
    render(<TripPage />);
    expect(await screen.findByTestId("split-flap")).toHaveTextContent("3");
    expect(screen.getByText("Ramesh K.")).toBeInTheDocument();
    expect(screen.getByText("Silver WagonR · DL 1C AB 2345")).toBeInTheDocument();
    expect(screen.getByText("Pickup · Hauz Khas Enclave")).toBeInTheDocument();
    expect(screen.getByText(/held at the Cyber City transfer/)).toBeInTheDocument();
  });

  it("subscribes to Realtime updates for the trip row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => TRIP }) as Response));
    render(<TripPage />);
    await screen.findByTestId("split-flap");
    await waitFor(() => expect(channel).toHaveBeenCalledWith("trip-t1"));
    expect(subscribe).toHaveBeenCalled();
  });

  it("Share copies the link; Emergency raises the oxblood alert", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => TRIP }) as Response));
    render(<TripPage />);
    await screen.findByTestId("split-flap");
    await userEvent.click(screen.getByRole("button", { name: "Share trip" }));
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Emergency" }));
    expect(screen.getAllByText(/112/).length).toBeGreaterThan(0);
  });

  it("with no active trip, says so", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "no_booking" }) }) as Response));
    render(<TripPage />);
    expect(await screen.findByText(/No trip running right now/)).toBeInTheDocument();
  });
});
