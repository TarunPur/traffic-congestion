import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon, ICON_NAMES, type IconName } from "@/components/icon";

/**
 * P1.1 — typed <Icon> ported from CL.icon() (clearline.js). Stroke SVG, weight 1.6, 24 viewBox.
 * ERD §2: never emoji, never unicode glyph icons.
 */
describe("Icon", () => {
  it("renders an svg with the ported stroke spec", () => {
    const { container } = render(<Icon name="back" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("stroke-width")).toBe("1.6");
    expect(svg?.getAttribute("fill")).toBe("none");
  });

  it("defaults to size 20 and honours the size prop (16/20/24 grid)", () => {
    const { container: c20 } = render(<Icon name="search" />);
    expect(c20.querySelector("svg")?.getAttribute("width")).toBe("20");
    const { container: c24 } = render(<Icon name="pin" size={24} />);
    const svg = c24.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
  });

  it("every named icon renders non-empty stroke geometry", () => {
    for (const name of ICON_NAMES) {
      const { container } = render(<Icon name={name as IconName} />);
      const svg = container.querySelector("svg");
      expect(svg, name).not.toBeNull();
      // at least one path/circle/rect child
      expect(svg?.querySelector("path, circle, rect"), name).not.toBeNull();
    }
  });

  it("contains no emoji or unicode glyph icons anywhere (ERD §2)", () => {
    for (const name of ICON_NAMES) {
      const { container } = render(<Icon name={name as IconName} />);
      const html = container.innerHTML;
      // no characters outside the BMP ASCII/markup range → no emoji
      expect(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html), name).toBe(false);
    }
  });

  it("applies an accessible label when given, else is aria-hidden", () => {
    const { container: labelled } = render(<Icon name="home" label="Home" />);
    const svg = labelled.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Home");

    const { container: decorative } = render(<Icon name="home" />);
    expect(decorative.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
