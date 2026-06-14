# Custod — API Contracts

The single source of truth for the Custod backend. Every client (Chrome
extension, macOS app, iOS app, web dashboard) talks to the **same** Next.js API,
deployed at `NEXT_PUBLIC_APP_URL` (e.g. `https://custod.vercel.app`, or
`http://localhost:3000` in dev).

See [`ECOSYSTEM_SYNC.md`](ECOSYSTEM_SYNC.md) for the account/device model and
[`PRIVACY_SAFETY.md`](PRIVACY_SAFETY.md) for the privacy guarantees these routes
must uphold.

## Identity — how the server decides "who" (`src/lib/owner.ts`)

Every request is resolved to an owner in this order:

1. `Authorization: Bearer <supabase access_token>` → the **user** (native apps / extension).
2. Supabase session **cookie** → the signed-in **web** user.
3. `X-Custod-Device: <uuid>` → anonymous **device** fallback.

When signed in, send **both** the `Bearer` token (→ `user_id`) **and**
`X-Custod-Device` (→ `device_id`) so scans are attributed to the right device.

## Core scan shapes (`src/lib/types.ts` — canonical TypeScript)

```ts
type BrowserTab = {
  id?: number; title: string; url: string; active: boolean; favIconUrl?: string;
};

// Request — POST /api/scans
type AnalyzeBurnoutRequest = {
  tabs: BrowserTab[];                 // [] allowed for non-browser clients, but a scan needs ≥1
  goal?: string;
  moodCheckIn?: "calm" | "stressed" | "overwhelmed" | "numb" | "skip";
  timeRemaining?: string;
  deviceId?: string;                  // also derivable from the X-Custod-Device header
  // `platform` is carried by POST /api/devices/register, not the scan body.
};

// Response — POST /api/scans  (and the per-item shape of GET /api/scans/[id].scan)
type AnalyzeBurnoutResponse = {
  scanId: string;
  title: string;
  createdAt: string;                  // ISO 8601
  status: "green" | "yellow" | "red";
  score: number;                      // 0–100
  statusLabel: "Stable" | "Strained" | "At Risk";
  mainPattern: string;
  oneSentenceExplanation: string;
  riskBreakdown: {                    // six signals, 0–100 each
    tabOverload: number; contextSwitching: number; distractionPull: number;
    goalFragmentation: number; timePressure: number; recoverySignal: number;
  };
  patternExplanation: string;
  resetPlan: {
    immediateAction: string; threeMinuteReset: string; twentyMinuteFocusBlock: string;
    closeOrSave: string[]; ignoreForNow: string[];
  };
  tabGroups: TabGroup[];              // present when browser tab data was sent
  checkEngineTimeline: { label: string; description: string }[];
  shareSummary: string;
  aiReasoning: string[];             // optional plain-language notes; numbers are rules-derived
};
```

> **Numbers are deterministic.** `score`, `status`, `riskBreakdown`, `resetPlan`,
> and `tabGroups` come from the rules engine (`src/lib/scoring`). If an AI key is
> configured, a model only rewrites `oneSentenceExplanation`, `patternExplanation`,
> `shareSummary`, and `aiReasoning` (`src/lib/ai`). It never changes the verdict.

## Route map (implemented — `src/app/api/**`)

| Method | Route | Purpose | Request body | Response | Auth / device | Clients |
|---|---|---|---|---|---|---|
| POST | `/api/devices/register` | Register / refresh a device | `{ deviceId?, platform: "chrome"\|"web"\|"ios"\|"macos", label? }` | `{ device }` | Bearer (user) or device header | ext, macOS, iOS, web |
| GET | `/api/devices` | List account devices (powers picker) | — | `{ devices: Device[] }` (`[]` if anon) | Bearer/cookie | web |
| POST | `/api/scans` | Submit a scan → analysis | `AnalyzeBurnoutRequest` | `AnalyzeBurnoutResponse` | any owner; `Idempotency-Key` honored; rate-limited 30/min | ext*, macOS, iOS, web |
| GET | `/api/scans?limit=N&device=<id>` | List scans (all devices, or one) | — | `{ scans: Scan[] }` | any owner; `device` filter = signed-in only | web |
| GET | `/api/scans/[id]` | One scan w/ reset plan, groups | — | `{ scan }` | owner of scan | web |
| POST | `/api/scans/[id]/reflection` | Add a reflection to a scan | `{ text?, accuracy?: "accurate"\|"partly"\|"off", helpfulAction? }` | `{ reflection }` | owner | web |
| POST | `/api/scans/[id]/reset-complete` | Mark reset steps done | `{ completedSteps?: string[] }` | `{ ok: true, progress }` | owner | web |
| GET | `/api/trends` | Score-over-time, status mix, patterns | — | `{ ...trends }` | owner | web |
| GET | `/api/me/progress` | Streaks + achievements | — | progress object | owner | web |
| GET / PATCH | `/api/me/privacy` | Read / update privacy settings | PATCH: `{ storeRawTabs?, retentionDays?, syncEnabled?, shareDefaultsIncludeRaw? }` | `{ privacy }` | owner | web |
| POST | `/api/me/claim` | Re-parent a device's anon scans onto the account | `{ deviceId }` | claim result | Bearer + device | web (on sign-in) |
| POST | `/api/share` | Create a share link for a scan | `{ scanId, includeRawTabs?, expiresInHours? }` | `{ slug, ... }` | owner | web |
| GET | `/api/share/[slug]` | Public read of a shared scan | — | `{ scan }` / `{ check }` | none (public) | web, anyone |
| DELETE | `/api/share/[slug]` | Revoke a share link | — | `{ ok: true }` | owner | web |
| GET | `/api/export?format=json` | Export everything | — | full export object | owner | web |
| DELETE | `/api/me/data` | Delete all account/device data | `{ confirm: true }` | `{ deleted }` | owner | web |

`*` The Chrome extension does **not yet** call `POST /api/scans` — see the gap below.

### Legacy routes (deprecated, still mounted)

`POST /api/analyze`, `GET/POST /api/checks`, `GET /api/checks/[id]`,
`POST /api/checks/[id]/share`. These are the older "checks" stack
(`src/lib/storage.ts`, `src/lib/analyzer.ts`). New clients should use the
**scans** stack above. Do not build new features on `/api/analyze`.

## Privacy notes (apply to every route)

- Request bodies carry **tab titles, URLs/domains, optional check-ins** only —
  never page contents, keystrokes, screenshots, or messages.
- `storeRawTabs` (privacy settings) controls whether raw tab text is persisted
  vs. only the derived signals.
- Share links may exclude raw tabs (`includeRawTabs: false`) and can expire.

## Known contract gap — Chrome extension

The extension currently writes **directly to Supabase** (`/rest/v1/browsing_sessions`,
`/rest/v1/site_visits`, `/rest/v1/browser_readings`) and scores via a Supabase
Edge Function (`/functions/v1/score`) — see `extension/supabase.js`. It resolves
to the same account but uses a **different data model** than `POST /api/scans`.

**Follow-up (tracked in `AGENT_HANDOFF.md`):** migrate the extension to
`POST /api/scans` so all four clients share one contract, or add a thin
server-side adapter that maps `browsing_sessions` → the scans schema. Until then,
extension data shows up via its own tables, not the dashboard's `/api/scans` list.
