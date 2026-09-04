import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import CorridorLivePage from "@/app/corridor-live/page";

describe("18 Corridor is live", () => {
  beforeEach(() => push.mockClear());

  it("announces the activation moment", () => {
    render(<CorridorLivePage />);
    expect(screen.getByText(/Your corridor/)).toBeInTheDocument();
    expect(screen.getByText(/is live\./)).toBeInTheDocument();
  });

  it("'Set up my commute' → /setup and 'Later' → / (never a one-way trap)", async () => {
    render(<CorridorLivePage />);
    await userEvent.click(screen.getByRole("button", { name: "Set up my commute" }));
    expect(push).toHaveBeenCalledWith("/setup");
    await userEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
