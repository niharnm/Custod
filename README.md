# Custod

**Your burnout check engine light.** Custod is a privacy-first, cross-platform
early-signal tool for **digital strain and burnout patterns** — a calm green /
yellow / red status that surfaces *before* you crash, with simple resets to
recover focus.

> Repo: <https://github.com/niharnm/Custod>

## What Custod is

- An **ambient, early-warning signal** for burnout patterns — like a check
  engine light, not a dashboard you have to babysit.
- **Privacy-first.** It reads only safe signals (tab titles, URLs/domains,
  optional check-ins, on-device usage timing) and turns them into a status +
  reset suggestions.
- **Cross-platform, one account.** Sign in once; your data follows you across the
  Chrome extension, macOS app, iOS app, and web dashboard (the "Grammarly"
  model). See [`docs/ECOSYSTEM_SYNC.md`](docs/ECOSYSTEM_SYNC.md).

## What Custod is not

- ❌ Not therapy, an AI therapist, or a mental-health chatbot.
- ❌ Not a diagnosis — it never diagnoses any condition.
- ❌ Not crisis support.
- ❌ It never reads full page contents, keystrokes, screenshots, or private
  messages. See [`docs/PRIVACY_SAFETY.md`](docs/PRIVACY_SAFETY.md).

## Repo structure

```
src/                  # Next.js 16 web app + dashboard + backend API (the hub)
  app/api/**          # Backend routes (scans, devices, trends, share, export…)
  app/{privacy,terms,support}/  # Legal + support pages
  lib/                # owner/auth, scoring, ai wording, storage, validation
extension/            # Chrome/MV3 extension (passive tab-pattern monitor)
ios/Custod/           # SwiftUI iOS app (account-first; Screen Time pending)
macos/Custod/         # SwiftUI macOS menu-bar app (most complete native client)
supabase/             # DB schema / SQL
docs/                 # API contracts, design system, privacy, plans, handoff
```

## Setup (web hub)

Prerequisites: Node.js 24+ (`.nvmrc`), a Supabase project.

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase server keys the API falls back to an **in-memory dev store** —
the app runs, but nothing persists. Apply the DB schema with
`scripts/apply-schema.mjs` (needs `POSTGRES_URL_NON_POOLING`) to persist.

### Environment variables (`.env.example`)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public base URL (share links) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` *(or `…_ANON_KEY`)* | Public client/auth key |
| `SUPABASE_URL` | Supabase URL (server) |
| `SUPABASE_SECRET_KEY` *(or `SUPABASE_SERVICE_ROLE_KEY`)* | Privileged server key — never exposed to the browser |
| `GROQ_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | **Optional** AI wording (precedence Groq→OpenAI→Gemini). Verdict is always rules-based. |

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run check      # lint + typecheck + build
```

## Chrome extension

Plain, unbundled MV3 — **no build step**.

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select the [`extension/`](extension/) folder.
3. Config: [`extension/config.js`](extension/config.js) (`WEB_APP_URL`) and
   [`extension/supabase.js`](extension/supabase.js) (same Supabase project).

See [`extension/README.md`](extension/README.md). The popup shows your status
ring, tab/switch/active-time stats, an **Open Dashboard** button, and a privacy
note. (Contract note: the extension currently writes directly to Supabase rather
than `POST /api/scans` — migration is tracked in the handoff.)

## iOS app

SwiftUI app in [`ios/Custod/`](ios/Custod). Account-first; shares the Supabase
account with every other client. Screen Time capture needs Apple's Family
Controls entitlement (pending). Run: `open ios/Custod/Custod.xcodeproj` → ⌘R.
Status & roadmap: [`docs/IOS_PLAN.md`](docs/IOS_PLAN.md).

## macOS app

SwiftUI menu-bar app in [`macos/Custod/`](macos/Custod) — the most complete
native client. Monitors on-device signals, scores burnout locally, and syncs
checks to `POST /api/scans`. Build:

```bash
cd macos/Custod
xcodebuild -project Custodt.xcodeproj -scheme Custodt \
  -destination 'platform=macOS' build CODE_SIGNING_ALLOWED=NO
```

Status & roadmap: [`docs/MACOS_PLAN.md`](docs/MACOS_PLAN.md).

## Backend API

The web app is the shared backend for all clients. Full route map, request/
response shapes, auth, and privacy notes: [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md).
Core: `POST /api/scans`, `GET /api/scans[/[id]]`, `/api/devices[/register]`,
`/api/trends`, `/api/me/{progress,privacy,data}`, `/api/share[/[slug]]`,
`/api/export`.

## Legal & support pages

- [`/privacy`](src/app/privacy/page.tsx) — what Custod analyzes and never collects.
- [`/terms`](src/app/terms/page.tsx) — wellness/productivity insights, not medical advice.
- [`/support`](src/app/support/page.tsx) — privacy, support, bug report, data deletion/export.

## Deployment

Deploys to **Vercel**. Set the env vars above in Project → Settings →
Environment Variables (`NEXT_PUBLIC_APP_URL` = the production URL). The repo also
ships a `Dockerfile` / `docker-compose.yml` for container deploys.

## Design & docs

- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — brand, tokens, status colors, states.
- [`docs/PRIVACY_SAFETY.md`](docs/PRIVACY_SAFETY.md) — canonical privacy/safety copy.
- [`docs/AGENT_HANDOFF.md`](docs/AGENT_HANDOFF.md) — what's done / what's next.

## Known limitations

- Persistence needs Supabase server keys + applied schema (else in-memory dev store).
- Chrome extension uses a direct-Supabase data model, not yet `POST /api/scans`.
- iOS Screen Time blocked on Apple's Family Controls entitlement.
- macOS real screen-time reads need Full Disk Access + relaunch.

## Contact

Privacy, support, bug reports, and **data deletion / export** requests:
**nihar.manchikalapudi@gmail.com**

## License

MIT — see [`LICENSE`](LICENSE).
