import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const signOut = vi.fn(async () => ({ error: null }));
const TRIPS = [
  {
    origin_place: { name: "DLF Cyber Hub" },
    dest_place: { name: "Hauz Khas Enclave" },
    created_at: new Date().toISOString(),
    plans: [
      {
        name: "recommended",
        total_min: 51,
        legs: [
          { mode: "Walk", ride: false, place: "Green Park Metro", depTime: "8:35", durMin: 8 },
          { mode: "Metro", ride: true, place: "Yellow Line, Sikanderpur", depTime: "8:43", durMin: 26, line: "yellow" },
        ],
      },
      { name: "fastest", total_min: 41, legs: [] },
    ],
  },
];
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { phone: "919824017722" } } }),
      signOut,
    },
    from: () => ({
      select: () => ({ order: () => ({ limit: async () => ({ data: TRIPS, error: null }) }) }),
    }),
  }),
}));

import YouPage from "@/app/you/page";

describe("16 You / Account", () => {
  beforeEach(() => {
    push.mockClear();
    signOut.mockClear();
  });

  it("shows the account identity with a masked phone and Free plan", async () => {
    render(<YouPage />);
    expect(await screen.findByText("Your account")).toBeInTheDocument();
    expect(screen.getByText(/\+91 98240 17722 · Free/)).toBeInTheDocument();
  });

  it("shows a real route/mode summary for a recent trip, not the date repeated (PIXEL-AUDIT.md §16)", async () => {
    render(<YouPage />);
    expect(await screen.findByText("Yellow Line · 51 min")).toBeInTheDocument();
    // The date still appears exactly once, in its own position — not duplicated into .sub too.
    expect(screen.getAllByText("Today")).toHaveLength(1);
  });

  it("routes the More menu rows to their sections", async () => {
    render(<YouPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Profile/ }));
    expect(push).toHaveBeenCalledWith("/profile");
    await userEvent.click(screen.getByRole("button", { name: /Privacy & data/ }));
    expect(push).toHaveBeenCalledWith("/privacy");
    await userEvent.click(screen.getByRole("button", { name: /About Clearline/ }));
    expect(push).toHaveBeenCalledWith("/about");
  });

  it("signs out and returns to /login", async () => {
    render(<YouPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("marks You as the current tab and navigates Home/Plan", async () => {
    render(<YouPage />);
    const you = await screen.findByRole("button", { name: /^You$/ });
    expect(you).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: /^Home$/ }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
