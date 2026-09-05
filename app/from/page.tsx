"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Icon } from "@/components/icon";
import { TripMap } from "@/components/trip-map";
import { usePlacesSearch, iconForPlace, type PlaceResult } from "@/lib/use-places-search";
import { setTrip } from "@/lib/trip-state";

type LocState = "idle" | "locating" | "denied";

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

export default function WhereFromPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [loc, setLoc] = useState<LocState>("idle");
  const { results } = usePlacesSearch(q);

  // Locked design pre-selects the first result by default (sel=0) so the map always shows a pin
  // and the CTA is ready to go — never a blank/pinless first paint (PIXEL-AUDIT.md §04).
  useEffect(() => {
    if (!selected && results.length > 0) choose(results[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  function choose(r: PlaceResult) {
    setSelected(r);
    setTrip({ origin: { name: r.name, lat: r.lat, lng: r.lng } });
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLoc("denied");
      return;
    }
    setLoc("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here: PlaceResult = {
          id: "current",
          name: "Current location",
          subLabel: "From your device",
          type: "area",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLoc("idle");
        choose(here);
      },
      () => setLoc("denied"),
      { timeout: 8000 },
    );
  }

  return (
    <AppShell
      scrollClassName="!px-0"
      foot={
        <>
          <div className="cap" style={{ fontFamily: "var(--grot)", fontSize: 9.5, color: "var(--grey2)", textAlign: "right", padding: "11px var(--m)" }}>
            Locations from Delhi open map data
          </div>
          <Cta disabled={!selected} onClick={() => router.push("/to")}>
            Set as start
          </Cta>
        </>
      }
    >
      <div style={{ padding: "0 var(--m)" }}>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/choose")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Step 3 of 4</span>
        </div>
        <h1 className="h1">Where do you start?</h1>
        <div className="said">Your home, or wherever today&rsquo;s trip begins.</div>

        <span className="field" style={{ marginTop: 20 }}>
          <Icon name="search" size={18} />
          <input
            type="text"
            value={q}
            placeholder="Search start"
            aria-label="Search start"
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button className="clear" type="button" aria-label="Clear" onClick={() => setQ("")}>
              <Icon name="plus" size={16} className="rotate-45" />
            </button>
          ) : null}
        </span>

        <div className="quick">
          <button type="button" data-state={loc === "denied" ? "denied" : undefined} onClick={useCurrentLocation}>
            <Icon name="locate" size={16} />
            <span>{loc === "locating" ? "Locating…" : loc === "denied" ? "Location unavailable" : "Use current location"}</span>
          </button>
          <button type="button" onClick={() => router.push("/map")}>
            <Icon name="pin" size={16} />
            <span>Set on map</span>
          </button>
        </div>

        <div className="rows" role="listbox" aria-label="Results">
          {results.map((r) => {
            const isSel = selected?.name === r.name;
            return (
              <button
                key={r.id}
                type="button"
                className="rowline"
                role="option"
                aria-selected={isSel}
                onClick={() => choose(r)}
              >
                <span className="ic">
                  <Icon name={iconForPlace(r)} size={19} />
                </span>
                <span className="lines">
                  <span className="nm">{highlight(r.name, q)}</span>
                  {r.subLabel ? <span className="sub">{r.subLabel}</span> : null}
                </span>
                <span className="tick">
                  <Icon name="check" size={20} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative", height: 224, borderTop: "1px solid var(--hair)", marginTop: 18 }}>
        <TripMap
          origin={selected ? { lng: selected.lng, lat: selected.lat } : null}
          interactive={false}
          className="absolute inset-0"
          style={{ height: "100%" }}
          ariaLabel="Selected start on the map"
        />
        <span className="band-eyebrow">On the map</span>
      </div>
    </AppShell>
  );
}
