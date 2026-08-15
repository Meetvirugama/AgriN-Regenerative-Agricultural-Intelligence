# AgriMesh — Frontend Redesign Specification

**Audience:** implementation coding agent
**Scope:** `client/` (React 19 + Vite 8 + TypeScript + Tailwind v4)
**Backend:** Express + in-memory store (`server/`), not modified except where explicitly flagged as a dependency

This document is the single source of truth for the frontend rebuild. It is based on a direct audit of the current repository (not assumptions). Where the backend does not yet support something the product model requires, that is called out explicitly as a **dependency**, not silently designed around.

---

## 1. Current Frontend Assessment

### 1.1 Stack (keep)
- React 19 + Vite 8 + TypeScript, Tailwind v4 (`@tailwindcss/vite`), `lucide-react`, `clsx` + `tailwind-merge`, `@react-google-maps/api`.
- No router installed. No state/data-fetching library (no React Query/SWR/Zustand). No test runner configured.
- `oxlint` is the configured linter (`npm run lint`).
- `vite.config.ts` already defines a `@` → `src` path alias (`resolve.alias`) — unused by any current import (everything uses relative `../../` paths today) but available; the redesign should adopt it for the new `app/`, `pages/`, `components/`, `services/` code to avoid relative-path churn.
- No `.env`/`.env.example` file exists anywhere in `client/`. This matters more than it sounds: the modules that "correctly" read `import.meta.env.VITE_API_URL` (`weatherApi`, `soilApi`, `diagnosisApi`, `regenApi`) never actually receive a value today, since nothing sets it — so in practice **every** API module currently resolves to `http://localhost:8000/api` regardless of which pattern it uses. The inconsistency in §1.4.6 is real and must still be fixed, but it is currently masked rather than causing visible breakage. Creating `.env.example` (and documenting `VITE_API_URL`) is part of the fix, not optional polish.

### 1.2 Structure that already works
- `client/src/features/<domain>/{api,components,hooks,types}` — this feature-folder convention is sound and should be **kept and extended**, not replaced.
- `client/src/index.css` already defines a real design-token system via CSS variables (`--primary`, `--background`, `--surface`, `--text-main`, `--text-muted`, `--border`, `--neutral`, `--success`, `--warning`, `--danger`) mapped into Tailwind's `@theme` (`bg-primary`, `text-text-muted`, `border-neutral`, etc.), including a dark-mode variant via `prefers-color-scheme`. **This token system is correct and matches the visual direction requested (black/white, restrained semantic color). Reuse it, extend it, do not replace it with a new palette.**
- `docs/AGRIMESH_FRONTEND_ENGINEERING_RULES.md` already codifies "no hardcoded colors / tokens only / no component-specific colors / severity-driven color" (FE-001–FE-005+). Treat this as binding — it is not a proposal, it's existing house rules the current code already half-violates (see 1.4).
- Severity/confidence vocabulary already exists and is consistent across features: `'green' | 'amber' | 'red'` (health-score), `'low' | 'moderate' | 'high'` (diagnosis), `'low' | 'medium' | 'high'` (weather flags), `Severity: 'Medium'` string enum (advisory). **Normalize these into one shared severity type in the redesign** (see §8.4).

### 1.3 Product surface that exists today (real, working end-to-end against the Express API)
- Crop/stage context (`crop-context`): stage banner, season progress, photo-based override flow.
- Weather (`weather-intelligence`): alert banner, forecast strip, expandable details.
- Soil (`soil-intelligence`): summary card, lab-report upload/parse flow.
- Satellite (`satellite-health`): health card, trend chart, detail map view.
- Field health synthesis (`health-score`): hero score + 6 dimension cards (water, soil, weather, disease, climate, vegetation).
- Climate risk (`climate-risk`): widget.
- AI advisory (`agro-advisory`): What/Why/Action/When/Monitor card shape already matches the required product model almost exactly.
- Disease diagnosis (`disease-diagnosis`): capture → analyzing → result/escalation flow with confidence dots and expert escalation.
- Regenerative planning (`regen-ag`): practices + next-season crop ranking.
- Field memory (`field-memory`): feedback prompts + timeline.
- Cross-border insights (`cross-border`): global insight widget.
- Escalation dashboard (`escalation-dashboard`): a **second persona** ("Extension Officer") — regional risk, ticket queue.
- Voice (`voice`): language switcher, global mic button, TTS button (STT/TTS calls are stubbed server-side).

This is a lot of real functionality. **The redesign is primarily an information-architecture, composition, and cleanup problem — not a rebuild of missing features.**

### 1.4 Confirmed defects (fix in redesign, do not preserve)

1. **`App.tsx` contains an unresolved merge conflict.** A literal `>>>>>>> main` marker sits mid-file (after the two wrapper function declarations, before `function App()`), and `FieldHealthScoreWrapper` / `FieldSatelliteWrapper` are each **declared twice** in the same module scope — once as `function` declarations near the top, once as `const` arrow functions near the bottom. Two declarations of the same identifier in one scope is invalid and this file cannot be trusted as-is. **This is not a design decision, it's broken source. Delete the duplicate top-of-file declarations and the conflict marker; keep one implementation of each wrapper (fold both into the new `Field` feature, see §7.2).**
2. **`App.tsx` is a 300+ line God component** doing routing-by-`useState`, all data fetching, all modal state, and full page composition for the entire app in one file. No page-level decomposition exists at all — everything is one screen.
3. **No router.** "Navigation" today is a single boolean (`persona: 'farmer' | 'extension'`) toggled by a floating button. There are no real routes, no deep links, no browser back/forward, no per-field URLs.
4. **No field switching**, despite the product model being field-centric. The app calls `cropApi.initStub()` (`POST /api/fields/stub-init`) which server-side always mock-creates/reuses one farmer (`farmer_mock_1`) and registers a **new** field named "Main Plot" — worth noting the stub currently re-registers a field on every call rather than reusing one, so field identity is not even stable across a reload. There is only ever "the current field," never a list.
5. **Hidden fallback mock data masks real errors.** `advisoryApi.getAdvisory` catches fetch failures and silently returns a fully-formed fake advisory object instead of surfacing an error state. This directly violates the "never turn missing/failed data into a misleading value" requirement (§9) and must be removed — errors must render as an error state, not fabricated content.
6. **Inconsistent API base URL handling — worse than one list can show.** Some modules read `import.meta.env.VITE_API_URL` with a fallback (`weatherApi`, `soilApi`, `diagnosisApi`, `regenApi`); most hardcode `http://localhost:8000/...` directly — including not just the obvious feature `api/*.ts` files (`advisoryApi`, `cropApi`, `crossBorderApi`, `escalationApi`, `memoryApi`, `voiceApi`) but also two **hooks** that fetch independently of any api module (`health-score/hooks/useHealthScore.ts`, `satellite-health/hooks/useSatelliteHealth.ts`), and **two components that bypass their own feature's API layer entirely**: `DiseaseDiagnosisFlow.tsx` and `AdvisoryCard.tsx` each hand-roll their own inline `fetch('http://localhost:8000/api/escalations/trigger', ...)` call to trigger an escalation, duplicating logic that already exists correctly in `escalationApi.triggerEscalation()` — and both then use a native browser `alert()` to report success/failure instead of any in-app UI state. Standardize on one `services/apiClient.ts` (§8.3), and make `escalationApi.triggerEscalation` the *only* call site for triggering an escalation — components that need it call the feature API, never `fetch` directly.
7. **`App.css` is dead Vite/React starter boilerplate** (`.hero`, `.ticks`, `#next-steps`, `.logo` spin animation targets that don't exist in the app) — never referenced meaningfully by real UI. Delete it.
8. **Unused starter/asset files**: `assets/react.svg`, `assets/vite.svg`, and `public/icons.svg` (a 5KB icon sprite with zero references anywhere in `src`). `assets/hero.png` usage should be verified and kept only if actually referenced. `index.html`'s `<title>` is still the generic Vite default `"client"`, not `"AgriMesh"`.
9. **Photo/document upload is only real for one of three flows.** `cropApi.identifyCrop` builds a `FormData` and then discards it, sending `{ image: 'mock_base64' }` as JSON instead — and server-side, `diagnosisRoutes.ts`'s `/diagnose` handler contains a literal comment: *"In a real app, we'd use multer and parse the file. Here we just mock the blob size from the body."* So **both** crop-identify photo capture and disease-diagnosis photo capture are non-functional against real image data today. Only `soilApi.parseLabReport` → `/soil/parse` is real: it sends genuine `FormData` and the server handles it with actual `multer` middleware (`upload.single('document')`). Flag the other two as a backend dependency (§14) — don't silently paper over it with a UI that implies photo analysis is happening when it isn't.
10. **Persona switch is a floating button that duplicates itself** in both branches of `App.tsx` (`Switch to Extension Officer` / `Switch to Farmer`), with slightly different positioning classes (`fixed` vs `absolute`) — a copy-paste artifact, not an intentional design.
11. **Every top-level `initStub()` call is repeated four separate times** in the same `useEffect` (once per data domain: crop, weather, soil, memory) instead of resolving the field id once and reusing it — redundant network calls on every load.
12. **A design token is referenced but never defined.** Three components — `ExtensionDashboard.tsx`, `DiseaseDiagnosisFlow.tsx`, `CropPlanningModal.tsx` — use Tailwind classes `bg-secondary`, `text-secondary-content`, and `border-secondary`, but no `--secondary` / `--color-secondary` variable exists anywhere in `index.css`'s `:root`, dark-mode block, or `@theme` mapping (only `primary`, `background`, `surface`, `text-main`, `text-muted`, `border`, `neutral`, `success`, `warning`, `danger` are defined). These utility classes currently generate no styling — the elements using them (an escalate button, a status badge, a crop-ranking highlight) are very likely rendering without their intended color today. This must be resolved as part of the token work (§3.2) — either define a real `--secondary` token or replace these usages with an existing token — not left silently broken.
13. **One component ignores the token system entirely.** `ClimateRiskWidget.tsx` is the sole file in the codebase (confirmed by a full-repo grep) using raw Tailwind palette classes — `bg-white`, `text-slate-500`, `bg-red-50`/`text-red-700`, `bg-rose-50/100`, `bg-amber-50/100`, `bg-emerald-50/100` — completely disconnected from the app's actual `--success/--warning/--danger` tokens, and it defines its own private `cn()` helper (`clsx` + `tailwind-merge`) instead of using a shared utility — it's also the only file in the repo importing `clsx`/`tailwind-merge` directly. This is the clearest concrete violation of the existing FE-001–FE-005 rules and should be rewritten onto the token system during the design-system pass (§3), not treated as acceptable prior art.
14. **The app mixes two parallel styling systems.** Alongside Tailwind utility classes (used almost everywhere), `index.css` also defines a hand-written global CSS class system — `.btn`, `.btn-primary`, `.btn-secondary`, `.map-container`, plus manual utility classes (`.text-center`, `.mt-4`, `.mt-8`, `.mb-4`) that simply duplicate what Tailwind already provides. These aren't dead: `.btn`/`.btn-primary`/`.btn-secondary` are actively used in `AdvisoryCard.tsx` and `SatelliteDetailView.tsx`. The `Button` primitive (§8.2) must absorb and fully retire the `.btn*` classes; the redundant manual spacing/utility classes should be deleted from `index.css` once confirmed unused.
15. **A cross-feature link is a stub.** `SatelliteDetailView.tsx` has a button wired to `onClick={() => alert('Deep link to Layer 07 Diagnosis flow')}` instead of an actual navigation to the diagnosis flow. This is exactly the kind of cross-feature link the new router (§4) needs to make real.
16. **Fetch failures silently render as "no data" in more than one place**, not just advisory — `GlobalInsightsWidget` (`cross-border`) catches its fetch error, logs to console, and leaves `insights` as an empty array, so a failed request and "this field genuinely has no cross-border insights" look identical to the farmer. Same class of bug as §1.4.5, different feature — see §9 for the fix that applies everywhere.

### 1.5 What this means for the rebuild
The redesign should treat the current `features/*` folders as the real, largely-correct **domain layer** (API + types + some components), and rebuild the **composition layer** (app shell, routing, pages, layout, cross-feature primitives) from scratch. Most existing feature components are reusable as-is or with light prop/styling cleanup — see §9 for what moves where.

---

## 2. Target UX Vision

AgriMesh is **field intelligence**, not a dashboard of data widgets. Every screen should answer, in order: *which field, what's happening, what matters now, what do I do.* The rest (raw weather numbers, satellite trend lines, soil lab values) is supporting evidence the farmer can drill into, not the headline.

Concretely:

- **One field is always "in view."** The app never shows a farmer an ambiguous or fieldless state once they have at least one field.
- **The advisory (What / Why / Severity / Action / When / Monitor) is the primary artifact**, not one card among many. Weather, soil, satellite, and health scores exist to justify *why* the advisory says what it says — they are evidence, reachable from the field screen, not competing top-level sections of equal visual weight.
- **Unknown is a visible state, not a hidden one.** A farmer with no soil report yet should see "No soil data yet — add one," never a blank or a fabricated "medium" value.
- **The Extension Officer persona is a distinct product surface**, not a bolted-on toggle. It gets its own route and its own shell (a data/ops dashboard: ticket queue, regional risk), while the Farmer persona keeps the calm, single-column, field-first experience. They should not visually or structurally resemble each other beyond shared design tokens.
- **Voice and language are ambient, not a feature to hunt for.** Language switcher and mic stay globally accessible from the app shell header, not inside any one page.

---

## 3. Visual System

Build on the CSS variables already defined in `client/src/index.css` — do not introduce a second competing token system.

### 3.1 Keep and extend these tokens
```
--primary        (black / white in dark mode)
--background
--surface
--text-main
--text-muted
--border
--neutral
--success  --warning  --danger
```

### 3.2 Additions needed
- `--info` (blue) — currently missing; required for "informational" semantic state called for in the product principle (weather/forecast context, non-urgent notices). Add alongside `--success/--warning/--danger` in both light and dark blocks.
- `--secondary` / `--secondary-content` — currently **used but never defined** (§1.4.12): three components already reference `bg-secondary`/`text-secondary-content`/`border-secondary`. Decide during this pass whether "secondary" earns a real token (e.g. a muted accent distinct from `--primary`) or whether those three call sites should instead be repointed to an existing token — either way, this is a live bug to close, not a nice-to-have.
- A `--surface-raised` or equivalent for the rare case a card needs to sit above `--surface` without resorting to shadow — keep shadow usage minimal (see 3.4).
- Map the existing `Severity` variants across features (`'green'|'amber'|'red'`, `'low'|'medium'|'high'`, `'Medium'`) onto one shared four-state scale: `neutral | info | attention(amber) | urgent(red)`, plus `healthy(green)`. This becomes the single status vocabulary (see §8.4) — components stop inventing their own color logic (already required by FE-004/FE-005 in the existing rules doc).
- Rewrite `ClimateRiskWidget.tsx` (§1.4.13) onto these tokens as part of this pass — it's the one place in the app currently using an unrelated ad hoc palette.

### 3.3 Typography
- Keep Inter. Establish a real type scale (currently only `.title`/`.subtitle` utility classes exist, unused outside the dead starter markup): page title, section heading, card title, body, caption/meta, numeric/data (tabular figures for scores and measurements).
- Headings should be restrained weight (600), not the current `font-black` used ad hoc in `App.tsx`'s `<h1>`.

### 3.4 Surface & elevation rules
- Borders over shadows: 1px `border-neutral`/`border-border` is the primary separation device (matches the "strong borders, minimal shadows" direction and the existing `--border: #000000` token).
- Shadows limited to true overlays (modals, the floating diagnose button) — not resting cards. Current code already over-uses `shadow-sm`/`shadow-2xl` on static cards; reduce to border-only for anything not floating.
- Corner radius: pick **one** small radius scale (e.g. `rounded-lg` for cards/inputs, `rounded-full` only for pills/avatars/FAB) and apply it everywhere — no per-component radius guessing.

### 3.5 Design system components to formalize
Typography · Spacing scale · Buttons (primary/secondary/ghost/destructive, all sizes touch-target ≥44px) · Inputs (text/select/file/photo-capture) · Cards (one base card primitive, not five ad hoc `bg-surface border p-6 rounded-xl` copies) · Tables · Status/severity badge (single component consuming the shared severity type) · Navigation (top bar + tab bar) · Dialogs/modals (one primitive; today `CropPhotoCapture`, `SoilUploadFlow`, `DiseaseDiagnosisFlow` each implement their own modal chrome) · Icons (lucide-react only, one size scale: 16/20/24/32).

---

## 4. Navigation & Information Architecture

Introduce a real router (`react-router` — nothing heavier is justified for this app's route count). Replace the `useState` persona/modal toggling in `App.tsx` with actual routes so field context is shareable/bookmarkable and back/forward works.

### 4.1 Farmer persona routes
```
/                          → Home
/fields                    → Field list / switcher
/fields/new                → Field registration (onboarding)
/fields/:fieldId           → Field (primary screen)
/fields/:fieldId/advisory  → Advisory detail (if advisory content grows beyond a card)
/fields/:fieldId/health    → Field Health detail
/fields/:fieldId/weather   → Weather detail
/fields/:fieldId/soil      → Soil detail
/fields/:fieldId/satellite → Satellite detail
/fields/:fieldId/diagnosis → Diagnosis flow (currently a modal — keep as a route-backed modal/sheet so it's linkable and survives refresh mid-flow)
/fields/:fieldId/history   → Field History / timeline
/profile                   → Farmer profile, language
```
Weather/soil/satellite/health each get a route only because the current components (`WeatherDetails`, `SatelliteDetailView`, etc.) already contain enough content to justify a dedicated screen — but they are **reached from within the Field screen** (tabs or "view details" links), never from a persistent top-level nav item. Top-level nav stays exactly: **Home · Fields · Advisory · History · Profile**, per the product principle in the brief. "Advisory" as a top-level nav item shows the current field's advisory by default and lets the farmer jump fields; it is not a separate data silo.

### 4.2 Extension Officer persona routes
```
/extension                 → Escalation dashboard (ticket queue + regional risk)
/extension/tickets/:id     → Ticket detail
```
Kept structurally separate from the farmer route tree (different shell, different nav), consistent with `ExtensionDashboard` already being a self-contained component today.

### 4.3 Persona switch
Becomes a real navigation action (link to `/extension` vs `/`), not client state (`persona` in `App.tsx`). Long-term this is an auth/role concern (see §14) — for now it's an explicit, single, top-of-shell control instead of two duplicated floating buttons.

---

## 5. App Shell

- **Header:** AgriMesh wordmark, active field name + quick switcher (dropdown, not a full page nav unless the farmer has many fields), language switcher, persona switch, global mic button.
- **Primary nav:** Home · Fields · Advisory · History · Profile — tab bar on mobile (bottom, thumb-reachable), left rail or top tabs on desktop/tablet.
- **Diagnose action:** keep as a persistent floating action button on the Field screen only (not global) — it's field-scoped, so it shouldn't appear on Home/Fields-list/Profile where there's no unambiguous field target.
- **Feedback prompts** (`FeedbackPrompt`) surface as a dismissible banner anchored to the top of Home/Field, not stacked into the middle of a long scroll as today.

---

## 6. Field Experience (Primary Screen)

`/fields/:fieldId` is the product. Structure top to bottom, matching the required product model (`Field → Crop+Stage → Current Condition → What matters now → Recommended Action → Why/When/Monitor → Feedback → Memory`):

1. **Field identity strip** — field name, crop + variety, stage (`GrowthStageBanner`), days-since-sowing/season progress (`StageProgressIndicator`), override entry point (`CropPhotoCapture`).
2. **Current condition summary** — the health-score hero (`FieldHealthHero`) as one glanceable synthesis, not six equally-weighted dimension cards up front. The 6 `HealthDimensionCard`s move to a secondary row or the Field Health detail screen — they're supporting evidence, not the headline.
3. **What matters now / Recommended action** — `AdvisoryCard` (What/Why/Severity/Action/When/Monitor) promoted to the most visually prominent element on the page, directly below identity + condition. Weather alert flags (`WeatherAlertBanner`) surface here too when active, since an active severe-weather flag *is* "what matters now."
4. **Evidence, on demand** — Weather strip, Soil summary, Satellite card, Climate risk widget, Regen planning: shown as compact summary rows/cards that link to their detail screens (§4.1), not fully expanded inline by default. This directly fixes the current one-long-vertical-scroll-of-everything layout.
5. **Recent activity / history** — `FieldTimeline`, condensed (last few entries) with a link to the full `/fields/:fieldId/history` screen.
6. **Feedback** — `FeedbackPrompt`, anchored near the advisory it refers to, not floating mid-page.

Diagnosis (`DiseaseDiagnosisFlow`) stays reachable via the floating camera button from this screen, and also gets its own route (§4.1) so a deep link / refresh mid-flow doesn't lose context.

---

## 7. Feature UI Specifications

### 7.1 Home (`/`)
New screen — does not exist today (today's "home" is literally the field screen with no field-selection step). Must show, using only real fetched data:
- Active/most-recent field, its current condition (reuse `FieldHealthHero` in compact form) and the single most important open action (advisory action_text or a weather flag if more urgent) — the "immediately communicate" requirement from the brief.
- Any active high-severity alerts across the farmer's fields.
- Quick access to switch fields (if the farmer has more than one — see §14 dependency).
- If the farmer has zero fields: an empty state that leads directly into Field Registration, not a broken fetch.

### 7.2 Field (`/fields/:fieldId`)
Per §6. Implementation note: this route absorbs and retires the duplicated `FieldHealthScoreWrapper`/`FieldSatelliteWrapper` logic from `App.tsx` (§1.4.1) — one implementation of each, living as small container components inside `features/health-score` and `features/satellite-health` respectively (they already fetch via feature hooks `useHealthScore`/`useSatelliteHealth`, which is the right pattern — just needs to exist once).

### 7.3 Advisory (`/fields/:fieldId/advisory`)
`AdvisoryCard`'s existing data shape (`what_text`, `why_text`, `severity`, `action_text`, `action_deadline`, `monitor_text`, `historical_parallel_callout`, `source_layers`) already matches the required structure almost exactly. Redesign work here is presentational, not structural:
- Render as distinct, labeled sections (What / Why / Severity / Action / When / Monitor), not a paragraph dump — the brief explicitly warns against "long AI text as the primary interface."
- `severity` badge uses the shared severity component (§8.4), not a one-off style.
- `historical_parallel_callout` and `source_layers` render as a clearly secondary "supporting context" block (small type, muted), reinforcing trust without competing with the primary recommendation.
- Feedback (`submitFeedback` / helped / didn't help) sits directly under the action, not on a separate screen.
- **Remove the hardcoded mock fallback** in `advisoryApi.getAdvisory` (§1.4.5) — on fetch failure render the shared error state (§9), never fabricated advisory text.

### 7.4 Field Health (`/fields/:fieldId/health`)
Full 6-dimension breakdown (`HealthDimensionCard` × 6: water, soil, weather, disease, climate, vegetation) using the existing `Severity = 'green'|'amber'|'red'` + `basis: string[]` shape — `basis` should be surfaced (it's the "why this rating" evidence and is currently computed but likely under-displayed). Charts (satellite trend, weather trend) only where they add over a single current-value readout, per the brief's "use charts only when they provide useful understanding."

### 7.5 Diagnosis (`/fields/:fieldId/diagnosis`)
Existing flow (`capture → analyzing → result/escalation`) already matches the required structure (Photo → Analysis → Possible condition → Confidence → Severity → Recommended next step → Expert escalation). Keep the confidence-dots pattern (3-tier: >0.8 / 0.5–0.8 / <0.5) — it's a good, simple trust signal. Redesign work: promote it from an ad hoc modal-with-its-own-chrome to using the shared dialog primitive (§3.5), and route-back it per §4.1/§7.2.

### 7.6 Field History (`/fields/:fieldId/history`)
Full `FieldTimeline`, plus resolved diagnosis events and past advisories with their farmer-feedback outcome (helped/didn't help) — making the "condition → recommendation → action → outcome" loop from the product model actually visible over time, not just a flat event list.

### 7.7 Field Registration (`/fields/new`)
Location → Boundary → Crop → Sowing date → Irrigation → Confirm, per the brief. **This is a new screen; it does not exist in the current frontend at all** (today a field is silently created server-side via the `stub-init` mock). Building this UI is straightforward (multi-step form + `@react-google-maps/api`, already a dependency, for the boundary step), but it has a hard backend dependency — see §14. Build the UI to the target flow; wire it to the real endpoint once available, and until then keep the app's existing single-field stub path working behind it so the app isn't broken mid-migration.

### 7.8 Extension Officer Dashboard (`/extension`)
`ExtensionDashboard` already covers regional risk + ticket queue. Redesign work: give it its own shell/nav (§4.2) distinct from the farmer shell rather than being a component swapped into the same layout, and apply the shared design system (it currently has its own visual conventions to reconcile).

---

## 8. Component Architecture

### 8.1 Ownership rule
Each `features/<domain>` folder keeps owning its API client, types, and domain components (this is already correct). New composition-layer code (pages, app shell, cross-feature layout) is new and lives outside `features/`, in `app/` and `components/`.

### 8.2 Shared primitives to extract (repetition that already exists across features today, so this is consolidation, not speculative abstraction)
- **Card** — every feature currently hand-rolls `bg-surface border border-neutral p-6 rounded-xl [shadow-sm]`. One `<Card>` primitive, variants for padding/emphasis only.
- **Modal/Dialog** — `CropPhotoCapture`, `SoilUploadFlow`, `DiseaseDiagnosisFlow`, and `CropPlanningModal` (regen-ag) each implement their own overlay/close-button/backdrop. One `<Dialog>` primitive; these four become its consumers.
- **StatusBadge** — consumes the unified severity type (§8.4) instead of each feature computing its own color classes inline (`FieldHealthHero`, `AdvisoryCard`, `WeatherAlertBanner`, `HealthDimensionCard`, `DiseaseDiagnosisFlow`'s confidence dots all currently do this separately).
- **Button** — current buttons are a genuine mix of two systems: ad hoc Tailwind `className` strings repeated per component (e.g. the persona-switch button duplicated in two places in `App.tsx`, §1.4.10) *and* the legacy global `.btn`/`.btn-primary`/`.btn-secondary` CSS classes still actively used in `AdvisoryCard.tsx` and `SatelliteDetailView.tsx` (§1.4.14). One `<Button>` primitive replaces both; the `.btn*` classes in `index.css` are deleted once migrated.
- **LoadingSkeleton / EmptyState / ErrorState** — currently each feature invents its own (`animate-pulse bg-neutral/20`, bespoke "Failed to load X" `<div>`s), and at least three places (`advisoryApi`, `SatelliteDetailView`'s error branch, `GlobalInsightsWidget`) collapse error into either fake success or silent empty state (§1.4.5, §1.4.16). One consistent set (§9).
- **`cn()` class-merge utility** — currently defined privately inside `ClimateRiskWidget.tsx` (the only file in the repo importing `clsx`/`tailwind-merge`) rather than shared. Move it to `lib/cn.ts`; delete the local copy as part of rewriting that component onto the token system (§1.4.13, §3.2).

### 8.3 Unified API client
Replace the mixed hardcoded-URL / `import.meta.env.VITE_API_URL` pattern (§1.4.6) with one `services/apiClient.ts` exporting a small `request(path, options)` wrapper that resolves the base URL from `VITE_API_URL` once, applies consistent JSON handling and error typing, and is what every `features/*/api/*.ts` module calls internally instead of calling `fetch` directly. This includes migrating the two hooks that currently fetch independently (`useHealthScore`, `useSatelliteHealth`) and the two components that currently bypass their feature API entirely (`DiseaseDiagnosisFlow`, `AdvisoryCard` calling `escalations/trigger` inline instead of `escalationApi.triggerEscalation`, §1.4.6). Feature API modules keep their existing exported shape (`weatherApi.getForecast(...)`, etc.) — this is an internal refactor, not a public interface change.

### 8.4 Unified severity/status type
```ts
// types/status.ts
export type StatusLevel = 'healthy' | 'neutral' | 'info' | 'attention' | 'urgent';
```
Provide mapping helpers from each feature's existing local severity types (`Severity` in health-score, diagnosis's `'low'|'moderate'|'high'`, weather's `'low'|'medium'|'high'`, advisory's `'Medium'`-style string) to `StatusLevel`, at the API-boundary/adapter level — do not force a breaking change to backend response shapes to achieve this (see §14, don't break API contracts for UI convenience). `StatusBadge` and any severity-driven styling consume only `StatusLevel`.

### 8.5 Sizing discipline
No giant screen-sized components (the current `App.tsx` is the anti-pattern to avoid), and no over-fragmentation into dozens of trivial wrapper components either. A page component orchestrates layout and data; feature components own their own fetch/render logic (most already do, via hooks like `useHealthScore`/`useSatelliteHealth` — extend that pattern to the features that currently fetch inline in `App.tsx`: crop-context, weather, soil, field-memory).

---

## 9. Data-Flow Rules

Every piece of field-derived UI must explicitly account for these states — this is not optional per-component polish, it's required before a feature is considered done:

```
loading | success | empty | error | unavailable | partial | saving | saved
```

- **Never fabricate a value.** No component may substitute `0`, `'healthy'`, `'unknown'`-as-if-known, or any other placeholder for data that failed to load or hasn't been collected. This directly rules out the current `advisoryApi` mock-fallback pattern (§1.4.5) — that pattern is deleted, not preserved.
- **Never let "failed" and "empty" render the same.** Beyond advisory, `GlobalInsightsWidget` (cross-border) currently does exactly this — a fetch error and "no insights for this field" both render as an empty widget (§1.4.16). Every feature hook must expose these as distinct states.
- **Distinguish "no data yet" from "failed to load."** `soilApi` already does this correctly (`404` → `'NO_DATA'` thrown distinctly from other failures) — that pattern is the model to follow everywhere, including advisory and satellite, which currently collapse all failures into one generic error string.
- **Distinguish "unavailable for this field" from "temporarily failed."** E.g. no satellite tile coverage yet vs. a fetch timeout — both are errors today; they should read differently to the farmer (one is retryable, the other may just need time).
- Every fetch that today happens ad hoc inside `App.tsx`'s single giant `useEffect` (§1.4.11) moves into its owning feature's hook, each managing its own loading/error/data state independently — this also fixes the current redundant quadruple `initStub()` call by resolving the field id once (in a `FieldProvider`/route loader) and having every feature hook receive `fieldId` as an argument instead of re-deriving it.

---

## 10. Responsive & Accessibility Rules

- Mobile is first-class: the current single `max-w-md` centered column is a reasonable mobile baseline but has no distinct tablet/desktop/large-desktop treatment at all today. Add real breakpoint behavior: tablet introduces two-column layout for evidence cards (§6.4), desktop/large-desktop introduces the persistent side-rail nav (§5) and a wider, multi-column Field screen (identity+condition+advisory as a primary column, evidence as a secondary column/rail).
- Touch targets ≥44×44px for all interactive elements, including the currently-small confidence dots and badge chips.
- Forms (Field Registration, soil upload, crop override) need visible labels, correct input types, and inline validation — current modals (`CropPhotoCapture`, `SoilUploadFlow`) should be audited against this during implementation.
- Maps (`SatelliteDetailView`, boundary drawing in Field Registration) need a non-map fallback/summary for keyboard/screen-reader users who can't interact with the canvas.
- Image upload (crop photo, diagnosis photo, soil lab report) needs a clear captured/uploading/failed state and a keyboard-operable alternative to camera capture (file picker).
- Voice (`GlobalMicButton`) needs a visible state machine (idle/listening/processing/error) communicated non-audibly too, not just an icon change.
- Global nav, field switcher, and persona switch must all be keyboard-navigable with visible focus rings (Tailwind's `focus-visible:outline` pattern already used on the current FAB — extend it everywhere).

---

## 11. Performance Rules

Target actual problems observed in the current code, not speculative ones:

- **Fix the redundant `initStub()` calls** (§1.4.11, §9) — four network round-trips per load collapse to one.
- **Route-based code splitting** once real routes exist (§4): diagnosis flow, satellite map view, and field registration (map-heavy) are natural `React.lazy` boundaries — they pull in `@react-google-maps/api`, which shouldn't be in the initial bundle for a farmer who never opens the map.
- **Avoid duplicate fetch-on-every-render.** `App.tsx` currently calls `cropApi.initStub()` up to four times in one effect run; ensure the migrated hooks don't reintroduce this via careless `useEffect` dependency arrays.
- **Image handling**: crop/diagnosis photo capture should downscale before upload (no current evidence of this happening; `imageBlobSize` is sent as a raw byte count today, suggesting no client-side compression exists yet) — add it, since these are farmer-uploaded photos over potentially poor mobile connections, which is core to this product's real-world usage context.
- Charts (satellite trend, weather trend) render only when their containing detail view is open/visible, not eagerly on the Field screen.

---

## 12. Folder Structure

```
src/
├── app/
│   ├── routes.tsx                # router config (§4)
│   ├── FarmerShell.tsx           # header, tab/rail nav, field context provider
│   ├── ExtensionShell.tsx        # separate shell for /extension (§4.2, §7.8)
│   └── providers/
│       └── FieldProvider.tsx     # resolves & holds active fieldId once (§9)
├── pages/
│   ├── Home.tsx                  # §7.1
│   ├── FieldsList.tsx
│   ├── FieldRegistration.tsx     # §7.7 — new
│   ├── Field.tsx                 # §6, §7.2
│   ├── Advisory.tsx              # §7.3
│   ├── FieldHealth.tsx           # §7.4
│   ├── Diagnosis.tsx             # §7.5
│   ├── FieldHistory.tsx          # §7.6
│   ├── Profile.tsx
│   └── extension/
│       ├── ExtensionDashboard.tsx
│       └── TicketDetail.tsx
├── components/
│   ├── ui/                       # Card, Dialog, Button, StatusBadge, LoadingSkeleton, EmptyState, ErrorState, Input (§8.2)
│   └── shared/                   # cross-feature but non-primitive (e.g. FieldSwitcher)
├── features/                     # existing convention, kept (§8.1)
│   ├── crop-context/
│   ├── weather-intelligence/
│   ├── soil-intelligence/
│   ├── satellite-health/
│   ├── health-score/
│   ├── climate-risk/
│   ├── agro-advisory/
│   ├── disease-diagnosis/
│   ├── regen-ag/
│   ├── field-memory/
│   ├── cross-border/
│   ├── escalation-dashboard/
│   └── voice/
├── services/
│   └── apiClient.ts              # (§8.3)
├── types/
│   └── status.ts                 # (§8.4)
├── hooks/                        # cross-feature hooks only (e.g. useActiveField)
├── lib/
└── styles/
    └── (current index.css content, extended per §3)
```
Delete: `App.css` (§1.4.7), `assets/react.svg`, `assets/vite.svg` (§1.4.8), the current monolithic `App.tsx` (replaced by `app/` + `pages/`).

---

## 13. Cleanup Plan

Remove once confirmed unused by the grep/build-check in §16:
- `App.css` and its dead Vite starter selectors (§1.4.7).
- `assets/react.svg`, `assets/vite.svg`, `public/icons.svg` (confirmed zero references in `src`, §1.4.8); keep `assets/hero.png` only if a real reference to it exists post-redesign.
- The duplicate `FieldHealthScoreWrapper`/`FieldSatelliteWrapper` declarations and the `>>>>>>> main` conflict marker in `App.tsx` (§1.4.1) — resolved by deleting `App.tsx` entirely in favor of `app/`+`pages/`.
- The hardcoded mock-advisory fallback in `advisoryApi.getAdvisory` (§1.4.5).
- The legacy `.btn`/`.btn-primary`/`.btn-secondary`/`.map-container` classes and redundant manual utility classes (`.text-center`, `.mt-4`, `.mt-8`, `.mb-4`) in `index.css`, once the `<Button>` primitive (§8.2) has replaced their call sites in `AdvisoryCard.tsx` and `SatelliteDetailView.tsx` (§1.4.14).
- The private `cn()` helper in `ClimateRiskWidget.tsx` once moved to `lib/cn.ts` (§8.2).
- Any now-orphaned inline fetch logic left behind in `App.tsx` once its responsibilities move into feature hooks (§9).
- Update `index.html`'s `<title>` from the default `"client"` to `"AgriMesh"` (§1.4.8).
- Rename nothing that doesn't need it — the `features/*` naming is already clear; don't churn file names for their own sake.

---

## 14. Data Safety Rules

- No destructive backend changes as part of this frontend redesign. The `InMemoryDB` seed data, farmer/field records, diagnosis/timeline history are not to be reset, dropped, or replaced with mocks in the running app.
- Do not change existing API response field names/shapes to make frontend code prettier — adapt in the frontend adapter layer (§8.3/§8.4) instead.
- **Dependencies requiring backend work before the corresponding UI can be fully real** (build the UI regardless, per §7.7, but do not fake success against a non-existent endpoint):
  - **Multi-field support**: no `GET` list-fields endpoint exists; `POST /api/fields/stub-init` currently mock-creates a farmer and **registers a new field every call** rather than reusing one (confirmed in `Layer1Service.registerField` / `cropRoutes.ts`) — field identity is not stable today. Field switcher (§7.1, §5) and Field Registration (§7.7) need a real `POST /api/fields` + `GET /api/farmers/:id/fields` before they're functionally complete; the frontend can and should be built against this target contract now.
  - **Auth/identity**: there is no login; `farmer_mock_1` is hardcoded server-side. Persona switching (§4.3) is UI-only until real roles exist.
  - **Photo-upload contract**: both `cropApi.identifyCrop` (crop-context) and the diagnosis endpoint (`/api/fields/:fieldId/diagnose`, whose server code explicitly comments that it mocks the file rather than parsing it) send no real image data today — only `soilApi.parseLabReport` has a genuine `multer`-backed multipart endpoint (§1.4.9). Confirm with backend whether multipart or base64-in-JSON is the intended contract for crop and diagnosis photos before finalizing either capture flow's upload code; build the capture UI now, but don't present analysis results as if real image inference occurred until the backend actually does it.
  - **Voice STT/TTS**: currently stubbed server-side (returns canned text / no real audio path); UI should treat these as best-effort/optional rather than core to any flow until real endpoints exist.
  Normal UI-only changes (layout, navigation, componentization, styling, client-side state) do **not** require any consultation and should proceed freely.

---

## 15. Implementation Order

1. **Audit** — confirm this document against the current `main` branch state (it may have moved since this audit); grep for every current `App.tsx` import to make sure nothing is missed during decomposition.
2. **Architecture cleanup** — delete dead files (§13), resolve the `App.tsx` merge conflict/duplicate wrappers by retiring the file entirely, stand up `apiClient.ts` (§8.3) and migrate all feature API modules onto it.
3. **Design system** — extend `index.css` tokens (§3.2), build `components/ui/*` primitives (§8.2), unify severity type (§8.4).
4. **App shell** — router (§4), `FarmerShell`/`ExtensionShell`, `FieldProvider` (§9).
5. **Field experience** — `Field.tsx` page per §6, migrating the wrapper logic cleanly (§7.2).
6. **Advisory** — §7.3, including removal of the mock-fallback anti-pattern.
7. **Health / weather / soil / satellite** — detail pages (§7.4) and their evidence-summary presence on the Field screen.
8. **Diagnosis** — §7.5, onto the shared `Dialog` primitive.
9. **History / feedback** — §7.6.
10. **Home + Field Registration** — §7.1, §7.7 (registration UI built to target contract per §14).
11. **Extension dashboard** — §7.8, own shell.
12. **Responsive refinement** — §10.
13. **Accessibility pass** — §10.
14. **Performance pass** — §11.
15. **Cleanup verification** — re-run §13 checklist once everything is migrated (confirm nothing still imports the deleted `App.tsx`/`App.css`).
16. **Verification** — §16.

---

## 16. Verification Checklist

Before claiming the redesign complete, the implementation agent must actually run and confirm all of the following (never assert success without running these):

- [ ] `npm run lint` (oxlint) — clean.
- [ ] `tsc -b` (part of `npm run build`) — clean, including confirming the old duplicate-declaration issue in `App.tsx` cannot recur because the file no longer exists.
- [ ] `npm run build` — succeeds.
- [ ] Any test suite, if one is added as part of this work — passing (none exists today; adding tests is not required by this spec but if written, must pass).
- [ ] All routes in §4 resolve and render without console errors, including direct navigation (refresh) to a deep route like `/fields/:fieldId/diagnosis`.
- [ ] Persona switch (§4.3) correctly separates farmer/extension shells with no shared route bleed.
- [ ] Every API call in `features/*/api/*`, plus the two formerly-independent hooks (`useHealthScore`, `useSatelliteHealth`) and the two formerly-inline escalation calls (`DiseaseDiagnosisFlow`, `AdvisoryCard`), goes through the unified `apiClient` (§8.3) and resolves its base URL from `VITE_API_URL` — a repo-wide grep for `http://localhost:8000` in `src/` returns zero results.
- [ ] `grep -r "bg-secondary\|text-secondary-content\|border-secondary"` in `src/` — every match resolves to a real, defined token (§1.4.12); none silently render unstyled.
- [ ] `grep -rE "bg-(red|green|blue|amber|rose|emerald|slate|gray|yellow|orange)-[0-9]"` in `src/` — no matches (§1.4.13); the rewritten `ClimateRiskWidget` uses only design tokens.
- [ ] No `alert(...)` calls remain in `src/` (confirmed present today in `DiseaseDiagnosisFlow.tsx`, `AdvisoryCard.tsx`, `SatelliteDetailView.tsx`) — replaced by real in-app UI states.
- [ ] Existing data (whatever is currently in the running `InMemoryDB`) still loads correctly through the new UI — no regressions against the real Express endpoints listed in `server/src/index.ts`.
- [ ] Field selection/switching behaves correctly given the current single-field backend reality (§14) — does not crash or silently mislead if only one field is ever available.
- [ ] Forms (Field Registration, soil upload, crop override) validate and submit correctly, and show real error states on backend failure — not fabricated success.
- [ ] Responsive behavior verified at mobile/tablet/desktop/large-desktop breakpoints (§10), not just "shrinks without breaking."
- [ ] Keyboard navigation and visible focus confirmed across nav, forms, modals, and the map view.
