"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { SplitFlap } from "@/components/split-flap";
import { TripMap } from "@/components/trip-map";
import { createClient } from "@/lib/supabase/client";
import type { LiveTrip } from "@/lib/managed-trip";

/**
 * 22 · Live trip (BUILD-SPEC §11·22). TripMap band, split-flap ETA, driver/vehicle, step tracker
 * (done/now/upcoming — "now" heavier ink), held-vehicle line, Share (copy link), Emergency
 * (oxblood — the one sanctioned risk action, paired with copy). Subscribes to Supabase Realtime
 * UPDATEs on `managed_trips` (the real driver feed) and re-reads; also re-reads on a slow interval
 * so the schedule-derived tracker advances without a feed. Contracted legs = committed window.
 */

const O: [number, number] = [77.2001, 28.5494];
const V: [number, number] = [77.2035, 28.546];

export default function TripPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<LiveTrip | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none">("loading");
  const [shared, setShared] = useState(false);
  const [sos, setSos] = useState(false);
  const tripIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/managed/trip");
    if (!res.ok) {
      setState("none");
      return;
    }
    const data = (await res.json()) as LiveTrip;
    setTrip(data);
    tripIdRef.current = data.tripId;
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Realtime: the driver-GPS feed UPDATEs the managed_trips row → re-read.
  useEffect(() => {
    if (!trip?.tripId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-${trip.tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "managed_trips", filter: `id=eq.${trip.tripId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [trip?.tripId, load]);

  async function share() {
    try {
      await navigator.clipboard?.writeText(window.location.href);
    } catch {
      /* clipboard unavailable — the button still confirms intent */
    }
    setShared(true);
    setTimeout(() => setShared(false), 1400);
  }

  if (state === "loading") {
    return (
      <AppShell>
        <p className="home-note">Loading your trip…</p>
      </AppShell>
    );
  }
  if (state === "none" || !trip) {
    return (
      <AppShell>
        <div className="topbar">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/managed")}>
            <Icon name="back" size={22} />
          </button>
          <span className="step">Live trip</span>
        </div>
        <p className="home-note">No trip running right now. Start today&rsquo;s trip from your managed home.</p>
      </AppShell>
    );
  }

  return (
    <AppShell scrollClassName="!px-0">
      <div className="mapband">
        <TripMap
          className="map-abs"
          origin={{ lng: O[0], lat: O[1] }}
          dest={{ lng: V[0], lat: V[1] }}
          route={[V, O]}
          center={[77.2018, 28.5477]}
          zoom={14}
          interactive={false}
          autoFit={false}
        />
        <div className="maptint" />
        <div className="mtop">
          <button className="iconbtn" type="button" aria-label="Back" onClick={() => router.push("/managed")}>
            <Icon name="back" size={22} />
          </button>
          <span className="tl live livepill">
            <span className="dot" />
            Live · updated now
          </span>
        </div>
      </div>

      <div className="tbody">
        <div className="now">
          <div className="k">{trip.legLabel}</div>
          <div className="nowrow">
            <SplitFlap value={String(trip.etaMin)} size="compact" aria-label={`${trip.etaMin} minutes away`} />
            <div className="h">min away</div>
          </div>
        </div>

        <div className="drv">
          <span className="av">
            <Icon name="user" size={22} />
          </span>
          <span className="who">
            <div className="nm">{trip.driver}</div>
            <div className="veh">{trip.vehicle}</div>
          </span>
          <button className="call" type="button" aria-label="Call driver" onClick={() => setSos(false)}>
            <Icon name="phone" size={18} />
          </button>
        </div>
        {trip.placeholder ? (
          <div className="cap2">Driver &amp; vehicle are sample data for the pilot — a real assignment lands with live fulfilment.</div>
        ) : null}

        <div className="track">
          {trip.steps.map((s, i) => (
            <div key={i} className={`tstep ${s.state}`}>
              <span className="dot" />
              <span>
                <span className="nm">{s.label}</span>
                <div className="sub">{s.sub}</div>
              </span>
              <span className="tm">{s.time}</span>
            </div>
          ))}
        </div>
        <div className="held">
          <Icon name="clock" size={15} />
          <span>{trip.heldNote}</span>
        </div>

        <div className="safety">
          <button className="share" type="button" onClick={share}>
            {shared ? "Link copied" : "Share trip"}
          </button>
          <button className="sos" type="button" aria-pressed={sos} onClick={() => setSos(true)}>
            {sos ? "Calling help…" : "Emergency"}
          </button>
        </div>
        {sos ? (
          <div className="err-line">
            For immediate danger call <b>112</b> now. In the pilot, tapping Emergency also flags this
            trip to the Clearline team — live 24/7 dispatch isn&rsquo;t wired yet, so 112 is the fast
            path.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
