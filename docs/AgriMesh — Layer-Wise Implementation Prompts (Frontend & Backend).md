# AgriMesh — Layer-Wise Implementation Prompts (Frontend & Backend)

This file translates the AgriMesh HLI and Layer-by-Layer Roadmap into ready-to-use build prompts, one pair (Backend + Frontend) per layer, in the recommended build order (01 → 02 → 03 → 04 → 05 → 06 → 07 → 09 → 11 → 12 → 08 → 13 → 10 → 14). Each prompt is self-contained: paste it into your coding assistant (e.g. Claude Code) for that layer's slice of work. Cross-layer dependencies are called out explicitly so layers can be handed to different engineers/agents without losing context.

**How to use this doc:** work top to bottom. Each layer's Backend prompt should be run before its Frontend prompt, since the frontend prompt assumes the API contract from the backend exists. P0/MVP layers are marked; build those first end-to-end (backend+frontend) before touching P1/P2 layers.

---

## Layer 01 — Farmer & Field Foundation
*(P0 · MVP · Critical · No dependencies — root layer)*

### Backend Prompt
```
Build the Farmer & Field Foundation service for AgriMesh, an agricultural intelligence platform.

Context: This is the root layer every other layer attaches to. It has no upstream dependencies.

Data models needed:
- Farmer: id, phone_number (unique, primary auth key), name, preferred_language, created_at
- Field: id, farmer_id (FK), name, boundary (GeoJSON polygon), centroid (lat/lng), area_hectares,
  crop_type, crop_variety (nullable), sowing_date, irrigation_source (enum: rainfed/canal/borewell/drip/other),
  created_at, updated_at

Requirements:
1. Phone-number-based auth (OTP flow) — no passwords. Return a JWT/session token on verification.
2. CRUD endpoints for Farmer profile (get/update name, language).
3. CRUD endpoints for Field: create (with boundary + crop + sowing date), list farmer's fields,
   get single field, update, soft-delete.
4. Field boundary input: accept either a raw GeoJSON polygon (farmer drew it) OR a single GPS point +
   radius fallback (auto-detect parcel — stub this as a TODO calling out where a satellite-parcel-
   detection service would plug in later; for now just buffer the point into a polygon).
5. Multi-field support: a farmer can register more than one field; every other layer's queries must be
   scoped by field_id, not just farmer_id.
6. Validate sowing_date is not in the future beyond a sane planting window, and crop_type against a
   fixed enum/lookup table (start with rice, wheat, maize, soy — extend later).
7. All timestamps in UTC; all endpoints return field area computed server-side from the boundary
   (do not trust client-submitted area).

Deliverables: REST (or GraphQL) API, migrations, model validation, and a seed script with 2 sample
farmers and 3 sample fields for frontend development. No AI calls in this layer — it's pure data capture.
```

### Frontend Prompt
```
Build the onboarding + field registration flow for AgriMesh (mobile-first, works on low-end Android,
must degrade gracefully on 2G/3G).

Screens needed:
1. Phone number entry → OTP verification → language selection (large tap targets, icons + text,
   assume low literacy — use flags/regional icons alongside language names).
2. "Add your field" — map view centered on device GPS, farmer either:
   (a) taps their plot location and the app shows an auto-detected boundary they can confirm/adjust, or
   (b) draws the boundary manually with a simple tap-to-place-points map interaction.
   Keep this to the minimum number of taps possible — assume first-time smartphone map users.
3. Crop + sowing date entry — crop picker as a visual icon grid (not a dropdown), sowing date as a
   simple calendar picker defaulting to "today."
4. Field confirmation summary screen: field name (auto-suggested, editable), map thumbnail, crop,
   sowing date, "Confirm" button.
5. "My Fields" list view for farmers with multiple fields — each field as a card with a map thumbnail,
   crop icon, and name; tapping opens that field's profile (stub the destination for now, Layer 03 builds it).

Requirements:
- No password fields anywhere — phone + OTP only.
- Every screen must have a voice-prompt icon (stub: plays a pre-recorded instruction; real TTS
  wiring comes in Layer 11) since illiterate users are a primary persona.
- Support RTL and non-Latin scripts in all text rendering from day one, even if only English/Hindi
  are wired up initially — the component library must not assume Latin script.
- Offline-tolerant: if network drops mid-registration, cache the draft locally and retry submission
  rather than losing the farmer's input.
- Call the Layer 01 backend API from this prompt's Backend Prompt for all persistence.
```

---

## Layer 02 — Crop & Growth-Stage Context
*(P0 · MVP · Critical · Depends on Layer 01)*

### Backend Prompt
```
Build the Crop & Growth-Stage service for AgriMesh, on top of the existing Layer 01 Farmer/Field service.

Context: Every downstream layer (weather, satellite, disease diagnosis, advisory) needs to know the
current crop, variety, and growth stage of a field. This layer produces that.

Data models needed:
- CropCalendar (reference table): crop_type, region, typical_days_to_stage (germination, vegetative,
  flowering, maturity as day-ranges), growing_degree_day thresholds per stage.
- FieldCropState: field_id (FK), confirmed_crop, confirmed_variety, current_stage (enum), stage_confidence,
  accumulated_gdd, last_updated_from (enum: calendar_estimate/satellite_phenology/farmer_override).

Requirements:
1. Endpoint: given a field_id, return current growth stage. Compute it by:
   a. Pulling sowing_date and crop_type from Layer 01.
   b. Looking up the regional CropCalendar entry.
   c. Computing accumulated growing-degree-days from a weather data source (Layer 03 will provide
      this — for now stub with a simple daily-temperature-average placeholder function you can swap out).
   d. Mapping accumulated GDD to a stage using the CropCalendar thresholds.
2. Endpoint: crop/variety identification from an uploaded photo. Stub this as a call to a multimodal
   AI endpoint (Gemini) — define the request/response contract now (image in, {crop, variety, confidence}
   out) even if you mock the actual model call for local dev.
3. Endpoint: farmer can manually override/correct crop or variety — log the override as a distinct
   event (needed later for model feedback in Layer 12).
4. Business rule: if satellite phenology data (Layer 05) later disagrees with the calendar-estimated
   stage by more than one stage-step, flag it (store a `stage_conflict` boolean) rather than silently
   picking one — downstream layers should be able to see and reason about the disagreement.
5. Nightly batch job (or on-demand recompute) that updates current_stage for all active fields.

Deliverables: API + models + the recompute job + a lookup-table seed for at least rice, wheat, maize.
```

### Frontend Prompt
```
Build the crop confirmation and growth-stage display for AgriMesh, extending the Layer 01 field flow.

Screens needed:
1. Crop photo capture (camera or gallery) as an alternative/supplement to manual crop selection during
   field registration — show the AI's identified crop + variety with a confidence indicator, and let
   the farmer confirm or correct it with one tap (large "Yes, that's right" / "No, let me fix it" buttons).
2. Field home screen stage banner: "Day 46 — Flowering stage" as a prominent header on the field's
   main screen, with a one-line explanation of what matters most at this stage (pull copy from backend,
   don't hardcode agronomy text in the frontend).
3. A simple horizontal stage-progress indicator (germination → vegetative → flowering → maturity) so
   a low-literacy farmer can see visually where they are in the season without reading.
4. Correction affordance: tapping the stage banner lets the farmer say "this doesn't look right" and
   manually adjust crop/variety, which calls the override endpoint.

Requirements:
- Confidence must be shown visually (not as a raw percentage) — e.g. a filled/outline icon state —
  since a bare "82%" means nothing to the target user.
- If backend returns `stage_conflict: true`, show a gentle "we're double-checking your field's stage"
  state rather than an alarming error.
- This screen is the first thing a farmer sees after opening a field, so keep load time low — show a
  skeleton/cached previous state instantly, then refresh in the background.
```


---

## Layer 03 — Weather Intelligence
*(P0 · MVP · Critical · Depends on Layer 01, loosely on Layer 02)*

### Backend Prompt
```
Build the Weather Intelligence service for AgriMesh.

Context: Raw weather data is useless to a farmer without field + crop-stage context. This layer
localizes forecasts to a specific field and translates them into action-relevant flags (not just
storing raw meteorological data).

Data models needed:
- FieldWeatherSnapshot: field_id, date, source, rainfall_mm, temp_min, temp_max, humidity_pct,
  forecast_confidence, is_forecast (bool), ingested_at.
- WeatherEventFlag: field_id, event_type (enum: rain_expected/heat_event/dry_spell/humidity_spike),
  start_date, end_date, severity, generated_at.

Requirements:
1. Integrate with a meteorological data provider (design the integration behind an interface/adapter
   so the actual provider — e.g. a national met service API or a commercial weather API — can be
   swapped without touching business logic). Fetch by field centroid + elevation (from Layer 01).
2. Ingest short-range (7-day) and medium-range (14–30 day) forecasts on a scheduled job; store
   historical actuals separately from forecasts so accuracy can be audited later.
3. Derive WeatherEventFlags from raw data using simple, explainable rules to start (e.g. rainfall_mm >
   threshold in next 72h → rain_expected; forecast temp_max > crop-specific heat threshold → heat_event).
   Keep thresholds in a config table, not hardcoded, since Layer 02's stage data will later modulate them.
4. Endpoint: given field_id, return current localized forecast + active event flags, in structured form
   (not prose — prose generation happens in Layer 09/Gemini, this layer stays factual).
5. Endpoint: field weather history (for Layer 12's "similar to last time" feature later).
6. This layer must NOT generate farmer-facing language itself — it exposes structured facts and flags;
   Layer 09 is responsible for turning them into "hold off on irrigation."

Deliverables: adapter-pattern weather provider integration, scheduled ingestion job, event-flag rule
engine (config-driven), and query endpoints.
```

### Frontend Prompt
```
Build the weather-at-a-glance component for AgriMesh's field home screen.

Screens/components needed:
1. A compact weather strip on the field home screen: next-3-days icons (sun/rain/cloud) with the
   single most important derived message rendered as a short sentence, e.g. "Rain expected in 3 days,"
   sourced from the backend's structured flags — do not compose this sentence in the frontend; render
   whatever farmer-facing text the backend/advisory layer provides, falling back to a generic icon-only
   view if no text is available yet (since Layer 09 may not exist when this is first built).
2. A "Weather Details" expandable view: simple 5-day forecast cards (icon, high/low temp, rain chance),
   using icons and color, minimal numeric text.
3. Push/in-app banner treatment for an active WeatherEventFlag (e.g. an amber banner: "Heavy rain
   expected this week") that's dismissible but reappears each session until the event passes.

Requirements:
- Icons must work without color reliance alone (colorblind-safe) — pair icon shape + color, not color alone.
- Keep this component resilient to partial data (show what's available, never block the whole field
  screen if the weather call fails or is slow — timeout and show a cached/last-known state).
```

---

## Layer 04 — Soil Health Intelligence
*(P1 · MVP-should-have · Core · Depends on Layer 01)*

### Backend Prompt
```
Build the Soil Health service for AgriMesh.

Context: Soil is normally a static, disconnected lab report. This layer keeps it attached to the live
field profile, with a regional-inference fallback when no lab data exists.

Data models needed:
- SoilProfile: field_id, source (enum: lab_report/regional_inference), texture (enum: sandy/loam/clay/
  sandy_loam/clay_loam/etc), organic_matter_pct, nitrogen_level, phosphorus_level, potassium_level,
  water_holding_capacity (enum: low/medium/high), ph, report_date, raw_document_url (nullable).
- RegionalSoilBaseline (reference table): region_id, texture, avg_organic_matter, avg_npk, avg_ph —
  used as fallback when a farmer has no lab report.

Requirements:
1. Endpoint: upload a lab report (image or PDF) → extract structured soil data. Define the contract
   for a multimodal-AI document-understanding call (Gemini Multimodal): document in, structured
   SoilProfile fields out with per-field confidence. Mock the model call for local dev but keep the
   contract stable.
2. Endpoint: if no lab report exists for a field, return the RegionalSoilBaseline for that field's
   region as a clearly-flagged `source: regional_inference` profile, never silently presented as lab-grade.
3. Endpoint: plain-language soil summary generation is Layer 09's job (Gemini) — this layer only
   returns structured data + a `summary_text` field that Layer 09 populates asynchronously; don't
   hardcode summary sentences here.
4. Allow farmers to re-upload an updated lab report over time; keep history (soil doesn't change fast,
   but multi-season trend matters for Layer 10 regenerative recommendations later).

Deliverables: upload endpoint + document-parsing contract, regional-fallback logic, soil history query.
```

### Frontend Prompt
```
Build the Soil Health screens for AgriMesh.

Screens needed:
1. "Add soil report" — camera/gallery upload of a lab report, with a loading state ("Reading your
   soil report...") while the backend parses it, then a review screen showing extracted fields the
   farmer can correct before saving.
2. Soil summary card on the field home screen: plain-language framing ("Your soil holds water well
   but is low in nitrogen") pulled from backend `summary_text`, with a clear visual badge distinguishing
   "From your lab report" vs. "Estimated for your region" so farmers understand data provenance.
3. Empty state: if no soil data at all yet, show a friendly prompt to upload a report, with an
   explanation of why it helps ("this makes your irrigation advice more accurate").

Requirements:
- Never present a regional-inference estimate with the same visual confidence as an actual lab report —
  use distinct badges/colors.
- Handle low-quality photo uploads gracefully (blurry scan) — surface a retake prompt rather than a
  generic error if the backend signals low extraction confidence.
```

---

## Layer 05 — Satellite Field Health Intelligence
*(P0 · MVP · Critical · Depends on Layer 01 · Highest-latency integration — start early)*

### Backend Prompt
```
Build the Satellite Field Health service for AgriMesh.

Context: This gives continuous field visibility between farmer visits. It's the highest-latency
integration (imagery pipelines) in the whole system, so its interfaces should be designed to be
resilient to delayed/missing data from day one.

Data models needed:
- SatelliteTile: field_id, capture_date, provider, ndvi_mean, ndvi_by_subregion (grid of small polygons
  or pixel-cluster values within the field boundary), moisture_proxy, cloud_cover_pct, tile_url.
- FieldHealthTrend: field_id, date, ndvi_trend_direction (improving/stable/declining), moisture_trend,
  computed_at.
- AnomalyFlag: field_id, subregion_geometry, detected_date, anomaly_type (vegetation_decline/moisture_
  drop), severity, still_active (bool), resolved_date (nullable).

Requirements:
1. Integrate with a satellite imagery provider (Sentinel-2 or similar) behind an adapter interface,
   clipped to each field's boundary (Layer 01). Design for the reality that cloud cover means gaps in
   coverage — every consumer of this data must handle "no recent clean pass" as a normal state, not an error.
2. Scheduled ingestion job: on each new usable pass, compute NDVI/moisture proxy for the whole field
   AND at sub-field granularity (grid cells) so specific patches (e.g. "northeast corner") can be flagged.
3. Trend + anomaly detection: compare each new pass against the field's own rolling history (not just
   a single snapshot) to flag a declining sub-region — this is a time-series anomaly detection job, keep
   it as a swappable module (start rule-based: e.g. NDVI drop > X% vs. 2-pass rolling average in a
   sub-region → anomaly) so it can be upgraded to a proper Vertex AI model later without changing the API.
4. Endpoint: given field_id, return latest health trend + any active anomaly flags with their
   sub-field location (as GeoJSON so the frontend can render a highlighted patch on the map).
5. Endpoint: rolling time-series (for charts and for Layer 12's "compare to last season" feature).

Deliverables: adapter-pattern satellite provider integration, scheduled ingestion + sub-field anomaly
detection job (rule-based v1, model-upgradeable), and query endpoints returning geo-located flags.
```

### Frontend Prompt
```
Build the Satellite Field Health view for AgriMesh.

Screens/components needed:
1. Field map view showing the field boundary with a health-trend overlay (green/amber/red tint by
   sub-region) — this is the visual heart of "we can see your field without visiting it."
2. Tap-to-inspect: tapping a flagged patch shows a small card: "Possible stress — northeast corner,
   detected 2 days ago" with a "Go check it" call-to-action that deep-links into the photo-upload flow
   (Layer 07) pre-tagged with that patch's location.
3. A simple trend sentence on the field home screen ("Greener than last week" / "A patch is browning
   in the northeast corner") sourced from backend, not composed in frontend.
4. Graceful "no recent clear image" state (cloud cover gaps are normal) — never show a stale map as if
   it were current; show the last-known-good date explicitly ("Last clear image: 6 days ago").

Requirements:
- Map rendering must work on low-end devices — keep tile complexity/resolution reasonable, lazy-load
  imagery, cache the last successful render for offline viewing.
- Color coding must be paired with icons/labels, not color alone.
```

---

## Layer 06 — Crop Health Synthesis (Field Health Score)
*(P1 · MVP-should-have · Core · First fusion layer · Depends on Layers 02, 03, 04, 05)*

### Backend Prompt
```
Build the Crop Health Synthesis (Field Health Score) service for AgriMesh.

Context: This is the first true fusion point in the system — it combines Layers 02–05's outputs into
one multi-dimensional, explainable score. No single upstream source is sufficient alone.

Data model needed:
- FieldHealthScore: field_id, computed_at, crop_health (enum: good/moderate/concern + underlying value),
  water_condition, soil_condition, weather_risk, disease_risk, climate_stress, vegetation_trend
  (each dimension: value + severity level + short factual basis), synthesis_text (nullable — filled by
  Layer 09/Gemini, not this layer).

Requirements:
1. Endpoint/job: given a field_id, pull the latest outputs from Layer 02 (stage), Layer 03 (weather
   flags), Layer 04 (soil profile), Layer 05 (satellite trend + anomalies), and compute each of the
   seven dimensions using explicit, documented rules per dimension (e.g. water_condition = f(satellite
   moisture proxy, forecast rainfall, crop-stage water need from a lookup table)). Keep each dimension's
   computation as a separate, independently testable function — this is a fusion layer, not a black box,
   and every dimension must be traceable back to which upstream facts produced it.
2. Each dimension's output must include a short structured "basis" (e.g. `{dimension: "disease_risk",
   severity: "amber", basis: ["humidity above threshold 3 days running", "field history: blight in
   similar conditions last season"]}`) so Layer 09/Gemini has concrete facts to reason over and explain,
   rather than needing to re-derive them.
3. Recompute on a schedule (e.g. daily) and on-demand when any upstream layer changes materially
   (new satellite pass with an anomaly, new severe weather flag).
4. Do NOT collapse the seven dimensions into a single opaque number anywhere in this layer — the
   product principle is explainable dimensions, not a composite score.

Deliverables: fusion computation service (documented per-dimension rules), scheduled + event-triggered
recompute, and a query endpoint returning the full structured score.
```

### Frontend Prompt
```
Build the Field Health Score display for AgriMesh's field home screen.

Screens/components needed:
1. A "field summary" hero section at the top of the field home screen: one synthesis sentence (from
   backend `synthesis_text`, with a sane fallback if Layer 09 hasn't populated it yet) plus a single
   overall color cue (green/amber/red) — this is what a farmer sees in the first 2 seconds.
2. Below it, seven small dimension cards/chips (Crop Health, Water, Soil, Weather Risk, Disease Risk,
   Climate Stress, Vegetation Trend), each with its own severity color + a one-tap expand showing the
   plain-language basis for that dimension.
3. Never show a raw composite number anywhere — no "72/100" score. The whole design principle is
   explainable dimensions over an opaque score.

Requirements:
- The hero synthesis sentence and color must load fast (this is the "farmer with two minutes and a
  phone signal" screen from the HLI) — prioritize this over the detailed dimension cards, which can
  lazy-load below the fold.
- Each dimension's "why" must be reachable in exactly one tap, never buried in a settings-like menu.
```

---

## Layer 07 — Crop Disease & Pest/Stress Diagnosis
*(P1 · MVP-should-have · Core · Depends on Layers 02, 03, 06, 01)*

### Backend Prompt
```
Build the Crop Disease & Pest/Stress Diagnosis service for AgriMesh.

Context: Visually similar symptoms (disease, pest, nutrient deficiency, water stress, heat stress)
require different — sometimes opposite — responses. Misdiagnosis wastes money and can harm the crop.
Honest uncertainty is a core requirement, not a nice-to-have.

Data model needed:
- DiagnosisEvent: id, field_id, photo_url, submitted_at, crop_type, growth_stage (snapshot from Layer 02
  at time of submission), recent_weather_snapshot (from Layer 03), field_health_context (from Layer 06),
  predicted_category (enum: disease/pest/nutrient_deficiency/water_stress/heat_stress/unknown),
  predicted_label (e.g. "bacterial leaf blight"), confidence (0-1), severity (enum: low/moderate/high),
  recommended_action_text (nullable — Layer 09 fills this), escalation_triggered (bool).

Requirements:
1. Endpoint: accept a farmer photo + field_id → assemble the full context bundle (crop/stage from
   Layer 02, recent weather from Layer 03, field health from Layer 06, this field's disease history)
   and call a multimodal AI model (Gemini Multimodal) for differential diagnosis. Define the request
   (image + structured context) / response (category, label, confidence, severity, differential
   reasoning notes) contract now; mock the model call for local dev.
2. The model prompt/response contract MUST force an explicit category choice including "unknown" —
   never let the system silently coerce a low-confidence read into one of the five known categories.
3. Confidence + severity jointly determine whether `escalation_triggered` is set (see Layer 13 for the
   consuming logic) — expose the thresholds as config, not hardcoded, since this is a safety-relevant
   decision that product/agronomy teams will need to tune.
4. Store every DiagnosisEvent permanently (feeds Layer 12 field history and eventually Layer 14
   cross-border disease pattern data, anonymized).
5. Endpoint: list a field's diagnosis history.

Deliverables: diagnosis endpoint with context-assembly + AI-model contract, config-driven escalation
thresholds, and history query. This layer stays factual/structured — farmer-facing phrasing is Layer 09's job.
```

### Frontend Prompt
```
Build the Crop Disease Diagnosis flow for AgriMesh.

Screens needed:
1. Photo capture — camera-first (not gallery-first) with an in-frame guide overlay ("Center the
   affected leaf/area"), reachable in one tap from the field home screen and from a tapped satellite
   anomaly patch (Layer 05 deep-link, pre-tagging location if available).
2. Analyzing state — a short, honest loading state ("Looking closely at your photo...") — avoid
   implying instant certainty.
3. Result screen: category + label + confidence shown visually (not a raw percentage — use a simple
   "how sure are we" indicator with 3 tiers: fairly sure / somewhat sure / not sure), severity as a
   color cue, and the recommended action as the most prominent element on the screen (per the six-
   question advisory structure — the "what should I do" answer must dominate, not the diagnosis label).
4. Explicit "unknown/not sure" result state — designed as a first-class, non-broken-feeling screen
   ("We're not confident enough to tell you what this is — let's get a human to look"), not an error page.
5. Escalation hand-off screen when `escalation_triggered` is true: "Connecting you to your local
   extension officer" with next-step expectations (stub the actual human routing — Layer 13 owns that).

Requirements:
- Never let the UI present a diagnosis with more visual authority than its confidence warrants — the
  design system needs a shared "confidence chrome" component used consistently across diagnosis,
  weather, and satellite screens.
- Support offline photo capture with background upload/retry (fields often have poor connectivity).
```

---

## Layer 09 — AI Agro-Advisory (Reasoning Core)
*(P0 · MVP · Critical · The product's central promise · Depends on Layers 02–08)*

### Backend Prompt
```
Build the AI Agro-Advisory reasoning engine for AgriMesh — the layer where fusion becomes judgment.

Context: This is the product's core value: turning many partial signals (crop stage, weather, soil,
satellite, health score, disease diagnosis, climate risk, farmer notes, field history) into ONE
prioritized, explained, actionable recommendation. Every recommendation must answer six questions:
what is happening / why / how serious / what to do / when / what to monitor next. Never emit a vague
observation without a next step — including a deliberate "no action needed" when that's genuinely correct.

Data model needed:
- Advisory: id, field_id, generated_at, trigger (enum: scheduled/farmer_query/event_flag), what_text,
  why_text, severity, action_text, action_deadline, monitor_text, source_layers (array of which
  upstream layer outputs were used — for traceability/debugging), farmer_response (enum: followed/
  ignored/overridden, nullable), overridden_reason (nullable, farmer free text).

Requirements:
1. Build a context-assembly step that pulls the current state from Layers 02 (stage), 03 (weather),
   04 (soil), 05 (satellite), 06 (health score + per-dimension basis), 07 (recent diagnoses), 08
   (climate risk, once it exists), and 12 (field history, once it exists) into one structured bundle.
2. Build the reasoning call: send the structured bundle to Gemini with a prompt that enforces the
   six-question structure as the output schema (what/why/how serious/action/deadline/monitor) — do
   not let the model free-write prose without that structure; validate the response against the schema
   before storing/returning it.
3. Endpoint: "what should I do today" — synchronous, on-demand advisory generation for a given field
   (Scenario 1 from the HLI).
4. Endpoint: farmer free-text/voice Q&A grounded in the field profile — same context bundle, different
   prompt framing, still must ground every answer in actual field data, never answer generically.
5. Scheduled job: proactive advisory generation triggered by upstream event flags (a severe weather
   flag, a new satellite anomaly, a high-severity diagnosis) rather than only on-demand — this powers
   the proactive push notifications described in the HLI (e.g. Scenario 4, extreme weather lead time).
6. Log every advisory's `source_layers` so a human can audit exactly which upstream facts produced a
   given recommendation — this traceability is required before this layer can be trusted in production.
7. Endpoint: record farmer response (followed/ignored/overridden + reason) — feeds Layer 12.

Deliverables: context-assembly service, schema-validated Gemini reasoning call, on-demand + proactive
advisory generation, farmer Q&A endpoint, and response-logging endpoint.
```

### Frontend Prompt
```
Build the AI Agro-Advisory experience for AgriMesh — this is the product's central screen.

Screens/components needed:
1. The advisory card, shown prominently on the field home screen: single dated, actionable
   recommendation rendered per the six-question structure — but NOT as six labeled fields; write it as
   the natural short paragraph the backend already composed (what/why/severity/action/deadline/monitor
   are baked into `what_text`/`why_text`/etc., render them as a coherent flow, e.g. headline = action,
   supporting line = why, small footer = what to monitor).
2. A clear "no action needed" state that still feels reassuring and specific ("Conditions are good —
   nothing to do today"), not just an absence of a card.
3. Farmer response affordance: "I'll do this" / "I already did something else" / "This doesn't seem
   right" — feeding directly into the response-logging endpoint; the override path should let the
   farmer add a short free-text or voice note on why.
4. A simple ask-a-question entry point ("Ask about your field") — text or voice input, answer rendered
   in the same card style as the proactive advisory, always grounded and never generic-sounding.
5. Proactive advisory notification/banner handling: when the backend pushes a new advisory outside the
   normal refresh cycle (e.g. an extreme-weather warning), surface it with appropriate urgency styling
   without being alarmist for routine updates.

Requirements:
- This card is the single most important UI surface in the product — it must load first, before every
  other field-home-screen element, even if it means other cards (weather strip, health score) stream
  in after it.
- Copy must never be composed client-side beyond simple templating — always render backend-provided text.
```

---

## Layer 11 — Voice & Multilingual Experience
*(P1 · MVP-should-have · Core for adoption · Depends on Layer 01 for language pref, Layer 09 for content)*

### Backend Prompt
```
Build the Voice & Multilingual delivery layer for AgriMesh.

Context: This is a delivery/interface layer around Layer 09's output, not a reasoning layer — it makes
every existing capability accessible without literacy or typing.

Requirements:
1. Speech-to-Text endpoint: accept an audio clip + field_id + language, return transcribed text. Design
   behind an adapter interface so the actual STT provider can be swapped.
2. Route transcribed text into Layer 09's farmer Q&A endpoint (reuse it — do not duplicate reasoning logic).
3. Text-to-Speech endpoint: accept text + language + a voice/register preference, return audio. Also
   behind an adapter interface.
4. Ensure Layer 09's Gemini prompts explicitly generate natural, agriculturally-fluent text directly in
   the farmer's target language (not literal machine translation of an English draft) — this may mean
   passing `preferred_language` into Layer 09's context bundle if it isn't already there; confirm/patch
   that contract as part of this layer's work.
5. Language/dialect switching endpoint updating Farmer.preferred_language (Layer 01), which should
   immediately affect all subsequent advisory generation and TTS output.
6. Design for graceful degradation: if TTS/STT for a requested language/dialect isn't yet supported,
   fall back to text-only in that language rather than failing the whole interaction.

Deliverables: STT adapter + endpoint, TTS adapter + endpoint, language-switch endpoint, and a documented
list of currently supported languages/dialects vs. text-only-fallback languages.
```

### Frontend Prompt
```
Build the voice-first interaction layer for AgriMesh.

Screens/components needed:
1. A persistent, always-reachable microphone button (not buried in a menu) on the field home screen —
   tap to ask a question aloud; visual feedback while recording and while the answer is being "thought
   through," then auto-play the spoken answer with the text also shown for anyone who can read.
2. Every advisory card, weather strip, health score, and diagnosis result gets a small speaker icon
   that reads the visible text aloud on tap — this must be wired consistently across every screen built
   in earlier layers, not just the advisory card.
3. Language switcher accessible from a single, obvious settings entry point, with language names shown
   in their own script (not just transliterated), large tap targets.
4. Fallback UI state for languages that are text-only (no TTS/STT yet) — clearly indicate this rather
   than silently failing when the mic button is tapped.

Requirements:
- Voice interaction must feel like a conversation, not a menu tree — no multi-step voice IVR-style
  navigation; one tap to talk, one response, done.
- Test with real device speakers/mics in noisy outdoor conditions in mind (this is a field-use product) —
  favor clear audio cues over subtle ones.
```

---

## Layer 12 — Farmer Feedback & Field Memory
*(P1 · MVP-should-have · Critical — the compounding mechanism · Depends on Layer 09, and 02–08 for outcome verification)*

### Backend Prompt
```
Build the Farmer Feedback & Field Memory service for AgriMesh — the loop-closing layer that makes
advice sharper season over season instead of just "correct on average."

Data models needed:
- FeedbackEvent: id, advisory_id (FK to Layer 09's Advisory), field_id, prompted_at, farmer_response
  (helped/didnt_help/no_response), follow_up_photo_url (nullable), follow_up_note (nullable), collected_at.
- OutcomeVerification: advisory_id, verification_method (enum: satellite_change_detection/farmer_photo/
  farmer_report), verified_outcome (enum: resolved/worsened/unchanged/unknown), verified_at.
- FieldTimelineEntry: field_id, date, entry_type (advisory/diagnosis/weather_event/farmer_note/
  satellite_anomaly), summary_text, linked_record_id, season_label.

Requirements:
1. Scheduled job: N days after any Advisory or DiagnosisEvent, trigger a "did this help?" prompt
   (surfaced via Layer 11/frontend) if no farmer response has been logged yet.
2. Endpoint: record farmer feedback (helped/didn't help + optional photo/note).
3. Outcome verification job: for advisories/diagnoses tied to a specific field location or condition,
   re-check Layer 05 (satellite) for that patch's trend after the expected resolution window, and/or
   use a submitted follow-up photo (re-run through Layer 07) to determine verified_outcome automatically
   where possible, falling back to farmer-reported outcome.
4. Build the season-by-season FieldTimeline: aggregate every advisory, diagnosis, weather event, and
   farmer note into a single chronological, filterable-by-season timeline per field.
5. Endpoint: "historical parallel" retrieval — given a field's current conditions, search that field's
   own past timeline for similar past conditions (e.g. similar weather-flag + stage combination) and
   return the matching past entry + its outcome, so Layer 09 can reason with "similar to the dry spell
   in week 5 last season."
6. This is the layer that produces the anonymized, aggregated outcome data Layer 14 will eventually
   consume — design the FeedbackEvent/OutcomeVerification schema now with future anonymized export in
   mind (avoid embedding farmer-identifying data directly in fields that would need per-record scrubbing).

Deliverables: feedback prompt scheduler, feedback + outcome endpoints, verification job (satellite +
photo + farmer-report fallback chain), timeline aggregation endpoint, historical-parallel search endpoint.
```

### Frontend Prompt
```
Build the Farmer Feedback & Field History screens for AgriMesh.

Screens needed:
1. A simple, low-friction "did this help?" prompt surfaced a few days after an advisory or diagnosis —
   two large buttons (thumbs-up / thumbs-down style, or "Yes it helped" / "Not really"), with an
   optional one-tap "add a photo" or short voice note, never a long form.
2. Field History / Timeline screen: a scrollable, season-filterable timeline of everything that's
   happened on the field (advisories, diagnoses, weather events, farmer notes), each entry as a compact
   card with date, icon by type, and a one-line summary; tapping expands full detail.
3. Season selector (simple tabs or dropdown: "This season" / "Last season" / "All time").
4. Surface historical-parallel callouts inline where relevant (e.g. inside an advisory card: "Similar
   to the dry spell in week 5 last season — that time, X happened") using backend-provided text.

Requirements:
- The feedback prompt must be dismissible without penalty (don't nag) but should reappear for future
  advisories even if a farmer skips it once.
- The timeline should feel like a source of pride/trust ("look how much we know about your field"),
  not a data-entry chore — lean visual, minimal text density.
```