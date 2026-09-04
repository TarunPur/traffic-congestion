"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlaceRef } from "@/lib/planner/types";

/**
 * Journey-1 trip state across screens 03–09. Client-side (localStorage) instant state, per
 * BUILD-SPEC §? — plan synthesis (08) hits the network, everything else is local. Home is
 * sensitive: this never leaves the device except as a trip row created server-side at /api/plan.
 */

export type ServiceChoice = "free" | "managed";

export interface TripState {
  service?: ServiceChoice;
  origin?: PlaceRef | null;
  dest?: PlaceRef | null;
  arriveBy?: string | null; // HH:MM
}

const KEY = "cl_trip";

export function getTrip(): TripState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TripState) : {};
  } catch {
    return {};
  }
}

export function setTrip(patch: Partial<TripState>): TripState {
  const next = { ...getTrip(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("cl_trip_change"));
  } catch {
    /* private mode — non-fatal */
  }
  return next;
}

export function clearTrip(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("cl_trip_change"));
  } catch {
    /* ignore */
  }
}

/** Reactive trip state; re-renders on cross-screen changes within the tab. */
export function useTrip(): [TripState, (patch: Partial<TripState>) => void] {
  const [trip, setState] = useState<TripState>({});
  useEffect(() => {
    setState(getTrip());
    const onChange = () => setState(getTrip());
    window.addEventListener("cl_trip_change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("cl_trip_change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const update = useCallback((patch: Partial<TripState>) => setState(setTrip(patch)), []);
  return [trip, update];
}
