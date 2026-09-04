/**
 * H:MM ⇄ ISO timestamp helpers. Several tables store a time-of-day in a `timestamptz` column
 * (trips.arrive_by, saved_commutes.arrive_by, managed_setups.arrive_by/return_after); the date
 * part is ignored by the UI, which only ever renders "H:MM". Always UTC on both ends so the value
 * round-trips exactly.
 */

export function hmToTimestamp(hm: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setUTCHours(h, min, 0, 0);
  return d.toISOString();
}

export function timestampToHm(ts: string | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
