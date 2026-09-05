import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import ChoosePage from "@/app/choose/page";

describe("03 Choose service", () => {
  beforeEach(() => {
    push.mockClear();
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it("defaults to Free and routes to /from", async () => {
    render(<ChoosePage />);
    const free = screen.getByRole("radio", { name: /plan it myself/i });
    expect(free).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(push).toHaveBeenCalledWith("/from");
  });

  it("Managed changes the CTA to waitlist and routes to /eligibility", async () => {
    render(<ChoosePage />);
    await userEvent.click(screen.getByRole("radio", { name: /Clearline manages it/i }));
    const cta = screen.getByRole("button", { name: "Join the waitlist" });
    expect(cta).toBeInTheDocument();
    await userEvent.click(cta);
    expect(push).toHaveBeenCalledWith("/eligibility");
  });

  it("keeps the uncovered-corridor honesty line", () => {
    render(<ChoosePage />);
    expect(screen.getByText(/Available only on covered corridors/i)).toBeInTheDocument();
  });

  it("has a back button and the 'Choose service' running label (PIXEL-AUDIT.md §03)", async () => {
    render(<ChoosePage />);
    expect(screen.getByText("Choose service")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
