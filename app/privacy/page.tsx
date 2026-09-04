"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";

/**
 * 13 · Privacy & data (BUILD-SPEC §10·13). "What we keep" list, the demand-contribution toggle
 * (`demand_prefs`, PATCH /api/privacy), per-trip delete, and the two-step OXBLOOD delete-all
 * (arm → confirm, auto-disarms). Oxblood is sanctioned here — a genuinely destructive action.
 * "Your home stays yours" = never exposed to employers (RLS owner-only); everything user-deletable.
 */

interface Row {
  id: string;
  kind: "commute" | "trip";
  nm: string;
  sub: string;
}

export default function PrivacyPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [demand, setDemand] = useState(true);
  const [armed, setArmed] = useState(false);
  const [wiped, setWiped] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/privacy");
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as { rows: Row[]; demand: boolean };
      setRows(data.rows);
      setDemand(data.demand);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleDemand() {
    const next = !demand;
    setDemand(next);
    await fetch("/api/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demand: next }),
    });
  }

  async function deleteRow(r: Row) {
    setRemoved((s) => new Set(s).add(r.id));
    await fetch(`/api/privacy?id=${encodeURIComponent(r.id)}&kind=${r.kind}`, { method: "DELETE" });
  }

  function onDeleteAll() {
    if (!armed) {
      setArmed(true);
      if (disarm.current) clearTimeout(disarm.current);
      disarm.current = setTimeout(() => setArmed(false), 3500);
      return;
    }
    if (disarm.current) clearTimeout(disarm.current);
    setArmed(false);
    setWiped(true);
    setRemoved(new Set(rows.map((r) => r.id)));
    void fetch("/api/privacy?all=1", { method: "DELETE" });
  }

  return (
    <AppShell scrollClassName="pb-[30px]">
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back to home" onClick={() => router.push("/")}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <h1 className="h1">Privacy &amp; data</h1>
      <p className="said">You decide what Clearline keeps.</p>

      <div className="sh">
        <h2>What we keep</h2>
      </div>
      <div className="rule" />
      <div className="keeps">
        <div className="krow">
          <span className="ic">
            <Icon name="check" size={20} />
          </span>
          <div>
            <span className="kt">Saved commutes &amp; trips</span>
            <span className="kd">Kept to your account only.</span>
          </div>
        </div>
        <div className="krow">
          <span className="ic">
            <Icon name="check" size={20} />
          </span>
          <div>
            <span className="kt">Anonymised demand</span>
            <span className="kd">Pooled with 4+ others to pick the next corridor — never tied to you.</span>
          </div>
        </div>
        <div className="krow protect">
          <span className="ic">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <span className="kt">Your home stays yours</span>
            <span className="kd">Never shared with an employer or anyone.</span>
          </div>
        </div>
      </div>

      <div className="toggle">
        <div>
          <div className="nm">Contribute anonymised demand</div>
          <div className="d">Helps pick the next managed corridor. You can turn this off any time.</div>
        </div>
        <button
          className="sw"
          type="button"
          aria-pressed={demand}
          aria-label="Contribute anonymised demand"
          onClick={toggleDemand}
        />
      </div>

      <div className="sh">
        <h2>Your saved trips</h2>
        <span className="tot" style={{ fontWeight: 400, color: "var(--grey2)" }}>
          View or delete
        </span>
      </div>
      <div className="rule" />
      <div className="priv-trips">
        {rows.length === 0 ? (
          <p className="home-note" style={{ marginTop: 20 }}>
            Nothing saved yet — nothing to delete.
          </p>
        ) : (
          rows.map((r) => {
            const gone = removed.has(r.id);
            return (
              <div key={r.id} className={`priv-trip${gone ? " removed" : ""}`}>
                <span>
                  <span className="nm">{r.nm}</span>
                  <div className="sub">{r.sub}</div>
                </span>
                <button className="del" type="button" disabled={gone} onClick={() => deleteRow(r)}>
                  {gone ? "Deleted" : "Delete"}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="danger">
        <button className={`delall${armed ? " armed" : ""}`} type="button" disabled={wiped} onClick={onDeleteAll}>
          {wiped ? "All history deleted" : armed ? "Tap again to delete everything" : "Delete all trip history"}
        </button>
        <div className="hint">
          {wiped
            ? "Your account is clean. Save a commute again any time."
            : armed
              ? "Are you sure? This can’t be undone."
              : "This removes every saved commute and trip from your account. It can’t be undone."}
        </div>
      </div>
    </AppShell>
  );
}
