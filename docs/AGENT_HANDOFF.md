# AGENT_HANDOFF.md — Custod

> Coordination file between Claude Code (architecture/product/backend design) and Codex (precise
> implementation, terminal work, build/deploy, adversarial review). Keep this current.

_Last updated: 2026-06-13 by Codex (backend implementation pass)._

---

## Current repo state

- **Branch:** `develop` (up to date with `origin/develop`). Other branches exist: `macOs`, `master`, `claude/eager-fermi-jxfre9`. Teammates may be active — coordinate before touching shared files.
- **Stack:** Next.js 16 App Router, TypeScript, Tailwind, Supabase (`@supabase/supabase-js`), Chrome extension (Vite + React).
- **App lives at repo root** (not `web/`). Vercel auto-detects Next.js. Do **not** relocate it without coordination — would break Vercel + teammate branches.
- **Storage:** `lib/storage.ts` already uses Supabase (table `checks`). README still describes the old local-JSON fallback — **stale**.
- **Analyzer:** `lib/analyzer.ts` is a working deterministic scorer using a `checks`-era shape (`BurnoutAnalysis`, 5 risk signals), **not** the target 6-category `RiskBreakdown` / `scans` contract.
- **API routes (current):** `POST /api/analyze`, `GET /api/checks`, `GET /api/checks/[id]` (+`?format=md`), `POST /api/checks/[id]/share`, `GET /api/share/[slug]`.
- **Types:** `lib/types.ts` is `checks`-era (`BrowserTab`, `BurnoutStatus`, `MoodCheckIn` as numeric energy/stress, `BurnoutAnalysis`, `BurnoutCheckRecord`). UI imports from `@/lib/types`.
- **Research doc:** `docs/custod-research-and-product-strategy.md` (untracked before this pass) — keep, it's the research backbone.

## Files changed in this pass (Claude Code)

Additive only. No existing code modified, no teammate work overwritten.

- `docs/PRODUCT.md` — created (canonical product definition).
- `docs/ARCHITECTURE.md` — created (system + backend + scoring + AI + gamification + deploy).
- `docs/API_CONTRACTS.md` — created (all 13 routes + target types).
- `docs/PRIVACY_SAFETY.md` — created (data rules, tone rules, AI constraints, disclaimers).
- `docs/AGENT_HANDOFF.md` — created (this file).
- `supabase/schema.sql` — created (full schema + indexes + FKs + RLS + retention notes).
- `docs/custod-research-and-product-strategy.md` — left intact (not authored by this pass).

## Files changed in this pass (Codex)

- `lib/types.ts` — extended with additive `scans` contract types while preserving legacy `checks` types.
- `lib/scoring/index.ts` — added deterministic six-category scan analyzer.
- `lib/ai/index.ts` — added optional OpenAI/Gemini wording wrapper with safe rules fallback.
- `lib/privacy/index.ts` — added sanitization, domain extraction, share-safe summaries, and Markdown export helpers.
- `lib/gamification/index.ts` — added progress/streak/achievement derivation from real events.
- `lib/validation/schemas.ts` — added Zod request validation for new routes.
- `lib/storage/scans.ts` — added Supabase/in-memory storage abstraction for devices, scans, events, privacy, share, export, delete.
- `lib/storage.ts` — kept legacy `checks` API working with in-memory fallback when Supabase env is missing.
- `lib/supabase.ts` — added `hasSupabaseAdminEnv()` and `getSupabaseAdminIfConfigured()` without reverting server-key cleanup.
- `app/api/devices/register`, `app/api/scans*`, `app/api/trends`, `app/api/me/*`, `app/api/share`, `app/api/export` — added MVP backend routes.
- `app/api/share/[slug]/route.ts` — resolves new scan shares first, then falls back to legacy check shares.
- `supabase/schema.sql` — aligned schema with persisted analysis/tab groups, reflection metadata, and device-scoped shares.
- `README.md`, `docs/API_CONTRACTS.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_HANDOFF.md` — updated for implemented backend behavior.

## What Claude handled

- Reviewed repo, pulled/fetched latest, confirmed `develop` is current.
- Defined canonical product (TabZero→Custod pivot, MVP scope, cut list).
- Designed backend architecture: local-first scoring, optional AI veneer, Supabase persistence, in-memory dev fallback, cross-device sync staging.
- Specified the full API contract (target `scans` model) + the `checks`→`scans` migration via aliases.
- Designed the deterministic 6-category scoring engine (inputs, weights, thresholds, over-warning prevention, shame-free language).
- Designed the AI wrapper rules and the mature (non-childish) gamification model.
- Wrote the Supabase SQL schema with RLS and privacy-safe share behavior.

## What Codex should handle next (ordered)

1. **Fix the secrets/storage problem (highest priority, security).**
   - `.env.local` with Supabase keys is committed to the repo (see Known Risks). Decide with the team: rotate keys, remove from git history, and switch server code to a **service-role key server-side only** + RLS, with the publishable key only for guarded client reads.
   - Update `README.md` storage section (it falsely claims local-JSON storage).
2. **Apply `supabase/schema.sql`** to the Supabase project (`vdzugcxkqzfauaywiria`). Verify tables + RLS. Add a `migrations/` baseline once stable.
3. **Finish UI migration from `checks` to `scans` when product owner is ready.**
   - Current dashboard still uses `/api/analyze` + `/api/checks*`.
   - New clients should use `/api/scans*`.
4. **Privacy hardening:** implement encrypted `scan_private_payloads` before enabling `storeRawTabs`; current implementation stores aggregate/full analysis JSON for server retrieval and share-safe public output defaults to hiding raw tabs.
5. **Retention cleanup:** wire Supabase cron/edge function for expired private payloads and shares.
6. **DB verification:** apply `supabase/schema.sql` to Supabase and verify table/RLS behavior.
7. **Generated DB types:** replace the local loose Supabase query-builder type in `lib/storage/scans.ts` once schema-generated TypeScript types exist.

## What Codex should NOT touch

- Broad UI redesigns (Claude owns UX/design; the dashboard was just restyled).
- Speculative feature expansion beyond the MVP scope in PRODUCT.md.
- Fake iOS/macOS implementations, demo routes, fake sample data, fake scans/previews.
- AI therapist/chat/wellness features; any diagnostic or scary language.
- Page-content collection or any item on the PRIVACY_SAFETY.md forbidden list.
- Relocating the app to `web/` or restructuring teammate branches without coordination.
- `git commit` / `push` / PRs unless explicitly asked.

## Known risks

- **🔴 Committed secrets:** `.env.local` (Supabase URL + publishable key) is tracked in git and `.gitignore` was loosened to allow it. Publishable keys are low-risk *only if* RLS is correct; today RLS is not enforced for the `checks` table and the server uses the publishable key. The `default` **secret** key shown in the dashboard must never be committed. Recommend: enable RLS, move to service-role server-side, scrub keys from history, rotate.
- **Naming drift:** `checks` (code) vs `scans` (contract). Mitigated by the alias migration plan; risk is duplicated logic if done carelessly.
- **Mood shape mismatch:** current `MoodCheckIn` is numeric energy/stress + timePressure; target is a single enum (`calm|stressed|overwhelmed|numb|skip`). Reconcile in the scoring engine; keep both supported during migration.
- **Stale README** misstates storage — fix to avoid misleading teammates.
- **No validation/rate limiting/idempotency** on current routes — abuse vector for public inserts.
- **Multiple active branches** — merge conflicts likely; prefer small diffs and file ownership.

## Pending decisions (need a human or team call)

1. **Auth timing:** ship anonymous device-scoped MVP now, add Supabase Auth in V1? (Docs assume yes.)
2. **Secret remediation:** rotate keys + scrub history now, or accept risk for hackathon demo? (Recommend rotate before any public/private launch.)
3. **`scans` rename:** full rename vs long-lived aliases — how aggressive?
4. **AI provider:** enable OpenAI/Gemini for the demo, or stay rules-only? (Rules-only is the safe default and fully functional.)
5. **mood enum vs numeric** check-in — pick the canonical client UX.

## Commands already run (Claude)

```bash
git fetch origin
git status
# read-only inspection of lib/, app/api/, extension/, README.md, docs/
npm install @supabase/supabase-js   # (earlier session)
npm run typecheck                   # (earlier session — passed)
```

## Commands Codex should run

```bash
# sync first
git fetch origin && git status

# verify after changes
npm run typecheck
npm run lint
npm run build

# extension (only if touched)
cd extension && VITE_WEB_APP_URL=http://localhost:3000 npm run build

# apply DB schema (Supabase SQL editor or CLI)
# psql "$SUPABASE_DB_URL" -f supabase/schema.sql
```

## Commands run by Codex

```bash
git fetch origin
npm install zod
npm run typecheck
```

Current verification status: `npm run typecheck` passes. Lint, build, and route smoke tests are the next verification steps.
