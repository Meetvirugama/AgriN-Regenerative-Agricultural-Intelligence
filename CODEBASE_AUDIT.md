# AgriMesh Codebase Audit

**Date:** 2026-08-16
**Scope:** Full-stack — React/TypeScript frontend, Node.js/Express backend
**Purpose:** Prerequisite document before major architectural changes

---

## Executive Summary

AgriMesh is a well-conceived field-intelligence agricultural platform with thoughtful layer-based design and 13+ feature areas. The codebase is a **strong MVP skeleton** demonstrating product intent clearly.

However, it is **not production-ready**. Critical blockers:

- **No real database.** Entire backend uses in-memory JavaScript Maps. Server restart wipes all data.
- **No authentication.** Zero auth anywhere.
- **No Python/FastAPI service.** All "AI" is mock return values.
- **Root-level Next.js ghost.** Root `package.json` is an unused Next.js scaffold conflicting with the real Vite app.
- **Missing `ExtensionShell.tsx`** — imported in App.tsx but doesn't exist (runtime crash).
- **CORS is wide open** (`cors()` with no options).
- **No input validation** on any endpoint.
- **No tests** anywhere.

---

## Project Structure

```
root/
├── package.json       ⚠️  Ghost Next.js root — unused, conflicting
├── .next/             ⚠️  Should not exist
├── node_modules/      ⚠️  Next.js modules — unused
├── fix_imports.js     ⚠️  One-off script — delete
├── move_files.sh      ⚠️  One-off script — delete
├── eslint.config.mjs  ⚠️  Root ESLint for Next.js — unused
├── tsconfig.json      ⚠️  Root tsconfig conflicts with server/
├── docs/              ✅  Comprehensive product docs (4 files)
├── client/            ✅  Vite + React + TypeScript — real frontend
└── server/            ✅  Express + TypeScript — real backend
```

---

## Backend Issues

### Server Entry (`server/src/index.ts`)

| Issue | Severity |
|---|---|
| `cors()` with no config — accepts any origin | 🔴 Security |
| No rate limiting | 🔴 Security |
| No global error handler middleware | 🟡 Reliability |
| No API versioning (`/api/v1/`) | 🟡 Maintainability |
| Route mounting inconsistent (mixed `/api/fields` and `/api`) | 🟡 Maintainability |
| No graceful shutdown | 🟡 Reliability |

### Database (`server/src/models/Database.ts`)

| Issue | Severity |
|---|---|
| **Entire DB is in-memory JavaScript Map** — zero persistence | 🔴 Critical |
| Server restart = total data loss | 🔴 Critical |
| No PostgreSQL, SQLite, or any real DB | 🔴 Critical |
| Crop calendars hardcoded to 'punjab' only | 🟡 Data |
| Regional soil baseline hardcoded to 'US-MW' (conflicts with Punjab seed) | 🟡 Data |
| `any` types in DiagnosisEvent fields | 🟡 Type Safety |

### Crop Module

| Issue | Severity |
|---|---|
| `stub-init` creates new field with `field_${Date.now()}` — not idempotent | 🔴 Bug |
| Re-calling stub-init creates orphaned fields | 🔴 Bug |
| GDD uses flat 15/day rate — not using real temperature data | 🟡 Accuracy |
| `identifyCrop` always returns wheat/HD2967 | 🟡 MVP Stub |

### Advisory Module

| Issue | Severity |
|---|---|
| **Entire advisory is a static mock JSON object** — same for all fields | 🔴 Critical |
| No AI reasoning | 🔴 Critical |
| Advisory feedback is `console.log()` only — not saved | 🟡 Data Loss |

### Disease Module

| Issue | Severity |
|---|---|
| AI returns static mock based on file size (999 bytes = blurry) | 🔴 MVP Stub |
| Images never stored — `photo_url: 'mock_local_blob_url'` | 🔴 Missing |
| No file upload validation | 🔴 Security |

### Other Modules

| Module | Issue | Severity |
|---|---|---|
| Satellite | Anomaly seeded for `mock-field-1` — won't match real field IDs | 🔴 Bug |
| Escalation | In-memory — resets on restart; farmerId hardcoded `'farmer-123'` | 🔴 Critical |
| Feedback | Timeline fully mocked — same 3 entries for every field | 🔴 Bug |
| Climate Risk | Static heatwave mock for every field | 🔴 Bug |
| Regen | Hardcoded soybean/cotton/rice recommendations | 🔴 Stub |
| Voice | `transcribe()` returns hardcoded wheat heat stress question | 🔴 Bug |
| Jobs | **Never scheduled** — no cron runner registered | 🔴 Critical |

### Package Issues

| Issue | Severity |
|---|---|
| No `dev` or `start` script in `server/package.json` | 🔴 Critical |
| TypeScript `^7.0.2` — bleeding edge, verify compatibility | 🟡 Risk |

---

## Frontend Issues

### Critical Missing File

`App.tsx` imports `{ ExtensionShell } from './app/ExtensionShell'` — **this file does not exist**. Runtime crash when navigating to `/extension`.

### `FieldProvider.tsx`

| Issue | Severity |
|---|---|
| Always calls `stub-init` on mount — creates new field every mount | 🔴 Bug |
| No persistence of fieldId — page refresh loses context | 🔴 Bug |

### `Field.tsx`

| Issue | Severity |
|---|---|
| `fieldBoundary` hardcoded as 4-point polygon in India | 🔴 Bug |
| Image blob never sent — always `mock_base64` | 🔴 Bug |

### `DiseaseDiagnosisFlow.tsx`

| Issue | Severity |
|---|---|
| "Test Blurry Flow" debug button in production UI | 🔴 Should not ship |
| No real camera API integration | 🔴 Missing |

### `SoilSummaryCard.tsx`

| Issue | Severity |
|---|---|
| Shows "Summary generation pending Layer 09 integration" to farmers | 🔴 UX |

### `GlobalMicButton.tsx`

| Issue | Severity |
|---|---|
| Sends empty Blob — no real audio recording | 🔴 Bug |

### CSS

| Issue | Severity |
|---|---|
| `animate-fade-in-up` referenced in GlobalMicButton but `@keyframes` not defined | 🔴 Bug |
| Mix of Tailwind utilities and legacy CSS classes (`.sharp-card`) | 🟡 Inconsistency |

### Dependencies

| Issue | Severity |
|---|---|
| `@react-google-maps/api` installed but unused | 🟡 Unused |
| `tailwindcss` and `@tailwindcss/vite` in `dependencies` (should be `devDependencies`) | 🟡 Package |

---

## Security Issues

| Problem | Risk |
|---|---|
| No authentication on any endpoint | 🔴 Critical |
| CORS allows all origins | 🔴 High |
| No rate limiting | 🔴 High |
| No input validation | 🔴 High |
| File uploads without type/size validation | 🔴 High |

---

## What's Good — Preserve These

| Item | Why |
|---|---|
| Feature-based folder structure | Clean, scalable |
| `apiClient.ts` with `ApiError` | Typed, centralized |
| `FieldProvider` context pattern | Right abstraction |
| `health-score.service.ts` rule engine | Real logic, not mock |
| `satellite.service.ts` + `satellite.store.ts` | Good separation |
| `Database.ts` interface definitions | Excellent domain model |
| Consent checkbox before escalation | Critical data ethics |
| Confidence dots in DiagnosisFlow | Good AI uncertainty UX |
| `Promise.allSettled` in Field.tsx | Non-blocking parallel fetches |
| Design system CSS tokens | Light/dark, extensible |
| Data provenance badging in SoilSummaryCard | Farmer trust |
| `Button.tsx` with min touch target | Accessibility correct |

---

## Layer Status

| Layer | Status |
|---|---|
| L01 — Farmer & Field Foundation | ⚠️ Stub only |
| L02 — Crop & Growth Stage | ⚠️ Mock (always wheat) |
| L03 — Weather Intelligence | ⚠️ Mock random data |
| L04 — Soil Intelligence | ✅ Structure good, parser stubbed |
| L05 — Satellite Health | ✅ Good structure, mock provider |
| L06 — Field Health Score | ✅ Best implemented — real rule logic |
| L07 — Disease Diagnosis | ⚠️ Mock AI, no real image |
| L08 — Climate Risk | ⚠️ Static mock |
| L09 — AI Advisory | ⚠️ Static mock — most critical gap |
| L10 — Regen Planning | ⚠️ Hardcoded plans |
| L11 — Voice Interface | ⚠️ Mock STT/TTS |
| L12 — Field Memory/Timeline | ⚠️ Hardcoded 3 entries |
| L13 — Escalation Dashboard | ✅ Good structure, in-memory |
| L14 — Cross-Border Intelligence | ⚠️ Static mock |

---

## Implementation Plan (9 Phases)

### Phase 1 — Critical Bugs (Do First)
1. Create missing `client/src/app/ExtensionShell.tsx`
2. Fix `stub-init` idempotency — stable field IDs
3. Fix `SatelliteStore` — remove hardcoded `mock-field-1`
4. Remove "Test Blurry Flow" debug button
5. Add `@keyframes fadeInUp` to CSS
6. Fix `SoilSummaryCard` — replace "pending Layer 09" text
7. Persist `fieldId` in `sessionStorage` in `FieldProvider`

### Phase 2 — Architecture Foundation
1. Remove ghost Next.js artifacts from root
2. Add `dev` script to `server/package.json`
3. Add `.env.example` documentation
4. Add API versioning `/api/v1/`
5. Restrict CORS to known origins
6. Add `express-rate-limit`
7. Add global error handler middleware
8. Add input validation (Zod)

### Phase 3 — Real Data Persistence
1. Set up PostgreSQL + PostGIS
2. Migrate interfaces to real schema
3. Implement stable UUID-based field registration
4. Replace all in-memory Maps with DB queries
5. Add migration system

### Phase 4 — Authentication & Security
1. Phone-based OTP authentication
2. JWT middleware on all field-scoped routes
3. Field ownership authorization
4. File upload validation (multer + type/size)
5. Helmet.js secure headers

### Phase 5 — Backend Stabilization
1. Connect real weather API (Open-Meteo)
2. Schedule background jobs (node-cron)
3. Wire HealthScoreService to real Layer 02/03/04 data
4. Persist feedback and timeline in Postgres
5. Persist escalations in Postgres

### Phase 6 — Python/FastAPI Service
1. Bootstrap FastAPI at `python/`
2. Crop identification via Gemini Vision
3. Disease diagnosis via multimodal AI
4. Advisory generation (structured 6-question format)
5. Node.js → Python proxy calls
6. Image storage (S3/GCS)

### Phase 7 — Frontend Improvements
1. Add React Error Boundaries per feature section
2. Add farmer onboarding UI (no "create field" screen exists)
3. Real camera capture in DiseaseDiagnosisFlow
4. Real STT (Web Speech API fallback)
5. Fix styling inconsistencies

### Phase 8 — Testing
1. Backend integration tests (supertest)
2. Service unit tests
3. Frontend component tests (RTL)
4. End-to-end farmer journey test

### Phase 9 — Performance & Polish
1. Pagination (timeline, history)
2. Redis caching for weather forecasts
3. API response timeouts
4. Loading/error/empty states audit

