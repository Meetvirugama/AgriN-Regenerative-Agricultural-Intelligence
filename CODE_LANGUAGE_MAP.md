# CODE_LANGUAGE_MAP.md
### AgriMesh (AgriN-Regenerative-Agricultural-Intelligence) — Final Language Assignment

**Analysis date:** 2026-08-16
**Scope analyzed:** Entire repository — root scaffold, `client/` (frontend), `server/` (backend), `ai-service/` (AI/ML service), `docs/`, migration scripts, tests.
**Status:** Analysis + mapping only. **No code has been changed, moved, converted, or deleted.**

---

## 1. What the codebase actually is today

| Layer | Location | Current language | LOC (approx, excl. deps) | Real state |
|---|---|---|---|---|
| Frontend | `client/src/` | React + **TypeScript** (`.tsx`/`.ts`) | 73 files / ~5,207 LOC | Real Vite+React app. Feature-folder structure. |
| Backend | `server/src/` | Node.js/Express + **TypeScript** | 60 files / ~3,947 LOC | Real Express API gateway, Postgres repositories, JWT auth, cron jobs. |
| AI/ML service | `ai-service/` | **Python** (FastAPI) | 15 files / ~986 LOC | Already Python. Wraps Google Gemini for vision/text AI + scientific calculators. |
| Root scaffold | `/` (repo root) | Next.js + TypeScript | small | **Dead/ghost project** — not used by the real app at all. |
| Docs | `docs/`, `*.md` | Markdown | — | Product/architecture docs, no code. |

**Important existing fact:** the project has *already* been partially migrated toward the target architecture. `server/src/services/pythonClient.ts` is a working HTTP client that delegates AI/ML/scientific work to the `ai-service` FastAPI app for: crop ID, disease diagnosis, advisory generation, phenology/GDD, weather-rule evaluation, health-score computation, satellite trend/anomaly processing, regen plan generation, soil-report vision parsing, cross-border insights, and voice STT/TTS. Node-side modules like `RegenAI.ts`, `DocumentParser.ts`, `VoiceAdapter.ts`, and `WeatherRuleEngine.ts` are already **thin delegation wrappers**, not real computation. This means the React/Node/Python split you're asking for is mostly a **language conversion + cleanup** task, not a re-architecture — the responsibility boundaries are already close to correct, they're just implemented in TypeScript instead of plain JavaScript.

---

## 2. Final Language Tree

```text
Project
 ├── React (client/) — JavaScript (.jsx), no TypeScript
 │    ├── app/ (App, FarmerShell, ExtensionShell, ProtectedRoute, ErrorBoundary, FieldProvider)
 │    ├── pages/ (Home, Field, Onboarding)
 │    ├── components/ui/ (Button, Card, Dialog, EmptyState, ErrorState, StatusBadge, LoadingSkeleton, FeatureErrorBoundary)
 │    ├── features/agro-advisory/
 │    ├── features/auth/ (AuthProvider, LoginPage, authApi)
 │    ├── features/climate-risk/
 │    ├── features/crop-context/
 │    ├── features/cross-border/
 │    ├── features/disease-diagnosis/
 │    ├── features/escalation-dashboard/
 │    ├── features/field-memory/
 │    ├── features/health-score/
 │    ├── features/regen-ag/
 │    ├── features/satellite-health/
 │    ├── features/soil-intelligence/
 │    ├── features/voice/
 │    ├── features/weather-intelligence/
 │    ├── services/apiClient.js
 │    └── lib/cn.js
 │
 ├── Node.js (server/) — JavaScript (.js), no TypeScript
 │    ├── index.js (Express app, routing, security middleware)
 │    ├── middleware/ (auth, errorHandler, rateLimiter, validate)
 │    ├── db/ (connection, migrate, migrations/*.sql, repositories/*)
 │    ├── jobs/ (scheduler, ingestWeather, recomputeStages)
 │    ├── models/ (Database, Feedback — domain type shapes as JSDoc, not TS interfaces)
 │    ├── services/pythonClient.js (HTTP bridge to ai-service)
 │    └── modules/
 │         ├── auth/  ├── field/   ├── crop/       ├── weather/
 │         ├── soil/  ├── disease/ ├── satellite/  ├── health-score/
 │         ├── advisory/ ├── climate-risk/ ├── regen/ ├── voice/
 │         ├── feedback/ ├── escalation/ └── cross-border/
 │
 └── Python (ai-service/) — already Python, kept and consolidated
      ├── main.py (FastAPI app + router registration)
      ├── services/gemini_client.py (Gemini text + vision wrapper)
      ├── models/schemas.py (Pydantic schemas)
      └── routers/
           ├── crop.py        (crop identification — vision AI)
           ├── disease.py     (disease diagnosis — vision AI)
           ├── vision.py      (soil report OCR/vision AI)
           ├── advisory.py    (advisory generation — LLM)
           ├── climate.py     (climate risk assessment — LLM)
           ├── cross_border.py(cross-region insight matching)
           ├── phenology.py   (GDD / crop-stage scientific calc)
           ├── weather_rules.py (rule-threshold evaluation over time series)
           ├── health.py      (multi-dimension health-score computation)
           ├── satellite.py   (NDVI trend + anomaly detection — geospatial)
           ├── regen.py       (regenerative-practice plan generation — LLM)
           └── voice.py       (STT/TTS — audio AI)
```

---

## 3. Module-by-Module Mapping Table

| Module | Current Code | Final Language | Reason |
|---|---|---|---|
| Frontend app shell, routing | `client/src/App.tsx`, `app/*` | React | UI composition, routing, browser-only concerns |
| Field context/state | `app/providers/FieldProvider.tsx` | React | Frontend state (Context API) |
| UI primitives | `components/ui/*.tsx` | React | Reusable UI components |
| All `features/*` (13 feature folders) | `.tsx` components + `.ts` API clients + `.ts` types | React | UI, forms, charts, maps, camera capture, mic button, user interaction |
| Frontend API clients (`*Api.ts` in each feature) | e.g. `advisoryApi.ts`, `weatherApi.ts` | React (JS) | Thin `fetch` wrappers calling the Node API — browser logic, stays with the frontend bundle |
| `apiClient.ts` | `client/src/services/apiClient.ts` | React (JS) | Centralized HTTP client + `ApiError`, browser-side |
| Express app entry | `server/src/index.ts` | Node.js | Server bootstrap, CORS, security middleware, route mounting |
| Auth (JWT/OTP) | `modules/auth/*`, `middleware/auth.ts` | Node.js | Authentication/authorization is backend business logic |
| All `*.routes.ts` (13 files) | crop, weather, soil, disease, regen, climate-risk, advisory, voice, feedback, satellite, health-score, escalation, cross-border | Node.js | HTTP request handling / API surface |
| All `*.service.ts` orchestration (field, crop, weather, soil, escalation) | `modules/*/​*.service.ts` | Node.js | Business logic, DB orchestration, calling Python for compute — this is exactly what Node should own |
| DB repositories | `db/repositories/*.ts` | Node.js | Database communication (Postgres) |
| DB connection/migrations | `db/connection.ts`, `db/migrate.ts`, `db/migrations/*.sql` | Node.js (SQL unchanged) | Backend data access; `.sql` files stay as-is regardless of app language |
| `PythonClient` | `services/pythonClient.ts` | Node.js | External API integration — this **is** the Node↔Python bridge, correctly placed |
| `RegenAI.ts`, `DocumentParser.ts`, `VoiceAdapter.ts`, `WeatherRuleEngine.ts` | `modules/regen`, `modules/soil`, `modules/voice`, `modules/weather` | Node.js | Already thin delegation wrappers around `PythonClient` — stay in Node, keep delegating |
| `WeatherProvider.ts` / `OpenMeteoProvider.ts` | `modules/weather/*` | Node.js | External weather API integration (I/O, not computation) |
| `satellite.provider.ts` (mock tile source) | `modules/satellite/satellite.provider.ts` | Node.js | This is a data **source/stub** (simulates fetching a tile), not image processing. Real NDVI processing already happens in Python (`routers/satellite.py`) |
| `satellite.store.ts` | `modules/satellite/*` | Node.js | In-memory/DB caching of tiles — backend data access |
| Jobs / scheduler | `jobs/scheduler.ts`, `ingestWeather.ts`, `recomputeStages.ts` | Node.js | Cron orchestration, calls into Node services (which call Python) |
| Middleware | `middleware/*.ts` | Node.js | Rate limiting, validation, error handling — backend cross-cutting concerns |
| Domain type shapes | `models/Database.ts`, `models/Feedback.ts` | Node.js (JSDoc typedefs, not TS interfaces) | Documentation of shapes without TypeScript's compile-time type system |
| Crop identification (vision) | `ai-service/routers/crop.py` | Python | Gemini Vision multimodal AI call |
| Disease diagnosis (vision) | `ai-service/routers/disease.py` | Python | Gemini Vision multimodal AI call |
| Soil report parsing (vision/OCR) | `ai-service/routers/vision.py` | Python | Image/document vision AI |
| Advisory generation (LLM) | `ai-service/routers/advisory.py` | Python | LLM prompt orchestration, localization |
| Climate risk assessment (LLM) | `ai-service/routers/climate.py` | Python | LLM reasoning over weather/region context |
| Cross-border insight matching | `ai-service/routers/cross_border.py` | Python | Climate-zone comparison / ML-style matching |
| Phenology / GDD calculation | `ai-service/routers/phenology.py` | Python | Scientific (growing-degree-day) calculation |
| Weather rule evaluation | `ai-service/routers/weather_rules.py` | Python | Threshold/time-series rule evaluation — CPU/data processing |
| Health score computation | `ai-service/routers/health.py` | Python | Multi-dimension scientific scoring |
| Satellite NDVI trend + anomaly detection | `ai-service/routers/satellite.py` | Python | Geospatial/vegetation-index processing |
| Regen plan generation | `ai-service/routers/regen.py` | Python | AI-driven agronomic recommendation |
| Voice STT/TTS | `ai-service/routers/voice.py` | Python | Audio AI |
| Gemini client wrapper | `ai-service/services/gemini_client.py` | Python | AI/LLM SDK integration |
| Pydantic schemas | `ai-service/models/schemas.py` | Python | Structured-output contracts for the AI service |

---

## 4. Files/modules to **keep** (structure and responsibility are correct — only language/syntax changes, no redesign)

- `server/src/modules/*` — the module-per-feature folder structure (routes + service pattern)
- `server/src/db/repositories/*` — repository pattern for Postgres access
- `server/src/services/pythonClient.ts` — the Node→Python bridge; this is the exact seam the task wants formalized
- `server/src/jobs/*` — cron job structure
- `client/src/features/*` — feature-folder frontend structure
- `client/src/components/ui/*` — shared UI primitive library
- `client/src/app/providers/FieldProvider.tsx` — Context pattern for field state
- Entire `ai-service/` FastAPI app — routers, Pydantic schemas, Gemini client. Already correctly Python; **no relocation needed**, only internal cleanup (see §9)
- SQL migrations (`server/src/db/migrations/*.sql`) — unaffected by the JS/TS decision

## 5. Files/modules to **convert** (TypeScript → JavaScript, same logic/location)

- All 60 files under `server/src/**/*.ts` → `.js` (strip type annotations, interfaces become JSDoc typedefs or plain objects, `enum`s become frozen objects/string unions)
- All 73 files under `client/src/**/*.ts(x)` → `.js`/`.jsx` (strip prop/interface types, convert `React.FC<Props>` typings to plain function components, drop generics)
- `server/tsconfig.json`, `client/tsconfig*.json` → removed, replaced by `jsconfig.json` (optional, for editor path/alias support only)
- Vite/Vitest configs (`vite.config.ts`, `vitest.config.ts`) → `.js` (Vite fully supports JS configs)
- `eslint.config.mjs` (root) → not needed once ghost root is removed; `client`'s own lint config (`oxlintrc.json`) stays

## 6. Files/modules to **move to Python** (none — already correctly placed)

No existing Node.js or React code performs AI/ML/geospatial/scientific work that is *not already* delegated to `ai-service`. The audit and code review confirm every AI/scientific computation already lives behind `PythonClient` calls into FastAPI routers. **No migration of logic into Python is required** — only the Node-side JS conversion of the thin wrapper files (`RegenAI`, `DocumentParser`, `VoiceAdapter`, `WeatherRuleEngine`, `pythonClient`) that call it.

## 7. Files/modules to **move to React** (none — already correctly placed)

All UI, forms, camera capture, maps, charts, and browser state already live under `client/src`. Nothing backend-only needs to move to the frontend.

## 8. Files/modules to **move to Node.js** (none — already correctly placed)

All API/auth/DB/business-orchestration/notification code already lives under `server/src`. Nothing needs to move into Node from elsewhere — this task is a conversion of existing Node/TS files to Node/JS, not a relocation.

## 9. Files/modules that should **not be changed**

- `ai-service/**/*.py` — already Python, already correctly scoped; leave logic untouched during this migration (only later, unrelated hardening — see `CODEBASE_AUDIT.md` — should touch it)
- `server/src/db/migrations/*.sql` — SQL is language-agnostic to this migration
- `docs/*.md`, `README.md` (once corrected — see below), `CODEBASE_AUDIT.md` — documentation, not code
- `.gitignore` files

## 10. Duplicate / unnecessary code (found during analysis)

| Item | Problem |
|---|---|
| Root `package.json`, `tsconfig.json`, `eslint.config.mjs`, `AGENTS.md`, `CLAUDE.md` | **Dead Next.js scaffold.** `package.json` name is literally `"temp-app"` and pulls in `next`, a second copy of `react`/`react-dom`, and a second `@react-google-maps/api` — none of it is used; the real frontend is `client/` (Vite). This is the single biggest source of confusion in the repo. |
| Root `README.md` | Describes `create-next-app` / `npm run dev` for a Next.js app that isn't the real project — misleading for any new contributor. Needs to be replaced with a real AgriMesh README (client + server + ai-service run instructions). |
| `fix_imports.js`, `move_files.sh` | One-off scripts from a *previous* internal refactor (Layer1Service → field.service.ts, etc.). Already applied — the imports in `server/src` already reflect the "after" state. These scripts are now inert history and should not be re-run. |
| Root-level `@react-google-maps/api` (root `package.json`) vs. `client/package.json`'s copy | Duplicate dependency declaration across the dead root and the real client — another symptom of the ghost Next.js app. |
| `client/package.json` — `tailwindcss` / `@tailwindcss/vite` under `dependencies` instead of `devDependencies` | Minor packaging inconsistency (noted in `CODEBASE_AUDIT.md`), not a duplication but worth fixing alongside the language migration since `package.json` is being touched anyway. |

No duplicate *business logic* was found between Node and Python — the delegation pattern is clean (Node calls Python once per capability, no re-implementation on either side).

## 11. Recommended final folder structure

```text
AgriMesh/
├── client/                      # React (JavaScript, .jsx)
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── components/ui/
│   │   ├── features/<feature>/{api,components,hooks,types→jsdoc}/
│   │   ├── services/
│   │   └── lib/
│   ├── package.json
│   ├── jsconfig.json            # optional, replaces tsconfig
│   └── vite.config.js
│
├── server/                      # Node.js (JavaScript, .js)
│   ├── src/
│   │   ├── modules/<domain>/{*.routes.js, *.service.js}
│   │   ├── db/{connection.js, migrate.js, migrations/*.sql, repositories/*.js}
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/               # JSDoc typedefs
│   │   └── services/pythonClient.js
│   └── package.json
│
├── ai-service/                  # Python (unchanged)
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── models/schemas.py
│   └── requirements.txt
│
├── docs/
├── README.md                    # rewritten to describe the real 3-service architecture
└── (root package.json, tsconfig.json, eslint.config.mjs, AGENTS.md, CLAUDE.md, fix_imports.js, move_files.sh — REMOVED)
```

## 12. Migration order (safe sequence — no functionality lost, testable at each step)

1. **Baseline safety net** — run existing test suites (`server` Vitest, `client` Vitest) and record current pass/fail state before touching anything, so regressions are visible.
2. **Remove the ghost root Next.js scaffold** (`package.json`, `tsconfig.json`, `eslint.config.mjs`, `AGENTS.md`, `CLAUDE.md`, `fix_imports.js`, `move_files.sh`) and rewrite root `README.md`. Zero risk — nothing in `client/` or `server/` depends on the root scaffold.
3. **Convert `server/` from TypeScript to JavaScript**, module by module, leaf-first (repositories → services → routes → `index.ts`), since repositories have no internal dependents to break. Re-run backend tests after each module.
4. **Convert `client/` from TypeScript to JavaScript**, feature by feature, leaf-first (types/API clients → components → pages → `App.tsx`), since each `features/*` folder is largely self-contained. Re-run frontend tests after each feature.
5. **Update build tooling** — `vite.config`, `vitest.config`, `tsconfig*` removal, `package.json` scripts (`tsc -b && vite build` → plain `vite build`; server `tsc`/`tsx` → plain `node`/`nodemon`).
6. **Leave `ai-service/` untouched** during steps 2–5; do a final pass afterward only to fix the packaging nit noted in §10 if desired.
7. **End-to-end smoke test** — run all three services together (`client` + `server` + `ai-service`) and walk the core farmer flow (onboarding → field → health score → advisory) to confirm the Node↔Python and React↔Node contracts still work after the language change.

## 13. Potential migration risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Losing type-checking safety net** | TypeScript currently catches shape mismatches between `PythonClient` responses, repository rows, and route handlers at compile time. Removing types removes that net. | Replace `interface`/`type` definitions with **JSDoc `@typedef`** blocks and enable `// @ts-check` + `checkJs` in a `jsconfig.json` during the transition so editors still catch mismatches without shipping TypeScript. |
| **`enum` → runtime values** | TS `enum`s (e.g. `StageEnum`) compile to JS objects but have subtly different semantics (reverse mapping, literal narrowing). | Convert to plain frozen objects (`Object.freeze({...})`) or string-literal unions documented via JSDoc; audit every `enum` usage for reverse-lookup reliance before converting. |
| **Decorator/generic-heavy code** | None found in this codebase (no NestJS-style decorators), so this specific risk is low here — confirmed during analysis. | N/A — verified low risk. |
| **Build script breakage** | `server/package.json`'s `build`/`start` scripts and `client/package.json`'s `build` script assume `tsc`. Removing TypeScript without updating scripts will break `npm run build`/CI. | Update scripts in the same commit as the conversion, not after. |
| **Existing test files are `.test.ts`/`.test.tsx`** | Vitest config, `tsconfig` path aliases, and `@testing-library` typings are wired to TS. | Convert test files alongside their source files in the same migration step (not as an afterthought) so coverage never drops to zero for a module mid-migration. |
| **`server/src/models/Database.ts`** defines the domain model relied on by *every* repository and service | High blast radius — it's the most-imported file in the backend. | Convert this file **first**, before any repository/service, and validate imports compile/run against it before proceeding. |
| **Legacy `/api/*` alias routes** in `index.ts` duplicate the `/api/v1/*` mounts | Not a language risk, but any accidental route-mounting typo during the `.ts → .js` rewrite of `index.ts` would silently break either the legacy or v1 surface (client currently may use either). | Diff the converted `index.js` route-mounting block line-by-line against the original before merging. |
| **Root scaffold removal accidentally deletes something referenced elsewhere** | Root `tsconfig.json` or `eslint.config.mjs` *could* theoretically be referenced by an IDE/CI config outside the repo tree shown here. | Grep the whole repo (including `.github/`, if present) for references to root config paths before deleting; none were found in this analysis, but re-verify at execution time. |
| **`ai-service` left as Python while everything else changes** | Team members unfamiliar with the existing delegation pattern might assume Python code also needs "converting" and duplicate logic into Node. | This document (and a short note in the new root `README.md`) should make explicit that Python is the **intended final state** for `ai-service`, not a leftover to be replaced. |

---

## Summary

- **React** — all of `client/src/**`, converted `.tsx → .jsx`. No relocation needed.
- **Node.js** — all of `server/src/**`, converted `.ts → .js`. No relocation needed.
- **Python** — all of `ai-service/**`, already correct, kept as-is.
- **Delete/replace** — the dead root Next.js scaffold and its README, plus two now-inert one-off scripts (`fix_imports.js`, `move_files.sh`).
- **No functionality gaps invented, no data loss, no premature migration performed** — this document is the map only, per Task 2. Actual conversion is a separate, subsequent task.