import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// CorridorPage's mount effect is keyed on [router]; the real useRouter() returns a
// stable ref, so mock it that way too. A fresh {push,replace} per call would re-fire
// the effect on every re-render and leak a late /api/corridor fetch past afterEach's
// unstub (undici then rejects the relative URL — flaked CI on Node 22).
const nav = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();
  return { push, replace, router: { push, replace } };
});
vi.mock("next/navigation", () => ({ useRouter: () => nav.router }));
const { push, replace } = nav;
vi.mock("@/components/duotone", () => ({ Duotone: () => <div data-testid="duotone" /> }));

function mockFetch(corridor: Record<string, unknown>, commitResult?: Record<string, unknown>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/api/corridor")) {
      return { ok: true, json: async () => corridor } as Response;
    }
    if (u.includes("/api/commit")) {
      return { ok: true, json: async () => commitResult ?? {} } as Response;
    }
    throw new Error(`unexpected ${u}`);
  });
}

import CorridorPage from "@/app/corridor/page";

const BASE = { id: "c1", name: "Sikanderpur → DLF Cyber City", threshold: 250, committedCount: 12, status: "waitlisted", committed: false };

describe("17 Corridor & waitlist", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the real committed count / threshold and the what-you-get rows", async () => {
    vi.stubGlobal("fetch", mockFetch(BASE));
    render(<CorridorPage />);
    expect(await screen.findByText(/\/ 250 committed/)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Door-to-door, arranged for you")).toBeInTheDocument();
  });

  it("Commit my seat POSTs and restates the waitlist state", async () => {
    vi.stubGlobal("fetch", mockFetch(BASE, { committedCount: 13, threshold: 250, status: "waitlisted" }));
    render(<CorridorPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Commit my seat" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /You’re on the waitlist/ })).toBeInTheDocument());
  });

  it("an already-open corridor forwards straight to 18", async () => {
    vi.stubGlobal("fetch", mockFetch({ ...BASE, status: "open" }));
    render(<CorridorPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/corridor-live"));
  });
});
