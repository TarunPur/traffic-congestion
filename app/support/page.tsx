"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon, type IconName } from "@/components/icon";

/**
 * 12 · Support (BUILD-SPEC §10·12). The FAQ is the honesty spine — why times differ, no live
 * metro, "you arrange this", privacy. Answers are verbatim from the prototype and never invent a
 * new claim. Single-open accordion; action rows → feedback / report / contact.
 */

function Stamp({ cls, children }: { cls: "live" | "sched"; children: ReactNode }) {
  return (
    <span className={`tl ${cls}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Why is a time sometimes wrong?",
    a: (
      <p>
        Every time comes from Delhi&rsquo;s public transit feeds, not from us. Bus times are{" "}
        <Stamp cls="live">Live · est.</Stamp> from GPS and can drift in traffic; metro times are{" "}
        <Stamp cls="sched">Scheduled</Stamp> from the timetable. We label the source on every time
        and never present it as a guarantee.
      </p>
    ),
  },
  {
    q: "Why is there no live metro?",
    a: (
      <p>
        There is no legal live-train feed for the Delhi Metro. We show metro from the published
        schedule and mark it <Stamp cls="sched">Scheduled</Stamp> — we never fake a moving train.
        Live tracking applies to buses only.
      </p>
    ),
  },
  {
    q: 'What does "you arrange this" mean?',
    a: (
      <p>
        The first and last stretch of a trip — a walk, auto or e-rickshaw to and from the stop — is
        yours to arrange. Clearline suggests and times it as guidance, but doesn&rsquo;t book or
        guarantee it.
      </p>
    ),
  },
  {
    q: "Is my data private?",
    a: (
      <p>
        Yes. Your home is never shared with employers or anyone else. Trip patterns are aggregated
        with a privacy threshold so no single person can be picked out, and you can delete
        everything in <b>Privacy &amp; data</b>.
      </p>
    ),
  },
];

const ACTIONS: { icon: IconName; nm: string; sub: string; to?: string }[] = [
  { icon: "edit", nm: "Rate your commute", sub: "How comfortable was it? Private, 30 seconds", to: "/feedback" },
  { icon: "help", nm: "Report a problem", sub: "A wrong time, a missing stop, a bug" },
  { icon: "info", nm: "Contact the team", sub: "We usually reply within a day" },
];

export default function SupportPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [ack, setAck] = useState<string | null>(null);

  return (
    <AppShell scrollClassName="pb-[30px]">
      <div className="topbar">
        <button className="iconbtn" type="button" aria-label="Back to home" onClick={() => router.push("/")}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <h1 className="h1">Support</h1>
      <p className="said">We run no buses or trains — but tell us what&rsquo;s off and we&rsquo;ll fix the app.</p>

      <div className="sh">
        <h2>Common questions</h2>
      </div>
      <div className="rule" />
      <div className="faq">
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={`item${isOpen ? " open" : ""}`}>
              <button className="q" type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                <span className="qt">{item.q}</span>
                <span className="cv">
                  <Icon name="chev" size={18} />
                </span>
              </button>
              <div className="a">
                <div className="in">{item.a}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sh">
        <h2>Get in touch</h2>
      </div>
      <div className="rule" />
      <div className="grp">
        {ACTIONS.map((a) => (
          <button
            key={a.nm}
            className="actrow"
            type="button"
            onClick={() => (a.to ? router.push(a.to) : setAck(a.nm))}
          >
            <span className="ic">
              <Icon name={a.icon} size={18} />
            </span>
            <span>
              <span className="nm">{ack === a.nm ? "Opening…" : a.nm}</span>
              <div className="sub">{a.sub}</div>
            </span>
            <span className="ch">
              <Icon name="chevR" size={18} />
            </span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
