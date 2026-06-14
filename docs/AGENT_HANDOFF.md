# Agent Handoff

> Two passes are recorded here. The **most recent pass** (backend verification &
> extension privacy hardening) is first; the original **integration & consistency
> pass** follows below.

---

## Update — Backend verification & extension privacy hardening (2026-06-13, later pass)

**Scope:** actually *run* the backend and clients, prove the deterministic and
no-Supabase fallbacks, and fix concrete privacy bugs found in the extension.
This pass builds on the integration pass below — it did not revert it.

### What I verified by running it (not just reading)

Started a dev server with **all AI keys and the Supabase service key forced
empty** (`GROQ_API_KEY= OPENAI_API_KEY= GEMINI_API_KEY= SUPABASE_SECRET_KEY= …`)
to exercise the pure deterministic + in-memory path, then smoke-tested every
route with `curl`:

| Route | Result |
|---|---|
| `POST /api/scans` (no AI key) | ✅ deterministic verdict — `status/score/statusLabel/mainPattern/riskBreakdown/resetPlan/tabGroups/checkEngineTimeline/shareSummary`, `aiReasoning: []` |
| `GET /api/scans/[id]` · `GET /api/scans` | ✅ `{ scan }` / `{ scans[] }`, owner-scoped |
| `POST /api/scans/[id]/reflection` | ✅ stores reflection |
| `POST /api/scans/[id]/reset-complete` | ✅ returns streak + unlocked achievements |
| `GET /api/trends` · `GET /api/me/progress` | ✅ aggregates from events |
| `PATCH /api/me/privacy` | ✅ persists patch |
| `POST /api/devices/register` | ✅ returns device |
| `POST /api/share` → `GET /api/share/[slug]` | ✅ created, and **public read shows domains only (`youtube.com`), never raw URLs** |
| `GET /api/export` | ✅ `storage: "memory-dev"` (correct fallback marker) |
| `DELETE /api/me/data` | ✅ deletes scans/reflections/shares |

**Acceptance criteria proven:** scan creation works; deterministic scoring runs
with **no AI keys**; the app **does not crash without Supabase env vars** (falls
back to the in-memory dev store, `export` reports `memory-dev`); share pages do
not leak raw tabs. The rules engine always computes the numbers first; AI only
layers wording and returns `null` safely on any failure.

### Privacy bugs fixed in the Chrome extension

1. **Removed a keystroke listener.** `extension/content.js` attached a global
   `keydown` handler on `<all_urls>` (including password fields) to count rapid
   Backspace "frustration" bursts. Even counting one key is keystroke
   collection — it contradicts Custod's privacy promise and the "never
   keystrokes" line already in `docs/PRIVACY_SAFETY.md` and `/privacy`. Fix:
   `content.js` is now a documented no-op, its `<all_urls>` content-script entry
   was removed from `manifest.json`, and the `frustration_event` message handler
   was removed from `background.js` (the now-unused `frustration_events` feature
   simply stays `0`). No keyboard listeners remain anywhere in the extension.
2. **Stop storing raw query strings.** `background.js` logged every navigation's
   **full URL** (path + query + hash) to Supabase `site_visits`. Query strings
   carry search terms, tokens, and PII. Added `stripQueryAndHash()` (mirrors the
   web backend's `stripUrlForStorage`) so only origin + path is stored.

All extension JS passes `node --check`; `manifest.json` is valid.

### Flagged, deliberately NOT changed (teammate-owned, marked intentional)

- **A real Groq secret is now hardcoded** in `src/lib/ai/index.ts`
  (`DEFAULT_GROQ_API_KEY`) and `.env.example` so AI works out of the box. This
  conflicts with the "no hardcoded secrets" rule but was committed intentionally
  (`2c67c93`) and carries its own SECURITY comment. **Top remaining security
  item: rotate it and move to a server-only env var before any public launch.**
  It does not affect the deterministic fallback (numbers are always rules-based).

### Commands run (this pass)

`npm run typecheck` ✅ · `npm run lint` ✅ · `npm run build` ✅ (all 13 routes incl.
`/privacy` `/terms` `/support` prerender) · live `curl` smoke tests ✅ ·
`node --check` on all extension JS ✅.

### Files changed (this pass)

- `extension/content.js` — keystroke listener → documented no-op.
- `extension/manifest.json` — removed the `content.js` `<all_urls>` registration.
- `extension/background.js` — added `stripQueryAndHash()`, sanitize stored visit
  URLs, removed the `frustration_event` handler.
- `docs/ARCHITECTURE.md` — **new** (system map of the actual repo).
- `docs/AGENT_HANDOFF.md` — this section.

### Still open after this pass

- Live AI path (bundled Groq key) verified by code inspection, not a live call.
- The extension↔web **two data models** gap (item 2 below) is unchanged — real
  but pre-existing and deliberate; persistence isn't live yet.
- Everything in the original follow-up list below still stands.

---

# Agent Handoff — Cross-platform integration & consistency pass

**Date:** 2026-06-13 · **Branch:** `master` · **Scope:** repo-wide integration,
branding, legal/safety, config, and docs consistency across web, Chrome
extension, macOS, and iOS.

## What I inspected

- Repo structure & branches (`master`, `chrome`, `macOs`, `website`, …).
- Web app: API route map (`src/app/api/**`), validation schemas, types, AI layer,
  owner/auth resolution, footer/links, landing content.
- Chrome extension (lived on the `chrome` branch): manifest, popup, background,
  supabase client, welcome flow.
- Native apps: iOS (`ios/Custod`) and macOS (`macos/Custod`) — config, screens,
  auth, sync, safety language.
- Existing docs (`docs/ECOSYSTEM_SYNC.md`), `.env.example`, README.

## Key findings

1. **Branding is already clean** — no "TabZero" references anywhere; everything
   says "Custod".
2. **Chrome extension was on a separate branch** (`chrome`), which is an *old
   fork of the whole repo* — merging it wholesale would have reverted the web
   app. I extracted only the extension files into `extension/` on `master`.
3. **Extension uses a different backend model** — it writes directly to Supabase
   (`/rest/v1/browsing_sessions`, Edge Function `score`) instead of the shared
   `POST /api/scans` contract. Documented; migration left as follow-up.
4. **No legal/support pages existed** — created `/privacy`, `/terms`, `/support`.
5. **Footer contact email was wrong** (`hello@custod.app`) and there were no
   legal links — fixed to `nihar.manchikalapudi@gmail.com` + added links.
6. **README was still the upstream template** ("AI Website Cloner Template") —
   replaced with a real Custod README.
7. **Native apps lacked a visible contact email / privacy links** — added an
   About & privacy block to both iOS and macOS.
8. **macOS already matches the API contract** (`CustodSync.swift` → `/api/scans`)
   and has strong anti-diagnosis guardrails. iOS is account-only so far.
9. **Lint was drowning in 851 errors** from untracked `website/.next` build
   artifacts (eslint's `.next/**` ignore wasn't recursive) — fixed the ignores.

## What I changed

### Web (Next.js)
- `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/support/page.tsx` — **new** legal/support pages.
- `src/components/legal/LegalShell.tsx` — **new** shared layout for those pages.
- `src/lib/custod-links.ts` — added `CONTACT_EMAIL` + `privacy`/`terms`/`support`/`contact` links.
- `src/lib/custod-content.ts` — footer: real contact email + Privacy Policy / Terms / Support links.
- `eslint.config.mjs` — recursive ignores; ignore `website/**` and `extension/**`.
- `.env.example` — added optional AI keys + per-client config notes + Vercel notes.
- `README.md` — full Custod rewrite.

### Chrome extension (new `extension/` folder)
- Extracted from the `chrome` branch into `extension/` (additive; web untouched).
- `extension/config.js` — **new**, centralizes `WEB_APP_URL` / `DASHBOARD_URL`.
- `extension/popup.js` — uses `DASHBOARD_URL` instead of a hardcoded URL.
- `extension/README.md` — **new**.

### iOS
- `ios/.../CustodConfig.swift` — added `webAppURL` + `contactEmail`.
- `ios/.../ContentView.swift` — added a Privacy & safety card (copy + Privacy/Terms/Support links + contact email).

### macOS
- `macos/.../CustodConfig.swift` — added `contactEmail`.
- `macos/.../ContentView.swift` — added an **About & privacy** settings card (copy + links + contact email).

### Docs (all new)
- `docs/API_CONTRACTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRIVACY_SAFETY.md`,
  `docs/IOS_PLAN.md`, `docs/MACOS_PLAN.md`, `docs/AGENT_HANDOFF.md`.

## Commands run / results

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ pass (0 errors) |
| `npm run lint` | ✅ clean after ignore fix (was 851 errors from build artifacts) |
| `npm run build` | ✅ pass — `/privacy`, `/terms`, `/support` prerender |
| iOS / macOS `xcodebuild` | ⚠️ **not run** — no Xcode in this sandbox. Build locally (commands in the plan docs). Swift edits are additive, syntactically conservative. |

## Remaining issues / follow-ups (for Codex / teammates)

1. **Verify the Swift builds** locally — the new About/privacy cards on iOS &
   macOS are additive but unbuilt here.
2. **Migrate the Chrome extension onto `POST /api/scans`** (or add a server
   adapter) so all four clients share one data shape. See `docs/API_CONTRACTS.md`.
3. **Extension popup vs. brief spec** — the popup is a passive status ring, not
   the goal/mood/"Scan My Patterns" form in the brief. Decide whether to add an
   active check-in form or keep the ambient model (documented, not forced).
4. **Apply the Supabase schema** in the deployed env so data persists (else
   in-memory dev store). Rotate the previously-exposed Groq key.
5. **iOS Screen Time** — request Apple's Family Controls entitlement, then wire
   device-register + `/api/scans` (mirror macOS `CustodSync`).
6. **Legacy `/api/analyze` + `/api/checks`** stack is still mounted — plan its
   removal once nothing depends on it.
7. `website/` is untracked local build junk; safe to delete locally.

## What teammates should avoid touching until merged

- `extension/` (just landed from the `chrome` branch — coordinate before editing).
- `eslint.config.mjs` ignore list and the new `docs/*.md` (this pass owns them).
- The new legal pages / `LegalShell` (stable; extend rather than rewrite).
