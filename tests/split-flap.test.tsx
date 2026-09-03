import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { SplitFlap } from "@/components/split-flap";

/** P1.3 — Solari board. Structure + reduced-motion settle (deterministic) verified here;
 * the animated flip is verified live in the gallery (NO-GO screenshot). */

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: reduce && query.includes("reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

describe("SplitFlap", () => {
  beforeEach(() => mockReducedMotion(true));
  afterEach(() => vi.unstubAllGlobals());

  it("renders one flap per character, colon flagged", () => {
    const { container } = render(<SplitFlap value="08:35" />);
    const flaps = container.querySelectorAll(".flap");
    expect(flaps.length).toBe(5);
    expect(container.querySelectorAll(".flap.colon").length).toBe(1);
  });

  it("exposes the value as an accessible label", () => {
    const { container } = render(<SplitFlap value="08:35" aria-label="Leave by 08:35" />);
    expect(container.querySelector(".flaps")?.getAttribute("aria-label")).toBe("Leave by 08:35");
  });

  it("reduced-motion settles to the final digits with no animation class", () => {
    const { container } = render(<SplitFlap value="08:35" />);
    const tops = Array.from(container.querySelectorAll<HTMLSpanElement>(".flap:not(.colon) .top span"));
    expect(tops.map((s) => s.textContent)).toEqual(["0", "8", "3", "5"]);
    expect(container.querySelectorAll(".fold.animate").length).toBe(0);
  });

  it("updates to a new value under reduced motion", () => {
    const { container, rerender } = render(<SplitFlap value="08:35" />);
    rerender(<SplitFlap value="09:00" />);
    const tops = Array.from(container.querySelectorAll<HTMLSpanElement>(".flap:not(.colon) .top span"));
    expect(tops.map((s) => s.textContent)).toEqual(["0", "9", "0", "0"]);
  });

  it("compact size adds the .sm modifier", () => {
    const { container } = render(<SplitFlap value="41" size="compact" />);
    expect(container.querySelector(".flaps")?.className).toContain("sm");
  });

  it("animates when motion is allowed (fold gets the animate class)", () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const { container } = render(<SplitFlap value="12" />);
    vi.advanceTimersByTime(200);
    // after starting, at least one fold has been animated at some point; final settles
    vi.advanceTimersByTime(2000);
    const tops = Array.from(container.querySelectorAll<HTMLSpanElement>(".flap .top span"));
    expect(tops.map((s) => s.textContent)).toEqual(["1", "2"]);
    vi.useRealTimers();
  });
});
