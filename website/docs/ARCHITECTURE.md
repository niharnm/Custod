# ARCHITECTURE.md — Custod

> System architecture, backend design, scoring engine, AI wrapper, and gamification.
> Contracts live in [API_CONTRACTS.md](./API_CONTRACTS.md). Data rules live in [PRIVACY_SAFETY.md](./PRIVACY_SAFETY.md).

---

## 1. System overview

Custod is a **local-first signal collector + cloud-optional analysis & history** system.

```
┌──────────────┐     safe signals      ┌─────────────────────────┐
│ Chrome ext   │ ───────────────────▶  │  Next.js App Router      │
│ (collector)  │                       │  /app/api/*  (backend)   │
└──────────────┘                       │                          │
┌──────────────┐                       │  lib/scoring (rules)     │
│ Web dashboard│ ◀── analysis/history ─│  lib/ai (optional)       │
│ (paste + UI) │                       │  lib/db / lib/storage    │
└──────────────┘                       └───────────┬─────────────┘
┌──────────────┐  (later, aggregate)               │
│ iOS / macOS  │ ─────────────────────▶            ▼
└──────────────┘                       ┌─────────────────────────┐
                                       │ Supabase Postgres + RLS  │
                                       │ (fallback: in-memory dev)│
                                       └─────────────────────────┘
```

Design principles:

- **Local-first scoring.** The deterministic rules engine is pure and runs anywhere (extension, server, future native clients). Cloud is for history/trends/sync, not for the core verdict.
- **Deterministic core, optional AI veneer.** Scores and status come from rules. AI only rewords explanations and never changes the score or status.
- **Collect less.** Only safe signals cross the wire. Raw payloads stay local or opt-in encrypted (see PRIVACY_SAFETY.md).
- **Additive evolution.** Current code uses `checks`; target contract uses `scans`. We migrate via aliases, not rewrites (see §11 + AGENT_HANDOFF.md).

---

## 2. Chrome extension role

- **Primary signal collector** and the fastest path to value.
- Captures **current-window** tabs only: `title`, `url`, `active`, optional `favIconUrl`. **Never page content.**
- Optional tiny check-in (mood + time remaining) in the popup.
- Sends a sanitized `AnalyzeBurnoutRequest` to the web backend (or scores locally when offline / privacy-mode local-only).
- Later: category correction, "park tabs" reset action, immediate yellow/red summary in the popup.
- Permissions kept minimal: `tabs`, `storage`. Host permissions scoped to the deployed app domain.

## 3. Web dashboard role

- Paste-tabs entry path (no extension required) + the canonical **analysis detail** view.
- History list, score trend, evidence groups, reset plan.
- Privacy/account controls: export, delete, share, privacy settings.
- Renders results from the shared contract; does not own scoring.

## 4. Future iOS role

- Self-check, trend review, quiet reset timer, "today status."
- Optional Screen Time / DeviceActivity category signals **only** with explicit permission and explicit data boundaries.
- Talks to the same backend via device registration; syncs **aggregate** records.
- Do **not** ship fake browser-detection. Design prototype until APIs are confirmed.

## 5. Future macOS role

- Menu-bar local pressure sensor: app/category switching + active-window domain, **local-only scoring**.
- Local baseline ("is this unusual for me?"), optional focus-mode handoff.
- Syncs aggregate scan records only.

## 6. Shared backend role

A thin, typed Next.js App Router API layer over Supabase. Responsibilities:

- Device + (later) user registration.
- Scan ingestion → deterministic scoring → optional AI wording → persistence.
- Scan retrieval, history, trend summaries.
- Reflection capture and reset-completion recording.
- Gamified progress (streaks, achievements) derived from real events.
- Privacy settings, share/export, delete-all.
- Validation (Zod), idempotency keys for ingestion, rate limiting, retention jobs.

## 7. Data flow

**Scan ingestion (`POST /api/scans`)**

```
client sanitizes tabs (drop page content) ─▶ POST /api/scans
  ─▶ Zod-validate request
  ─▶ lib/scoring: deterministic score + status + risk breakdown + reset plan + tab groups
  ─▶ lib/ai (optional): reword explanation only; validate/repair JSON; fallback to rules text
  ─▶ lib/privacy: split aggregate (always stored) vs raw payload (local / opt-in encrypted)
  ─▶ persist scan + risk_scores + reset_plan (+ scan_events)
  ─▶ return AnalyzeBurnoutResponse
```

**Retrieval / history / trends**

```
GET /api/scans/[id]   → owner/device-scoped scan detail
GET /api/scans        → list (aggregate fields) for history
GET /api/trends       → bucketed status/score over time
GET /api/me/progress  → streaks + achievements derived from scan_events
```

## 8. Storage strategy

- **Aggregate, always-store (safe):** status, score, top pattern, tab_count, domain_count, per-category risk scores, timestamps, evidence **counts** + sample domains.
- **Sensitive, local / opt-in:** full tab titles, full URLs, raw reflection text, favicon URLs, full session lists. Stored only in `scan_private_payloads` as an **encrypted** blob with an `expires_at`, and only when the user opts in.
- **Share links:** store a slug → scan mapping with `expires_at` and `include_raw_tabs` (default `false`). Shares are revocable.
- **Retention:** `privacy_settings.retention_days` drives a scheduled cleanup of expired private payloads and shares.
- **Fallback:** if Supabase env is absent (local/dev only), use an in-memory store (`lib/storage/memory.ts`). Never use in-memory as production persistence. **No fake seed data.**

## 9. AI / rules fallback strategy

Priority order for analysis wording:

1. `OPENAI_API_KEY` present → OpenAI.
2. else `GEMINI_API_KEY` present → Gemini.
3. else → **deterministic rules only** (fully functional; this is the MVP default).

Hard rules for the AI wrapper (`lib/ai`):

- AI receives **only**: tab titles, URLs, goal, optional mood check-in, time remaining. Nothing else.
- AI must return **strict JSON** matching the wording schema. Output is validated/repaired; on any failure → fall back to rules text.
- AI **cannot** change `score`, `status`, or `riskBreakdown` — those are deterministic.
- AI **cannot** diagnose, claim certainty, use scary/clinical language, or act as a therapist (see PRIVACY_SAFETY.md prompt constraints).

## 10. Cross-device sync plan

- **MVP:** anonymous/device-scoped scans; no account required. Each client registers a device (`POST /api/devices/register`) and includes `deviceId` on scans.
- **V1:** Supabase Auth. Link devices to a user. Sync **aggregate** scan records by default.
- **V1+ (opt-in):** encrypted raw-evidence sync with retention controls and idempotency keys to dedupe extension submissions.
- Sync moves **aggregate metadata + user category overrides**, never raw evidence unless explicitly enabled.

## 11. `checks` → `scans` migration

Current code (`develop`) ships `checks`. Target contract is `scans`. Plan:

1. Introduce `scans` schema (table + types) alongside existing `checks`.
2. Add `/api/scans*` routes that the new clients use; keep `/api/checks*` as **thin aliases** during transition.
3. Migrate the web UI to `scans` once routes are stable.
4. Remove `checks` aliases only after all clients are cut over.

This avoids breaking the working dashboard mid-flight. Codex owns the mechanical migration (see AGENT_HANDOFF.md).

---

## 12. Backend file / folder structure (proposed)

The web app currently lives at the **repo root** (not `web/`). Keep it there to avoid breaking Vercel auto-detection and teammate branches. Proposed additive structure:

```
app/
  api/
    devices/register/route.ts
    scans/route.ts                 # POST (ingest), GET (list)
    scans/[id]/route.ts            # GET (detail), DELETE
    scans/[id]/reflection/route.ts # POST
    scans/[id]/reset-complete/route.ts # POST
    trends/route.ts                # GET
    me/progress/route.ts           # GET
    me/privacy/route.ts            # PATCH
    me/data/route.ts               # DELETE (delete all)
    export/route.ts                # GET
    share/route.ts                 # POST (create)
    share/[slug]/route.ts          # GET (read), DELETE (revoke)
    checks/**                      # legacy aliases during migration (delete later)
lib/
  db/            # Supabase client (server), typed row helpers, query fns
  storage/       # storage interface + supabase impl + memory (dev) fallback
  scoring/       # deterministic rules engine (pure, isomorphic)
  ai/            # optional OpenAI/Gemini wrapper + JSON validate/repair
  privacy/       # sanitize, aggregate/raw split, encryption helpers
  gamification/  # streaks + achievements derivation
  devices/       # device id + registration helpers
  validation/    # Zod schemas for all request/response bodies
types/           # shared TS types (or keep lib/types.ts; see note)
supabase/
  schema.sql     # full schema + indexes + RLS (source of truth for DB)
  migrations/    # ordered migrations once schema stabilizes
docs/            # this folder
```

> Note: current types live in `lib/types.ts` and the UI imports from `@/lib/types`. To stay additive, **extend `lib/types.ts`** rather than introducing a competing `types/` dir, unless/until Codex does a deliberate move. API_CONTRACTS.md defines the target shapes.

---

## 13. Scoring engine design (deterministic)

Pure module in `lib/scoring`. No network, no AI, no randomness — same input ⇒ same output.

### Inputs

- `tabs: BrowserTab[]` (sanitized)
- `goal?: string`
- `moodCheckIn?: "calm" | "stressed" | "overwhelmed" | "numb" | "skip"`
- `timeRemaining?: string` (parsed to minutes when possible)

### Six risk categories (0–100 each, then weighted into the overall score)

| Category | Drivers |
| --- | --- |
| `tabOverload` | tab count thresholds: >10 adds risk, >20 more, >35 high |
| `contextSwitching` | distinct domains + distinct categories; coding/docs/search/video mixed together |
| `distractionPull` | count of distraction-domain tabs (esp. mixed with deadline tabs) |
| `goalFragmentation` | many categories competing; research/communication/admin open together |
| `timePressure` | goal mentions deadline/submission/tonight/final/project; `timeRemaining` < 2h; mood stressed/overwhelmed/numb |
| `recoverySignal` | tabs centered on one task/category; recovery cues present — **reduces** overall risk |

### Weights & overall score

- Each category produces a sub-score. Overall score = weighted sum of the five **strain** categories **minus** a damping from `recoverySignal`, clamped to `0–100`.
- Suggested starting weights (tunable, keep in one constants file): tabOverload 0.22, contextSwitching 0.20, distractionPull 0.20, goalFragmentation 0.18, timePressure 0.20; recoverySignal damps up to ~15 points.
- **Over-warning prevention:** require corroborating signals before red. A high tab count alone should not exceed yellow unless paired with distraction/time-pressure/mood. Strong `recoverySignal` caps the status at yellow.

### Thresholds

| Score | Status | `statusLabel` |
| --- | --- | --- |
| 0–34 | `green` | `Stable` |
| 35–69 | `yellow` | `Strained` |
| 70–100 | `red` | `At Risk` |

### Main pattern selection

- Pick the highest **strain** sub-score as `mainPattern`. If all are low, `mainPattern = "Stable browsing pattern"` and no urgent language.
- `oneSentenceExplanation` is templated from the top category, shame-free.

### Reset plan generation

Templated from the top pattern + status into the `resetPlan` shape:

- `immediateAction` — the single most useful next move (e.g. "Park entertainment tabs first").
- `threeMinuteReset` — body/attention reset.
- `twentyMinuteFocusBlock` — one-sentence "for the next 20 minutes I am only doing X."
- `closeOrSave[]` / `ignoreForNow[]` — concrete tab guidance derived from tab groups.

### Language rules (enforced in templates)

- Plain, specific, shame-free: "Your browser is carrying too many open loops," not "You are unproductive."
- Never imply certainty from weak signals. Never diagnose. See PRIVACY_SAFETY.md tone rules.

---

## 14. AI analyzer design (`lib/ai`)

- `analyzeWithAI(input) → WordingResult | null`. Input limited to the safe fields (§9).
- Strict JSON output schema (explanation strings, `aiReasoning[]`, `shareSummary`). Validate with Zod; attempt one repair; else return `null`.
- Caller merges AI **wording** over deterministic results; deterministic `score`/`status`/`riskBreakdown` are authoritative.
- Prompt constraints enforced server-side (no diagnosis, no certainty, no scary/clinical/therapy language) — see PRIVACY_SAFETY.md.

---

## 15. Gamification design (mature, Duolingo-habit not childish)

Derived from real `scan_events`, never fabricated:

- **Check-in streak** — consecutive days with at least one scan.
- **Reset-completion streak** — consecutive resets actually completed.
- **Weekly consistency** — scans on N distinct days this week.
- **Stability trend** — run of green/low scores ("Three Stable Days").
- **Achievements** — First Check-In, Reset Completed, Pattern Spotted, Focus Recovered, Three Stable Days, Weekly Reflection.

Rules: **no punishment for missed days, no shame language, no guilt mechanics, no pets/trees.** Missing a day quietly pauses a streak; it never scolds.

---

## 16. Deployment plan (Vercel + Supabase)

- **Vercel:** web app at repo root, Next.js auto-detected. Env: `NEXT_PUBLIC_APP_URL` (share links), Supabase URL + keys, optional `OPENAI_API_KEY` / `GEMINI_API_KEY`.
- **Supabase:** Postgres + Auth (when accounts land) + RLS. Apply `supabase/schema.sql`. Use the **service-role key server-side only**; never expose it to the client. The publishable/anon key is for RLS-guarded client reads only.
- **Secrets:** managed in Vercel/Supabase dashboards. Codex owns deployment/secret wiring; Claude does not touch production credentials.
- **Known issue:** repo currently commits `.env.local` with Supabase keys, and the server uses the publishable key directly. This must be fixed before real users (see AGENT_HANDOFF.md risks).
