# AgriMesh (AgriN & Regenerative Agricultural Intelligence) — Feature Documentation

**Repository:** `AgriN-Regenerative-Agricultural-Intelligence-main`
**Architecture:** 3-tier — `client/` (React 19 + Vite), `server/` (Node.js + Express, API gateway / DB orchestration), `ai-service/` (Python + FastAPI, Gemini + PyTorch inference). Supporting `ml/` directory holds offline training/evaluation scripts and per-crop model artifacts.

> Scope note: This document covers every backend module (`server/src/modules/*`, `ai-service/routers/*`, `ai-service/services/*`) and the client integration points that consume them. Client UI components are referenced by the feature they belong to rather than documented file-by-file.

---

## 1. Authentication (OTP + Email/Password, JWT)

### 1.1 How It Works
- **Purpose:** Farmer identity, session issuance, and route protection.
- **Files:** `server/src/modules/auth/auth.routes.js`, `auth.service.js`, `server/src/db/repositories/authRepository.js`, `farmerRepository.js`, `server/src/middleware/auth.js`, `server/src/middleware/rateLimiter.js`.
- **Flow (OTP):** `POST /api/auth/request-otp` → `AuthService.requestOtp()` generates a 6-digit code (`crypto.randomInt`), stores it via `authRepo.createOtp()` (table `otp_codes`), and logs it to the console in development (no real SMS integration — see Errors). `POST /api/auth/verify-otp` → `authRepo.verifyOtp()` checks expiry/attempts/match, then `farmerRepo.upsertFarmer()` auto-creates the farmer account on first login, and `AuthService.issueTokens()` signs a JWT access token (`jsonwebtoken`, `JWT_EXPIRES_IN`, default 7d) plus a random 256-bit refresh token stored (SHA-256 hashed) via `authRepo.saveRefreshToken()`.
- **Flow (Email/Password):** `POST /api/auth/login` → `AuthService.loginWithPassword()` looks up the farmer by email and compares the password with `bcryptjs`.
- **Flow (Refresh/Logout):** `POST /api/auth/refresh` rotates the refresh token (`authRepo.revokeRefreshToken` + reissue). `POST /api/auth/logout` revokes one or all refresh tokens for the farmer.
- **Middleware:** `requireAuth` (in `middleware/auth.js`) validates the `Authorization: Bearer` header via `AuthService.verifyAccessToken()` and sets `req.farmer`. `optionalAuth` does the same without blocking.
- **DB:** tables `otp_codes`, `refresh_tokens`, `auth_audit_log`, `farmers` (migrations `008_auth.sql`, `009_email_auth.sql`).
- **Rate limiting:** `authLimiter` (100 req / 15 min) applied to all `/auth/*` routes.
- **Input/Output:** JSON in, `{ accessToken, refreshToken, expiresIn, farmer }` out.

### 1.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `DATABASE_URL environment variable is not set.` (thrown at process start) | `.env` missing/incomplete | `server/src/db/connection.js` |
| `[Auth] WARNING: JWT_SECRET is not set. Using insecure dev default.` | `JWT_SECRET` not configured | `auth.service.js` |
| `OTP expired or not found. Please request a new code.` | No matching unexpired/unused OTP row | `authRepository.js: verifyOtp()` |
| `This OTP has already been used.` | OTP reused | `authRepository.js: verifyOtp()` |
| `Too many incorrect attempts. Please request a new code.` | `attempts >= 5` | `authRepository.js: verifyOtp()` |
| `Incorrect code. Please try again.` | Code mismatch | `authRepository.js: verifyOtp()` |
| `Invalid email or password` | Email not found or bad password | `auth.service.js: loginWithPassword()` |
| `Account does not have a password set. Please use OTP.` | Farmer has no `password_hash` | `auth.service.js: loginWithPassword()` |
| `Refresh token invalid or expired. Please log in again.` | Token not found/expired/revoked | `auth.service.js: refreshAccessToken()` |
| `TokenExpiredError` / `Invalid token` → HTTP 401 | Expired or malformed JWT | `middleware/auth.js: requireAuth()` |
| 422 validation error (`Invalid phone number format`, `OTP must be exactly 6 digits`, etc.) | Zod schema rejects `req.body` | `auth.routes.js` (via `middleware/validate.js`) |

### 1.3 Solutions
- **DATABASE_URL / .env missing:** Create `server/.env` with `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`. Note: the referenced `server/.env.example` file does **not exist** in the repository — one should be added (see Suggestions).
- **JWT_SECRET default:** Always set `JWT_SECRET` outside development; the fallback string is committed in source and is a security risk in any deployed environment.
- **OTP failures:** Instruct the user to request a new OTP; the attempt counter and expiry are enforced server-side and require no code change to operate correctly.
- **401 on protected routes:** Client should call `POST /api/auth/refresh` with the stored `refreshToken` and retry; `AuthProvider.jsx` on the client already does this on app boot.

### 1.4 Suggestions for Improvement
- **Security:** Real SMS delivery (Twilio/AWS SNS) is stubbed — `AuthService.requestOtp()` only logs to console (`// TODO Phase 5: integrate Twilio / AWS SNS`), meaning OTP login is not deliverable outside development. Also `JWT_SECRET` should fail-fast (throw) rather than silently defaulting in production.
- **Consistency:** `requireAuth` sets `req.farmer`, but several routes (`field.routes.js`, `alerts.routes.js`) read `req.user` instead — this is a **real bug** (see Field Management §2.2) causing ownership checks and farmer-scoping to silently no-op.
- **Reliability:** Add a `.env.example` file (referenced by `connection.js` but absent) so new environments can be bootstrapped without reading source code.
- **Testing:** No test file exists for `auth.service.js` or `auth.routes.js` — this is the most security-sensitive module in the codebase and has zero automated coverage.
- **Logging/monitoring:** `auth_audit_log` is written but never queried/exposed anywhere (no admin endpoint) — add an audit-log viewer or alerting on repeated failed logins.

---

## 2. Field Management

### 2.1 How It Works
- **Purpose:** CRUD for farmer fields (location, crop type, sowing date, boundary).
- **Files:** `server/src/modules/field/field.routes.js`, `field.service.js` (`Layer1Service`), `server/src/db/repositories/farmerRepository.js` (`FieldRepository`).
- **Flow:** `GET /api/v1/fields` lists fields for the current farmer (or a hardcoded `STUB_FARMER_ID` if unauthenticated). `POST /api/v1/fields` validates `name`, `cropType`, `sowingDate` are present, calls `fieldRepo.createField()`, and fires a **non-blocking** weather pre-fetch (`setImmediate(() => triggerWeatherPrefetch(field.id))`) so the first weather forecast is ready quickly. `PUT`/`DELETE /api/v1/fields/:fieldId` are behind `requireAuth` and include an ownership check.
- **DB:** table `fields` (+ optional PostGIS `geometry`/`centroid` columns, migrations `001_core_fields.sql`, `002_add_field_location_boundary.sql`, `011_postgis_geometry.sql`, `015_field_irrigation_type.sql`). PostGIS updates are best-effort — wrapped in try/catch so the app works without the PostGIS extension.
- **Input/Output:** Field JSON (name, cropType, sowingDate, lat/lng, boundaryGeojson, irrigationType) → persisted field row.

### 2.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `name, cropType, and sowingDate are required` (400) | Missing required body fields | `field.routes.js: POST /` |
| `Field not found` (404) | `fieldId` doesn't exist | `field.routes.js: GET/PUT/DELETE /:fieldId` |
| `Forbidden` (403) — **never actually triggers** | Ownership check compares `req.user.id` to `field.farmer_id`, but `requireAuth` sets `req.farmer`, not `req.user` | `field.routes.js: PUT/DELETE` |
| `[Weather] Pre-fetch failed for field ... (non-fatal)` (console warning only) | Weather API/coords issue during background pre-fetch | `field.routes.js: triggerWeatherPrefetch()` |
| `[DB] PostGIS geometry update skipped (extension not available)` (console warning only) | PostGIS extension not installed | `farmerRepository.js: FieldRepository.createField()` |

### 2.3 Solutions
- **Ownership check bug:** Change `req.user?.id` to `req.farmer?.sub` (the JWT payload field actually set by `requireAuth`, per `auth.service.js: signAccessToken()`), in `field.routes.js` (`GET /`, `POST /`, `PUT /:fieldId`, `DELETE /:fieldId`). As written, every farmer can edit/delete any other farmer's field because the check `existing.farmer_id !== req.user.id` is always `true !== undefined` → falls through if `req.user` itself is undefined, but if it's truthy the field is misread — this should be audited and fixed directly.
- **Missing PostGIS:** Deploy PostgreSQL with the PostGIS extension enabled in production so satellite/soil geo-lookups (which depend on `field.geojson`) work; otherwise those features silently fall back to defaults.

### 2.4 Suggestions for Improvement
- **Security:** Fix the `req.user` vs `req.farmer` mismatch (critical — breaks authorization). `POST /api/v1/fields` (create) has **no** `requireAuth` at all, unlike `PUT`/`DELETE` — any unauthenticated caller can create fields under the stub farmer ID.
- **Maintainability:** `STUB_FARMER_ID` is a permanent fallback identity used across multiple modules (`escalation.service.js` too) — this should be removed once auth is fully enforced, or clearly gated behind a `NODE_ENV !== 'production'` check.
- **Reliability:** The legacy `/api/fields` alias routes in `index.js` do not apply `requireAuth` at all (only `/api/v1/fields` does for weather/soil/etc.), creating an inconsistent security surface between `/api/*` and `/api/v1/*`.

---

## 3. Crop Identification & Growth Stage Tracking (Phenology)

### 3.1 How It Works
- **Purpose:** Identify crop from a photo, and track/override the crop's growth stage using Growing-Degree-Days (GDD).
- **Files:** `server/src/modules/crop/crop.routes.js`, `crop.service.js` (`Layer2Service`), `server/src/services/pythonClient.js`, `ai-service/routers/crop.py`, `ai-service/routers/phenology.py`.
- **Flow:** `POST /api/fields/:fieldId/identify-crop` decodes a base64 image and calls `PythonClient.identifyCrop()` → FastAPI `/api/v1/crop/identify` → `analyze_image_with_prompt()` (Gemini Vision) → `CropIdentificationResponse`. `GET /api/fields/:fieldId/crop-state` calls `Layer2Service.getFieldCropState()`, which looks up a crop calendar (`cropStateRepo.getCropCalendar(cropType, "punjab")` — **region hardcoded**) and calls `PythonClient.calculatePhenology()` → FastAPI `/api/v1/phenology/gdd`, which computes accumulated GDD as **`days_since_sowing * 15`** (a fixed stub average, not derived from real temperature data) and maps it to a stage via calendar thresholds. `POST /api/fields/:fieldId/override-stage` lets the farmer manually correct the stage (`last_updated_from: "farmer_override"`), which then takes priority over recalculation.
- **DB:** tables `field_crop_states`, `crop_calendars`.

### 3.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field not found: {fieldId}` | Invalid `fieldId` | `crop.service.js: getFieldCropState()` |
| `Crop calendar not found for {cropType} in region punjab` | No calendar row for that crop/region combination (region is always `"punjab"`, regardless of field location) | `crop.service.js: getFieldCropState()` |
| `Image data is required` (unhandled → falls to global error handler as 500, not 400) | No `image` in body | `crop.routes.js: POST /identify-crop` |
| `Python AI Error: {text}` | `ai-service` unreachable, or non-2xx response | `pythonClient.js` (any method) |

### 3.3 Solutions
- **Hardcoded region:** `crop.service.js: getFieldCropState()` should derive region from `field.lat`/`field.lng` (the same logic already exists in `soil.service.js: _inferRegion()`) instead of always requesting `"punjab"`.
- **GDD stub:** `phenology.py: calculate_phenology()` explicitly comments `# Stub: Assumes 15 GDD accumulated per day on average`. Replace with real GDD accumulation from `weatherRepo`/`weather_snapshots` daily min/max temperatures against each crop's base temperature.
- **Missing calendar:** Seed `crop_calendars` for every crop type the app claims to support (wheat, rice, maize, cotton, etc.) in every region referenced by fields, or fall back to a default calendar instead of throwing.
- **400 vs 500:** Wrap the `"Image data is required"` throw in an explicit `res.status(400)` check like other routes, rather than letting it propagate to `next(err)` with an unspecified status.

### 3.4 Suggestions for Improvement
- **Accuracy:** Real GDD calculation (base-temperature-adjusted, using actual daily highs/lows already ingested by the weather module) would materially improve stage accuracy, which downstream features (disease diagnosis context, health score, advisory) all depend on.
- **Scalability:** Region inference should be shared as a single utility instead of duplicated logic between `soil.service.js` and (missing from) `crop.service.js`.
- **Testing:** No tests exist for `Layer2Service` or the phenology endpoint.

---

## 4. Weather Intelligence

### 4.1 How It Works
- **Purpose:** Fetch, cache, and rule-evaluate weather forecasts/history per field.
- **Files:** `server/src/modules/weather/weather.routes.js`, `weather.service.js` (`Layer3Service`), `weather.rules.js`, `openMeteo.provider.js`, `server/src/db/repositories/weatherRepository.js`, `ai-service/routers/weather_rules.py`.
- **Flow:** `Layer3Service.getLocalizedForecast()` serves a Postgres-cached forecast if it is < 6 hours old (`CACHE_TTL_HOURS`), otherwise calls `fetchAndStoreForecast()` → `OpenMeteoProvider.getForecast()` (Open-Meteo `/v1/forecast`, no API key) → persists snapshots via `weatherRepo.saveSnapshot()`, purges forecasts older than 2 days, and evaluates `WeatherRuleEngine.evaluate()` → delegates to Python `POST /api/v1/weather-rules/evaluate`, which flags `rain_expected`, `heat_event`, `humidity_spike`, and `frost_warning` against configurable thresholds. `GET .../weather/history` reads cached history or fetches Open-Meteo `/v1/archive` (last 30 days). A background job (`jobs/ingestWeather.js`) refreshes every field hourly via `node-cron`.
- **DB:** tables for weather snapshots and event flags (migration `002_weather.sql`).
- **External API:** Open-Meteo (free, no key). Default coordinates fall back to Punjab, India (30.9, 75.8) if a field has no lat/lng.

### 4.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field {fieldId} not found` | Invalid `fieldId` | `weather.service.js: fetchAndStoreForecast()` / `getFieldWeatherHistory()` |
| `Field {fieldId} has no location coordinates. Add a field boundary or lat/lng before fetching weather.` | Field has null `lat`/`lng` | `weather.service.js` |
| `Open-Meteo API error: {status} {statusText}` | Non-2xx from Open-Meteo | `openMeteo.provider.js: fetchWithTimeout()` |
| Silent 8-second timeout abort (no explicit custom message — surfaces as a generic `AbortError`) | Open-Meteo slow/unreachable | `openMeteo.provider.js` (`this.timeout = 8000`) |
| `Python AI Error: ...` | `ai-service` unreachable for rule evaluation | `pythonClient.js: evaluateWeatherRules()` |
| `[Timeout] {method} {path} took longer than 15s` (console warning, request still processed) | Slow downstream call (Open-Meteo/Gemini/Python) | `server/src/index.js` request logger |

### 4.3 Solutions
- **No coordinates:** Prompt the farmer to draw a field boundary or set lat/lng at field-creation time; `AddFieldWizard.jsx` on the client should make this mandatory rather than optional.
- **Open-Meteo timeout/outage:** The 6-hour cache already provides resilience for repeat calls; for first-time fetch failures, surface a retry action in the UI (`WeatherAlertBanner.jsx`) instead of a raw error.
- **AI service down:** `WeatherRuleEngine.evaluate()` has no fallback if Python is unreachable — the whole `fetchAndStoreForecast()` call fails and forecasts are not saved even though they were successfully fetched from Open-Meteo. Persist the forecast snapshots first, then evaluate rules in a separate try/catch so one failure doesn't discard the other's work.

### 4.4 Suggestions for Improvement
- **Reliability:** Decouple snapshot persistence from rule evaluation (see above) so a Python outage doesn't also block weather caching.
- **Performance:** The hourly cron job (`ingestWeather.js`) iterates every field sequentially with `for...of` and `await` — for large farmer bases this should be batched/parallelized (with a concurrency cap) rather than one field at a time.
- **Monitoring:** Add metrics/alerting on the job's `errorCount` (currently only logged to console) so failures are actionable.

---

## 5. Soil Intelligence

### 5.1 How It Works
- **Purpose:** Provide a soil profile per field from the best available source.
- **Files:** `server/src/modules/soil/soil.routes.js`, `soil.service.js` (`SoilService`), `soilgrids.provider.js`, `document.parser.js`, `server/src/db/repositories/soilRepository.js`, `ai-service/routers/vision.py`.
- **Flow (priority chain, `getActiveSoilProfile`):** 1) existing lab report or fresh (< 30 days) SoilGrids row in DB → returned directly; 2) fetch fresh from ISRIC SoilGrids REST API v2 using field lat/lng (rate-limited client-side to 5 calls/min via an in-memory sliding window); 3) fall back to a regional baseline inferred from lat/lng bounding boxes (Punjab/Maharashtra/Karnataka/Gujarat — Gujarat maps to the Maharashtra baseline as "nearest match") with `confidence: 0.45`.
- **Flow (lab report):** `POST /:fieldId/soil/parse` accepts a multipart upload (via `multer`, in-memory storage), calls `DocumentParser.parseSoilReport()` → `PythonClient.parseSoilReport()` → FastAPI vision parsing (Gemini) → `soilRepo.saveProfile()`.
- **DB:** table `soil_profiles` (migration `003_soil.sql`).
- **External API:** ISRIC SoilGrids v2 (`https://rest.isric.org/soilgrids/v2.0/properties/query`, free, no key, informal 5 req/min limit).

### 5.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `[SoilGrids] Rate limit: 5 calls per minute. Try again later.` | More than 5 SoilGrids calls in a rolling 60s window (process-local, not distributed) | `soilgrids.provider.js: checkRateLimit()` |
| `SoilGrids API error: {status} {statusText}` | Non-2xx from ISRIC | `soilgrids.provider.js: fetchSoilProfile()` |
| `SoilGrids request timed out after 10000ms` | ISRIC slow/unreachable | `soilgrids.provider.js: fetchSoilProfile()` |
| `Could not parse soil report document.` | `DocumentParser.parseSoilReport()` returns falsy | `soil.service.js: parseAndSaveLabReport()` |
| `Document file is required` (400) | No `document` file in multipart body | `soil.routes.js: POST /soil/parse` |
| `No soil data available.` (404, with a suggestion string) | No profile and no coordinates for fallback | `soil.routes.js: GET /soil` |

### 5.3 Solutions
- **Rate limit:** The limiter is in-memory per Node process — under multiple server instances this undercounts real usage against ISRIC's actual limit. Move to a shared store (Redis) or a token-bucket keyed centrally if scaling horizontally.
- **Hardcoded mime type:** `document.parser.js: DocumentParser.parseSoilReport()` always sends `"image/jpeg"` to `PythonClient.parseSoilReport()` regardless of the uploaded file's actual MIME type (`req.file.mimetype` from multer is available but not passed through) — PDFs or PNGs uploaded by the farmer will be mislabeled. Pass the real `mimeType` from the route through the service and parser.
- **Error responses:** Soil routes catch errors and return `res.status(500).json({ error: err.message })` directly instead of calling `next(err)`, bypassing the shared `globalErrorHandler` (inconsistent error shape vs. the rest of the API, and no stack trace suppression logic in production).

### 5.4 Suggestions for Improvement
- **Accuracy:** `Gujarat` region maps to the `maharashtra` baseline "as nearest match" — this is a coarse approximation; add a real Gujarat baseline record instead.
- **Reliability:** SoilGrids and lab-report parsing both depend on external services with no circuit breaker — repeated failures could cascade into slow response times across the whole `/soil` endpoint family (mitigated only by the 10s timeout).
- **Security:** No file-size or file-type validation on the multer upload (`multer({ storage: multer.memoryStorage() })` has no `limits` configured) — large or malicious uploads are unbounded.

---

## 6. Crop Disease & Pest/Stress Diagnosis

### 6.1 How It Works
- **Purpose:** Diagnose crop health issues from farmer-submitted photos, fused with real field context (weather, satellite, soil, crop stage).
- **Files:** `server/src/modules/disease/disease.routes.js`, `disease.service.js` (`ObservationService`), `ai-service/routers/disease.py`, `ai-service/services/diagnosis_service.py`, `ai-service/services/vision_inference.py` (`CropVisionPredictor`), `ai-service/services/gemini_client.py`, `ai-service/models/crop_registry.py`, `ai-service/models/schemas.py`.
- **Flow:** `POST /api/v1/fields/:fieldId/diagnose` accepts up to 3 base64 images + optional farmer Q&A. Node's `ObservationService.diagnoseWithVision()` assembles real context (`_assembleContext`: field, crop stage, last 3 weather snapshots, latest satellite tile, active soil profile — each independently try/caught so one missing source doesn't block the others), then calls the Python service (`_callPythonService`) with the images + context as multipart form data.
  - In Python, `disease.py: diagnose_disease()` first checks `crop_registry.is_supported(crop)` (a **crop support gate** — unsupported crops short-circuit with a structured "Unsupported Crop" response, no model call) and runs `assess_image_quality()` (Pillow-based blur/brightness/resolution check — **Section 15: Image Quality Gate**) before any AI call; poor-quality images short-circuit with a guidance response.
  - `diagnosis_service.py: diagnose()` runs local PyTorch inference (`CropVisionPredictor.predict()`) if a `.pth` model is registered for the crop in `data/model_registry.json`, then sends the vision result + context to Gemini (`gemini-3.6-flash`) for context-fused differential diagnosis (exactly 3 ranked candidates).
  - If the Python service is unreachable, Node falls back to calling Gemini Vision directly (`ObservationService._callGeminiVision()`), duplicating a very similar prompt/schema in JavaScript.
- **DB:** table `field_observations` (migrations `005_diagnosis.sql`, `016_observations.sql`, `017_observations_6q.sql`) — immutable records; farmer feedback (`outcome`) can be added later via `PUT /:fieldId/observations/:obsId`.

### 6.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `image is required (base64 data URL)` (400) | No `image` field | `disease.routes.js: POST /diagnose` |
| `image data is empty or too short` (400) | Base64 payload < 100 chars | `disease.routes.js` |
| `Gemini Vision failed: {message}` | Gemini API error (quota, auth, network) | `disease.service.js: _callGeminiVision()` |
| `Gemini returned non-JSON: {text}` | Model didn't return parseable JSON | `disease.service.js: _callGeminiVision()` |
| `Could not parse Gemini diagnosis JSON: {text}` | `JSON.parse` failure on extracted match | `disease.service.js: _callGeminiVision()` |
| `Observation not found` (404) | Invalid `obsId`/`fieldId` combination on outcome update | `disease.routes.js: PUT /observations/:obsId` |
| `outcome is required (...)` (400) | Missing `outcome` in body | `disease.routes.js` |
| `[Vision] Could not load model for {weights_path}` | `.pth` file present but corrupt/mismatched classes | `vision_inference.py: _load_efficientnet_b0()` |
| No local model at all — always falls back to Gemini | `data/model_registry.json` and `ml/models/*.pth` weight files are **not present in the repository** (confirmed: no `data/` directory, no `.pth` files exist), so `CropVisionPredictor._pytorch_crops()` is always empty | `vision_inference.py` |
| `Diagnosis failed: {str(e)}` (500) | Any unhandled exception in the diagnose pipeline | `ai-service/routers/disease.py` |

### 6.3 Solutions
- **Missing model artifacts:** Either commit trained `.pth` weights + `data/model_registry.json` per the `ml/training/train_baseline.py` pipeline, or explicitly document that the app currently runs Gemini-Vision-only (the PyTorch path is fully implemented but has no shipped weights) so expectations match reality.
- **Duplicate prompts:** The Gemini fallback prompt in `disease.service.js: _buildVisionPrompt()` and the Python `diagnosis_service.py: _build_reasoning_prompt()` implement very similar rules independently — consolidate to one canonical prompt template (ideally served from Python only, since Node already prefers delegating to Python first).
- **JSON parse robustness:** Both Node and Python extract JSON via a regex (`/\{[\s\S]*\}/`) — brittle if Gemini wraps output in nested braces from example text. Prefer the `response_schema`/structured-output mode already used successfully in `gemini_client.py: generate_text()` for `disease.py`'s vision call path too (note `analyze_image_with_prompt()` explicitly avoids `response_schema` "to prevent AFC hang" — investigate and resolve the underlying hang instead of avoiding structured output entirely).

### 6.4 Suggestions for Improvement
- **Performance:** Diagnosis calls Gemini Vision synchronously per request with up to 3 images; consider a job queue for slow requests (30s timeout in `disease.service.js: _callPythonService`) so the HTTP request doesn't block for the full model+LLM roundtrip.
- **Reliability:** `_persist()` truncates the stored image to `imageUrl` as a **100-character-truncated base64 data URL** (`imageBuffer.toString("base64").slice(0, 100)...`) — this is explicitly a placeholder ("replace with S3 URL in production") and currently stores an unusable, truncated image reference in the DB, meaning stored diagnoses cannot show the original photo.
- **Testing:** No automated tests cover `ObservationService`, the image-quality gate, or the crop-support gate — these are core business rules and should be unit tested.
- **Logging:** Extensive `console.log`/`console.warn`/`print` statements throughout; replace with a structured logger (e.g., pino/winston on Node, `logging` module on Python) with log levels for production.

---

## 7. Satellite / NDVI Health Monitoring

### 7.1 How It Works
- **Purpose:** Provide NDVI (vegetation health) tiles and trend for a field from Sentinel-2 imagery, with a mock fallback.
- **Files:** `server/src/modules/satellite/satellite.routes.js`, `satellite.service.js` (`SatelliteService`), `copernicus.provider.js` (`CopernicusProvider`), `satellite.provider.js` (`MockSatelliteProvider`), `satellite.store.js`.
- **Flow:** `createSatelliteProvider()` picks `CopernicusProvider` if `CDSE_CLIENT_ID`/`CDSE_CLIENT_SECRET` are set, else `MockSatelliteProvider` (data explicitly badged `"simulated"`). `getLatestForField()` serves a cached tile if one exists in `satellite_tiles` less than 6 days old; otherwise fetches from the provider and persists via `_saveTile()`. `CopernicusProvider` authenticates via OAuth2 client-credentials against CDSE, searches the OData catalog (`findLatestScene`) for the freshest cloud-free (`≤50%` cloud cover) Sentinel-2 L2A scene intersecting the field's bounding box, then requests NDVI statistics via the Sentinel Hub Statistical API (avoids raw GeoTIFF band decoding). `getTimeseries()` computes a simple two-half average comparison to classify trend as `improving`/`declining`/`stable`.
- **DB:** table `satellite_tiles` (migrations `004_satellite.sql`, `012_satellite_enhancements.sql`).

### 7.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field {fieldId} not found` | Invalid `fieldId` | `satellite.service.js: getLatestForField()` |
| `CDSE_CLIENT_ID and CDSE_CLIENT_SECRET must be set` | `CopernicusProvider` constructed without credentials (only reachable if the factory logic changes; currently guarded by the factory) | `copernicus.provider.js` constructor |
| `CDSE auth failed ({status}): {text}` | Bad/expired CDSE credentials | `copernicus.provider.js: fetchAccessToken()` |
| `Invalid field geometry — cannot compute bounding box` | Field has no usable `boundary_geojson` | `copernicus.provider.js: findLatestScene()` |
| `CDSE catalog search failed: {status} {statusText}` | CDSE OData API error | `copernicus.provider.js: findLatestScene()` |
| `Sentinel Hub process API failed ({status}): {text}` | Sentinel Hub API error | `copernicus.provider.js: fetchNdvi()` |
| `Invalid geometry for Sentinel Hub request` | Missing polygon coordinates | `copernicus.provider.js: fetchNdvi()` |

### 7.3 Solutions
- **Missing CDSE credentials:** Document in the README that satellite data is **simulated by default** and requires CDSE credentials for real Sentinel-2 data (currently only surfaced via a console warning, not to the UI beyond the `data_source`/`disclaimer` fields already returned in the API response — which is good practice and should be preserved).
- **No boundary geometry:** Prompt farmers to draw a field boundary polygon (not just a point) for both satellite and better SoilGrids accuracy.
- **"Refresh" endpoint doesn't force refresh:** `POST /satellite/refresh` comment says "Clear cached tiles > 1 second old to force real API call" but the implementation simply calls `getLatestForField()`, which will still serve the 6-day cache if a recent tile exists — the endpoint does not actually bypass the cache as documented. Fix by adding an explicit `forceRefresh` parameter to `getLatestForField()` that skips the cache lookup.

### 7.4 Suggestions for Improvement
- **Reliability:** Add a fallback from `CopernicusProvider` failures to `MockSatelliteProvider` (currently a Copernicus error propagates as a 500 to the client with no graceful degradation, unlike Soil's SoilGrids → regional-baseline fallback pattern).
- **Performance:** `getTimeseries()`'s trend calculation is a simple split-half average; a proper linear regression slope would be more robust to noisy/sparse observations.
- **Testing:** No unit tests for NDVI statistic computation (`computeNdviStats`) or trend classification — these are pure functions and are easy to test.

---

## 8. Field Health Score

### 8.1 How It Works
- **Purpose:** Deterministic (non-AI) 0–100 composite health score combining NDVI, weather risk, soil quality, and crop-stage stress, used as evidence for the AI Advisory feature.
- **Files:** `server/src/modules/health-score/health-score.routes.js`, `health-score.service.js` (`HealthScoreService`). (A parallel, unused implementation also exists in `ai-service/routers/health.py` — see Errors.)
- **Flow:** `computeScore(fieldId)` independently gathers NDVI (satellite service, weight 40%), weather risk (weather repo + active flags, weight 30%), soil quality (soil service, weight 20%), and crop-stage stress (crop state repo, weight 10%) — each wrapped in its own try/catch with a neutral default score if that source is unavailable, and each contributing an `evidence` entry describing its finding and data quality. The weighted sum produces `score` and a `category` (`good`/`moderate`/`poor`/`critical`).
- **Output:** `{ fieldId, computedAt, score, category, components: { ndvi, weather, soil, stage }, evidence[] }`.

### 8.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field {fieldId} not found` | Invalid `fieldId` | `health-score.service.js: computeScore()` |
| Individual component "Unavailable: {message}" evidence entries (not thrown — degrades gracefully) | Satellite/weather/soil/crop-stage sub-call failure | `health-score.service.js: computeScore()` (each `catch` block) |
| Stale/unused: Python `/api/v1/health-score/compute` endpoint and `PythonClient.computeHealthScore()` exist but are **never called** by the active `HealthScoreService` — the Node service reimplements the scoring logic independently in JavaScript | `ai-service/routers/health.py`, `pythonClient.js: computeHealthScore()` |
| `server/src/__tests__/health-score.service.test.js` mocks `satelliteStore`, `soilRepo.getLatestProfile`, and `PythonClient.computeHealthScore` — **none of which are used by the current `health-score.service.js`** (it imports `satelliteService`, `soilService`, and computes locally). This test will fail against the current implementation. | Stale test written against an older architecture | `server/src/__tests__/health-score.service.test.js` |

### 8.3 Solutions
- **Dead Python endpoint:** Either remove the unused `health.py` router + `computeHealthScore` client method (dead code), or migrate the scoring logic there and have Node delegate to it for consistency with the rest of the AI-computation modules (crop, weather rules, regen, etc.).
- **Broken test:** Rewrite `health-score.service.test.js` to mock `satelliteService`, `weatherRepo`, `soilService`, `layer1Service`, and `cropStateRepo` — matching the actual imports in `health-score.service.js` — or delete/skip the stale test until replaced so it doesn't give a false sense of coverage (or false CI failures).

### 8.4 Suggestions for Improvement
- **Maintainability:** Two independent, out-of-sync scoring implementations (Node deterministic logic vs. unused Python endpoint) is a maintenance risk — consolidate to one source of truth.
- **Testing:** Health score is core evidence feeding into the Advisory module (§9) and Intelligence dashboard (§17) — prioritize fixing/rewriting its test coverage.
- **Documentation:** The weighting scheme (40/30/20/10) and thresholds (e.g., NDVI 0.2/0.4/0.6/0.8 bands) are well-commented in code; consider surfacing this methodology to farmers/extension workers in the UI for trust/transparency.

---

## 9. AI Advisory Generation

### 9.1 How It Works
- **Purpose:** Generate a Gemini-authored, evidence-grounded advisory (what/why/action/deadline/monitor) for a field.
- **Files:** `server/src/modules/advisory/advisory.routes.js`, `advisory.service.js` (`AdvisoryService`), `gemini.client.js` (`generateAdvisoryWithGemini`).
- **Flow:** `AdvisoryService.generateAdvisory()` assembles crop evidence (deterministic stage estimate — **duplicate logic** of `crop.service.js`/`health-score.service.js`'s stage calendars, implemented a third time here as `_estimateCropStage()`), weather evidence (next 72h from `layer3Service.getLocalizedForecast()`), satellite evidence (`satelliteService`), and soil evidence (`soilService`) — each independently try/caught. It then calls `generateAdvisoryWithGemini()` (Node-side direct Gemini call, model `gemini-1.5-flash`, **different from the `gemini-3.6-flash` used elsewhere**) with a strict evidence-only prompt (explicitly instructs the model not to fabricate missing data), parses the JSON response, and persists it to the `advisories` table (falling back to an in-memory-shaped response object if the insert fails, e.g. due to schema mismatch).
- **Output includes** an `evidence_summary` block flagging whether weather/satellite/soil were actually available and what quality/source they were, so the frontend can communicate confidence honestly.

### 9.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field {fieldId} not found` | Invalid `fieldId` | `advisory.service.js: generateAdvisory()` |
| `[Advisory] Weather/Satellite/Soil unavailable for field {id}: {message}` (console warning, non-fatal — evidence set to `null`) | Any evidence sub-call failure | `advisory.service.js: generateAdvisory()` |
| `Gemini API call failed: {message}` | Gemini quota/auth/network error | `gemini.client.js: generateAdvisoryWithGemini()` |
| `Gemini returned non-JSON response: {text}` | Model output not parseable | `gemini.client.js` |
| `Could not parse Gemini JSON: {text}` | `JSON.parse` failure | `gemini.client.js` |
| `[Advisory] Could not persist to DB: {message}` (console warning, falls back to unsaved in-memory response) | `advisories` table schema mismatch or DB error | `advisory.service.js: _saveAdvisory()` |
| `advisoryId and action are required` (400) | Missing fields on farmer-response endpoint | `advisory.routes.js: POST /advisory/response` |

### 9.3 Solutions
- **Two different Gemini models in use** (`gemini-1.5-flash` here vs. `gemini-3.6-flash` in disease/vision/intelligence modules) — standardize on one model version via a shared config/env var to keep cost, latency, and behavior consistent across features.
- **Triplicated stage-estimation logic:** `AdvisoryService._estimateCropStage()`, `HealthScoreService._estimateStage()`, and `crop.service.js`'s `getStageDescription()` / phenology GDD calendar all independently encode crop-stage-by-days logic with slightly different calendars. Consolidate into a single shared crop-calendar utility to avoid drift (e.g., wheat's vegetative window is `[8,60]` in two places but the phenology service uses GDD thresholds from `crop_calendars` DB rows instead — these can disagree).
- **Persist failure:** If saving to `advisories` fails, the returned advisory has a synthetic `id` (`adv-{Date.now()}`) that doesn't exist in the DB — any subsequent `POST /advisory/response` referencing that `advisoryId` will silently insert an orphaned row. Surface a warning to the client when persistence failed instead of returning a normal-looking success response.

### 9.4 Suggestions for Improvement
- **Reliability:** Add retry/backoff for transient Gemini API errors before failing the whole advisory generation.
- **Consistency:** Consolidate the three crop-stage-calendar implementations (Advisory, Health Score, Crop service via Python) into one canonical source, ideally the DB-backed `crop_calendars` table already used by phenology, rather than three copies of hardcoded JS objects.
- **Security:** `GEMINI_API_KEY` absence only logs a warning at startup; requests will fail at call time with a less-clear Gemini SDK error — fail fast with a clear message when the key is missing and the route is hit.

---

## 10. Regenerative Agriculture Planning

### 10.1 How It Works
- **Purpose:** Generate regenerative-practice recommendations (cover cropping, no-till, etc.) and carbon-credit estimates for a field.
- **Files:** `server/src/modules/regen/regen.routes.js`, `regen.service.js` (`Layer10Service`), `regen.ai.js` (`RegenAI`), `ai-service/routers/regen.py`.
- **Flow (as designed):** `Layer10Service.getRegenPlan()` should check an in-memory cache (`db.regenPlans`, `models/Database.js`), gather field + soil context, and call `regenAI.generatePlan()` → `PythonClient.generateRegenPlan()` → FastAPI `/api/v1/regen/generate-plan`.
- **Flow (as actually wired):** `GET /api/fields/:fieldId/regen/planning` in `regen.routes.js` does **not** call `Layer10Service` at all — it returns a fully hardcoded JSON object (`carbon_credits_est: 12.5`, a fixed milestone date `2025-08-15`, and two static practices). `Layer10Service`, `RegenAI`, and the Python `/regen/generate-plan` endpoint are effectively **dead code** from the perspective of this route.

### 10.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field not found` — only reachable if `Layer10Service.getRegenPlan()` is ever actually invoked (currently it is not, from any route) | Invalid `fieldId` | `regen.service.js: getRegenPlan()` |
| Missing `await`: `const latestSoil = layer4Service.getActiveSoilProfile(fieldId);` assigns a **pending Promise**, not the resolved soil profile, to `context.soil` | Missing `await` keyword | `regen.service.js: getRegenPlan()` |
| Hardcoded response never reflects real field data (`fieldId` is echoed but nothing else is field-specific) | Route bypasses the service layer entirely | `regen.routes.js: GET /:fieldId/regen/planning` |

### 10.3 Solutions
- **Wire the route to the service:** Replace the hardcoded response in `regen.routes.js` with `await layer10Service.getRegenPlan(req.params.fieldId)`, and wrap in try/catch → `next(err)`.
- **Fix missing await:** Add `await` before `layer4Service.getActiveSoilProfile(fieldId)` in `regen.service.js`.
- **Cache invalidation:** `db.regenPlans` (an in-memory `Map`) has no TTL or invalidation — once a plan is cached for a field, it is served forever, even after soil/crop data changes, and is lost entirely on server restart. Move to Postgres persistence (consistent with every other feature) or add explicit invalidation triggers.

### 10.4 Suggestions for Improvement
- **Correctness:** This is the most significant functional gap in the codebase — an entire "Regenerative Agriculture" feature (a name-brand part of the project) is non-functional / mocked in production. Prioritize wiring it up.
- **Testing:** Add an integration test asserting `GET /regen/planning` actually reflects field-specific data (which would have caught this regression).
- **Architecture:** `InMemoryDB` (`models/Database.js`) is explicitly documented as a stopgap ("data that does not yet have a Postgres table") — migrate `regenPlans` to a `regen_plans` table like every other feature.

---

## 11. Climate Risk Assessment

### 11.1 How It Works
- **Purpose:** Predict climate-related risk for a field (drought, heat, etc.) via the AI service.
- **Files:** `server/src/modules/climate-risk/climate-risk.routes.js`, `ai-service/routers/climate.py`.
- **Flow:** `GET /fields/:fieldId/climate-risk` looks up the field, then calls `PythonClient.assessClimateRisk({ field_id, crop_type, lat, lng, sowing_date })` → FastAPI `/api/v1/climate/risk`.

### 11.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Field not found` (404) | Invalid `fieldId` | `climate-risk.routes.js` |
| Generic 500 `{ error: error.message }` | Any Python-side or network failure | `climate-risk.routes.js` (catches and returns 500 directly instead of via `next(err)`) |

### 11.3 Solutions
- Standardize error handling to use `next(err)` and the shared `globalErrorHandler` for a consistent response shape across the API (this route, along with soil, satellite, health-score, disease, and regen routes, bypasses the shared handler).

### 11.4 Suggestions for Improvement
- **Testing:** No tests exist for this route or the underlying Python `climate.py` router.
- **Documentation:** `climate.py` (41 lines) should be reviewed to confirm what real inputs/heuristics drive the risk score, since this documentation is based on the Node-side contract only (see the file directly for its internal logic, which was reviewed but is brief/heuristic based on field crop type and coordinates).

---

## 12. Cross-Border Global Insights

### 12.1 How It Works
- **Purpose:** Aggregate insights across regions/borders for a field's context (e.g., comparing conditions or practices across countries).
- **Files:** `server/src/modules/cross-border/cross-border.routes.js`, `cross-border.service.js`, `ai-service/routers/cross_border.py`.
- **Flow:** `GET /fields/:fieldId/global-insights` (mounted **without** `requireAuth`, unlike most other field-scoped routes) delegates directly to `PythonClient.getGlobalInsights(fieldId)` → FastAPI `GET /api/v1/cross-border/insights/{fieldId}`.

### 12.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Failed to fetch cross-border insights` (500, generic — original error message discarded) | Any failure in the Python call | `cross-border.routes.js` |

### 12.3 Solutions
- Include the underlying error detail (`error.message`) in server logs (already done via `console.error`) and consider returning a more specific client-facing message for debugging during development, while keeping a generic message in production.

### 12.4 Suggestions for Improvement
- **Security:** This is one of the few field-scoped endpoints not behind `requireAuth` — confirm this is intentional (e.g., meant to be publicly shareable benchmark data) or add auth for consistency with other field routes.
- **Testing:** No tests exist for this feature.

---

## 13. Voice Interface (Speech-to-Text / Text-to-Speech)

### 13.1 How It Works
- **Purpose:** Let farmers interact by voice in their preferred language.
- **Files:** `server/src/modules/voice/voice.routes.js`, `voice.adapter.js` (`PythonVoiceAdapter`), `ai-service/routers/voice.py`.
- **Flow:** `PUT /api/v1/user/language` stores a language preference in a **module-level in-memory variable** (`let userLanguage`). `POST /api/v1/voice/stt` is intended to transcribe uploaded audio but currently **always transcribes a hardcoded dummy buffer** (`Buffer.from("dummy-audio")`) instead of parsing the actual uploaded audio file — the route comment explicitly says *"For MVP, we mock the buffer."* `POST /api/v1/voice/tts` synthesizes real speech via `PythonClient.synthesizeSpeech()` and returns base64 audio.

### 13.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Language is required` (400) | Missing `language` in body | `voice.routes.js: PUT /user/language` |
| `Failed to transcribe audio` (500) | Python STT call fails (though input is always the dummy buffer, not real audio) | `voice.routes.js: POST /voice/stt` |
| `Failed to synthesize speech` (500) | Python TTS call fails | `voice.routes.js: POST /voice/tts` |
| STT never reflects actual farmer speech — always transcribes `"dummy-audio"` | No `multer` (or equivalent) middleware wired to parse the uploaded audio file into `req.file`/`req.body` | `voice.routes.js: POST /voice/stt` |
| Language preference is **global and shared across all users/sessions** on the server process, not per-farmer | Uses a single `let userLanguage` module variable instead of per-request/per-user state | `voice.routes.js` |

### 13.3 Solutions
- **Wire real audio input:** Add `multer` (already a dependency, used elsewhere e.g. `soil.routes.js`) to parse the uploaded audio file in `POST /voice/stt`, and pass `req.file.buffer` to `voiceAdapter.transcribe()` instead of the hardcoded dummy buffer.
- **Per-user language:** Store language preference on the farmer record (`farmers.preferred_language` already exists in the DB schema per `farmerRepository.js`) and read/write it via `req.farmer.sub`, instead of a global in-memory variable that leaks state across concurrent users and resets on server restart.

### 13.4 Suggestions for Improvement
- **Correctness (critical):** STT is non-functional for real use today — this should be treated as a P0 fix, not a minor gap, since the feature is advertised (`GlobalMicButton.jsx`, `LanguageSwitcher.jsx` on the client) as working.
- **Security:** Global mutable language state is also a data-integrity issue in a multi-tenant server (one farmer's language change affects all concurrent farmers' TTS/STT language until the next change).
- **Testing:** No tests cover this module; given the identified functional bug, tests would have caught it.

---

## 14. Escalation & Extension-Worker Dashboard

### 14.1 How It Works
- **Purpose:** Let farmers escalate an issue to a human extension worker, and let extension workers triage/resolve tickets and view regional risk.
- **Files:** `server/src/modules/escalation/escalation.routes.js`, `escalation.service.js` (`EscalationService`), `server/src/db/repositories/escalationRepository.js`.
- **Flow:** `POST /trigger` creates a ticket (`escalationRepo.createTicket()`) — always attributed to `STUB_FARMER_ID` rather than the authenticated farmer (comment: `// Phase 4: replace with JWT-authenticated farmer ID`). `GET /tickets` paginates pending tickets for extension workers. `POST /tickets/:id/resolve` marks a ticket resolved. `GET /regional-risk` returns ticket-count stats mixed with **hardcoded placeholder values** (`averageHealthScore: 68`, `topIssues: ["Late Blight", "Drought Stress", "Nutrient Deficiency"]` — both explicitly marked `// Phase 6: ...`).
- **DB:** table for escalation tickets (migration `007_escalation_regen.sql`).

### 14.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Missing required fields: fieldId, reason, source` (400) | Incomplete trigger payload | `escalation.routes.js: POST /trigger` |
| Tickets always attributed to the stub farmer, not the real authenticated one | `STUB_FARMER_ID` hardcoded instead of `req.farmer.sub` | `escalation.service.js: triggerEscalation()` |
| `averageHealthScore` and `topIssues` are static, not computed from real data | Explicitly stubbed pending "Phase 6" | `escalation.service.js: getRegionalRisk()` |

### 14.3 Solutions
- **Attribute tickets correctly:** Pass `req.farmer.sub` from `escalation.routes.js` into `EscalationService.triggerEscalation()` instead of relying on the imported `STUB_FARMER_ID`.
- **Real regional stats:** Replace the hardcoded `averageHealthScore`/`topIssues` with an aggregation query over `field_health_scores` and `field_observations` (both already populated by other features) once that work is prioritized.

### 14.4 Suggestions for Improvement
- **Security:** Every escalation ticket currently being attributed to one stub farmer ID means extension workers cannot actually tell which real farmer raised an issue — this undermines the entire feature's purpose and should be fixed before production use.
- **Testing:** No tests exist for this module.

---

## 15. Alerts

### 15.1 How It Works
- **Purpose:** Farmer-facing notification feed (e.g., weather warnings, advisory flags).
- **Files:** `server/src/modules/alerts/alerts.routes.js`, `server/src/db/repositories/alertsRepository.js`.
- **Flow:** `GET /` (mounted at both `/api/v1/alerts` behind `requireAuth`, and `/api/alerts` legacy without it) reads `req.farmer?.sub`; if absent, returns `[]` gracefully (documented as intentional for the legacy unauthenticated alias). Formats `created_at` into a human-readable "time ago" string. `POST /` creates a test/seed alert for the authenticated farmer.

### 15.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| Generic 500 `{ error: err.message }` (both routes) | DB error | `alerts.routes.js` |
| `POST /` will throw a TypeError (`req.farmer.sub` on undefined) if called without auth, since it doesn't guard like `GET /` does | Missing auth on `POST` combined with the legacy unauthenticated mount `/api/alerts` | `alerts.routes.js: POST /` |

### 15.3 Solutions
- Add the same `if (!req.farmer?.sub) return res.status(401)...` guard to `POST /` that `GET /` already has, since `POST` is mounted both authenticated (`/api/v1/alerts`) and unauthenticated (`/api/alerts`) in `index.js`.

### 15.4 Suggestions for Improvement
- **Consistency:** Route error handling again bypasses `next(err)`/`globalErrorHandler` — same pattern as several other modules; worth a project-wide pass.
- **Maintainability:** Consider removing the legacy unauthenticated `/api/alerts` mount once the frontend is confirmed migrated to `/api/v1/alerts`, per the `index.js` comment about removing legacy aliases.

---

## 16. AI Chat Assistant

### 16.1 How It Works
- **Purpose:** Conversational Q&A assistant for farmers.
- **Files:** `server/src/modules/chat/chat.routes.js`.
- **Flow:** `POST /api/v1/chat` (mounted behind `requireAuth`, but `req.farmer` is never read) **does not call any AI model.** It runs a `setTimeout`-based artificial 1.5s delay, then does simple keyword matching (`includes("aphid")`, `includes("wheat")`, etc.) against a small set of **hardcoded canned responses**, falling back to a generic "That's an excellent question..." reply for anything unmatched. `GET /recent` similarly returns three **fully hardcoded** fake conversation entries, not a real per-farmer history.

### 16.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `Message is required` (400) | Missing `message` in body | `chat.routes.js: POST /` |
| Chat replies are not AI-generated and not personalized — any message not matching one of 3 keyword sets gets the same generic fallback | Feature is fully mocked, no Gemini/Python call at all | `chat.routes.js` |
| `GET /recent` never reflects a real farmer's conversation history | Hardcoded response array | `chat.routes.js: GET /recent` |

### 16.3 Solutions
- **Wire to a real AI backend:** Replace the keyword-matching mock with an actual call to Gemini (Node `gemini.client.js` pattern or a new Python router), ideally reusing the Advisory module's evidence-assembly pattern so chat answers can be grounded in real field data.
- **Persist real history:** Add a `chat_messages`/`chat_conversations` table and have `GET /recent` query it per `req.farmer.sub`.

### 16.4 Suggestions for Improvement
- **Correctness (critical):** This is presented to users as an "AI chat" but is fully mocked — a significant gap between advertised and actual functionality that should be flagged to stakeholders/product owners explicitly.
- **Testing:** Given the feature is mocked, tests would at least confirm the mock's current (limited) behavior, but real tests should be written once the feature is implemented for real.

---

## 17. Farm Intelligence Dashboard (Aggregated Insights)

### 17.1 How It Works
- **Purpose:** Cross-field summary: total fields, average health, active alerts, health distribution, and Gemini-generated prioritized recommendations.
- **Files:** `server/src/modules/intelligence/intelligence.routes.js`.
- **Flow:** `GET /api/v1/intelligence` (behind `requireAuth`) queries `fields`, `field_health_scores` (query wrapped in `.catch(() => [])` in case the table doesn't exist yet), and `alerts` directly via raw SQL (bypassing the repository pattern used elsewhere), computes basic stats and a good/moderate/poor health distribution, then — if the farmer has fields — sends a summary prompt to Gemini (`gemini-3.6-flash`) asking for exactly 3 prioritized recommendations as JSON.

### 17.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `[Intelligence] GEMINI_API_KEY not set — intelligence endpoint will fail at runtime.` (startup warning only) | Missing API key | `intelligence.routes.js` |
| `[Intelligence] Gemini recommendations failed: {message}` (console warning, degrades gracefully — `topRecommendations` stays `[]`) | Gemini call/parse failure | `intelligence.routes.js` |
| Generic 500 `{ error: err.message }` | Any other failure (e.g. `fields` query itself failing, which is **not** wrapped in `.catch`) | `intelligence.routes.js` |

### 17.3 Solutions
- The `fields` query itself has no `.catch()` fallback (unlike `healthRows`/`alertRows`) — if that query fails, the whole endpoint 500s instead of degrading gracefully; consider whether that's the desired behavior (arguably correct, since fields are foundational) or should also degrade.
- Raw SQL directly in the route handler bypasses the repository abstraction used elsewhere (e.g., `fieldRepo`, `alertsRepository`) — for consistency, move these queries into repository methods.

### 17.4 Suggestions for Improvement
- **Maintainability:** Centralize DB access behind repositories consistently across the codebase; this route is a notable exception that queries `pool`/`query()` directly.
- **Performance:** Three separate DB round-trips could be combined into fewer queries (e.g., a single query joining fields + latest health scores) if this endpoint becomes a hot path.
- **Testing:** No tests exist for this aggregation logic (health distribution buckets, avg health calculation).

---

## 18. Feedback & Field Timeline

### 18.1 How It Works
- **Purpose:** Capture farmer feedback on advisories and maintain a chronological field event timeline.
- **Files:** `server/src/modules/feedback/feedback.routes.js`, `server/src/db/repositories/feedbackRepository.js`.
- **Flow:** `POST /api/feedback` saves feedback (`feedbackRepo.saveFeedback()`) and writes a corresponding timeline entry (`timelineRepo.addEntry()`). `GET /api/feedback/pending/:field_id` and `GET /api/timeline/:field_id` are wired to routes but **do not query the repositories at all** — they return a hardcoded empty list and two hardcoded sample timeline entries, respectively. Two background-job trigger endpoints (`POST /jobs/trigger-feedback-prompts`, `POST /jobs/verify-outcomes`) are explicit **"Phase 5" stubs** that only return a static "not yet implemented" message.

### 18.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `field_id and farmer_response are required` (400) | Missing fields | `feedback.routes.js: POST /feedback` |
| `GET /timeline/:field_id` never reflects the real timeline for the given field — always returns the same 2 hardcoded entries regardless of `field_id` | Route doesn't call `timelineRepo` | `feedback.routes.js` |
| `GET /feedback/pending/:field_id` always returns `{ prompts: [] }` | Route doesn't query any pending-feedback logic | `feedback.routes.js` |

### 18.3 Solutions
- **Wire `GET /timeline/:field_id`** to `timelineRepo.getEntriesForField(field_id)` (or equivalent method — verify/add to `feedbackRepository.js`) instead of the hardcoded array.
- **Implement `GET /feedback/pending/:field_id`** against real "stale advisory, no farmer response" logic, consistent with the intent described in the `POST /jobs/trigger-feedback-prompts` comment.
- **Implement the two job endpoints** or remove them from the router until they're built, to avoid the false impression that these background processes are active.

### 18.4 Suggestions for Improvement
- **Correctness:** `FieldTimeline.jsx` on the client currently renders fabricated data for every field — this should be prioritized similarly to the Chat and Voice STT gaps.
- **Testing:** No tests for this module.

---

## 19. Background Jobs / Scheduler

### 19.1 How It Works
- **Purpose:** Keep weather data fresh and crop stages up to date without manual intervention.
- **Files:** `server/src/jobs/scheduler.js`, `ingestWeather.js`, `recomputeStages.js`.
- **Flow:** `startScheduler()` (called once at server boot in `index.js`) registers two `node-cron` jobs: hourly weather ingestion for every field (`runDailyWeatherIngestion()`, iterates `SELECT id, name FROM fields`), and a nightly (01:00 UTC) crop-stage recompute (`runNightlyStageRecompute()`).

### 19.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| `[Job:Weather] Error for field {id}: {message}` (per-field, non-fatal — loop continues) | Weather fetch/persist failure for one field | `ingestWeather.js` |
| **Stage recompute silently processes zero fields on every run** | `fieldRepo.findFieldsByFarmer("")` is called with an **empty string** as the farmer ID (comment: `// Phase 5: paginate all farmers`) — this queries `WHERE farmer_id = ''`, which will not match any real field, so the nightly job effectively does nothing useful in its current form | `recomputeStages.js: runNightlyStageRecompute()` |
| `[Job] Error recomputing field {id}: {message}` (per-field, non-fatal) | Would only trigger if the query above were fixed | `recomputeStages.js` |

### 19.3 Solutions
- **Fix the stage-recompute job:** Replace `fieldRepo.findFieldsByFarmer("")` with a new repository method that lists **all** fields (e.g., `fieldRepo.findAllFields()`, mirroring the direct `SELECT id, name FROM fields` pattern already used in `ingestWeather.js`), since stage recompute is meant to run across every farmer's fields, not one farmer's.

### 19.4 Suggestions for Improvement
- **Reliability (critical):** This is a silent failure — the job runs "successfully" (no thrown error, clean log output showing `Updated: 0, Errors: 0`) while doing nothing. Add an assertion/alert if a scheduled job processes zero records when fields are known to exist, to catch this class of bug faster in the future.
- **Scalability:** Both jobs process fields sequentially; for a large farmer base, add batching/parallelism with a concurrency limit and per-job timeouts.
- **Testing:** No tests exist for either job; a simple test asserting `runNightlyStageRecompute()` processes more than zero fields (given seeded fields) would have caught this bug immediately.

---

## 20. ML Training & Evaluation Pipeline (Offline Tooling)

### 20.1 How It Works
- **Purpose:** Train and evaluate the per-crop EfficientNet-B0 disease-classification models consumed by `ai-service/services/vision_inference.py` at inference time.
- **Files:** `ml/training/train_baseline.py`, `ml/preprocessing/{data_split,dataset_audit,label_normalizer}.py`, `ml/evaluation/evaluate_model.py`, `ml/calibration/temperature_scaling.py`, `ml/models/{crop}/{classes.json,metadata.json,model_config.json,training_config.json}`.
- **Flow:** `train_baseline.py` loads a per-crop manifest, extracts images from source ZIPs on the fly, does two-phase transfer learning (frozen backbone → fine-tune), and would write a `.pth` checkpoint plus an experiment report. `ml/models/{crop}/` directories currently contain only **metadata/config JSON files** (`classes.json`, `metadata.json`, `model_config.json`, and for some crops `training_config.json`) — **no `.pth` weight files or `data/model_registry.json` are present in the repository**, confirming that the trained models described by this pipeline have not been checked in (see §6.2).

### 20.2 Errors
| Error/message | Cause | Location |
|---|---|---|
| No weight files (`.pth`) or `data/model_registry.json` present, so `CropVisionPredictor` cannot load any crop-specific model | Trained artifacts not committed to the repository (likely by design, given typical model-size/git-hygiene practice, but this means the inference service always uses the Gemini fallback) | `ml/models/*/` (absence), `ai-service/services/vision_inference.py` |

### 20.3 Solutions
- If PyTorch-based classification is intended to be part of the production system, add a documented model-artifact deployment step (e.g., download from cloud storage at deploy time, or Git LFS) and populate `data/model_registry.json` accordingly. Otherwise, document that the system currently runs on Gemini Vision only and the `ml/` pipeline is a research/future-work track.

### 20.4 Suggestions for Improvement
- **Documentation:** Add a top-level `ml/README.md` (not found in the current tree) explaining the training → export → deploy path and the expected location of `data/model_registry.json` relative to `ai-service/services/vision_inference.py`'s `ROOT` resolution.
- **Reproducibility:** `AgriMesh_Colab_Training.ipynb` exists at the repo root for cloud-GPU training — consider linking it explicitly from `ml/training/train_baseline.py`'s docstring for discoverability.

---

## Project-Level Section

### Feature Summary

| Feature | Main Files | Errors | Priority |
|---|---|---:|---|
| Authentication | `server/src/modules/auth/*`, `middleware/auth.js` | 11 | High |
| Field Management | `server/src/modules/field/*` | 5 | High |
| Crop ID & Phenology | `server/src/modules/crop/*`, `ai-service/routers/{crop,phenology}.py` | 4 | Medium |
| Weather Intelligence | `server/src/modules/weather/*`, `ai-service/routers/weather_rules.py` | 6 | High |
| Soil Intelligence | `server/src/modules/soil/*` | 6 | Medium |
| Disease Diagnosis | `server/src/modules/disease/*`, `ai-service/{routers/disease.py,services/*}` | 9 | High |
| Satellite / NDVI | `server/src/modules/satellite/*` | 7 | Medium |
| Health Score | `server/src/modules/health-score/*`, `ai-service/routers/health.py` | 4 | High |
| AI Advisory | `server/src/modules/advisory/*` | 7 | High |
| Regenerative Planning | `server/src/modules/regen/*`, `ai-service/routers/regen.py` | 3 | **Critical** (non-functional) |
| Climate Risk | `server/src/modules/climate-risk/*` | 2 | Low |
| Cross-Border Insights | `server/src/modules/cross-border/*` | 1 | Low |
| Voice (STT/TTS) | `server/src/modules/voice/*` | 5 | **Critical** (STT non-functional) |
| Escalation Dashboard | `server/src/modules/escalation/*` | 3 | Medium |
| Alerts | `server/src/modules/alerts/*` | 2 | Medium |
| AI Chat | `server/src/modules/chat/*` | 3 | **Critical** (fully mocked) |
| Intelligence Dashboard | `server/src/modules/intelligence/*` | 3 | Medium |
| Feedback & Timeline | `server/src/modules/feedback/*` | 3 | High (fabricated data shown to users) |
| Background Jobs | `server/src/jobs/*` | 3 | **Critical** (stage recompute is a no-op) |
| ML Training Pipeline | `ml/*`, `ai-service/services/vision_inference.py` | 1 | Low (offline tooling) |

### Overall Improvements

**Architecture**
- Two independent Gemini-calling code paths exist in Node (`advisory/gemini.client.js`, `disease.service.js`, `intelligence.routes.js`) *and* in Python (`ai-service/services/gemini_client.py`), using two different model strings (`gemini-1.5-flash` vs `gemini-3.6-flash`) and duplicated prompt/JSON-parsing logic. Consolidate all Gemini calls behind the Python `ai-service`, consistent with the README's stated intent ("Do not duplicate Python logic into Node").
- Crop growth-stage logic is implemented independently in at least three places (Node `crop.service.js` descriptions, Node `advisory.service.js._estimateCropStage()`, Node `health-score.service.js._estimateStage()`, and Python `phenology.py`/DB `crop_calendars`) with inconsistent calendars. Establish `crop_calendars` (DB) + the Python phenology endpoint as the single source of truth.
- Inconsistent auth field name (`req.user` vs `req.farmer`) between `field.routes.js`/`alerts.routes.js` and the rest of the codebase is a systemic bug pattern, not a one-off — worth a project-wide grep/fix pass.

**Performance**
- Background jobs (`ingestWeather.js`, `recomputeStages.js`) iterate fields sequentially with `await` in a loop; add bounded concurrency.
- The Node ↔ Python boundary uses HTTP/multipart for every AI call, including images — for co-located services this is reasonable, but timeouts vary widely (8s Open-Meteo, 10s SoilGrids, 30s disease diagnosis, no explicit timeout on some Python calls) and should be standardized.

**Security**
- `JWT_SECRET` defaults to an insecure, hardcoded string if unset — should fail fast in production instead of silently degrading (`auth.service.js`).
- CORS in `ai-service/main.py` uses `allow_origins=["*"]` combined with `allow_credentials=True`, which is both a security smell and, per the CORS spec, not honored by browsers for credentialed requests — restrict to the Node server's origin as the code comment itself notes should happen.
- Ownership checks in Field Management are broken due to the `req.user`/`req.farmer` mismatch (§2), meaning field edit/delete authorization is not actually enforced as intended.
- Escalation tickets are all attributed to a shared `STUB_FARMER_ID` rather than the authenticated farmer, defeating traceability (§14).
- Multer uploads (soil report parsing) have no file-size/type limits configured.
- JWT access + refresh tokens are stored in `localStorage` on the client (`AuthProvider.jsx`, `apiClient.js`), which is readable by any injected script — an XSS in any dependency would allow full session theft; consider httpOnly cookies for the refresh token at minimum.

**Error Handling**
- Many route handlers (`soil.routes.js`, `disease.routes.js`, `satellite.routes.js`, `climate-risk.routes.js`, `regen.routes.js`) catch errors locally and return `res.status(500).json({ error: err.message })` directly, bypassing `globalErrorHandler` — this produces an inconsistent JSON error shape (`{ error: "..." }` vs. the standard `{ error: { message, status } }`) across the API and loses the shared stack-trace-suppression-in-production logic. Standardize on `next(err)` everywhere.

**Testing**
- Only 3 test files exist for the entire Node server (`weather.rules.test.js`, `health-score.service.test.js`, `api/fields.test.js`), and `health-score.service.test.js` is stale/broken against the current implementation (§8.2). The `ai-service` (Python) and `client` (React) have **no test files evident** for the core business logic beyond one component test (`AdvisoryCard.test.jsx`) and a `vitest.setup.js`. Given the number of functional gaps found in this review (mocked chat, non-functional STT, no-op stage-recompute job, hardcoded regen/timeline endpoints), test coverage is the single highest-leverage investment to prevent regressions and catch "looks done but isn't wired up" bugs like the ones documented throughout this file.

**Code Quality**
- Several modules contain explicit `// TODO`, `// Phase N`, or "MVP"/"mock"/"stub" comments describing known-incomplete functionality (Auth SMS delivery, Chat, Voice STT, Regen planning, Feedback timeline/pending, Escalation regional stats, background job stubs) — these should be tracked in a project issue tracker rather than left as inline comments, so their status is visible outside of a source-code read-through.
- `server/.env.example`, referenced by `db/connection.js`'s own error message, does not exist in the repository.

**Scalability**
- The in-memory `InMemoryDB.regenPlans` cache (`models/Database.js`) and the in-memory `_callTimes` SoilGrids rate limiter are both process-local; they will behave inconsistently (duplicate SoilGrids calls, lost regen-plan cache) the moment the Node server is scaled beyond a single instance. Both should move to a shared store (Postgres and/or Redis) before horizontal scaling.
- The hourly weather job and nightly stage job both scan the entire `fields` table on a single timer with no sharding/partitioning — fine at current scale, but should be revisited if the farmer base grows significantly.