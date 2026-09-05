import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect, useState } from "react";
import { act, render } from "@testing-library/react";
import { createMarkerElement } from "@/lib/map-markers";
import type { LngLat } from "@/components/trip-map";

/** P1.6 — TripMap. The pure marker factory is unit-tested; the map itself (WebGL) is verified
 * live in a real browser (NO-GO). maplibre-gl is mocked here so the component renders in jsdom. */

const { addToSpy } = vi.hoisted(() => ({ addToSpy: vi.fn() }));

vi.mock("maplibre-gl", () => {
  class FakeMap {
    private loadCb: (() => void) | null = null;
    on(event: string, cb: () => void) {
      if (event === "load") {
        this.loadCb = cb;
        // A real map's style/tile load resolves on a later tick, never synchronously —
        // this is what makes the origin/dest-arrives-before-load race reproducible.
        setTimeout(() => this.loadCb?.(), 20);
      }
    }
    addControl() {}
    addSource() {}
    addLayer() {}
    getSource() {
      return { setData() {} };
    }
    fitBounds() {}
    easeTo() {}
    resize() {}
    triggerRepaint() {}
    remove() {}
  }
  class FakeMarker {
    setLngLat() {
      return this;
    }
    addTo() {
      addToSpy();
      return this;
    }
    on() {}
    remove() {}
    getLngLat() {
      return { lng: 0, lat: 0 };
    }
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

  describe("marker sync when origin/dest arrive before the map finishes loading", () => {
    beforeEach(() => addToSpy.mockClear());

    it("still adds both markers once the map loads (a screen that prefills origin/dest fast, e.g. 06 Set on map)", async () => {
      const { TripMap } = await import("@/components/trip-map");
      function Wrapper() {
        const [pts, setPts] = useState<{ origin: LngLat | null; dest: LngLat | null }>({
          origin: null,
          dest: null,
        });
        // Mirrors a real prefill effect: origin/dest settle almost immediately after mount,
        // well before the map's simulated 20ms "load" delay above.
        useEffect(() => {
          setPts({ origin: { lng: 77.2, lat: 28.5 }, dest: { lng: 77.09, lat: 28.49 } });
        }, []);
        return <TripMap origin={pts.origin} dest={pts.dest} draggable />;
      }
      render(<Wrapper />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 60));
      });
      expect(addToSpy).toHaveBeenCalledTimes(2);
    });
  });
});
