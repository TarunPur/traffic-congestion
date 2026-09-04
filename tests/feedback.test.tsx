import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back }) }));

import FeedbackPage from "@/app/feedback/page";

describe("15 Feedback", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("disables Send until a rating is chosen, then shows 'N · word'", async () => {
    render(<FeedbackPage />);
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Rate 4 out of 5 — Good" }));
    expect(screen.getByText("4 · Good")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send feedback" })).toBeEnabled();
  });

  it("POSTs the rating + note and returns home", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({ ok: true }) }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<FeedbackPage />);
    await userEvent.click(screen.getByRole("button", { name: "Rate 2 out of 5 — Stressful" }));
    await userEvent.type(screen.getByLabelText(/Anything to add/i), "bus never came");
    await userEvent.click(screen.getByRole("button", { name: /Send feedback|Thanks — noted/ }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body));
    expect(body).toEqual({ rating: 2, note: "bus never came" });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"), { timeout: 2000 });
  });

  it("back uses history", async () => {
    render(<FeedbackPage />);
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(back).toHaveBeenCalled();
  });
});
