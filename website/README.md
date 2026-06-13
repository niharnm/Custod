# Custod

Custod is a privacy-first, cross-platform check engine light for burnout. It combines browser, computer, phone, and desk signals into one green, yellow, or red status so students and young professionals can notice risky patterns before they crash.

Custod is not therapy, a medical device, or a mental health chatbot. It is an informational signal layer.

## What It Uses

- Browser metadata: tab counts, tab titles, URLs, switching rate, session length, and derived focus signals.
- Computer signals: active app patterns, late-night usage, session length, and local blink-rate measurements.
- Phone signals: HealthKit and motion signals when the user grants permission.
- Desk signals: posture and environment data from the hardware companion.

Custod does not read page contents, messages, emails, passwords, keystrokes, screenshots, or stored video.

## Web App

The canonical Next.js app lives in this folder (`website/`).

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run check
```

## Routes

**Marketing**

- `/` — public marketing site
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/download` — extension and Mac app install instructions
- `/login` — Supabase email/password login
- `/dashboard` — gated overview with live scan data

**Product**

- `/check` — run a burnout check (tab capture + mood check-in)
- `/scan/[id]` — scan results dashboard
- `/trends` — score history and achievements
- `/settings` — privacy controls and data export
- `/share/[slug]` — public shared scan summary

**API** — see root [`README.md`](../README.md#api) for the full route table.

## Repo Layout

```text
src/              Next.js website, product UI, and API routes
extension/        Chrome extension source
supabase/         Supabase schema and database setup
../macos/         macOS app source (canonical copy at repo root)
docs/             Product, architecture, API, and privacy notes
```

## Design System

Warm cream/amber/rose palette defined in `src/app/globals.css` and `src/lib/design-tokens.ts`.
Shared UI primitives live in `src/components/custod/ui/`.

## Deployment

Production deploys from the repo root via `vercel.json`, which builds this folder.
Push only verified changes:

```bash
npm run check
```

## License

MIT
