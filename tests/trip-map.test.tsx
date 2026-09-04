import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { createMarkerElement } from "@/lib/map-markers";

/** P1.6 — TripMap. The pure marker factory is unit-tested; the map itself (WebGL) is verified
 * live in a real browser (NO-GO). maplibre-gl is mocked here so the component renders in jsdom. */

vi.mock("maplibre-gl", () => {
  class FakeMap {
    on() {}
    addControl() {}
    addSource() {}
    addLayer() {}
    getSource() {
      return { setData() {} };
    }
    fitBounds() {}
    resize() {}
    triggerRepaint() {}
    remove() {}
  }
  class FakeMarker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  return {
    default: {
      Map: FakeMap,
      Marker: FakeMarker,
      AttributionControl: class {},
      NavigationControl: class {},
      LngLatBounds: class {},
    },
  };
});

describe("createMarkerElement", () => {
  it("origin is a ring", () => {
    const el = createMarkerElement("origin");
    expect(el.className).toBe("mk mk-origin");
    expect(el.querySelector(".ring")).not.toBeNull();
    expect(el.querySelector("svg")).toBeNull();
  });

  it("dest is an ink teardrop svg (ink fill, paper stroke)", () => {
    const el = createMarkerElement("dest");
    expect(el.className).toBe("mk mk-dest");
    const svg = el.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("fill")).toBe("#1b1a16");
    expect(svg?.getAttribute("stroke")).toBe("#efece2");
  });
});

describe("TripMap", () => {
  it("renders the duotone map container + paper tint overlay", async () => {
    const { TripMap } = await import("@/components/trip-map");
    const { container } = render(<TripMap origin={{ lng: 77.2, lat: 28.5 }} dest={{ lng: 77.09, lat: 28.49 }} />);
    expect(container.querySelector(".trip-map")).not.toBeNull();
    expect(container.querySelector(".trip-map .map")).not.toBeNull();
    expect(container.querySelector(".trip-map .maptint")).not.toBeNull();
  });
});
