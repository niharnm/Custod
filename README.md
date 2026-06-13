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

```text
Custod/
  app/                  Next.js App Router pages and API routes
  components/           Dashboard and capture UI
  lib/                  Analyzer, storage, markdown export, shared types
  extension/            Chrome extension
  vercel.json           Vercel framework config
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Chrome Extension

The extension collects the current Chrome window's HTTP and HTTPS tabs and sends titles and URLs to the configured Custod web app.

```bash
cd extension
npm install
VITE_WEB_APP_URL=http://localhost:3000 npm run build
```

Load `extension/dist` in `chrome://extensions` with Developer Mode enabled.

For production, build with the deployed URL:

```bash
VITE_WEB_APP_URL=https://your-custod-deploy.vercel.app npm run build
```

Keep `extension/manifest.json` host permissions aligned with the deployed app domain.

## Storage

The current MVP uses local JSON fallback storage:

- local dev: `.custod-data/checks.json`
- Vercel/serverless fallback: `/tmp/custod-checks.json`

That is good enough for a hackathon prototype and local testing, but it is not durable hosted storage. Add Supabase/Postgres or another explicit persistence layer before depending on long-term hosted history.

## Deploy To Vercel

The web app is at the repository root, so Vercel can auto-detect Next.js. Set this optional env var for absolute share links:

```bash
NEXT_PUBLIC_APP_URL=https://your-custod-deploy.vercel.app
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/analyze` | Analyze submitted tabs and create a burnout check. |
| `GET` | `/api/checks` | Return recent checks for history/trend. |
| `GET` | `/api/checks/[id]` | Return a check. Add `?format=md` for Markdown export. |
| `POST` | `/api/checks/[id]/share` | Create or return a public share link. |
| `GET` | `/api/share/[slug]` | Return a shared read-only check. |

`POST /api/analyze` body:

```ts
type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

type MoodCheckIn = {
  energy?: number; // 1-5
  stress?: number; // 1-5
  timePressure?: "none" | "some" | "high";
  reflection?: string;
};
```

## Safety Notes

- Do not present Custod as diagnosis, treatment, or clinical advice.
- Do not add telemetry or analytics without an explicit product decision.
- Do not send page contents to any API.
- URLs can contain sensitive information, so warn users before sharing checks.
