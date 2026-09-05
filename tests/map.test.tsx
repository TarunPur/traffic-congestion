import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const setTrip = vi.fn();
vi.mock("@/lib/trip-state", () => ({
  setTrip: (p: unknown) => setTrip(p),
  useTrip: () => [{}, vi.fn()],
}));

vi.mock("@/components/trip-map", () => ({ TripMap: () => <div data-testid="trip-map" /> }));

const HAUZ_KHAS = { id: "1", name: "Hauz Khas Enclave", subLabel: "Area", type: "area", lat: 28.55, lng: 77.2 };
const DLF_HUB = { id: "2", name: "DLF Cyber Hub", subLabel: "Office hub", type: "office_hub", lat: 28.49, lng: 77.09 };

vi.mock("@/lib/use-places-search", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/use-places-search")>();
  return {
    ...actual,
    usePlacesSearch: () => ({ results: [HAUZ_KHAS, DLF_HUB], loading: false }),
  };
});

import SetOnMapPage from "@/app/map/page";

/**
 * 06 · Set on map (BUILD-SPEC §7·06). Search fields AND draggable pins together — the previous
 * build had only the drag half (PIXEL-AUDIT.md §06). This covers the search-driven path; the
 * drag path is exercised via TripMap's own onOriginMove/onDestMove props (mocked out here since
 * MapLibre doesn't render in jsdom).
 */
describe("06 Set on map", () => {
  beforeEach(() => {
    push.mockClear();
    setTrip.mockClear();
  });

  it("disables the CTA until both a start and destination are picked", async () => {
    render(<SetOnMapPage />);
    expect(screen.getByRole("button", { name: "See ways to go" })).toBeDisabled();

    await userEvent.click(screen.getByLabelText("From"));
    await userEvent.click(screen.getByText("Hauz Khas Enclave"));
    expect(screen.getByRole("button", { name: "Add both points" })).toBeDisabled();

    await userEvent.click(screen.getByLabelText("Where to"));
    await userEvent.click(screen.getByText("DLF Cyber Hub"));
    expect(screen.getByRole("button", { name: "See ways to go" })).toBeEnabled();
  });

  it("confirming writes the trip and routes a multi-part destination to /part", async () => {
    render(<SetOnMapPage />);
    await userEvent.click(screen.getByLabelText("From"));
    await userEvent.click(screen.getByText("Hauz Khas Enclave"));
    await userEvent.click(screen.getByLabelText("Where to"));
    await userEvent.click(screen.getByText("DLF Cyber Hub"));
    await userEvent.click(screen.getByRole("button", { name: "See ways to go" }));

    expect(setTrip).toHaveBeenCalledWith({
      origin: { name: "Hauz Khas Enclave", lat: 28.55, lng: 77.2 },
      dest: { name: "DLF Cyber Hub", lat: 28.49, lng: 77.09 },
    });
    // DLF Cyber Hub is an office_hub with no specific building number → multi-part → /part.
    expect(push).toHaveBeenCalledWith("/part");
  });

  it("swap exchanges the start and destination", async () => {
    render(<SetOnMapPage />);
    await userEvent.click(screen.getByLabelText("From"));
    await userEvent.click(screen.getByText("Hauz Khas Enclave"));
    await userEvent.click(screen.getByLabelText("Where to"));
    await userEvent.click(screen.getByText("DLF Cyber Hub"));

    await userEvent.click(screen.getByRole("button", { name: "Swap" }));
    expect(screen.getByLabelText("From")).toHaveValue("DLF Cyber Hub");
    expect(screen.getByLabelText("Where to")).toHaveValue("Hauz Khas Enclave");
  });

  it("shows the summary line and distance once both points are set", async () => {
    render(<SetOnMapPage />);
    await userEvent.click(screen.getByLabelText("From"));
    await userEvent.click(screen.getByText("Hauz Khas Enclave"));
    await userEvent.click(screen.getByLabelText("Where to"));
    await userEvent.click(screen.getByText("DLF Cyber Hub"));
    expect(screen.getByText(/km as the crow flies/)).toBeInTheDocument();
  });
});
