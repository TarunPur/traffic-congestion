"use client";

import { useState } from "react";
import { SplitFlap } from "@/components/split-flap";
import { Cta } from "@/components/controls";

/** P1 signatures gallery (dev-only) — grows to hold all four signature components. */
export default function SignaturesDevPage() {
  const [t, setT] = useState("08:35");

  return (
    <main className="mx-auto max-w-[480px] px-m pb-24 pt-6">
      <p className="lab">Clearline · signatures</p>

      <H>SplitFlap — hero</H>
      <SplitFlap value={t} aria-label={`Leave by ${t}`} />
      <div className="mt-4 flex gap-3">
        <Cta ghost onClick={() => setT("08:35")}>
          08:35
        </Cta>
        <Cta ghost onClick={() => setT("09:12")}>
          09:12
        </Cta>
        <Cta ghost onClick={() => setT("17:40")}>
          17:40
        </Cta>
      </div>

      <H>SplitFlap — compact</H>
      <SplitFlap value="41" size="compact" aria-label="41 minutes" />
    </main>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-8 border-b border-hair pb-1.5 font-serif text-[20px] font-semibold text-ink">
      {children}
    </h2>
  );
}
