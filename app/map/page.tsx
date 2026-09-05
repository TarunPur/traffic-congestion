"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { TripMap, type LngLat } from "@/components/trip-map";
import { usePlacesSearch, iconForPlace, isMultiPart, type PlaceResult } from "@/lib/use-places-search";
import { setTrip, useTrip } from "@/lib/trip-state";
import type { PlaceRef } from "@/lib/planner/types";

/**
 * 06 · Set on map (BUILD-SPEC §7·06). A full-bleed map with a floating From/To search panel
 * (same Place index as 04/05) AND draggable origin/dest pins together — the locked
 * 06-setonmap.html mock only shows the search half, but BUILD-SPEC §7·06 calls for both, and
 * the built screen previously had only the drag half (PIXEL-AUDIT.md §06). "See ways to go" is
 * enabled only once both points are set. Confirm → writes trip → /part or /ways.
 */

interface Point {
  name: string;
  lat: number;
  lng: number;
}

const DEFAULT_ORIGIN: Point = { name: "Pinned start", lat: 28.5494, lng: 77.2001 };
const DEFAULT_DEST: Point = { name: "Pinned destination", lat: 28.4949, lng: 77.0889 };

// Extra room top/bottom so a fitted marker never lands under the floating search panel or the
// bottom sheet (matches the locked design's own frame() padding for this screen).
const MAP_FIT_PADDING = { top: 170, bottom: 170, left: 56, right: 56 };

function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

function highlight(name: string, q: string) {
  const query = q.trim();
  if (!query) return name;
  const i = name.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return name;
  return (
    <Fragment>
      {name.slice(0, i)}
      <mark>{name.slice(i, i + query.length)}</mark>
      {name.slice(i + query.length)}
    </Fragment>
  );
}

type Field = "from" | "to" | null;

export default function SetOnMapPage() {
  const router = useRouter();
  const [trip] = useTrip();
  const [origin, setOrigin] = useState<Point | null>(null);
  const [dest, setDest] = useState<Point | null>(null);
  const [destType, setDestType] = useState<PlaceResult["type"] | null>(null);
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [active, setActive] = useState<Field>(null);
  const { results: fromResults } = usePlacesSearch(fromQuery);
  const { results: toResults } = usePlacesSearch(toQuery);

  // Prefill from trip state once it loads client-side (useTrip is empty on first render).
  useEffect(() => {
    if (trip.origin?.lat != null && trip.origin?.lng != null) {
      setOrigin((prev) => prev ?? { name: trip.origin!.name, lat: trip.origin!.lat!, lng: trip.origin!.lng! });
      setFromQuery((prev) => prev || trip.origin!.name);
    }
    if (trip.dest?.lat != null && trip.dest?.lng != null) {
      setDest((prev) => prev ?? { name: trip.dest!.name, lat: trip.dest!.lat!, lng: trip.dest!.lng! });
      setToQuery((prev) => prev || trip.dest!.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.origin, trip.dest]);

  function choose(role: "from" | "to", r: PlaceResult) {
    const point = { name: r.name, lat: r.lat, lng: r.lng };
    if (role === "from") {
      setOrigin(point);
      setFromQuery(r.name);
    } else {
      setDest(point);
      setDestType(r.type);
      setToQuery(r.name);
    }
    setActive(null);
  }

  function swap() {
    setOrigin(dest);
    setDest(origin);
    setDestType(null);
    setFromQuery(toQuery);
    setToQuery(fromQuery);
  }

  function clearFrom() {
    setOrigin(null);
    setFromQuery("");
  }

  function onOriginMove(p: LngLat) {
    setOrigin((prev) => ({ name: prev?.name ?? DEFAULT_ORIGIN.name, ...p }));
  }
  function onDestMove(p: LngLat) {
    setDest((prev) => ({ name: prev?.name ?? DEFAULT_DEST.name, ...p }));
    setDestType(null);
  }

  function confirm() {
    if (!origin || !dest) return;
    const originRef: PlaceRef = { name: origin.name, lat: origin.lat, lng: origin.lng };
    const destRef: PlaceRef = { name: dest.name, lat: dest.lat, lng: dest.lng };
    setTrip({ origin: originRef, dest: destRef });
    router.push(destType && isMultiPart({ type: destType, name: dest.name }) ? "/part" : "/ways");
  }

  const activeResults = active === "from" ? fromResults : active === "to" ? toResults : [];
  const activeQuery = active === "from" ? fromQuery : toQuery;

  let summary: React.ReactNode;
  let ctaLabel: string;
  let ctaDisabled: boolean;
  if (origin && dest) {
    const km = haversineKm(origin, dest).toFixed(1);
    summary = (
      <>
        <b>{origin.name}</b> → <b>{dest.name}</b> · {km} km as the crow flies
      </>
    );
    ctaLabel = "See ways to go";
    ctaDisabled = false;
  } else if (origin || dest) {
    const p = origin ?? dest!;
    summary = origin ? (
      <>
        Start set — <b>{p.name}</b>. Now add where you&rsquo;re headed.
      </>
    ) : (
      <>
        Destination set — <b>{p.name}</b>. Now add your start.
      </>
    );
    ctaLabel = "Add both points";
    ctaDisabled = true;
  } else {
    summary = "Pick a start and a destination to preview the way.";
    ctaLabel = "See ways to go";
    ctaDisabled = true;
  }

  return (
    <AppShell
      scrollClassName="!px-0 !overflow-hidden"
      foot={
        <div className="sheet">
          <div className="sumrow">
            <div className="sum">{summary}</div>
          </div>
          <button className="cta" type="button" disabled={ctaDisabled} onClick={confirm}>
            {ctaLabel}
          </button>
        </div>
      }
    >
      <div className="mapscreen">
        <TripMap
          origin={origin}
          dest={dest}
          draggable
          interactive
          center={[(origin ?? DEFAULT_ORIGIN).lng, (origin ?? DEFAULT_ORIGIN).lat]}
          zoom={11}
          onOriginMove={onOriginMove}
          onDestMove={onDestMove}
          fitPadding={MAP_FIT_PADDING}
          className="absolute inset-0"
          style={{ height: "100%" }}
          ariaLabel="Set your start and destination on the map"
        />
      </div>

      <div className="panel">
        <div className="prow">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/from")}>
            <Icon name="back" size={22} />
          </button>
          <div className="fields">
            <div className="spine" />
            <div className="fieldrow">
              <span className="end">
                <span className="endA" title="Start" />
              </span>
              <input
                type="text"
                placeholder="From — home or start"
                aria-label="From"
                value={fromQuery}
                onFocus={() => setActive("from")}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setActive("from");
                }}
              />
              {fromQuery ? (
                <button className="clr" type="button" aria-label="Clear from" onClick={clearFrom}>
                  <Icon name="close" size={15} />
                </button>
              ) : null}
            </div>
            <div className="fieldrow">
              <span className="end endB">
                <Icon name="pin" size={15} />
              </span>
              <input
                type="text"
                placeholder="Where to — work or destination"
                aria-label="Where to"
                value={toQuery}
                onFocus={() => setActive("to")}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setActive("to");
                }}
              />
              <button className="swap" type="button" aria-label="Swap" onClick={swap}>
                <Icon name="swap" size={16} />
              </button>
            </div>
          </div>
        </div>

        {active ? (
          <div className="suggest">
            {activeResults.length === 0 ? (
              <div className="sug" aria-disabled>
                No matches.
              </div>
            ) : (
              activeResults.map((r) => (
                <button
                  key={r.id}
                  className="sug"
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(active, r);
                  }}
                >
                  <span className="ic">
                    <Icon name={iconForPlace(r)} size={18} />
                  </span>
                  <span className="nm">{highlight(r.name, activeQuery)}</span>
                  <span className="ty">{r.type.replace("_", " ")}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="disclaimer">
        <span>Public-feed estimate. First/last-mile guidance only.</span>
      </div>
    </AppShell>
  );
}
