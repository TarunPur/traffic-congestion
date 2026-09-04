import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mockFetch(fields: Record<string, string | null>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/api/profile") && (!init || init.method === undefined || init.method === "GET")) {
      return { ok: true, json: async () => ({ fields }) } as Response;
    }
    if (u.includes("/api/profile") && init?.method === "PUT") {
      const body = JSON.parse(String(init.body)) as { key: string; value: string };
      return { ok: true, json: async () => ({ ok: true, ...body }) } as Response;
    }
    if (u.includes("/api/commute")) {
      return { ok: true, json: async () => ({ commutes: [] }) } as Response;
    }
    throw new Error(`unexpected ${u}`);
  });
}

import ProfilePage from "@/app/profile/page";

const EMPTY = { home: null, work: null, arrival: null, return: null, preferred_mode: null };

describe("11 Profile", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("lists the five progressive-profile rows, all 'Not set' when empty", async () => {
    vi.stubGlobal("fetch", mockFetch(EMPTY));
    render(<ProfilePage />);
    expect(await screen.findByText("Home area")).toBeInTheDocument();
    expect(screen.getByText("Work location")).toBeInTheDocument();
    expect(screen.getByText("Usual arrival")).toBeInTheDocument();
    expect(screen.getByText("Return after")).toBeInTheDocument();
    expect(screen.getByText("Preferred mode")).toBeInTheDocument();
    expect(screen.getAllByText("Not set").length).toBe(5);
  });

  it("edits a field inline and PUTs it, then shows the new value", async () => {
    const fetchMock = mockFetch(EMPTY);
    vi.stubGlobal("fetch", fetchMock);
    render(<ProfilePage />);
    await userEvent.click(await screen.findByRole("button", { name: /Home area/ }));
    const input = await screen.findByLabelText(/Set Home area/i);
    await userEvent.type(input, "Hauz Khas Enclave");
    await userEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(await screen.findByText("Hauz Khas Enclave")).toBeInTheDocument();
  });

  it("back returns to home", async () => {
    vi.stubGlobal("fetch", mockFetch(EMPTY));
    render(<ProfilePage />);
    await userEvent.click(await screen.findByRole("button", { name: /Back/i }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
