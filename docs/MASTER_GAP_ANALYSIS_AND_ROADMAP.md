# Custod — Master Gap Analysis & Roadmap

> Generated 2026-06-13. A full-ecosystem audit: what exists, what's disconnected, what's
> missing, and what to build next — informed by a deep codebase pass, a competitor scan,
> and real user sentiment from Reddit / HN / app reviews / academic studies.
>
> Companion docs: [PRODUCT.md](./PRODUCT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) ·
> [API_CONTRACTS.md](./API_CONTRACTS.md) · [PRIVACY_SAFETY.md](./PRIVACY_SAFETY.md) ·
> [AGENT_HANDOFF.md](./AGENT_HANDOFF.md)

---

## 0. TL;DR — the one-paragraph state of the union

The **backend is ~95% built and the frontend is ~60% wired to it.** Custod has two parallel
stacks living side by side: a mature new `scans` stack (6-category scoring, AI veneer, privacy,
gamification, devices, trends, share, export, delete — all implemented) and a legacy `checks`
stack that the actual UI still talks to. **The single biggest problem is not missing features —
it's that the good backend is not connected to the frontend, the database schema has never been
applied to Supabase, and secrets are committed to git.** Close those three gaps and Custod jumps
from "demo" to "shippable." Everything past that is differentiation: the research says Custod's
privacy-first + tab-signal + early-warning + student angle is genuinely uncontested — but it must
*never block, never shame, never over-claim a diagnosis,* and it must *prove* its privacy promise.

---

## 1. CRITICAL — connectivity & "make the ecosystem one thing" (P0)

These are the gaps that mean the product isn't actually one connected system yet. **Do these first.**

### 1.1 Frontend still talks to the legacy stack
- `components/BrowserCaptureForm.tsx:117` POSTs to `/api/analyze` (legacy) → `lib/analyzer.ts`
  (5-signal scorer), **not** `/api/scans` → `lib/scoring/index.ts` (6-category engine).
- `app/page.tsx` reads history via `listChecks()` (legacy `lib/storage.ts`), not `listScans()`.
- `app/check/[id]/page.tsx` uses `getCheck()`; `app/share/[slug]/page.tsx` uses `getCheckBySlug()`.
- **Result:** every new capability (recoverySignal category, reset plan, tab groups, AI wording,
  reflections, reset-complete, streaks, trends, privacy settings, export, delete) is **invisible to
  users** because the UI never calls those routes.
- **Action:** migrate the UI to the `scans` contract. Point the form at `POST /api/scans`, history
  at `GET /api/scans`, detail at `GET /api/scans/[id]`, share at `POST /api/share`. Keep legacy
  routes as thin aliases until cutover is verified, then delete them.

### 1.2 Database has never been applied
- `supabase/schema.sql` (13 tables, RLS, indexes) is written but **not run** against the live
  project (`vdzugcxkqzfauaywiria`). Today everything runs on the in-memory fallback, which is
  wiped on every server restart/redeploy — i.e. **no data actually persists.**
- **Action:** apply the schema, verify tables + RLS, add a `migrations/` baseline, generate typed
  DB types (Supabase CLI) and replace the loose query-builder type in `lib/storage/scans.ts`.

### 1.3 Committed secrets / security must-fix
- `.env.local` with Supabase URL + publishable key is tracked in git history; `.gitignore` was
  loosened to allow it. The **secret/service-role key must never be committed.**
- RLS is **not** enforced on the legacy `checks` table and the server has used the publishable key.
- **Action (in order):** rotate keys in Supabase → scrub from git history (BFG/filter-repo) →
  server uses service-role key **server-side only** → publishable/anon key only for RLS-guarded
  client reads → enable RLS on every table → confirm `.env.local` is gitignored and `.env.example`
  is the only committed env file.

### 1.4 Two analyzers + mood-shape mismatch
- Legacy `lib/analyzer.ts` (5 signals, numeric energy/stress mood) vs new `lib/scoring/index.ts`
  (6 categories, enum mood `calm|stressed|overwhelmed|numb|skip`). The capture form collects the
  *old* mood shape.
- **Action:** pick the enum mood as canonical, update the form, retire `lib/analyzer.ts` +
  `lib/markdown.ts` once the UI is on `scans`. One scorer, one mood model.

### 1.5 Extension ↔ web contract
- Extension sends tabs to the web form via `postMessage`; `manifest.json` host permissions and
  `VITE_WEB_APP_URL` are dev/localhost-shaped.
- **Action:** make the deployed-domain build the default, align manifest host permissions with the
  Vercel domain, and have the extension call `POST /api/scans` directly (with `X-Custod-Device`)
  rather than only piggybacking the web form, so it works as a standalone collector.

### 1.6 Privacy controls exist in the backend but not the UI
- `GET/PATCH /api/me/privacy`, `GET /api/export`, `DELETE /api/me/data` are all implemented, but
  there is **no settings/privacy-controls screen** that calls them. The privacy page is static text.
- **Action:** build a real Settings screen (see §4.5) wired to those three routes.

---

## 2. SECURITY, INFRA & CORRECTNESS (P0–P1)

| # | Item | Why | Priority |
|---|------|-----|----------|
| 2.1 | Rotate + scrub committed Supabase keys | Leaked credentials | P0 |
| 2.2 | Apply schema + enable RLS on all tables | No persistence + access control | P0 |
| 2.3 | Service-role key server-side only | Privilege separation | P0 |
| 2.4 | Rate limiting on `POST /api/scans`, `/api/share`, `/api/devices/register` | Public insert/abuse vector | P1 |
| 2.5 | Idempotency-Key handling on ingestion | Extension retries double-write | P1 |
| 2.6 | Encrypt `scan_private_payloads` before `storeRawTabs` can be enabled | Raw URLs are sensitive | P1 |
| 2.7 | Retention cron (Supabase edge fn) for expired shares + payloads | `expires_at` is set but nothing deletes | P1 |
| 2.8 | `DELETE /api/share/[slug]` revoke route | Contract promises revocation; not built | P1 |
| 2.9 | Input size caps / tab-count limits enforced server-side | DoS via huge payloads | P1 |
| 2.10 | Structured error + logging (no sensitive content in logs) | Reflections/URLs must never be logged | P1 |
| 2.11 | CORS policy for extension origin | Extension → API hardening | P2 |
| 2.12 | CI: `typecheck` + `lint` + `build` on PR; route smoke tests | Catch regressions | P1 |
| 2.13 | Tests for `lib/scoring` (golden inputs → expected status) | Scoring is the product; protect it | P1 |
| 2.14 | Error boundary + offline/empty/loading states across UI | Resilience | P2 |

---

## 3. BACKEND — gaps & enhancements

### 3.1 Missing / incomplete routes & logic
- **`DELETE /api/share/[slug]`** (revoke) — promised, not implemented.
- **Pagination** — `GET /api/scans` is newest-first + limit; no cursor pagination yet.
- **Trends bucketing** — `GET /api/trends` works but "what changed since last check" insight is
  not computed.
- **Auth** — entire app is anonymous device-scoped. Supabase Auth (V1) needed for cross-device.
- **Cross-device sync** — device registration exists; actual aggregate sync between a user's
  devices is not wired.
- **Idempotency + rate limiting** — see §2.

### 3.2 Scoring engine enhancements (the moat — invest here)
- **Personal baseline / "is this unusual for me?"** — academic passive-sensing work and macOS
  design both call for a per-user baseline. Right now scoring is absolute, not relative. Add a
  rolling baseline so a heavy-tab user isn't permanently red. *(High differentiation value.)*
- **Time-of-day / day-of-week awareness** — exam-season and Sunday-night spikes are exactly what
  users say they want surfaced (see §6). Feed timestamps into trend insight.
- **Confidence score on each status** — supports the "signal not diagnosis" framing users demand.
- **Explainability payload** — return the exact inputs that fired a status ("23 tabs + 2 deadline
  tabs + stressed mood") so the UI can show *why*. Users distrust black-box wellness scores.
- **Tunable weights in one constants file** — already recommended in ARCHITECTURE; make sure
  weights live in one place for calibration.
- **Correlation engine** — Bearable's "which factors drive your mood" is a proven retention hook.
  Derive simple correlations from stored scans (mood ↔ score, tab count ↔ status over time).

### 3.3 AI layer
- Currently wording-only OpenAI/Gemini wrapper with safe fallback — correct and safe. Keep it
  rules-authoritative. Consider: **model id refresh** (use current Claude models — the repo
  references gpt-4o-mini / gemini-1.5-flash; evaluate Claude Haiku for the cheap wording pass),
  and a **one-repair-then-fallback** guarantee (already designed). Do **not** let AI touch score.

---

## 4. FRONTEND / UI — gaps & enhancements

### 4.1 Migrate to the `scans` contract (see §1.1) — prerequisite for everything below.

### 4.2 Trends / history dashboard
- No real trend visualization. Build the green/yellow/red-over-time view from `GET /api/trends`
  (status calendar/heatmap + score line). Users explicitly want **patterns over raw numbers**
  ("worse in exam season / when daylight drops"), not a daily digit.

### 4.3 Reset plan as an interactive flow, not static text
- Render `resetPlan` with checkable steps; "I did this" calls `POST /api/scans/[id]/reset-complete`
  → drives the reset streak + achievements. Right now the gamification backend has no UI to feed it.

### 4.4 Reflection capture UI
- `POST /api/scans/[id]/reflection` exists with no UI. Add an optional, ~5-second reflection on the
  detail page. Keep it trivially fast (users abandon slow mood logging).

### 4.5 Settings / privacy control center (wire the trust story)
- One screen with: privacy toggles (`storeRawTabs`, `retentionDays`, `syncEnabled`,
  `shareDefaultsIncludeRaw`) → `PATCH /api/me/privacy`; **Export my data** → `GET /api/export`;
  **Delete everything** → `DELETE /api/me/data` with confirm. This screen *is* the privacy promise
  made tangible — it's a marketing asset, not just a settings page.

### 4.6 Progress / achievements surface
- `GET /api/me/progress` (streaks, 6 achievements, weekly consistency, stability trend) has no UI.
  Surface it gently — **forgiving streaks, no guilt, no sad mascot.** Research is emphatic: shame
  mechanics and fragile all-or-nothing streaks are the #1 reason wellness apps get deleted. Use
  streak-freeze / weekly-goal framing.

### 4.7 Share view polish
- Public share page should clearly show it's a redacted, expiring snapshot; warn before sharing
  that URLs may be sensitive; show expiry. Add a copy-link + revoke control for the owner.

### 4.8 Onboarding / empty states / first-run
- First-run explainer ("Custod is a check-engine light, not a diagnosis"), empty-history state,
  and a sample/explanatory walkthrough that uses the user's *own* first scan (no fake seed data).

### 4.9 Accessibility, responsive, dark-theme consistency
- Audit contrast, keyboard nav, focus rings, mobile layout. The dashboard was recently restyled
  dark — verify the new screens match and meet WCAG AA.

### 4.10 Status framing copy pass
- Every yellow/red must pair with the reset plan ("what now") and use hedged, shame-free language.
  This is a correctness requirement per PRIVACY_SAFETY, and the research backs it hard.

---

## 5. ECOSYSTEM — extension, native, integrations

### 5.1 Chrome extension (highest-leverage channel — it's the unique sensor)
- **Standalone scan** — call `POST /api/scans` directly so a scan works from the popup without the
  web app open.
- **In-popup status** — show immediate green/yellow/red + one-line reason after a scan.
- **One-click reset that preserves tabs** — *the* most-requested feature in the research: solve the
  "black-hole fear." Group/save/snooze tabs (à la OneTab/CMU's Skeema) **before** suggesting
  closing any. Never just say "close tabs."
- **Local-only mode** — score in the extension, send nothing. This is the privacy headline.
- **Production build defaults** + manifest host-permission alignment (see §1.5).
- Keep permissions minimal (`tabs`, `storage`); never read page content.

### 5.2 iOS (designed, not built — keep it honest)
- Self-check, trend review, quiet reset timer, "today status." Optional Screen Time / DeviceActivity
  category signals **only** with explicit permission. **Do not ship fake browser-detection** —
  prototype until APIs are confirmed (per ARCHITECTURE §4).
- HealthKit corroboration (sleep/activity) would strengthen the score where browser signal is thin
  — but strictly opt-in and on-device.

### 5.3 macOS menu-bar (branch `macOs` exists)
- Local pressure sensor: app/category switching + active-window domain, **local-only scoring**,
  personal baseline ("unusual for me?"). Syncs aggregate records only. Coordinate with that branch.

### 5.4 Integrations to consider (later)
- **Calendar read** (deadlines/exam dates) to sharpen time-pressure scoring — opt-in.
- **University counseling export** — "share with my campus wellbeing service" PDF/markdown. This
  doubles as the B2B2C wedge (see §8).
- **Notion / calendar "park tabs here"** — low priority.

---

## 6. WHAT USERS ACTUALLY WANT (Reddit / HN / studies → features)

Each maps to a concrete build item. Sourced from the user-sentiment research pass.

1. **Closing a tab feels like losing it → preserve before close.** Group/save/snooze, never blunt
   "close." (CMU n=103 study; r/ADHD tab-hoarding.) → §5.1 reset action.
2. **The 8-tab tipping point is real and ownable.** Median 8 tabs flips users from in-control to
   stressed; 30% self-identify as "tab hoarders." → calibrate `tabOverload`, market the number.
3. **Burnout is noticed too late → people want an early "check-engine light," not a diagnosis.** →
   exactly Custod's framing; keep status hedged and pair with reset plan.
4. **Trackers feel inaccurate → users stop trusting the data.** → show *why* a status fired
   (explainability, §3.2); confidence score; let users correct tab categories.
5. **Aggressive blocking backfires (locks people out of work).** → Custod must **never block**.
   Nudge + reset only. This is a positioning win — keep it.
6. **Surveillance / employer-dashboard vibes are poison.** → loud "only you can see this, no
   employer, no data brokers" promise; no analytics/telemetry without explicit product decision.
7. **Streaks induce panic; one missed day collapses everything.** → forgiving streaks, freezes,
   weekly goals; never scold. (§4.6.)
8. **Guilt mascots / "you wasted X hours" are resented.** → shame-free copy everywhere. (§4.10.)
9. **Mood logging decays into a chore; averages flatten reality.** → ~5-sec optional check-ins;
   surface seasonal/contextual *patterns*, not a single averaged number. (§4.2, §4.4.)
10. **Notification spam ("open the app!") drives churn — especially during focus hours.** →
    opt-in, rare, never during deep work; prefer a weekly digest over daily nags.
11. **Paywalling the core loop triggers backlash.** → keep status + reset plan free forever. (§8.)
12. **Subscription fatigue is acute → offer a one-time/lifetime option.** (§8.)
13. **Students: procrastination root is evaluation anxiety, not laziness.** → never frame as "you're
    lazy / you wasted time"; speak to exam-season pressure.
14. **Body-doubling / low-pressure accountability helps students more than blocking.** → consider a
    gentle "focus block" companion framing (not social surveillance).
15. **Privacy guarantees that win trust:** local/on-device, no account, no third-party trackers,
    plain-language data policy, explicit "we don't sell data," deletion rights. → §1.6 / §4.5 make
    these real and visible.

---

## 7. COMPETITIVE GAPS & DIFFERENTIATION

### 7.1 Top competitors (condensed)

| Product | Category | Key feature | Pricing | Relevance |
|---|---|---|---|---|
| **Anticipate** | Burnout early-warning | Sensor-fusion "declining trends before you notice" | $3.99/mo, $34.99/yr | Closest concept; iOS+health, not browser/student |
| **RescueTime** | Focus/passive sensing | Productivity Pulse 0–100, context-switch latency | ~$12/mo | Has the signals, sells *productivity* not wellbeing |
| **Rize** | Focus/passive sensing | AI focus-quality score, strong privacy posture | $12.99/mo | Privacy framing to emulate |
| **Forest** | Focus/gamification | Grow-a-tree sessions, one-time price | $3.99 once | Gentle gamification model |
| **Freedom** | Focus/blocking | Hard cross-device blocking | $8.99/mo | The anti-pattern (over-blocking) to avoid |
| **one sec / Jomo** | Focus/friction | Breathing pause; "never sees content" | $4.99–5.99/mo | Lightweight reset patterns to borrow |
| **Daylio / Bearable** | Mood/symptom | Tap-logging; correlation reports | ~$2–6/mo | Correlation engine = retention hook |
| **Finch** | Wellness/gamification | Nurture-pet, affection > competition | Freemium | Reward/reassure model; but watch notification churn |
| **How We Feel** | Mood (nonprofit) | Yale-backed, **all on-device, free** | Free | The privacy gold standard to match |
| **OneTab / Toby / Workona** | Tab managers | Collapse/organize tabs | Free–$9/mo | They *organize* tabs; nobody *interprets* them |

### 7.2 Feature gaps competitors have that Custod lacks
- Biometric/health corroboration (Anticipate, Welltory).
- Correlation/insight engine (Bearable).
- In-the-moment intervention option (Forest/one sec/Jomo) — Custod has a plan but no one-click reset.
- Cross-platform breadth at launch (most rivals are multi-platform; Custod is browser-first).
- Clinical/therapy bridge (Anticipate exports therapy-prep notes).
- Deep habit loop / retention mechanics (Finch/Duolingo).

### 7.3 Where Custod is genuinely uncontested (lean in)
1. **Tab behavior as a mental-health signal** — tab managers organize, focus apps track app focus;
   *nobody reads tab overload / goal fragmentation / distraction loops as burnout evidence.* Core moat.
2. **Burnout early-warning framing vs productivity** — reaches users who reject "be more productive."
3. **Privacy-first / local-first as a category claim** — process in the extension, never transmit
   URLs/content; go further than Rize, match How We Feel.
4. **Student-native positioning** — purpose-built for student burnout; a white space.
5. **Zero-hardware, zero-friction** — no wearable, no phone permission, runs where students work.
6. **Evidence + reset plan, not just a number** — explainable + actionable = trust.

> Validation note: passive sensing predicting student stress is academically supported (AUC ~0.90),
> but the strongest published signals are phone/location, **not browser tabs.** Custod's tab-signal
> bet is novel *and* unproven — worth validating with its own data once scans persist.

---

## 8. MONETIZATION

Recommended stack (matches what works in this space *and* what users will tolerate):
1. **Free local-first core forever** — status + evidence + reset plan. Builds the privacy reputation
   How We Feel owns. Paywalling the core loop triggers Finch-style backlash.
2. **Cheap personal premium ($3–4/mo, ~$30/yr)** — trends/history depth, cross-device sync,
   correlation insights. **Don't paywall essentials** (export/backups) — that's Daylio's churn mistake.
3. **One-time / lifetime option** — subscription fatigue is acute; aligns with anti-engagement brand.
4. **Student pricing / .edu verification** — proven channel (Calm/Headspace student tiers).
5. **Institutional B2B2C licensing to university wellbeing services** — likely the **highest-LTV
   path**; the counseling-export feature is the hook; sidesteps the consumer-privacy tension because
   the university pays and the student gets it free.

---

## 9. DOCS & DX cleanups

- README storage section still implies local-JSON; update to Supabase + in-memory fallback.
- Add a one-paragraph plain-English **data promise** (for the app + landing page).
- Add `CONTRIBUTING.md` + branch-coordination notes (multiple active branches: `develop`, `master`,
  `macOs`, `claude/*`).
- Generate Supabase TS types and replace loose query-builder types.
- Add `.env.example` completeness check; ensure `.env.local` is gitignored.

---

## 10. PRIORITIZED ROADMAP

### P0 — Make it real (this week)
1. Rotate + scrub committed secrets; service-role server-side; enable RLS. (§1.3, §2)
2. Apply `supabase/schema.sql` to the live project; verify persistence. (§1.2)
3. Migrate UI to the `scans` contract (form, history, detail, share). (§1.1)
4. Build Settings/privacy control center wired to privacy/export/delete. (§1.6, §4.5)
5. Retire legacy analyzer + mood-shape mismatch; one scorer, one mood model. (§1.4)

### P1 — Make it trustworthy & sticky (next 2–4 weeks)
6. Trends dashboard (patterns over numbers) + explainability ("why this status"). (§3.2, §4.2)
7. Interactive reset plan → reset-complete → forgiving streaks/achievements UI. (§4.3, §4.6)
8. Reflection capture UI (~5 sec, optional). (§4.4)
9. Rate limiting, idempotency, retention cron, share-revoke route, encrypted payloads. (§2, §3.1)
10. Extension: standalone scan + in-popup status + **preserve-before-close** reset. (§5.1)
11. CI + scoring golden tests. (§2.12–2.14)

### P2 — Differentiate (next quarter)
12. Personal baseline ("unusual for me?") + time/season-aware insight. (§3.2)
13. Correlation engine (mood ↔ score ↔ tab patterns). (§3.2)
14. Supabase Auth + real cross-device sync (aggregate only). (§3.1)
15. macOS menu-bar local sensor (coordinate `macOs` branch). (§5.3)
16. Onboarding, empty states, accessibility/responsive audit. (§4.8–4.9)

### P3 — Expand (later)
17. iOS prototype (honest, no fake detection) + optional HealthKit/Screen Time. (§5.2)
18. Calendar integration for deadline-aware scoring. (§5.4)
19. University counseling export + B2B2C licensing motion. (§5.4, §8)
20. Premium tier + one-time/lifetime + student pricing. (§8)

---

## 11. GUARDRAILS (do not violate — they ARE the product)

- **Never block or lock the user out.** Nudge + reset only.
- **Never shame.** No guilt mechanics, no sad mascots, no "you wasted X hours," no fragile streaks.
- **Never diagnose / over-claim.** Status is a signal, hedged, always paired with "what now."
- **Never transmit page content, screenshots, cookies, credentials, or full history.**
- **Never add telemetry/analytics** without an explicit product decision.
- **Never present Custod as clinical advice.**
- **Preserve before you close** any tab. Closing must never feel like loss.
