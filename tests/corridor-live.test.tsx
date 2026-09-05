import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mockFetch(name: string) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => ({ name, threshold: 250, committedCount: 2, status: "waitlisted", committed: true }),
  }) as Response);
}

import CorridorLivePage from "@/app/corridor-live/page";

describe("18 Corridor is live", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("announces the activation moment", async () => {
    vi.stubGlobal("fetch", mockFetch("Hauz Khas ↔ DLF Cyber Hub"));
    render(<CorridorLivePage />);
    expect(screen.getByText(/Your corridor/)).toBeInTheDocument();
    expect(screen.getByText(/is live\./)).toBeInTheDocument();
    await screen.findByText(/Hauz Khas ↔ DLF Cyber Hub is now a/);
  });

  it("names the real corridor from data, not a hardcoded string (PIXEL-AUDIT.md §18)", async () => {
    vi.stubGlobal("fetch", mockFetch("Hauz Khas ↔ DLF Cyber Hub"));
    render(<CorridorLivePage />);
    expect(await screen.findByText(/Hauz Khas ↔ DLF Cyber Hub is now a/)).toBeInTheDocument();
    expect(screen.queryByText(/Sikanderpur/)).not.toBeInTheDocument();
  });

  it("'Set up my commute' → /setup and 'Later' → / (never a one-way trap)", async () => {
    vi.stubGlobal("fetch", mockFetch("Hauz Khas ↔ DLF Cyber Hub"));
    render(<CorridorLivePage />);
    await userEvent.click(screen.getByRole("button", { name: "Set up my commute" }));
    expect(push).toHaveBeenCalledWith("/setup");
    await userEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
