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
