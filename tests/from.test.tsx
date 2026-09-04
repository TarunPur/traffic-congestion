import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const setTrip = vi.fn();
vi.mock("@/lib/trip-state", () => ({ setTrip: (p: unknown) => setTrip(p) }));

vi.mock("@/components/trip-map", () => ({ TripMap: () => <div data-testid="trip-map" /> }));

vi.mock("@/lib/use-places-search", () => ({
  usePlacesSearch: () => ({
    results: [
      { id: "1", name: "Hauz Khas Enclave", subLabel: "Area", type: "area", lat: 28.55, lng: 77.2 },
      { id: "2", name: "Hauz Khas Metro", subLabel: "Yellow", type: "metro", lat: 28.54, lng: 77.21 },
    ],
    loading: false,
  }),
  iconForPlace: () => "pin",
}));

import WhereFromPage from "@/app/from/page";

describe("04 Where from", () => {
  beforeEach(() => {
    push.mockClear();
    setTrip.mockClear();
  });

  it("lists results and disables the CTA until one is chosen", () => {
    render(<WhereFromPage />);
    expect(screen.getByRole("option", { name: /Hauz Khas Enclave/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set as start" })).toBeDisabled();
  });

  it("choosing a result writes the origin and enables → /to", async () => {
    render(<WhereFromPage />);
    await userEvent.click(screen.getByRole("option", { name: /Hauz Khas Enclave/ }));
    expect(setTrip).toHaveBeenCalledWith({ origin: { name: "Hauz Khas Enclave", lat: 28.55, lng: 77.2 } });
    const cta = screen.getByRole("button", { name: "Set as start" });
    expect(cta).toBeEnabled();
    await userEvent.click(cta);
    expect(push).toHaveBeenCalledWith("/to");
  });

  it("keeps the open-data honesty caption", () => {
    render(<WhereFromPage />);
    expect(screen.getByText(/Locations from Delhi open map data/i)).toBeInTheDocument();
  });
});
