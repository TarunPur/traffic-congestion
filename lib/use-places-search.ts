"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { IconName } from "@/components/icon";

/**
 * Debounced type-ahead over the public `places` table (screens 04/05). ~150ms debounce
 * (BUILD-SPEC §7·04). Empty query returns the seeded suggestions (recent/saved surrogate),
 * never a blank list.
 */

export interface PlaceResult {
  id: string;
  name: string;
  subLabel: string | null;
  type: "area" | "metro" | "bus_stop" | "office_hub" | "landmark";
  lat: number;
  lng: number;
}

const ICON_BY_TYPE: Record<PlaceResult["type"], IconName> = {
  area: "pin",
  metro: "metro",
  bus_stop: "bus",
  office_hub: "work",
  landmark: "pin",
};

export function iconForPlace(p: PlaceResult): IconName {
  return ICON_BY_TYPE[p.type];
}

export function usePlacesSearch(query: string, debounceMs = 150) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = useRef(createClient());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      let req = supabase.current.from("places").select("id,name,sub_label,type,lat,lng").limit(6);
      const q = query.trim();
      if (q.length > 0) req = req.ilike("name", `%${q}%`);
      const { data } = await req;
      if (cancelled) return;
      setResults(
        (data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          subLabel: r.sub_label,
          type: r.type as PlaceResult["type"],
          lat: r.lat,
          lng: r.lng,
        })),
      );
      setLoading(false);
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, debounceMs]);

  return { results, loading };
}
