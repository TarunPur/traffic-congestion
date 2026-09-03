"use client";

import { useState } from "react";
import {
  Cta,
  Segmented,
  FilterTabs,
  TextField,
  SelectableRow,
  RuledRows,
  TabBar,
} from "@/components/controls";
import { Icon, ICON_NAMES } from "@/components/icon";

/** P1.2 verification surface (dev-only) — every core control + the icon set. Not a product screen. */
export default function ControlsDevPage() {
  const [mode, setMode] = useState<"free" | "managed">("free");
  const [sort, setSort] = useState<"fastest" | "cheapest" | "greenest">("fastest");
  const [phone, setPhone] = useState("");
  const [q, setQ] = useState("Hauz Khas");
  const [sel, setSel] = useState("a");
  const [tab, setTab] = useState<"home" | "plan" | "you">("home");

  return (
    <main className="mx-auto max-w-[480px] px-m pb-24 pt-6">
      <p className="lab">Clearline · controls</p>

      <H>Icons (25)</H>
      <div className="grid grid-cols-8 gap-3 pt-2 text-ink">
        {ICON_NAMES.map((n) => (
          <span key={n} title={n} className="flex items-center justify-center">
            <Icon name={n} size={20} />
          </span>
        ))}
      </div>

      <H>Segmented</H>
      <Segmented
        ariaLabel="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "free", label: "Free" },
          { value: "managed", label: "Managed" },
        ]}
      />

      <H>Filter tabs</H>
      <FilterTabs
        ariaLabel="Sort"
        value={sort}
        onChange={setSort}
        options={[
          { value: "fastest", label: "Fastest" },
          { value: "cheapest", label: "Cheapest" },
          { value: "greenest", label: "Greenest" },
        ]}
      />

      <H>Text fields</H>
      <TextField label="Phone" prefix="+91" value={phone} onChange={setPhone} placeholder="10-digit number" inputMode="tel" aria-label="Phone" />
      <TextField label="Search" iconLeft="search" value={q} onChange={setQ} onClear={() => setQ("")} aria-label="Search" />
      <TextField label="Errored" value="123" error onChange={() => {}} aria-label="Errored" />

      <H>Selectable rows</H>
      <RuledRows>
        <SelectableRow name="Hauz Khas Enclave" sub="Area · South Delhi" icon="pin" selected={sel === "a"} onSelect={() => setSel("a")} />
        <SelectableRow name="Hauz Khas Metro" sub="Yellow / Magenta" icon="metro" selected={sel === "b"} onSelect={() => setSel("b")} />
        <SelectableRow name="DLF Cyber Hub" sub="Office hub · Gurgaon" icon="work" selected={sel === "c"} onSelect={() => setSel("c")} />
      </RuledRows>

      <H>Primary CTA — states</H>
      <div className="flex flex-col gap-3">
        <Cta>Continue</Cta>
        <Cta ghost>Later</Cta>
        <Cta disabled>Disabled</Cta>
        <Cta loading loadingLabel="Sending…">Send code</Cta>
      </div>

      <H>Bottom tab bar</H>
      <div className="border border-hair">
        <TabBar
          current={tab}
          onChange={setTab}
          items={[
            { key: "home", label: "Home", icon: "home" },
            { key: "plan", label: "Plan", icon: "route" },
            { key: "you", label: "You", icon: "user" },
          ]}
        />
      </div>
    </main>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-8 border-b border-hair pb-1.5 font-serif text-[20px] font-semibold text-ink">
      {children}
    </h2>
  );
}
