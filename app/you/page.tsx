"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TabBar } from "@/components/controls";
import { Icon, type IconName } from "@/components/icon";
import { createClient } from "@/lib/supabase/client";
import type { Leg, PlaceRef } from "@/lib/planner/types";

/**
 * 16 · You / Account (BUILD-SPEC §10·16) — the "You" tab. Identity header, recent trips (read
 * from `trips` joined to its cached `plans`, RLS owner-only), the More menu → 11–14, and
 * sign-out → /login. Overlaps Profile but is the account/menu hub — the tab-bar destination.
 */

interface RecentTrip {
  origin: string;
  dest: string;
  sub: string | null; // route/mode summary, e.g. "Yellow Line · 51 min" — null if no cached plan
  when: string;
}

/** "Yellow Line · 51 min" style summary from the trip's recommended plan, matching the locked
 * design's 16-account.html. Falls back gracefully if no metro leg or no cached plan exists — see
 * PIXEL-AUDIT.md §16 (this used to just repeat the date here instead of a route summary). */
function routeSummary(legs: Leg[] | undefined, totalMin: number | undefined): string | null {
  if (totalMin == null) return null;
  const lined = legs?.find((l) => l.line);
  const rideLeg = lined ?? legs?.find((l) => l.ride);
  const label = lined?.line ? `${lined.line.charAt(0).toUpperCase()}${lined.line.slice(1)} Line` : rideLeg?.mode ?? null;
  return label ? `${label} · ${totalMin} min` : `${totalMin} min`;
}

const MENU: { icon: IconName; name: string; sub: string; href: string }[] = [
  { icon: "user", name: "Profile", sub: "Home, work, arrival & preferred mode", href: "/profile" },
  { icon: "edit", name: "Rate your commute", sub: "How comfortable was it? Private", href: "/feedback" },
  { icon: "help", name: "Support", sub: "Questions, feedback, report a problem", href: "/support" },
  { icon: "shield", name: "Privacy & data", sub: "Your saved trips — view or delete", href: "/privacy" },
  { icon: "info", name: "About Clearline", sub: "Data sources, freshness & limits", href: "/about" },
];

function maskPhone(raw: string | null | undefined): string {
  if (!raw) return "Signed in";
  const nat = raw.replace(/^\+?91/, "").replace(/\D/g, "");
  if (nat.length !== 10) return `+${raw.replace(/\D/g, "")}`;
  return `+91 ${nat.slice(0, 5)} ${nat.slice(5)}`;
}

function relativeDay(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return then.toLocaleDateString("en-GB", { weekday: "short" });
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function YouPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentTrip[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (cancelled) return;
      setPhone(user?.phone ?? null);
      const { data } = await sb
        .from("trips")
        .select("origin_place, dest_place, created_at, plans(name, total_min, legs)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (cancelled || !data) return;
      setRecent(
        data.map((r) => {
          const plans = (r.plans as unknown as { name: string; total_min: number; legs: Leg[] }[]) ?? [];
          const recommended = plans.find((p) => p.name === "recommended") ?? plans[0];
          return {
            origin: (r.origin_place as unknown as PlaceRef)?.name ?? "—",
            dest: (r.dest_place as unknown as PlaceRef)?.name ?? "—",
            sub: routeSummary(recommended?.legs, recommended?.total_min),
            when: relativeDay(r.created_at),
          };
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  const tabs = [
    { key: "home" as const, label: "Home", icon: "home" as const },
    { key: "plan" as const, label: "Plan", icon: "search" as const },
    { key: "you" as const, label: "You", icon: "user" as const },
  ];

  return (
    <AppShell
      scrollClassName="pb-[24px]"
      foot={
        <TabBar
          ariaLabel="Main"
          items={tabs}
          current="you"
          onChange={(k) => router.push(k === "home" ? "/" : k === "plan" ? "/from" : "/you")}
        />
      }
    >
      <div className="me">
        <span className="av">
          <Icon name="user" size={26} />
        </span>
        <span className="who">
          <div className="nm">Your account</div>
          <div className="sub">{maskPhone(phone)} · Free</div>
        </span>
      </div>

      {recent.length > 0 ? (
        <>
          <span className="lab2">Recent trips</span>
          <div className="recent">
            {recent.map((r, i) => (
              <button key={i} className="rr" type="button" onClick={() => router.push("/ways")}>
                <span className="ic">
                  <Icon name="clock" size={18} />
                </span>
                <span>
                  <span className="nm">
                    {r.origin} &rarr; {r.dest}
                  </span>
                  {r.sub ? <div className="sub">{r.sub}</div> : null}
                </span>
                <span className="when">{r.when}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      <span className="lab2">Settings</span>
      <div className="more">
        {MENU.map((m) => (
          <button key={m.href} className="mr" type="button" onClick={() => router.push(m.href)}>
            <span className="ic">
              <Icon name={m.icon} size={20} />
            </span>
            <span>
              <span className="nm">{m.name}</span>
              <div className="sub">{m.sub}</div>
            </span>
            <span className="ch">
              <Icon name="chevR" size={18} />
            </span>
          </button>
        ))}
      </div>

      <button className="signout" type="button" onClick={onSignOut}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </AppShell>
  );
}
