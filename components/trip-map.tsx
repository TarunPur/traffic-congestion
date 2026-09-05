"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import { publicEnv } from "@/lib/env";
import { createMarkerElement } from "@/lib/map-markers";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * TripMap (P1.6) — MapLibre + OpenFreeMap `liberty`, rendered as a monochrome duotone map with
 * a paper-multiply tint. Origin ring / dest teardrop markers, dashed ink route. maplibre-gl is
 * dynamically imported (kept out of the main bundle; only loads where the map is used).
 *
 * Repaint kick: MapLibre renders on rAF, which the browser freezes for a hidden/backgrounded
 * tab, so the canvas can stall blank until looked at. We resize()+triggerRepaint() on
 * visibility/focus/pageshow and on mount — the prototype's fix for that freeze.
 */

export interface LngLat {
  lng: number;
  lat: number;
}

export interface TripMapProps {
  origin?: LngLat | null;
  dest?: LngLat | null;
  /** Route polyline (dashed ink). Coordinates as [lng,lat]. */
  route?: Array<[number, number]>;
  center?: [number, number];
  zoom?: number;
  /** Interaction on/off (off for a static preview). */
  interactive?: boolean;
  /** Make the origin/dest pins draggable (screen 06). */
  draggable?: boolean;
  onOriginMove?: (p: LngLat) => void;
  onDestMove?: (p: LngLat) => void;
  /** Auto fit/center the view to the markers. Off for draggable editing (avoids jumps). */
  autoFit?: boolean;
  /** fitBounds padding (px), per-side. Default is a flat 64px; a screen with its own floating
   * chrome over the map (e.g. a search panel top, a sheet bottom) should pass more room on
   * those sides so a marker never lands underneath them. */
  fitPadding?: { top?: number; bottom?: number; left?: number; right?: number };
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const DELHI: [number, number] = [77.209, 28.6139];
const DEFAULT_PADDING = { top: 64, bottom: 64, left: 64, right: 64 };

export function TripMap({
  origin,
  dest,
  route,
  center = DELHI,
  zoom = 11,
  interactive = true,
  draggable = false,
  onOriginMove,
  onDestMove,
  autoFit = true,
  fitPadding,
  className = "",
  style,
  ariaLabel = "Trip map",
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const originMarker = useRef<MlMarker | null>(null);
  const destMarker = useRef<MlMarker | null>(null);
  const routeReady = useRef(false);
  const onOriginMoveRef = useRef(onOriginMove);
  const onDestMoveRef = useRef(onDestMove);
  onOriginMoveRef.current = onOriginMove;
  onDestMoveRef.current = onDestMove;
  // Flips once the map finishes loading. Without this, a screen whose origin/dest settle
  // right after mount (e.g. prefilled from saved trip state) can have them arrive — and the
  // reactive sync effect below run and no-op on `!map` — entirely before the map itself is
  // ready, with nothing left to re-trigger the sync once it is. Including this in that effect's
  // deps gives it one more, guaranteed-ready chance to run.
  const [mapLoaded, setMapLoaded] = useState(false);

  // Init the map once.
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: publicEnv.mapStyleUrl,
        center,
        zoom,
        interactive,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      if (interactive) {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      }

      const kickMap = () => {
        try {
          map.resize();
          map.triggerRepaint();
        } catch {
          /* map torn down */
        }
      };
      const onVisible = () => {
        if (!document.hidden) kickMap();
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", kickMap);
      window.addEventListener("pageshow", kickMap);
      if (document.visibilityState === "visible") requestAnimationFrame(kickMap);

      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#1b1a16", "line-width": 3, "line-dasharray": [2, 1.6], "line-opacity": 1 },
        });
        routeReady.current = true;
        setMapLoaded(true);
      });

      // store cleanup on the map instance
      (map as unknown as { _clKick?: () => void })._clKick = () => {
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", kickMap);
        window.removeEventListener("pageshow", kickMap);
      };
    })();

    return () => {
      cancelled = true;
      const map = mapRef.current;
      if (map) {
        (map as unknown as { _clKick?: () => void })._clKick?.();
        map.remove();
        mapRef.current = null;
      }
    };
    // Map is created once; data changes flow through the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncMarkersAndRoute() {
    const map = mapRef.current;
    if (!map) return;
    const maplibregl = (await import("maplibre-gl")).default;

    if (origin) {
      if (originMarker.current) originMarker.current.setLngLat([origin.lng, origin.lat]);
      else {
        const m = new maplibregl.Marker({ element: createMarkerElement("origin"), anchor: "center", draggable })
          .setLngLat([origin.lng, origin.lat])
          .addTo(map);
        if (draggable) m.on("dragend", () => onOriginMoveRef.current?.(m.getLngLat()));
        originMarker.current = m;
      }
    } else if (originMarker.current) {
      originMarker.current.remove();
      originMarker.current = null;
    }

    if (dest) {
      if (destMarker.current) destMarker.current.setLngLat([dest.lng, dest.lat]);
      else {
        const m = new maplibregl.Marker({ element: createMarkerElement("dest"), anchor: "bottom", draggable })
          .setLngLat([dest.lng, dest.lat])
          .addTo(map);
        if (draggable) m.on("dragend", () => onDestMoveRef.current?.(m.getLngLat()));
        destMarker.current = m;
      }
    } else if (destMarker.current) {
      destMarker.current.remove();
      destMarker.current = null;
    }

    if (routeReady.current) {
      const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
      const coords: Array<[number, number]> =
        route ?? (origin && dest ? [[origin.lng, origin.lat], [dest.lng, dest.lat]] : []);
      src?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} });
    }

    if (!autoFit) return;
    const padding = { ...DEFAULT_PADDING, ...fitPadding };
    if (origin && dest) {
      map.fitBounds(
        new maplibregl.LngLatBounds([origin.lng, origin.lat], [dest.lng, dest.lat]),
        { padding, duration: 600, maxZoom: 14 },
      );
    } else if (origin) {
      map.easeTo({ center: [origin.lng, origin.lat], zoom: 14.2, duration: 600, offset: [0, -8] });
    } else if (dest) {
      map.easeTo({ center: [dest.lng, dest.lat], zoom: 14.2, duration: 600, offset: [0, -8] });
    }
  }

  useEffect(() => {
    void syncMarkersAndRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, origin?.lng, origin?.lat, dest?.lng, dest?.lat, route]);

  return (
    <div className={`trip-map ${className}`.trim()} style={style} role="img" aria-label={ariaLabel}>
      <div ref={containerRef} className="map" />
      <span className="maptint" aria-hidden />
    </div>
  );
}
