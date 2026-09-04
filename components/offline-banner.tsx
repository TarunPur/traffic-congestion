"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

/**
 * Offline / stale banner (P11.4, design §10 + BUILD-SPEC §7·Global). When the device is offline
 * the app may still show the last times it loaded — this says so plainly (oxblood = at-risk),
 * never hides staleness, and never implies the times are live. Renders nothing while online.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="offline-b" role="status">
      <Icon name="info" size={16} />
      <span>
        You&rsquo;re offline — showing the last times we loaded. They may be out of date; reconnect
        for live and scheduled data.
      </span>
    </div>
  );
}
