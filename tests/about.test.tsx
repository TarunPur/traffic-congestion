import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/clearing-splash", () => ({
  ClearingSplash: () => <div data-testid="clearing-splash" />,
}));

import AboutPage from "@/app/about/page";

describe("14 About", () => {
  beforeEach(() => push.mockClear());

  it("shows the data-source matrix with status badges", () => {
    render(<AboutPage />);
    expect(screen.getByText("Buses")).toBeInTheDocument();
    expect(screen.getByText("Metro")).toBeInTheDocument();
    expect(screen.getByText("Platform & gate")).toBeInTheDocument();
    expect(screen.getAllByText(/Scheduled/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Demo only/)).toBeInTheDocument();
  });

  it("keeps the pre-launch no-fabricated-traction line", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/pre-launch — no users, partners or press we don’t have/i),
    ).toBeInTheDocument();
  });

  it("back returns to home", async () => {
    render(<AboutPage />);
    await userEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
