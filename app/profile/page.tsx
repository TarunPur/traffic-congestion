"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Duotone } from "@/components/duotone";
import { Icon, type IconName } from "@/components/icon";
import type { PlaceRef } from "@/lib/planner/types";

// Same duotone crop/treatment as Home's ride-head thumbnail (design's own "signature reuse").
const DEST_THUMB_CROP = { sxf: 0.18, syf: 0.1, swf: 0.5, shf: 0.52 };
const DEST_THUMB_OPTIONS = { contrast: 1.9, max: 0.9 };

/**
 * 11 · Profile (BUILD-SPEC §10·11) — the progressive profile. Every field is optional ("Not set"
 * until filled); the full profile is captured at the J2 upgrade, not here. Home/work are sensitive
 * (RLS owner-only) and feed the saved commute + the J2 setup prefill. Inline editors write
 * `profile_fields` via PUT /api/profile.
 */

type FieldKey = "home" | "work" | "arrival" | "return" | "preferred_mode";
interface Fields {
  home: string | null;
  work: string | null;
  arrival: string | null;
  return: string | null;
  preferred_mode: string | null;
}
interface Commute {
  id: string;
  origin: PlaceRef;
  dest: PlaceRef;
  label: string;
}

const ROWS: { key: FieldKey; label: string; icon: IconName; kind: "text" | "time" | "mode" }[] = [
  { key: "home", label: "Home area", icon: "home", kind: "text" },
  { key: "work", label: "Work location", icon: "work", kind: "text" },
  { key: "arrival", label: "Usual arrival", icon: "clock", kind: "time" },
  { key: "return", label: "Return after", icon: "moon", kind: "time" },
  { key: "preferred_mode", label: "Preferred mode", icon: "metro", kind: "mode" },
];
const MODES = ["Metro", "Bus", "Auto", "Walk", "Any"];

export default function ProfilePage() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields | null>(null);
  const [commutes, setCommutes] = useState<Commute[]>([]);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pRes, cRes] = await Promise.all([fetch("/api/profile"), fetch("/api/commute")]);
      if (cancelled) return;
      if (pRes.ok) setFields((await pRes.json()).fields as Fields);
      else setFields({ home: null, work: null, arrival: null, return: null, preferred_mode: null });
      if (cRes.ok) setCommutes(((await cRes.json()).commutes as Commute[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openEditor(key: FieldKey) {
    setEditing(key);
    setDraft(fields?.[key] ?? "");
  }

  async function save(key: FieldKey) {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: draft }),
    });
    setSaving(false);
    if (res.ok) {
      const { value } = (await res.json()) as { value: string | null };
      setFields((f) => (f ? { ...f, [key]: value } : f));
      setEditing(null);
    }
  }

  return (
    <AppShell scrollClassName="pb-[30px]">
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back to home" onClick={() => router.push("/")}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <h1 className="h1">Profile</h1>
      <p className="said">
        Optional. What you add tailors your rides — the rest is set up only when you switch to a
        managed commute.
      </p>

      <div className="sh">
        <h2>Your commutes</h2>
        <span className="tot">{commutes.length} saved</span>
      </div>
      <div className="rule" />
      <div className="commutes">
        {commutes.map((c) => (
          <button key={c.id} className="crow" type="button" onClick={() => router.push("/ways")}>
            <span className="thumb">
              <Duotone
                src="/img/dlf-cyberhub.jpg"
                alt={c.dest.name}
                canvasWidth={110}
                canvasHeight={110}
                crop={DEST_THUMB_CROP}
                options={DEST_THUMB_OPTIONS}
                vignette={false}
              />
            </span>
            <span>
              <span className="k">{c.label}</span>
              <span className="nm">
                {c.origin.name} &rarr; {c.dest.name}
              </span>
            </span>
            <span className="ch">
              <Icon name="chevR" size={18} />
            </span>
          </button>
        ))}
        <button className="crow" type="button" onClick={() => router.push("/from")}>
          <span className="thumb">
            <Icon name="moon" size={20} />
          </span>
          <span>
            <span className="k">Evening · home</span>
            <span className="nm dim">Add your evening commute</span>
          </span>
          <span className="ch">
            <Icon name="plus" size={18} />
          </span>
        </button>
      </div>

      <div className="sh">
        <h2>About you</h2>
        <span className="tot" style={{ fontWeight: 400, color: "var(--grey2)" }}>
          All optional
        </span>
      </div>
      <div className="rule" />
      <div className="grp">
        {ROWS.map((r) => {
          const val = fields?.[r.key] ?? null;
          const isEditing = editing === r.key;
          return (
            <div key={r.key} className="setrow-wrap">
              <button className="setrow" type="button" onClick={() => (isEditing ? setEditing(null) : openEditor(r.key))}>
                <span className="ic">
                  <Icon name={r.icon} size={18} />
                </span>
                <span className="nm">{r.label}</span>
                <span className={`val${val ? "" : " empty"}`}>{val ?? "Not set"}</span>
                <span className="ch">
                  <Icon name="chevR" size={18} />
                </span>
              </button>
              <div className={`editor${isEditing ? " open" : ""}`}>
                {isEditing ? (
                <div className="editor-in">
                  {r.kind === "mode" ? (
                    <select
                      className="ed-input"
                      aria-label={`Set ${r.label}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    >
                      <option value="">Not set</option>
                      {MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="ed-input"
                      type={r.kind === "time" ? "time" : "text"}
                      aria-label={`Set ${r.label}`}
                      placeholder={r.kind === "time" ? "" : r.label}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  )}
                  <div className="ed-actions">
                    <button className="linkbtn" type="button" disabled={saving} onClick={() => save(r.key)}>
                      Save
                    </button>
                    <button className="linkbtn ed-cancel" type="button" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pnote">
        <div className="t">Your full profile is set up when you upgrade.</div>
        <div className="d">
          Until then, Clearline keeps only what you add here — editable or deletable any time in
          Privacy &amp; data.
        </div>
      </div>
    </AppShell>
  );
}
