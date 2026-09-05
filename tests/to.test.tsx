import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/trip-state", () => ({
  setTrip: vi.fn(),
  useTrip: () => [{ origin: { name: "Hauz Khas Enclave" } }, vi.fn()],
}));

vi.mock("@/components/trip-map", () => ({ TripMap: () => <div data-testid="trip-map" /> }));
vi.mock("@/components/duotone", () => ({ Duotone: () => <div data-testid="duotone" /> }));

// Real seed data names this result "DLF Cyber Hub, Building 10" — not the bare "DLF Cyber Hub"
// (PIXEL-AUDIT.md's post-fix pass: an exact-match check against the shorter name never matched).
vi.mock("@/lib/use-places-search", () => ({
  usePlacesSearch: () => ({
    results: [
      { id: "1", name: "DLF Cyber Hub, Building 10", subLabel: "Office hub · Gurgaon", type: "office_hub", lat: 28.4949, lng: 77.0889 },
      { id: "2", name: "DLF Cyber City", subLabel: "Office district · Gurgaon", type: "office_hub", lat: 28.4941, lng: 77.087 },
    ],
  }),
  iconForPlace: () => "pin",
  isMultiPart: () => false,
}));

import WhereToPage from "@/app/to/page";

describe("05 Where to", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("shows the real duotone photo thumbnail for the featured DLF Cyber Hub result, matching its real (longer) seeded name (PIXEL-AUDIT.md §05)", () => {
    render(<WhereToPage />);
    const row = screen.getByRole("option", { name: /DLF Cyber Hub, Building 10/ });
    expect(row.querySelector('[data-testid="duotone"]')).toBeInTheDocument();
  });

  it("shows a plain icon, not a fabricated photo, for a result with no real photo asset", () => {
    render(<WhereToPage />);
    const row = screen.getByRole("option", { name: /DLF Cyber City/ });
    expect(row.querySelector('[data-testid="duotone"]')).not.toBeInTheDocument();
  });
});
