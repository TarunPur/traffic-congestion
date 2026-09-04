import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/duotone", () => ({ Duotone: () => <div data-testid="duotone" /> }));

import WhichPartPage from "@/app/part/page";

/**
 * Regression for the CSS-selector bug (PIXEL-AUDIT.md §07): the lead paragraph reused the shared
 * `.said` class, which is scoped `.h1 + .said` in app/globals.css — it only applies right after
 * an `.h1` sibling, and this screen has no `.h1`, so the text rendered unstyled (larger/darker
 * than intended). It now gets its own `.lead` class, ported from the locked design.
 */
describe("07 Which part", () => {
  beforeEach(() => push.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("styles the lead paragraph with its own class, not the .h1-scoped .said class it can never match here", () => {
    render(<WhichPartPage />);
    const lead = screen.getByText(/large place\. Which entrance or building/);
    expect(lead).toHaveClass("lead");
    expect(lead).not.toHaveClass("said");
  });

  it("still lets you pick a part and confirm", async () => {
    render(<WhichPartPage />);
    await userEvent.click(screen.getByRole("radio", { name: /Building 8 & 9/ }));
    await userEvent.click(screen.getByRole("button", { name: /Confirm building/ }));
    expect(push).toHaveBeenCalledWith("/ways");
  });
});

describe("07 .lead CSS — byte fidelity to the locked design", () => {
  const appCss = readFileSync(resolve(__dirname, "../app/globals.css"), "utf8");

  it("matches the locked 07-whichpart.html's .lead rule exactly", () => {
    // Locked: .lead{ font-family:var(--grot); font-size:13px; color:var(--grey); margin-top:20px; line-height:1.5 }
    const rule = /\.lead\s*\{([^}]*)\}/.exec(appCss)?.[1] ?? "";
    expect(rule).toMatch(/font-family:\s*var\(--grot\)/);
    expect(rule).toMatch(/font-size:\s*13px/);
    expect(rule).toMatch(/color:\s*var\(--grey\)/);
    expect(rule).toMatch(/margin-top:\s*20px/);
    expect(rule).toMatch(/line-height:\s*1\.5/);
  });
});
