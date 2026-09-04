import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back }) }));

function mockFetch(postResult: { status?: number; partnered?: boolean }) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/api/eligibility") && (init?.method ?? "GET") === "GET") {
      return { ok: true, json: async () => ({ eligibility: null }) } as Response;
    }
    if (u.includes("/api/eligibility") && init?.method === "POST") {
      const status = postResult.status ?? 200;
      return {
        ok: status < 400,
        status,
        json: async () => (status >= 400 ? { error: "invalid_email" } : { partnered: postResult.partnered }),
      } as Response;
    }
    throw new Error(`unexpected ${u}`);
  });
}

import EligibilityPage from "@/app/eligibility/page";

describe("17a Eligibility", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("states both outcomes and takes the four fields", () => {
    vi.stubGlobal("fetch", mockFetch({}));
    render(<EligibilityPage />);
    expect(screen.getByText("Your employer has partnered")).toBeInTheDocument();
    expect(screen.getByText("Not yet a partner")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Employee ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).toBeInTheDocument();
  });

  it("a partnered result routes to /setup", async () => {
    vi.stubGlobal("fetch", mockFetch({ partnered: true }));
    render(<EligibilityPage />);
    await userEvent.type(screen.getByLabelText("Work email"), "aarav@nexusgcc.in");
    await userEvent.click(screen.getByRole("button", { name: /Check my workplace/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/setup"), { timeout: 2000 });
  });

  it("a non-partnered result routes to /corridor (waitlist, not an error)", async () => {
    vi.stubGlobal("fetch", mockFetch({ partnered: false }));
    render(<EligibilityPage />);
    await userEvent.type(screen.getByLabelText("Work email"), "me@gmail.com");
    await userEvent.click(screen.getByRole("button", { name: /Check my workplace/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/corridor"), { timeout: 2000 });
  });

  it("a malformed email shows the accent error line and does not advance", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: 400 }));
    render(<EligibilityPage />);
    await userEvent.type(screen.getByLabelText("Work email"), "nope");
    await userEvent.click(screen.getByRole("button", { name: /Check my workplace/ }));
    expect(await screen.findByText("Enter your work email.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
