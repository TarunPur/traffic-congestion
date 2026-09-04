"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Cta, RuledRows, SelectableRow } from "@/components/controls";
import { Icon } from "@/components/icon";
import { Duotone } from "@/components/duotone";
import { getTrip, setTrip } from "@/lib/trip-state";

/**
 * 07 · Which part (BUILD-SPEC §7·07). Shown only for a multi-part hub. Radio list of
 * buildings/gates; sets the last-mile drop into the trip. Demo parts list until a real
 * `parts` column on places (parked in PARKED.md). → /ways.
 */

interface Part {
  nm: string;
  sub: string;
}
const DEMO_PARTS: Part[] = [
  { nm: "Building 10", sub: "Main tower · lobby entry" },
  { nm: "Building 8 & 9", sub: "North block · shared atrium" },
  { nm: "The plaza & food court", sub: "Open-air, ground level" },
  { nm: "Gate 3 — drop-off", sub: "Kerbside pick-up / drop point" },
];

export default function WhichPartPage() {
  const router = useRouter();
  const trip = useMemo(() => getTrip(), []);
  const destName = trip.dest?.name ?? "Your destination";
  const [sel, setSel] = useState(0);

  function confirm() {
    const part = DEMO_PARTS[sel]!;
    setTrip({ dest: { ...(trip.dest ?? { name: destName }), name: `${destName} · ${part.nm}` } });
    router.push("/ways");
  }

  return (
    <AppShell
      scrollClassName="!px-0"
      foot={<Cta onClick={confirm}>Confirm building</Cta>}
    >
      <div style={{ position: "relative", height: 172 }}>
        <Duotone
          src="/img/dlf-cyberhub.jpg"
          alt={destName}
          credit="Slyronit · CC BY-SA 4.0"
          canvasWidth={784}
          canvasHeight={344}
          crop={{ sxf: 0.02, syf: 0.05, swf: 0.96, shf: 0.62 }}
          className="absolute inset-0"
          style={{ height: "100%" }}
        />
        <button
          className="iconbtn"
          type="button"
          aria-label="Back"
          onClick={() => router.push("/to")}
          style={{ position: "absolute", left: "var(--m)", top: 16, zIndex: 5, background: "var(--paper)", boxShadow: "0 2px 10px -3px rgba(0,0,0,.35), inset 0 0 0 1px var(--hair)" }}
        >
          <Icon name="back" size={22} />
        </button>
        <div style={{ position: "absolute", left: "var(--m)", right: "var(--m)", bottom: 14, zIndex: 5 }}>
          <div className="lab" style={{ marginBottom: 3 }}>Destination</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 23, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ink)" }}>
            {destName}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 var(--m)" }}>
        <div className="said" style={{ marginTop: 18 }}>It&rsquo;s a large place. Which entrance or building are you going to?</div>
        <RuledRows>
          {DEMO_PARTS.map((p, i) => (
            <SelectableRow
              key={p.nm}
              role="radio"
              name={p.nm}
              sub={p.sub}
              selected={i === sel}
              onSelect={() => setSel(i)}
            />
          ))}
        </RuledRows>
      </div>
    </AppShell>
  );
}
