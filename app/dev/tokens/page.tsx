import { TOKENS, LINECOL, FEEDBACK_TONES } from "@/lib/tokens";

/**
 * P0.2 verification surface (dev-only). Renders the frozen token set as swatches so the
 * ported values can be confirmed live against the prototype. Not a product screen.
 */

const COLOUR_TOKENS: ReadonlyArray<[string, string]> = [
  ["--paper", TOKENS.paper],
  ["--paper2", TOKENS.paper2],
  ["--ink", TOKENS.ink],
  ["--grey", TOKENS.grey],
  ["--grey2", TOKENS.grey2],
  ["--accent (oxblood)", TOKENS.accent],
];

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--hair)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 44,
          height: 30,
          flex: "0 0 auto",
          background: value,
          boxShadow: "inset 0 0 0 1px var(--hair)",
        }}
      />
      <span style={{ fontFamily: "var(--grot)", fontSize: 13, color: "var(--ink)" }}>
        {label}
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontFamily: "var(--grot)",
          fontSize: 12,
          color: "var(--grey2)",
          fontVariantNumeric: "tabular-nums lining-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--serif)",
        fontSize: 20,
        fontWeight: 600,
        margin: "32px 0 4px",
        paddingBottom: 6,
        borderBottom: "1px solid var(--hair)",
        color: "var(--ink)",
      }}
    >
      {children}
    </h2>
  );
}

export default function TokensDevPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px var(--m) 48px" }}>
      <p
        style={{
          fontFamily: "var(--grot)",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--grey2)",
        }}
      >
        Clearline · token check
      </p>

      <SectionHead>Core tokens</SectionHead>
      {COLOUR_TOKENS.map(([label, value]) => (
        <Swatch key={label} label={label} value={value} />
      ))}

      <SectionHead>Metro lines (§1a)</SectionHead>
      {Object.entries(LINECOL).map(([line, hex]) => (
        <Swatch key={line} label={line} value={hex} />
      ))}

      <SectionHead>Feedback scale (§1c)</SectionHead>
      {FEEDBACK_TONES.map((hex, i) => (
        <Swatch key={hex} label={`${i + 1} · rating`} value={hex} />
      ))}

      <SectionHead>Type + press</SectionHead>
      <p style={{ fontFamily: "var(--serif)", fontSize: 47, margin: "12px 0 0", textShadow: "var(--press)" }}>
        08:35
      </p>
      <p style={{ fontFamily: "var(--grot)", fontSize: 13, color: "var(--grey)", margin: "4px 0 0" }}>
        tabular-nums lining-nums · 0123456789
      </p>
    </main>
  );
}
