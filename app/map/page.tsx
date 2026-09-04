"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { TripMap, type LngLat } from "@/components/trip-map";
import { getTrip, setTrip } from "@/lib/trip-state";

/**
 * 06 · Set on map (BUILD-SPEC §7·06). Draggable origin + dest pins; enable when both placed.
 * Prefills from trip if set, else sensible Delhi defaults to drag. Confirm → writes trip → /ways.
 * MapLibre only composites in a real browser tab (documented); verify there.
 */

const DEFAULT_ORIGIN: LngLat = { lng: 77.2065, lat: 28.5494 }; // Hauz Khas Enclave
const DEFAULT_DEST: LngLat = { lng: 77.0889, lat: 28.4949 }; // DLF Cyber Hub

export default function SetOnMapPage() {
  const router = useRouter();
  const trip = useMemo(() => getTrip(), []);
  const [origin, setOrigin] = useState<LngLat>(
    trip.origin?.lat != null && trip.origin?.lng != null
      ? { lat: trip.origin.lat, lng: trip.origin.lng }
      : DEFAULT_ORIGIN,
  );
  const [dest, setDest] = useState<LngLat>(
    trip.dest?.lat != null && trip.dest?.lng != null
      ? { lat: trip.dest.lat, lng: trip.dest.lng }
      : DEFAULT_DEST,
  );

  function confirm() {
    setTrip({
      origin: { name: trip.origin?.name ?? "Pinned start", lat: origin.lat, lng: origin.lng },
      dest: { name: trip.dest?.name ?? "Pinned destination", lat: dest.lat, lng: dest.lng },
    });
    router.push("/ways");
  }

  return (
    <AppShell
      scrollClassName="!px-0 !overflow-hidden flex flex-col"
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            Drag the pins to fine-tune · map from Delhi open data
          </div>
          <Cta onClick={confirm}>Confirm points</Cta>
        </>
      }
    >
      <div style={{ padding: "0 var(--m)" }}>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/from")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Set on map</span>
        </div>
        <h1 className="h1">Drop your pins</h1>
        <div className="said">Drag the ring (start) and the teardrop (destination) to the exact spots.</div>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 320, borderTop: "1px solid var(--hair)", marginTop: 16 }}>
        <TripMap
          origin={origin}
          dest={dest}
          draggable
          autoFit={false}
          interactive
          center={[(origin.lng + dest.lng) / 2, (origin.lat + dest.lat) / 2]}
          zoom={11}
          onOriginMove={setOrigin}
          onDestMove={setDest}
          className="absolute inset-0"
          style={{ height: "100%" }}
          ariaLabel="Drag origin and destination pins"
        />
      </div>
    </AppShell>
  );
}
