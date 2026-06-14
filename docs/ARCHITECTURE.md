# Custod — Architecture

Custod is a privacy-first "check engine light" for student burnout and digital
strain. It reads a small set of **safe signals** (tab titles, URLs/domains,
optional check-ins) and turns them into an ambient green/yellow/red status with
a reset plan. It is **not** a diagnosis, therapy, or crisis tool.

This document describes the repo **as it actually is** (verified 2026-06-13), not
an aspirational design. For the request/response contract see
[`API_CONTRACTS.md`](API_CONTRACTS.md); for the privacy posture see
[`PRIVACY_SAFETY.md`](PRIVACY_SAFETY.md); for the cross-client account/sync model
see [`ECOSYSTEM_SYNC.md`](ECOSYSTEM_SYNC.md).

## Components

| Client | Path | Talks to backend via | Auth |
|---|---|---|---|
| Web app + dashboard | `src/app` | Next.js route handlers `src/app/api/**` (`apiFetch`) | Supabase cookie session |
| Backend API | `src/app/api/**`, `src/lib/**` | — (is the backend) | `resolveOwner()` |
| Chrome extension | `extension/` | **Supabase REST + Edge Function `score`** (its own data model) | Supabase bearer token |
| macOS app | `macos/Custod` | `POST /api/scans` (`CustodSync.swift`) | Supabase bearer token |
| iOS app | `ios/Custod` | account/login only so far (scan wiring pending) | Supabase bearer token |

All clients authenticate against the **same Supabase project**
(`vdzugcxkqzfauaywiria`) using the public **publishable/anon** key, so one
account resolves across every surface. The service/secret key is server-only.

## Backend request flow (the `scans` stack)

```
client → POST /api/scans
  └─ rateLimit + optional Idempotency-Key                (src/lib/http-guards.ts)
  └─ resolveOwner(request)                               (src/lib/owner.ts)
       Bearer JWT → userId · else cookie → userId · else X-Custod-Device → deviceId
  └─ analyzeBurnoutRequestSchema.parse()                 (src/lib/validation/schemas.ts)
  └─ analyzeWithRules(input)   ── DETERMINISTIC, always runs ── (src/lib/scoring)
       sanitize tabs → categorize → score 6 risks → status/score → reset plan
  └─ applyOptionalAiWording(input, rules)                (src/lib/ai)
       Groq → OpenAI → Gemini; layers WORDING only; null-safe → rules wording
  └─ getScanStore().createScan(analysis, owner)          (src/lib/storage/scans.ts)
  → AnalyzeBurnoutResponse (JSON)
```

Key invariant: **the model never changes the numbers.** Score, status,
`riskBreakdown`, reset plan, and tab grouping are computed by the rules engine;
the AI layer only rewrites the human-readable explanations and is fully optional.
With no AI key (or any API failure) the deterministic result is returned as-is.

## Storage layer — two backends behind one interface

`src/lib/storage/scans.ts` exposes a single `ScanStore` interface with two
implementations, chosen at call time by `getScanStore()`:

- **`SupabaseScanStore`** — used when `SUPABASE_URL` + `SUPABASE_SECRET_KEY`
  (or legacy `SUPABASE_SERVICE_ROLE_KEY`) are set. Writes to `scans`,
  `risk_scores`, `reset_plans`, `scan_events`, `share_links`, `reflections`,
  `privacy_settings`, `devices`, `profiles`. Upserts FK parents (`profiles`,
  `devices`) before inserting a scan to avoid 500s.
- **`MemoryScanStore`** — the fallback when the service key is absent. In-memory,
  process-lifetime only. `export` reports `storage: "memory-dev"` so the
  fallback is observable. **The app never crashes when Supabase env vars are
  missing** — it degrades to this store.

Owner scoping: signed-in requests scope by `user_id`; anonymous by `device_id`;
public shared-scan reads use an empty owner (match by slug only).

## Privacy boundaries (where data is reduced)

- `src/lib/privacy/index.ts` — `extractDomain`, `stripUrlForStorage`
  (drops query + hash), `sanitizeTabsForAnalysis`, `shareSafeTabGroups`
  (public shares show **domains only** unless the owner opts into raw tabs),
  `publicScan` (strips owner ids + reflection).
- `src/lib/ai/index.ts` `safePayload()` — the model sees titles, URLs, active
  flag, goal, mood, time only; **never page contents**, and output is rejected
  if it contains diagnosis/therapy/panic terms (`isSafeWording`).
- Extension — collects only aggregate browser metadata (tab count, switch rate,
  active time, distraction-domain ratio). **No keystrokes, no page contents.**
  Stored visit URLs are stripped of query + hash (`stripQueryAndHash`).

## Known architectural gap

The Chrome extension writes a **different data model** (`browser_readings`,
`browsing_sessions`, `site_visits`, Edge Function `score`) than the `scans`
stack the web dashboard reads. Both hit the same Supabase project, but extension
activity does **not** currently appear in the dashboard's `/api/scans` list.
Reconciling them (extension → `POST /api/scans`, or a server adapter) is the main
open follow-up — see `AGENT_HANDOFF.md` and `API_CONTRACTS.md`.

## Legacy (dead-but-present)

`/api/analyze` and the `/api/checks/**` routes are an older "checks" stack kept
only so nothing breaks during the migration. Do not build new features on them;
they are slated for removal once nothing depends on them.
