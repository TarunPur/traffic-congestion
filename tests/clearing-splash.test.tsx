import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClearingSplash } from "@/components/clearing-splash";

/** P1.5 — brand animation. Reduced-motion settle (deterministic) verified here; the live
 * animation is verified in the gallery (NO-GO screenshot). */

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

describe("ClearingSplash", () => {
  afterEach(() => vi.unstubAllGlobals());

  describe("reduced motion", () => {
    beforeEach(() => mockReducedMotion(true));

    it("renders 9 strands + a node and the wordmark/tagline", () => {
      const { container } = render(<ClearingSplash />);
      expect(container.querySelectorAll(".mark path").length).toBe(9);
      expect(container.querySelectorAll(".mark circle.node").length).toBe(1);
      expect(screen.getByText("Clearline")).toBeInTheDocument();
      expect(screen.getByText("Your commute, confirmed.")).toBeInTheDocument();
    });

    it("settles instantly: wordmark + tagline shown, node at the end, never blank", () => {
      const { container } = render(<ClearingSplash />);
      expect(container.querySelector(".wordmark")?.className).toContain("in");
      expect(container.querySelector(".tagline")?.className).toContain("in");
      expect(container.querySelector(".mark circle.node")?.getAttribute("cx")).toBe("314");
      // strand 0 survives (opacity 1), others hidden
      const paths = Array.from(container.querySelectorAll<SVGPathElement>(".mark path"));
      expect(paths[0]!.style.opacity).toBe("1");
      expect(paths[1]!.style.opacity).toBe("0");
    });

    it("fires onDone immediately under reduced motion", () => {
      const onDone = vi.fn();
      render(<ClearingSplash onDone={onDone} />);
      expect(onDone).toHaveBeenCalledOnce();
    });

    it("accepts a custom word + tagline", () => {
      render(<ClearingSplash word="Clearline" tagline="Run it for me" />);
      expect(screen.getByText("Run it for me")).toBeInTheDocument();
    });
  });

  it("does not settle instantly when motion is allowed (animation pending)", () => {
    mockReducedMotion(false);
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("performance", { now: () => 0 });
    const { container } = render(<ClearingSplash />);
    // before any frame runs, the wordmark has not resolved yet
    expect(container.querySelector(".wordmark")?.className).not.toContain("in");
  });
});
