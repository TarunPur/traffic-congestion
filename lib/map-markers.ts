/**
 * Marker DOM factory for TripMap — ported from 06-setonmap.html. Monochrome, distinct by form:
 * origin = ink ring, destination = ink teardrop. Pure (takes a document) so it's unit-testable.
 */

export type MarkerKind = "origin" | "dest";

const DEST_SVG =
  '<svg width="26" height="32" viewBox="0 0 24 30" fill="#1b1a16" stroke="#efece2" stroke-width="1.2">' +
  '<path d="M12 29S3 20.5 3 12A9 9 0 1 1 21 12c0 8.5-9 17-9 17Z"/>' +
  '<circle cx="12" cy="12" r="3.2" fill="#efece2" stroke="none"/></svg>';

export function createMarkerElement(kind: MarkerKind, doc: Document = document): HTMLDivElement {
  const el = doc.createElement("div");
  el.className = "mk mk-" + kind;
  el.innerHTML = kind === "origin" ? '<span class="ring"></span>' : DEST_SVG;
  return el;
}
