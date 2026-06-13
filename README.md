# Custod

Custod is a privacy-first burnout warning light for students. It uses browser behavior signals - tab overload, context switching, distraction loops, goal fragmentation, deadline surfaces, and optional mood check-ins - to produce a green, yellow, or red burnout status with evidence and a short reset plan.

Custod is not a tab manager and it is not a medical diagnosis. It is a pattern detector that helps make early burnout signals visible before a student is deep in a spiral.

## What Custod Analyzes

Custod only analyzes submitted:

- tab titles
- tab URLs
- active-tab state
- optional energy, stress, time-pressure, and reflection values

Custod does not read page contents, screenshots, cookies, passwords, keystrokes, or full browsing history.

## Product Outputs

- burnout status light: Green, Yellow, or Red
- burnout score from 0 to 100
- main detected pattern
- risk breakdown with evidence
- pattern explanation
- reset plan
- tab groups as evidence
- optional reflection
- history and trend over time
- Markdown export
- public share link

## Repo Layout

This repo is a monorepo holding every Custod surface. **`website/`** is the canonical
web app (marketing + product + API). It deploys to Vercel from the repo root via
[`vercel.json`](vercel.json).

```text
Custod/
  website/              Next.js app — marketing, product UI, API routes  ← canonical web app
  website/extension/    Chrome extension (Vite + TypeScript)
  macos/                Native macOS app (SwiftUI / Xcode project)
  supabase/             Database schema and RLS policies (also copied under website/)
  app/                  Deprecated root app — see app/README.md
  docs/                 Product, architecture, API, privacy, and roadmap docs
  vercel.json           Points Vercel builds at website/
```

## Run Locally

```bash
cd website
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
cd website
npm run check
```

## Chrome Extension

The extension collects the current Chrome window's HTTP and HTTPS tabs and sends titles and URLs to the configured Custod web app.

```bash
cd website/extension
npm install
VITE_WEB_APP_URL=http://localhost:3000 npm run build
```

Load `website/extension/dist` in `chrome://extensions` with Developer Mode enabled.

For production, build with the deployed URL:

```bash
cd website/extension
VITE_WEB_APP_URL=https://your-custod-deploy.vercel.app npm run build
```

Keep `website/extension/manifest.json` host permissions aligned with the deployed app domain.

## macOS App

A native SwiftUI app lives in `macos/`. Open `macos/Custod/Custodt.xcodeproj` in Xcode
and run the `Custodt` scheme. It mirrors the burnout-signal model natively (tab import,
usage tracking, burnout analysis, notifications).

## Marketing Website

The `website/` app serves both the public marketing site and the full product (check flow,
scan results, trends, settings, API). Run it independently:

```bash
cd website
npm install
npm run dev
```

Routes include `/`, `/download`, `/login`, `/dashboard`, `/check`, `/scan/[id]`, `/trends`, `/settings`, and `/api/*`.

## Storage

The backend uses a storage abstraction:

- Supabase when `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) and `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` exist.
- In-memory local/dev fallback when Supabase server env vars are missing.

The fallback is deliberately nonpersistent and is only for local development or CI smoke tests. Hosted deployments should use Supabase with `supabase/schema.sql` applied. Do not use browser clients or extensions to write directly to Supabase tables.

Expected env vars:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
OPENAI_API_KEY=
GEMINI_API_KEY=
```

AI keys are optional. If neither key exists, Custod still returns a full deterministic analysis.

## Deploy To Vercel

Vercel builds from the repo root using [`vercel.json`](vercel.json), which runs `website/`.
Set this optional env var for absolute share links:

```bash
NEXT_PUBLIC_APP_URL=https://your-custod-deploy.vercel.app
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/devices/register` | Register or refresh an anonymous device. |
| `POST` | `/api/scans` | Analyze submitted tabs, store the scan, and return the full check-engine result. |
| `GET` | `/api/scans` | Return recent scan history for a device. |
| `GET` | `/api/scans/[id]` | Return one scan. Add `?format=md` for Markdown export. |
| `POST` | `/api/scans/[id]/reflection` | Store an optional reflection on a scan. |
| `POST` | `/api/scans/[id]/reset-complete` | Record reset completion and return progress updates. |
| `GET` | `/api/trends` | Return aggregate score trends and common patterns. |
| `GET` | `/api/me/progress` | Return streaks, achievements, weekly consistency, and stability trend. |
| `GET`/`PATCH` | `/api/me/privacy` | Read or update device privacy settings. |
| `POST` | `/api/share` | Create an expiring public scan summary link. |
| `GET` | `/api/share/[slug]` | Return a public shared scan summary, or a legacy shared check. |
| `GET` | `/api/export` | Export device data as JSON or Markdown. |
| `DELETE` | `/api/me/data` | Delete device-owned scan data with `{ "confirm": true }`. |
| `POST` | `/api/analyze` | Analyze submitted tabs and create a burnout check. |
| `GET` | `/api/checks` | Return recent checks for history/trend. |
| `GET` | `/api/checks/[id]` | Return a check. Add `?format=md` for Markdown export. |
| `POST` | `/api/checks/[id]/share` | Create or return a public share link. |

The `checks` routes are legacy aliases kept for the current dashboard. New clients should use `scans`.

`POST /api/scans` body:

```ts
type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

type AnalyzeBurnoutRequest = {
  tabs: BrowserTab[];
  goal?: string;
  moodCheckIn?: "calm" | "stressed" | "overwhelmed" | "numb" | "skip";
  timeRemaining?: string;
  deviceId?: string;
};
```

Clients may also send `X-Custod-Device` instead of `deviceId`.

## Safety Notes

- Do not present Custod as diagnosis, treatment, or clinical advice.
- Do not add telemetry or analytics without an explicit product decision.
- Do not send page contents to any API.
- URLs can contain sensitive information, so warn users before sharing checks.
