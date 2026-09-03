import { AppShell } from "@/components/app-shell";

export default function Home() {
  return (
    <AppShell
      foot={
        <button
          type="button"
          className="h-[54px] w-full bg-ink text-paper"
          style={{
            fontFamily: "var(--grot)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
          }}
        >
          Continue
        </button>
      }
    >
      <p
        className="text-grey2"
        style={{
          fontFamily: "var(--grot)",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 24,
        }}
      >
        Clearline · shell
      </p>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 600, margin: "8px 0 0" }}>
        The morning decision, in the instrument that always owned it.
      </h1>
      <p style={{ fontFamily: "var(--grot)", fontSize: 14, color: "var(--grey)", marginTop: 16 }}>
        App shell placeholder — real screens land in Phases 3–10. This verifies the 100dvh column,
        the centred 480px max-width, the scrolling body, the paper-grain ground, and the sticky
        foot CTA honouring the safe-area inset.
      </p>
    </AppShell>
  );
}
