import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AppShell } from "@/components/app-shell";

/**
 * P0.6 — the real mobile shell (no prototype 412×812 device frame).
 * Column at 100dvh, content max-w 480 centred on paper, scroll region, sticky foot
 * honouring the safe-area inset. Verified structurally here; responsive/installable
 * behaviour is verified live in Chrome + the manifest assertions below.
 */
describe("AppShell", () => {
  it("renders children in the scroll region", () => {
    render(
      <AppShell>
        <p>hello commute</p>
      </AppShell>,
    );
    expect(screen.getByText("hello commute")).toBeInTheDocument();
  });

  it("renders a foot slot when provided, pinned outside the scroll region", () => {
    render(
      <AppShell foot={<button>CONTINUE</button>}>
        <p>body</p>
      </AppShell>,
    );
    const foot = screen.getByTestId("app-foot");
    expect(foot).toBeInTheDocument();
    expect(foot).toContainElement(screen.getByRole("button", { name: "CONTINUE" }));
    // Foot is a sibling of the scroll region, not nested inside it.
    const scroll = screen.getByTestId("app-scroll");
    expect(scroll).not.toContainElement(foot);
  });

  it("omits the foot element entirely when no foot is given", () => {
    render(
      <AppShell>
        <p>body</p>
      </AppShell>,
    );
    expect(screen.queryByTestId("app-foot")).not.toBeInTheDocument();
  });

  it("constrains the frame to a centred max-width column (never desktop-stretch)", () => {
    render(
      <AppShell>
        <p>body</p>
      </AppShell>,
    );
    const frame = screen.getByTestId("app-frame");
    expect(frame.className).toMatch(/max-w-\[480px\]/);
    expect(frame.className).toMatch(/mx-auto/);
  });
});

describe("PWA manifest", () => {
  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), "public/manifest.webmanifest"), "utf8"),
  ) as Record<string, unknown>;

  it("declares an installable standalone app on the paper ground", () => {
    expect(manifest.name).toBe("Clearline");
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBe("#efece2");
    expect(manifest.theme_color).toBe("#efece2");
    expect(manifest.start_url).toBe("/");
  });

  it("ships at least one icon", () => {
    const icons = manifest.icons as Array<Record<string, unknown>>;
    expect(Array.isArray(icons)).toBe(true);
    expect(icons.length).toBeGreaterThan(0);
  });
});
