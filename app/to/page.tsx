"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta } from "@/components/controls";
import { Duotone } from "@/components/duotone";
import { Icon } from "@/components/icon";
import { TripMap } from "@/components/trip-map";
import { usePlacesSearch, iconForPlace, isMultiPart, type PlaceResult } from "@/lib/use-places-search";
import { setTrip, useTrip } from "@/lib/trip-state";
import { ARRIVE_DEFAULT, stepArrive, toHM, to12h } from "@/lib/arrive-by";

// Same duotone crop/treatment as the destination thumbnails elsewhere (design's own "signature
// reuse") — only for the one place we actually have a real licensed photo of (DLF Cyber Hub);
// every other result keeps its plain type icon rather than a fabricated photo.
const DEST_THUMB_CROP = { sxf: 0.18, syf: 0.1, swf: 0.5, shf: 0.52 };
const DEST_THUMB_OPTIONS = { contrast: 1.9, max: 0.9 };
function hasRealPhoto(name: string): boolean {
  return name === "DLF Cyber Hub";
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

export default function WhereToPage() {
  const router = useRouter();
  const [trip] = useTrip();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [arrive, setArrive] = useState(ARRIVE_DEFAULT);
  const { results } = usePlacesSearch(q);
  const t12 = to12h(arrive);

  function choose(r: PlaceResult) {
    setSelected(r);
  }

  function onContinue() {
    if (!selected) return;
    setTrip({
      dest: { name: selected.name, lat: selected.lat, lng: selected.lng },
      arriveBy: toHM(arrive),
    });
    router.push(isMultiPart(selected) ? "/part" : "/ways");
  }

  return (
    <AppShell
      scrollClassName="!px-0"
      foot={
        <>
          <div className="arrivebar">
            <div className="ab-main">
              <span className="ab-eyebrow">Arrive by</span>
              <div className="ab-time" aria-live="polite">
                {t12.t}
                <span className="mer">{t12.mer}</span>
              </div>
            </div>
            <div className="ab-steps">
              <button className="ab-step" type="button" aria-label="15 minutes earlier" onClick={() => setArrive((m) => stepArrive(m, -1))}>
                −15
              </button>
              <button className="ab-step" type="button" aria-label="15 minutes later" onClick={() => setArrive((m) => stepArrive(m, 1))}>
                +15
              </button>
            </div>
          </div>
          <Cta disabled={!selected} onClick={onContinue}>
            Set as destination
          </Cta>
        </>
      }
    >
      <div style={{ padding: "0 var(--m)" }}>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/from")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Step 4 of 4</span>
        </div>
        <h1 className="h1">Where are you headed?</h1>
        <div className="said">
          {trip.origin?.name ? `From ${trip.origin.name}. ` : ""}Your office, or today&rsquo;s destination.
        </div>

        <span className="field" style={{ marginTop: 20 }}>
          <Icon name="search" size={18} />
          <input
            type="text"
            value={q}
            placeholder="Search destination"
            aria-label="Search destination"
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button className="clear" type="button" aria-label="Clear" onClick={() => setQ("")}>
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </span>

        <div className="rows" role="listbox" aria-label="Results">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`rowline${hasRealPhoto(r.name) ? " hasthumb" : ""}`}
              role="option"
              aria-selected={selected?.name === r.name}
              onClick={() => choose(r)}
            >
              {hasRealPhoto(r.name) ? (
                <span className="thumb">
                  <Duotone
                    src="/img/dlf-cyberhub.jpg"
                    alt={r.name}
                    canvasWidth={120}
                    canvasHeight={120}
                    crop={DEST_THUMB_CROP}
                    options={DEST_THUMB_OPTIONS}
                    vignette={false}
                  />
                </span>
              ) : (
                <span className="ic">
                  <Icon name={iconForPlace(r)} size={19} />
                </span>
              )}
              <span className="lines">
                <span className="nm">{highlight(r.name, q)}</span>
                {r.subLabel ? <span className="sub">{r.subLabel}</span> : null}
              </span>
              <span className="tick">
                <Icon name="check" size={20} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", height: 178, borderTop: "1px solid var(--hair)", marginTop: 18 }}>
        <TripMap
          dest={selected ? { lng: selected.lng, lat: selected.lat } : null}
          interactive={false}
          className="absolute inset-0"
          style={{ height: "100%" }}
          ariaLabel="Selected destination on the map"
        />
        <span className="band-eyebrow">On the map</span>
      </div>
    </AppShell>
  );
}
