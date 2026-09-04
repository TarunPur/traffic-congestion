import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import SupportPage from "@/app/support/page";

describe("12 Support", () => {
  beforeEach(() => push.mockClear());

  it("shows the four honesty FAQ questions", () => {
    render(<SupportPage />);
    expect(screen.getByText(/Why is a time sometimes wrong\?/)).toBeInTheDocument();
    expect(screen.getByText(/Why is there no live metro\?/)).toBeInTheDocument();
    expect(screen.getByText(/What does "you arrange this" mean\?/)).toBeInTheDocument();
    expect(screen.getByText(/Is my data private\?/)).toBeInTheDocument();
  });

  it("is single-open — opening one collapses the previous", async () => {
    render(<SupportPage />);
    const q1 = screen.getByRole("button", { name: /Why is a time sometimes wrong/ });
    const q2 = screen.getByRole("button", { name: /Why is there no live metro/ });
    await userEvent.click(q1);
    expect(q1).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(q2);
    expect(q1).toHaveAttribute("aria-expanded", "false");
    expect(q2).toHaveAttribute("aria-expanded", "true");
  });

  it("'Rate your commute' routes to /feedback and back to /", async () => {
    render(<SupportPage />);
    await userEvent.click(screen.getByRole("button", { name: /Rate your commute/ }));
    expect(push).toHaveBeenCalledWith("/feedback");
    await userEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
