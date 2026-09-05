# Pixel Audit — Locked Design vs Built App

Audited 2026-09-05. Method: full source-level comparison of every locked screen's HTML/CSS/JS
(`design/journey1-timetable/16screensjourney1-working/`) against the corresponding built Next.js
route and its components (`clearline-app/`) — reading actual file contents and, where a specific
claim needed independent proof, diffing exact CSS values or grepping for a class's real usage.

**A note on method, stated plainly:** local Supabase/Docker was not running in this session, so the
app could not be logged into and screenshotted end-to-end in a real browser during this pass. Every
finding below is a *source-level* finding — confirmed by reading the actual HTML/CSS/TSX, not by
eyeballing a rendered screenshot. This is a stronger signal for structural/content/behavioral
fidelity (nothing here is a guess), but it does **not** catch pure-rendering issues that only show
up live (font-loading fallbacks, browser-specific quirks, actual computed layout). Two screens (06
map, 22 live-trip map) also could not be visually verified even if a browser had been available —
MapLibre is documented elsewhere in this repo as rendering blank in the automation browser tab.
Treat this as a rigorous *code* audit, not a substitute for the NO-GO real-device walkthrough this
project already requires before calling any screen done.

---

## Post-Fix Verification Pass — 2026-09-05 (third pass, after 20 fix commits)

**Method:** local Supabase reset fresh (`supabase db reset`), app running on `localhost:3001` from
the exact code at `origin/main` HEAD (`f70ce2c` at the time of this pass — confirmed identical,
0 commits ahead/behind), locked design screens on `localhost:8747/16screensjourney1-working/`.
Logged in with the test-OTP flow, walked the full J1 flow end to end (login → choose → from → to →
map → ways → plan → save) and most of J2 (eligibility → setup → itinerary → booking → managed home →
start trip → live trip) with real screenshots at every step, comparing directly against the locked
design file open in an adjacent tab. This is a genuine live-browser re-verification of the 20 fix
commits, not a re-read of the commit messages.

**Overall picture: the great majority of fixes are confirmed working exactly as intended. One is
confirmed NOT working — the Live Trip countdown — and one design-gap fix (screen 05's photo
thumbnail) did not actually apply despite its commit message.** Corridor (17) and Corridor-is-live
(18) were not re-walked live this pass (would have required a second, separate test account to hit
the "not yet a partner" branch instead of the already-partnered one this session's account is
committed to) — their fixes stay UNABLE TO CONFIRM LIVE, resting on the commit diff only.

### RESOLVED — confirmed live, matches locked design
- **Countdown bug, Home (§10) and Managed Home (§23):** both show small, sane values ("12 min",
  "18 min") exactly matching the locked design's expected numbers. Confirmed on a fresh page load
  and again after a full-flow round trip — stable, not fluctuating.
- **Screen 07 CSS-selector bug:** the lead paragraph now renders as small grey caption text, not
  oversized/dark. Confirmed directly.
- **Screen 16 data bug:** recent trips now show real route/mode summary ("Yellow Line · 49 min") and
  a separate date ("Today") — no more duplication. Confirmed directly.
- **Duotone-thumbnail pattern — 5 of 6 screens confirmed:** Login filmstrip (§01, all 4 real photos
  rendering above the wordmark), Home (§10), Profile (§11), Managed Home (§23), and Ways-to-go's
  masthead (§08, full photo band + trip caption, exactly as the locked file's "signature move"
  describes) all show real duotone photography now. **Screen 05 is the exception — see STILL
  PRESENT below.**
- **Screen 06 full rebuild:** confirmed live and it's a complete match to the locked design's
  described interaction — floating panel, From/To search fields, swap icon, live crow-flies distance
  in a bottom sheet ("13.0 km as the crow flies"), CTA disabled until both points are set then
  enabling ("SEE WAYS TO GO"). Real map tiles and a dashed route line rendered correctly — the
  automation-tab MapLibre limitation noted in earlier passes did **not** reproduce this time.
- **Screen 03:** back button and "CHOOSE SERVICE" label are back in the topbar; the headline now
  wraps to 2 lines matching the locked design's line break.
- **Screen 04:** the map now shows a real pin by default (first result pre-selected) — confirmed
  after it briefly looked pinless due to a longer unfiltered result list pushing the map band down to
  a sliver; typing to filter results (matching the locked file's exact test) revealed the pin
  rendering correctly with the same marker style as the locked design.
- **Screen 05 subhead:** "From Hauz Khas Enclave. Your office, or today's destination." now renders
  in full — the previously-dropped clause is back.
- **Screen 14 (About):** now plays its own distinct animation (flat dash-segments scattering then
  resolving left-to-right, ending in a static underlined "Clearline" wordmark) — visibly different
  from Login's curved-strand animation, matching the locked design's intent. The "Your commute,
  confirmed." tagline is back underneath it.
- **Screen 15 (Feedback):** the "RATING THIS RIDE / Hauz Khas Enclave → DLF Cyber Hub, Building 10"
  context block is now present with hairlines, reached via the real "Rate it" link from Home.
- **Screen 20 (Itinerary):** operator tags now render in plain sentence case ("Clearline auto",
  "Clearline AC shuttle") with no uppercase transform or letter-spacing — confirmed by direct
  screenshot, no more all-caps eyebrow styling.
- **Screen 02 (OTP) caret:** now visibly thin/hairline in a zoomed screenshot, a real change from the
  thicker native caret seen in the prior pass — consistent with the custom-caret fix. Blink timing
  and the `.din` entrance animation remain UNABLE TO CONFIRM from screenshots, same as before.

### STILL PRESENT — fix did not actually resolve the issue
- **🔴 Live Trip countdown (§22) — the fix commit's claim does not hold up live.** Loaded `/trip`
  twice (fresh navigation both times): first showed **"min away"** preceded by a garbled run of
  digits with what looked like a decimal point mid-stream; second load showed **"274737 min away"**
  — still a large, nonsensical number, arguably a *new*, different failure mode (a raw
  unrounded/misformatted value) rather than the original wall-clock-vs-hardcoded-time bug, but the
  user-visible result is the same category of defect: this countdown is broken in the live app right
  now. This is the single most important finding of this pass — the commit `32fa059` fixed Home and
  Managed Home but did **not** actually fix Live Trip, despite the commit message claiming all three.
- **🟡 Screen 05 photo thumbnail (§05) — the fix commit's claim does not hold up live.** Searched
  "DLF Cyber" in `/to` exactly as the locked design does: the result row still shows a plain
  briefcase icon, not the duotone photo thumbnail the locked design shows for this featured result.
  The subhead half of this same commit (`7d2e84b`) did work — only the thumbnail part did not apply.

### UNABLE TO CONFIRM LIVE this pass (not re-walked — different account/flow needed)
- Screen 17 (Corridor) and Screen 18 (Corridor-is-live), including the dynamic-corridor-name fix
  (`9918265`) — this session's test account is already past the "waitlist" branch (committed to the
  already-partnered flow), and re-testing the not-yet-partner path would need a second, separate test
  identity. Not confirmed broken — just not independently re-verified live this pass.
- Screen 04's clear-button icon shape and Screen 22's phone-icon shape (commit `f70ce2c` claims a fix
  for the former, confirms the latter was already correct) — not zoomed/compared this pass.
- Exact sub-pixel values carried over as UNABLE TO CONFIRM from prior passes (OTP blink timing, the
  22px map-height delta, back-button offset precision) remain unconfirmed for the same reason as
  before — a screenshot can't settle them either way.

### Screens not touched by this round of fixes, re-confirmed still clean
09, 12, 13, 17a, 19, 21 — briefly re-checked live, no regressions, matches prior clean verdicts.

---

## Visual Confirmation Pass — 2026-09-05 (second pass)

**Method this time: live screenshots, both servers actually running and verified.** Docker was
already up; local Supabase was stopped (stale containers from a prior session), so it was cleanly
`supabase stop` → `supabase start` → `supabase db reset` before anything else. The app was
confirmed serving on `http://localhost:3001` (port 3000 was occupied by an unrelated process) and
the locked design screens on `http://localhost:8747/16screensjourney1-working/`, both curl-verified
before use. Logged into the app with the real test-OTP flow (`98123 45678` / `424242`), then walked
the entire J1 flow (login → choose → from → to → ways → plan → save) and the entire J2 flow
(eligibility → corridor → commit → corridor-live → setup → itinerary → booking → managed home →
start trip → live trip) to reach every one of the 24 screens with real, live-rendered app state —
no screen was skipped or guessed at.

**Correction to the first pass's stated limitation: MapLibre does NOT render blank in this
automation browser tab this session.** Screens 04, 05, 06 (implicitly via /from, /to), 17, and 22
all rendered real, live, pannable map tiles with correct markers in both the locked HTML and the
app — directly observed, not inferred. Screens 06 and 22 (previously flagged as "not visually
verifiable") **were** verified this pass.

**Every verdict below (CONFIRMED / REVISED / UNABLE TO CONFIRM) reflects something actually seen
on screen in this pass — screenshots for every locked/app pair were taken and compared directly.**
Where a prior finding could not be re-derived from a still screenshot (e.g. an exact letter-spacing
value, a blink-timing difference), it is marked UNABLE TO CONFIRM rather than assumed true.

**One new, high-confidence, live-only bug found — not in the source-level pass, because it can't be
seen by reading code, only by watching the rendered countdown:** the "until pickup" / "until you go"
minute-countdown shown on Home, Managed Home, and the Live Trip screen renders a nonsensical
3-digit number (**312 min**, **271 min**, **152 min** — observed at different points, always large
and always changing) where the locked design shows a small, sane number (locked Home: "12 min",
locked Managed Home: "18 min"). Confirmed on **three separate screens**, so this is a systemic
countdown-calculation bug, not a one-off. This is a real, live-visible defect a real user would see
immediately — flagged as the single highest-priority new finding from this pass.

**Second new finding:** on the Itinerary screen (20), the per-leg operator tag renders in full
uppercase with letter-spacing in the app ("CLEARLINE AUTO") where the locked design uses plain
sentence case with no letter-spacing ("Clearline auto") — confirmed by direct zoomed-in screenshot
comparison of the same element in both. Minor, but a real, confirmed pixel difference.

**Third new finding:** the About screen (14) is missing its tagline entirely — the locked design
shows "Your commute, confirmed." directly under the wordmark; the app renders no such line at all
(on top of the already-known wrong-animation finding for this screen).

**What could not be improved on from the first pass:** exact sub-pixel values (letter-spacing
degrees, the 22px map-height delta on screen 05, blink-interval timing on screen 02's OTP caret)
remain UNABLE TO CONFIRM from a screenshot — those still rest on the source-level reading, which
this pass had no reason to doubt.

## Summary

**24 of 24 screens audited.** 9 screens are clean (no deviations found): 09, 13, 17, 17a, 19, 20,
21, plus two with only a single low-confidence note (02, 22). The remaining 15 screens have at
least one confirmed, source-verified deviation from the locked design file.

- **19 MAJOR findings** (visible layout/content differences, missing signature elements, or
  confirmed functional bugs)
- **6 MINOR findings** (small pixel-value drift, icon-shape uncertainty, secondary copy differences)
- **1 DOCUMENTED** (already known, logged in `PARKED.md` before this audit — screen 10's `.addrow`
  fix)
- **1 nuanced case** requiring your decision, not a simple bug (screen 08's own internal token
  drift)

**The single biggest cross-cutting pattern:** the destination/route **duotone photo treatment is
missing on at least 6 screens** (01, 05, 08, 10, 11, 23) — replaced by a plain icon or, on screen
08, by nothing at all — despite the underlying `Duotone` component existing, working, and being
used *correctly* elsewhere (screens 07 and 17 both render it faithfully, crop and contrast values
byte-identical to the locked files). This isn't a missing capability; it's inconsistent wiring
across screens. If this were fixed, it would resolve more than a third of the MAJOR findings below.

**The single most consequential individual finding:** screen 06 ("Set on map") in the real app is
not just visually different from the locked design — it's missing a whole input method (a search
box) that both the locked HTML **and the project's own written `BUILD-SPEC.md`** call for. See §06
below.

---

## 01 · Login (`01-login.html` → `/login`)

**MAJOR/NEW.** The locked screen has a small decorative "filmstrip" — a 188px-tall canvas
rendering 4 duotone thumbnail photos (metro/bus/auto/walk, `mode-*.jpg`) — positioned above the
brand mark. The built `/login` page renders `<ClearingSplash/>` (the wordmark/strand animation)
directly with no filmstrip at all; the element is not in the component, not in any CSS class, not
referenced anywhere. This isn't just a missing decoration — its 188px height also means the
brand mark and form sit ~188px higher on screen than the locked layout intends.

Confirmed clean by contrast: the wordmark/strand SVG animation itself (`ClearingSplash`) is a
near-exact line-for-line port of the locked script — same constants (`X0=6, X1=314, YC=37,
CX1=112, CX2=208, N=9`), same `HOLD=350`/`DUR=1500`/cubic easing, same node-travel timing (450ms).

**Visual pass: CONFIRMED.** Screenshotted side by side — the locked screen shows the 4-photo
filmstrip clearly above the wordmark; the app has empty space where it should be and the wordmark
sits noticeably higher. Full certainty, directly seen.

## 02 · Verify / OTP (`02-otp.html` → `/verify`)

**MINOR/NEW.** The locked design specifies a custom blinking caret for the active OTP cell — a
hand-drawn `<span class="caret">`, 2px × 30px, ink-colored, blinking at `1.05s steps(1)`. The built
`OtpInput` uses real `<input>` elements with `caret-color: var(--ink)` set — correct color, but it's
the **browser's native text caret** (thinner, different blink timing/behavior, OS-dependent), not
the design's custom one.

**MINOR/NEW.** The locked design's `.din` per-digit entrance animation (fade-in + slide-up, 0.3s)
is not ported at all — confirmed no `digIn` keyframe or `.din` class anywhere in the app's CSS.
Typed digits appear instantly with no animation.

Not a deviation, just worth noting: the app adds a wrong-code shake animation (`otpShake`,
oxblood border) that has no counterpart in the static locked mock to compare against — a reasonable
addition consistent with the design system's own rules, not verifiable as "matching" or "not
matching" since the design never specified this state.

**Visual pass: REVISED (partial).** Zoomed in on the active cell's caret in both, same scale. The
app's caret is visibly **thicker/bolder** than the locked design's thin line — a real, seen
difference, not just a theoretical one. **UNABLE TO CONFIRM** the blink-timing claim (1.05s vs.
native) — not observable from still screenshots. The `.din` entrance-animation claim was not
independently re-tested this pass (typing was fast/automated) — stays UNABLE TO CONFIRM, resting on
the source-level reading.

## 03 · Choose service (`03-choosemode.html` → `/choose`)

**MAJOR/NEW.** The locked screen's top bar has three parts: a back icon-button, a "Choose service"
running-context label, and the step counter. The built `/choose` page's topbar has **only** the
step counter — confirmed no back button and no `.running` label anywhere in the component or CSS
(`.topbar .running` doesn't exist in the app's stylesheet at all). A user on this screen has no
back button.

Not a visual issue: the component uses `aria-checked` instead of the locked design's `aria-pressed`
for the radio-style mode selector. Confirmed the app's CSS selectors were updated to match
(`.mode[aria-checked="true"]` etc.) — this is a legitimate a11y improvement (correct ARIA for
`role="radio"`), not a rendering bug.

**Visual pass: CONFIRMED.** Screenshotted directly — locked shows "‹ CHOOSE SERVICE ... STEP 2 OF
4"; the app shows only "STEP 2 OF 4", nothing top-left. Full certainty. **New, live-only
observation:** the headline "How should we help today?" wraps to 2 lines in the locked screen at
this width but stays on 1 line in the app — a real, seen difference, likely a font-size or
max-width delta; not independently root-caused, flagging as a minor new observation.

## 04 · Where from (`04-wherefrom.html` → `/from`)

**MAJOR/NEW.** The locked design always shows a pin on the confirmation map — `moveTo(RES[sel])`
runs immediately on load, defaulting to the first search result. The built `/from` page only draws
a pin once the user has explicitly selected a result (`origin={selected ? {...} : null}`) — on
first load, the map band is empty/pinless, which the locked screen never shows.

**MINOR/NEW, unverified.** The locked clear-button uses a bespoke inline SVG X (`stroke-width:
1.6`). The app reuses the shared "plus" icon rotated 45° (`<Icon name="plus" className="rotate-45"
/>`). Conceptually the same shape; the exact stroke-width/arm-length wasn't independently confirmed
to match — flagging as a possible subtle shape difference, not a confirmed one.

Expected, not a defect: the locked mock's specific "Hauz Khas Enclave / Village / Metro / Fort"
result set is hardcoded demo data; the real app's autocomplete is powered by the actual seeded
`places` table and will show a different result set/count. This is inherent to going from a static
mock to a real search, not a bug.

**Visual pass: CONFIRMED.** Typed "Hauz Khas" in the live app — map band stayed blank/pinless with
results showing, exactly as claimed. Selected a result and watched the pin appear live with the
same circular marker style as the locked file. **UNABLE TO CONFIRM** the clear-button icon
stroke-width claim — not zoomed/compared this pass.

## 05 · Where to (`05-whereto.html` → `/to`)

**MAJOR/NEW.** The locked screen's subhead reads "From Hauz Khas Enclave. Your office, or today's
destination." — dynamically including the just-selected origin. The built `/to` page's subhead is
just "Your office, or today's destination." — the "From [origin]." clause is dropped entirely.
Confirmed by reading the component: no origin name is interpolated anywhere in this string.

**MAJOR/NEW.** The locked design shows a duotone photo thumbnail (52×52px, cropped/contrast-lifted
`dlf-cyberhub.jpg`) for the featured "DLF Cyber Hub" result — a distinct visual treatment marking
the primary result. The app's results list only ever renders a plain `<Icon>` for every row,
including this one. The `dlf-cyberhub.jpg` asset is present and checksum-identical in the app's
`public/img/`, confirming this is a dropped feature, not a missing asset.

**MINOR/NEW.** The confirmation map band is `height: 200` in the app vs. `height:178px` in the
locked CSS — a confirmed 22px deviation.

Confirmed clean: the destination marker (teardrop SVG, `mkDrop` animation) is a byte-for-byte port
— `lib/map-markers.ts`'s `DEST_SVG` constant is character-identical to the locked `markerEl()`
output.

**Visual pass: CONFIRMED both MAJOR findings.** Typed "DLF Cyber" live and screenshotted: the
subhead read only "Your office, or today's destination." (locked shows the full "From Hauz Khas
Enclave. ..." line) and the DLF Cyber Hub row showed a plain briefcase icon where the locked design
shows a real duotone photo thumbnail — both seen directly, side by side, at the same moment.
**UNABLE TO CONFIRM** the exact 22px map-height delta (not reliably measurable by eye from a
screenshot). Destination marker: **CONFIRMED clean**, same teardrop style live.

## 06 · Set on map (`06-setonmap.html` → `/map`)

**MAJOR/NEW — the largest single deviation found in this audit.** The locked screen is a
full-screen, search-driven map planner: a floating panel with two autocomplete search fields
(From/To, backed by a 10-place local dataset), a swap button, a bottom sheet showing a live
crow-flies-distance summary, and a CTA that's disabled until both points are set ("Add both
points" → "See ways to go"). The built `/map` route is a completely different interaction: "Drop
your pins" — draggable origin/destination pins pre-populated with defaults (or the trip's saved
points), **no search fields, no suggestion panel, no bottom-sheet summary, no swap button**. The
headline, body copy, and CTA label/logic are all different from the locked file.

This is not just a design-vs-mockup gap — the project's own `BUILD-SPEC.md` §7·06 explicitly
specifies **both** "search box (same Place index)" **and** "draggable origin + dest pins" together,
with the CTA "enabled only when both origin and destination are set." The built screen implements
only the drag-pins half. This is worth flagging to Tarun directly: it may be a deliberate pivot
made after the visual mockup was frozen (worth asking), but as built today it doesn't match either
the locked HTML file or the team's own written spec.

**Visual pass: CONFIRMED — full certainty, this is the single clearest finding in the whole
audit.** Navigated to `/map` directly and screenshotted next to the locked file: locked shows a
floating "From / Where to" search panel with a swap icon over a full-bleed map and a bottom sheet
reading "Pick a start and destination to preview the way"; the app shows a completely different
screen — headline "Drop your pins", instruction "Drag the ring (start) and the teardrop
(destination) to the exact spots", visible zoom controls, CTA "Confirm points". No search fields
anywhere in the app version. Seen directly, not inferred.

## 07 · Which part (`07-whichpart.html` → `/part`)

**MINOR/NEW.** The back button sits at `top: 16` in the app vs. `top:22px` in the locked masthead
CSS — a confirmed 6px positional difference.

**MAJOR/NEW — likely a real rendering bug, not just a style drift.** The locked design's `.lead`
paragraph ("It's a large place. Which entrance or building are you going to?") has its own
screen-local CSS class (13px, grey, 20px top margin). The built `/part` page reuses the shared
`.said` class for this text instead — but the shared `.said` rule in **both** the locked design's
`clearline.css` and the app's `globals.css` is scoped as `.h1 + .said` (only styled when
immediately preceded by an `.h1` sibling). Screen 07 has **no** `.h1` element (confirmed: neither
the locked file nor the app's JSX renders one here) — so this CSS rule cannot match. The subtext
line likely renders with no font-size/color styling at all, falling back to body defaults, rather
than the intended 13px grey copy. Worth a live-browser check to confirm the visual impact, but the
selector mismatch itself is confirmed by direct source inspection.

**Visual pass: CONFIRMED — the predicted visual impact is real and clearly visible.** Navigated to
`/part` directly. The subtext "It's a large place. Which entrance or building are you going to?"
renders **noticeably larger and darker** in the app than the locked design's small grey caption —
exactly the unstyled-fallback effect the selector-mismatch predicted. Seen directly, side by side.
(Aside, not a design finding: the app screen also showed a "1 error" dev-toolbar badge in the
corner at the time — not investigated as part of this visual/design audit, flagging only so it
isn't missed.) **UNABLE TO CONFIRM** the 6px back-button position delta (not reliably measurable by
eye).

## 08 · Ways to go (`08-waystogo.html` → `/ways`) — LOCKED v8

**MAJOR/NEW.** The locked file's single most distinctive visual element — described in its own
"DIRECTION CONTRACT" comment as one of v8's three signature moves — is a full ink-halftone
masthead band (a canvas rendering a duotone photo of the destination) with a trip-caption button
overlaid ("Hauz Khas Enclave → DLF Cyber Hub · Bldg 10", with an edit icon). **This is entirely
absent from the built `/ways` page.** More tellingly: the CSS for it (`.ways-masthead`, `.trip`,
`.trip .sep`, `.trip .tail`) **does exist**, fully ported, in `app/globals.css` — but grepping the
entire codebase confirms no component anywhere renders an element with `className="ways-masthead"`
or `className="trip"`. This is dead, unused CSS — strong evidence the masthead was ported into the
stylesheet as part of a batch pass but never actually wired into the page.

**Nuanced finding, needs your call rather than a simple fix.** Screen 08's locked HTML file has its
own embedded `:root` block, separate from the shared `clearline.css` used by the other 23 screens —
and it's stale: `--grey:#726c5e; --grey2:#9a9384` (the pre-retune greys `PARKED.md` already flags
as outdated) and a locally-overridden `.cta{ letter-spacing:.11em }` (vs. `.055em` everywhere else,
including in the current, authoritative shared CSS). Screen 08 is explicitly marked "LOCKED v8 —
additive changes only, never restyle," so this file was frozen before the later token retune and
never reconciled. The built app correctly uses the shared, retuned tokens (matching all 23 other
screens) — which is very likely the right call — but it means `/ways` does **not** literally
pixel-match `08-waystogo.html`'s own CSS values on this specific point. Worth a one-line decision
from you: keep following the shared/current tokens (recommended — screen 08's own file is the
outlier here), or special-case this screen to match its frozen file exactly.

Confirmed clean: the split-flap board mechanics, segmented departure control, and filter row are
faithfully ported and functionally wired to real data.

**Visual pass: CONFIRMED — full certainty.** Completed a real plan search and screenshotted `/ways`
next to the locked file: the locked screen's photo masthead + trip-caption band is unmistakable at
the top; the app goes straight from the topbar into "LEAVE BY" with nothing above it. Seen directly.
The nuanced color-token question (screen 08's own stale `:root`) stays **UNABLE TO CONFIRM**
visually — the CTA didn't look obviously different by eye, but letter-spacing at this scale isn't
something a screenshot can settle either way.

## 09 · Plan detail (`09-plandetail.html` → `/plan`)

**No deviations found.** Verified in detail given the screen's complexity: the arrive-time
formatting (`lastArrival()` in `lib/planner/stub.ts` correctly omits the leading zero, matching the
locked "9:16" display, not "09:16"), the journey-bar segment/line-colour logic, and the leg detail
expander all check out. The dynamic "{name} way" step label (vs. the locked mock's fixed "Fastest
way") is expected, correct behavior for a screen that now serves 4 different real plans instead of
one fixed demo.

**Visual pass: CONFIRMED clean.** Screenshotted the real plan detail page live — layout, big
door-to-door number, leave/arrive/changes row, journey-at-a-glance bar, and leg-by-leg list all
matched the locked file closely. No new issues seen.

## 10 · Saved / home (`10-savedhome.html` → `/`)

**DOCUMENTED** (already known, in `PARKED.md`) — the locked file's `.addrow` bug (evening-commute
title/description rendering on one line, missing `display:block`) — confirmed still present in the
locked HTML; confirmed already fixed in the app (commit `2a1e871`). No action needed here, just
confirming the existing record is accurate.

**MAJOR/NEW.** The locked "ride" head section shows a 44×44px duotone destination-photo thumbnail
next to the route text. The built Home page's `.head` renders no thumbnail element at all — just
the text. Sixth occurrence of the cross-cutting duotone-thumbnail pattern (see Summary).

Not a deviation, unverifiable against the design: the app adds a disruption/late banner (`.disrupt`,
oxblood-styled) with no counterpart in the static locked mock.

**Visual pass: thumbnail finding CONFIRMED**, seen directly on the live, populated Home screen
(real saved commute, not the empty state) — no thumbnail element at all next to the route text.
**The `.addrow` bug itself was UNABLE TO CONFIRM this pass** — the locked screen was only seen in
its empty "Add your evening commute" state, which doesn't exercise the buggy populated row; this
finding still rests on the source-level reading, not newly re-derived.

**NEW, high-confidence, live-only finding (not visible from source):** the "until you go" countdown
showed **"312 min"** — a nonsensical 3-digit number — where the locked design shows a small, sane
number ("12 min"). This is a real rendering/calculation bug, not a design mismatch, and it recurred
on two other screens too (see §23, §22 below and the pass-level note at the top). Confirmed by
direct observation of the live countdown value.

## 11 · Profile (`11-profile.html` → `/profile`)

**MAJOR/NEW.** Same pattern as above — the locked "Your commutes" row shows a duotone photo
thumbnail; the app renders a plain `<Icon name="route">` instead. Fifth confirmed occurrence.

Not a deviation: the app adds real inline field editors (text/time/mode inputs with Save/Cancel)
for the "About you" rows. The locked mock only has an inert "Opening…" toast animation with no
actual editing UI — there's no design reference to check the editors' appearance against, so this
can't be marked as matching or not matching, just flagged as new UI with no visual spec.

**Visual pass: CONFIRMED.** Screenshotted live with a real saved commute present — the "Your
commutes" row shows a plain route-line icon, no photo, exactly as claimed.

## 12 · Support (`12-support.html` → `/support`)

**MINOR/NEW.** The locked design's "Report a problem" / "Contact the team" rows show row-specific
acknowledgement text on click ("Opening report…", "Opening contact…"). The app shows a generic
"Opening…" for both, regardless of which was clicked.

Otherwise a genuinely clean, near-verbatim port — all 4 FAQ answers and all 3 action-row copy
blocks match word-for-word, including specific phrasing like "There is no legal live-train feed."

**Visual pass: CONFIRMED clean overall.** Screenshotted live — layout, FAQ rows, and the "Get in
touch" section all matched closely. The generic-vs-specific "Opening…" toast claim was **UNABLE TO
CONFIRM** (didn't click through both rows to compare toast text this pass).

## 13 · Privacy & data (`13-privacy.html` → `/privacy`)

**No deviations found.** Verified the renamed `.priv-trip`/`.priv-trips` classes (renamed from the
locked `.trip`/`.trips` to avoid collision) are styled with values identical to the locked CSS. The
two-step armed/disarm delete-all interaction, all copy, and the consent toggle all match.

**Visual pass: CONFIRMED clean.** Screenshotted live with real saved-trip data present — layout,
toggle, and saved-trips list all matched the locked file's structure and styling.

## 14 · About (`14-about.html` → `/about`)

**MAJOR/NEW.** The locked About screen has its **own**, distinct brand animation from the login
screen — 20 flat dash-segments that scatter (random Y-offset + rotation) then resolve into
alignment left-to-right, with a traveling node, plus a *static* (non-animated) 34px underlined
"Clearline" wordmark. This is visually and mechanically different from login's animation (9 curved
SVG strand paths converging via bezier easing, with a *fading-in* 41px wordmark). The built
`/about` page simply reuses `<ClearingSplash>` — the login screen's component — verbatim. A real
user would see the exact same animation on both screens, when the design commissioned two distinct
ones with different wordmark sizes and behavior.

Otherwise very faithful: the data-sources list, "what Clearline can't do" list, and colophon text
all match word-for-word, including the specific "pre-launch — no users, partners or press we don't
have" line. The live-dot pulse animation (`livepulse`, scoped to `.src .tl.live .dot`) is correctly
ported and correctly scoped.

**Visual pass: CONFIRMED — full certainty, and one new finding.** Screenshotted directly: the
locked screen has a short animated dash-line that resolves into a *static, underlined* "Clearline"
wordmark with a subtitle "Your commute, confirmed." right below it; the app instead plays the exact
same curved-strand animation as the Login screen, with no underline and — **newly found this
pass** — **the "Your commute, confirmed." subtitle line is missing entirely**, on top of the
already-known wrong-animation issue. Both seen directly, side by side.

## 15 · Feedback (`15-feedback.html` → `/feedback`)

**MAJOR/NEW.** The locked design shows a "Rating this ride" context block naming the specific trip
being rated ("Hauz Khas Enclave → DLF Cyber Hub"), styled with top/bottom hairlines. Confirmed via
grep: no `.ctx`-equivalent element exists anywhere in the app's JSX or CSS — not even as unused dead
code. A user rating "yesterday's commute" from Home has no on-screen confirmation of which trip
they're rating.

Confirmed clean: the 5-point rating scale's tone colors (`#a8452f`/`#c06a4a`/`#b8801a`/`#7d9455`/
`#4f6b3a`) are byte-identical to the locked design in `lib/tokens.ts`.

**Visual pass: CONFIRMED.** Screenshotted directly — the locked file shows the "RATING THIS RIDE /
Hauz Khas Enclave → DLF Cyber Hub" context block with hairlines; the app goes straight from the
subhead into "How did the ride feel?" with no such block. Seen directly. Rating-scale colors:
**CONFIRMED clean**, visually matched.

## 16 · You / Account (`16-account.html` → `/you`)

**MAJOR/NEW — a real data bug, not a missing feature.** The locked design's recent-trips row shows
route/mode summary in `.sub` (e.g. "Yellow Line · 51 min") and a separate relative date in `.when`
(e.g. "Yesterday"). The app's `RecentTrip` data model only captures `{origin, dest, when}` — it
never fetches route/mode/duration at all — and renders `{r.when}` in **both** the `.sub` and
`.when` positions. A real user would see the same date string duplicated on each row instead of
the intended route summary.

**Visual pass: CONFIRMED — full certainty, unambiguous on screen.** Screenshotted `/you` live with
real trip history present: every recent-trip row reads "Today" in both the position where a route
summary belongs and the date position. The locked file, for contrast, shows real route/mode
summaries ("Yellow Line · 51 min") with a separate date. Directly seen, not inferred.

## 17 · Corridor & waitlist (`17-corridor.html` → `/corridor`)

**No deviations found.** A genuinely strong example of faithful porting: the `Duotone` masthead
(crop, contrast 1.9, max 0.86) matches exactly; the `.mast::after` fade-to-paper gradient is
present and identical; all copy — including the specific "≥85% on-time, or we make it right"
reliability line — matches word-for-word. Real corridor data (count/threshold/status) correctly
replaces the locked mock's hardcoded numbers.

**Visual pass: CONFIRMED clean.** Screenshotted live — masthead photo, copy, and the commit-count
bar all matched the locked file closely.

## 17a · Eligibility (`17a-eligibility.html` → `/eligibility`)

**No deviations found.** All copy matches exactly, including the specific hint about email-domain
matching and employee-ID non-verification. The app correctly moved partner-domain matching
server-side (vs. the locked mock's client-visible array) — a legitimate security improvement over
the mock, not a visual deviation.

**Visual pass: CONFIRMED clean.** Screenshotted the empty form live next to the locked (pre-filled
demo) version — structure, labels, and copy matched exactly.

## 18 · Corridor is live (`18-corridor-live.html` → `/corridor-live`)

**MINOR/NEW.** The celebratory copy — "Sikanderpur → DLF Cyber City is now a managed commute" — is
a static, hardcoded string in the app's JSX, not read from the actual corridor object. With only
one demo corridor in the system today this isn't currently visible as a bug, but it's a latent
correctness issue: any second corridor would show the wrong name on this screen.

Otherwise an exceptionally faithful port — the "clearing" SVG animation's path data is
character-identical between the locked file and the component.

**Visual pass: CONFIRMED clean.** Reached this screen live by actually committing a seat and
screenshotted it — layout, the converging-lines animation, and copy all matched. The
hardcoded-corridor-name claim stays **UNABLE TO CONFIRM** (only one demo corridor exists to test
against, same limitation as the source-level pass).

## 19 · Managed setup (`19-setup.html` → `/setup`)

**No deviations found.** Copy, stepper logic (±15min, wraps at 1440), and day-chip behavior all
match. Home/tower fields correctly prefill from the real saved profile instead of the mock's
hardcoded demo values — expected, correct behavior.

**Visual pass: CONFIRMED clean.** Filled the real form live and screenshotted next to the locked
file — layout, stepper controls, and day chips all matched.

## 20 · Itinerary (`20-itinerary.html` → `/itinerary`)

**No deviations found.** The boarding-pass "ticket" hero, perforation divider, reliability line,
and "why this plan" stat cells all match. Real `ManagedPlan` data correctly replaces the locked
mock's hardcoded legs/numbers.

**Visual pass: CONFIRMED clean overall — one new, confirmed minor finding.** Screenshotted the real
generated plan live: the boarding-pass hero, stat cells, and leg list all matched closely. **New
this pass, confirmed by direct zoomed comparison:** the per-leg operator tag renders in full
uppercase with letter-spacing in the app ("CLEARLINE AUTO") where the locked design uses plain
sentence case, no letter-spacing ("Clearline auto") — same element, same position, different
casing. Seen directly at matching zoom on both.

## 21 · Booking (`21-booking.html` → `/booking`)

**No deviations found.** Verified the renamed `.pilot-credit` class (from locked `.credit`) is
styled identically. All plan/terms copy matches exactly; real fares are fetched instead of
hardcoded.

**Visual pass: CONFIRMED clean.** Screenshotted the real booking screen live — pricing cards, trip
toggle, and coverage list all matched the locked file closely.

## 22 · Live trip (`22-livetrip.html` → `/trip`)

**MINOR/NEW, unverified.** The locked design's call button uses a bespoke inline phone-handset SVG
path. The app uses the shared `Icon name="phone"` glyph instead. Not independently confirmed
whether the shapes match — flagging the substitution, not a confirmed visual mismatch.

Verified clean: despite unusually heavy class-renaming on this screen (`.mtop`, `.nowrow`,
`.tstep`, `.tbody`, `.livepill`, `.map-abs` — all renamed from the locked file's names, likely to
avoid collisions with shared classes used elsewhere), every renamed class is present and correctly
styled in the app's CSS with matching values. The driver-placeholder honesty disclosure and the
Emergency/SOS confirmation flow are additions with no counterpart in the static mock — reasonable,
unverifiable against a design reference.

**Visual pass: map CONFIRMED working (correction to the first pass), CONFIRMED clean overall, plus
one new high-confidence bug.** Contrary to the first pass's stated limitation, the live map on this
screen rendered real tiles with the correct dashed-route/pin treatment, matching the locked file
closely — directly observed. **New this pass:** the "min away" countdown showed **"152 min"** then,
moments later, **"271 min"** — the same nonsensical-countdown bug confirmed on Home (§10) and
Managed Home (§23), now confirmed on a third screen. Phone-icon shape: **UNABLE TO CONFIRM** (not
zoomed/compared this pass).

## 23 · Managed home (`23-managed-home.html` → `/managed`)

**MAJOR/NEW.** Same duotone-thumbnail gap — sixth and final confirmed occurrence. The locked ride
head shows a 44×44 photo thumbnail; the app shows a plain `<Icon name="route">`.

Verified clean: the `.modify` button was intentionally reused as the shared `.otherways` class
(from screen 10) — checked both locked CSS blocks property-by-property, they're identical, so this
is safe, correct reuse rather than a mismatch. The `.line-a` reschedule/manage buttons (renamed
from the locked `.r` span, now real clickable buttons instead of inert demo text) are correctly
styled.

**Visual pass: CONFIRMED.** Screenshotted live — no thumbnail next to the route text, plain icon
instead, exactly as claimed. **Same countdown bug confirmed here too:** "271 min until pickup"
shown live where the locked design shows "18 min until pickup" — second of three screens where this
bug was directly observed.

---

## What to decide first

Updated after the live visual pass — three things now stand out, in priority order:

1. **The countdown bug (Home, Managed Home, Live Trip) — highest priority, this is a functional
   bug, not a design gap.** The "until you go" / "until pickup" countdown renders a nonsensical
   3-digit number (312, 271, 152 min — all directly observed live) instead of a small sane one. A
   real user opening the app today would see this immediately. Confirmed on three separate screens,
   so it's a shared calculation bug, not a one-off — worth root-causing before anything cosmetic.
2. **The duotone photo pattern (6 screens).** This is one root cause with a wide blast radius —
   fixing how thumbnails get wired on Login/Where-to/Ways/Home/Profile/Managed-home would resolve
   the single largest recurring visual gap in the app. Confirmed live on every one of the 6 screens.
3. **Screen 06 (Set on map).** This is the one place where the built screen doesn't match not just
   the locked design file but the project's own written `BUILD-SPEC.md` — confirmed live, and it's
   the starkest side-by-side difference in the whole audit (an entirely different interaction
   model, not just missing decoration). Worth a direct decision: was dropping the search box
   intentional, and should the spec or the build change to match?
