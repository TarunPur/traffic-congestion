"use client";

import { useEffect, useRef } from "react";
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
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const DELHI: [number, number] = [77.209, 28.6139];

export function TripMap({
  origin,
  dest,
  route,
  center = DELHI,
  zoom = 11,
  interactive = true,
  className = "",
  style,
  ariaLabel = "Trip map",
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const originMarker = useRef<MlMarker | null>(null);
  const destMarker = useRef<MlMarker | null>(null);
  const routeReady = useRef(false);

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
        syncData();
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

  // Sync markers + route whenever the props change.
  const syncData = () => {
    void syncMarkersAndRoute();
  };

  async function syncMarkersAndRoute() {
    const map = mapRef.current;
    if (!map) return;
    const maplibregl = (await import("maplibre-gl")).default;

    if (origin) {
      if (originMarker.current) originMarker.current.setLngLat([origin.lng, origin.lat]);
      else
        originMarker.current = new maplibregl.Marker({ element: createMarkerElement("origin"), anchor: "center" })
          .setLngLat([origin.lng, origin.lat])
          .addTo(map);
    } else if (originMarker.current) {
      originMarker.current.remove();
      originMarker.current = null;
    }

    if (dest) {
      if (destMarker.current) destMarker.current.setLngLat([dest.lng, dest.lat]);
      else
        destMarker.current = new maplibregl.Marker({ element: createMarkerElement("dest"), anchor: "bottom" })
          .setLngLat([dest.lng, dest.lat])
          .addTo(map);
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

    if (origin && dest) {
      map.fitBounds(
        new maplibregl.LngLatBounds([origin.lng, origin.lat], [dest.lng, dest.lat]),
        { padding: 64, duration: 600, maxZoom: 14 },
      );
    }
  }

  useEffect(() => {
    void syncMarkersAndRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lng, origin?.lat, dest?.lng, dest?.lat, route]);

  return (
    <div className={`trip-map ${className}`.trim()} style={style} role="img" aria-label={ariaLabel}>
      <div ref={containerRef} className="map" />
      <span className="maptint" aria-hidden />
    </div>
  );
}
