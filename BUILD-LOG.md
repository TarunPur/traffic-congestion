# Clearline — Build Log

Chronological record of the real build (per IMPLEMENTATION-PLAN.md). One entry per task.
Bound by ERD.md + the frozen docs. `../design/journey1-timetable/16screensjourney1-working/` is the port source.

## Pre-build gates (2026-09-04, cleared by Tarun)
- ERD.md + IMPLEMENTATION-PLAN.md approved as-is.
- All 6 ERD §12 defaults accepted as written.
- Phone OTP → Supabase **test phone numbers** (no SMS spend; real SMS = switch-on-ready later).
- Supabase project → Tarun to create (P0.4/P0.5 wait on it).
- Repo lives at `The last case study/clearline-app/`.
- Mappls → stub only (P4.1); no P4.2 until Tarun's key + free-tier confirm.
- Autonomy → continue building unattended after rate-limit reset; testing must be rock-solid.

## Phase 0 — Foundations & rails

### P0.1 — Repo + Next.js scaffold ✅ (2026-09-04)
- New git repo `clearline-app` (main branch); Next.js 15.1.6 App Router + React 19 + TypeScript `strict`
  (+ `noUncheckedIndexedAccess`, `noImplicitOverride`). `@/*` path alias. pnpm 9.15.9 (installed globally via npm; corepack absent on Homebrew Node 26).
- Core ERD stack installed once up front (Tailwind 3.4, Vitest 3 + RTL + jsdom, ESLint + @typescript-eslint) to avoid repeated install gates; wired per-task.
- Minimal themed ground in `app/globals.css` (`--paper`/`--ink` only; full token set = P0.2).
- **Verify:** `pnpm dev` → HTTP 200, themed page served; `tsc --noEmit` clean. No high-stakes path → no security-review needed.

### P0.2 — Tailwind + tokens ✅ (2026-09-04)
- `lib/tokens.ts` = single source of truth: `TOKENS` (ERD §2 authoritative set incl. `--accent`, `--press`), `LINECOL` (§1a, 8 lines), `FEEDBACK_TONES` (§1c 1→5), `lineColour()` fallback, `cssVarBlock()`.
- Full `:root` token set in `app/globals.css` + global `font-variant-numeric: tabular-nums lining-nums`, ink selection/focus (`1.5px ink` offset 3). `tailwind.config.ts` mirrors tokens as utilities referencing the CSS vars (one source). PostCSS wired. ESLint `no-explicit-any: error` active.
- **TDD:** `tests/tokens.test.ts` — 8 tests. Ground-truth assertions (CI-safe) + a **drift guard** that re-parses the real frozen prototype (clearline.css / 09 / 15) when the sibling folder is present, so tokens can never silently diverge.
- Dev verify surface `app/dev/tokens/page.tsx` (swatches). **Verify:** tsc + lint + 8 tests green; live render at `/dev/tokens` correct (paper/ink/oxblood + muted metro palette), console clean; screenshot sent to Tarun (visual confirm async). No high-stakes path.
