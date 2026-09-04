import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back }) }));

function mkFetch() {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ url: String(url), method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (String(url).includes("/api/profile")) {
      return { ok: true, json: async () => ({ fields: { home: null, work: null } }) } as Response;
    }
    if (String(url).includes("/api/managed") && method === "GET") {
      return { ok: true, json: async () => ({ setup: null, plan: null }) } as Response;
    }
    return { ok: true, json: async () => ({ setupId: "s1" }) } as Response;
  });
  return { fn, calls };
}

import SetupPage from "@/app/setup/page";

describe("19 Managed setup", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows home/tower, two steppers and Mon–Fri all selected", async () => {
    const { fn } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<SetupPage />);
    expect(screen.getByLabelText("Home area")).toBeInTheDocument();
    expect(screen.getByLabelText("Tower")).toBeInTheDocument();
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      expect(screen.getByRole("button", { name: d })).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("stepping arrival changes the displayed time", async () => {
    const { fn } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<SetupPage />);
    expect(screen.getByText("9:30")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Later arrival" }));
    expect(screen.getByText("9:45")).toBeInTheDocument();
  });

  it("disables Generate with no days, else POSTs and goes to /itinerary", async () => {
    const { fn, calls } = mkFetch();
    vi.stubGlobal("fetch", fn);
    render(<SetupPage />);
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      await userEvent.click(screen.getByRole("button", { name: d }));
    }
    expect(screen.getByRole("button", { name: "Generate my plan" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Wed" })); // re-select one
    await userEvent.click(screen.getByRole("button", { name: "Generate my plan" }));
    await waitFor(() =>
      expect(calls.some((c) => c.url.includes("/api/managed") && c.method === "POST")).toBe(true),
    );
    const post = calls.find((c) => c.method === "POST")!;
    expect((post.body as { days: string[] }).days).toEqual(["Wed"]);
    expect(push).toHaveBeenCalledWith("/itinerary");
  });
});
