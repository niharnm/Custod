# API_CONTRACTS.md — Custod

> The canonical contract between clients (extension, web, future native) and the backend.
> **Freeze this before splitting UI/backend work.** Status terms use `scans` (target); current code still
> exposes `checks` — see [ARCHITECTURE.md §11](./ARCHITECTURE.md) migration plan.

## Conventions

- All routes are Next.js App Router handlers under `app/api/`.
- Request/response bodies are JSON unless noted. All inputs are **Zod-validated**; reject with `400` + `{ error }`.
- **Auth/device:** MVP is device-scoped (anonymous). Every request carries a `deviceId` (body or `X-Custod-Device` header). When Supabase Auth lands, an authenticated user owns devices and rows are RLS-scoped to the user. Owner-only routes return `404` (not `403`) for non-owned rows to avoid leaking existence.
- **Idempotency:** ingestion accepts an optional `Idempotency-Key` header to dedupe extension retries.
- **Errors:** `{ error: string, code?: string }` with appropriate HTTP status.
- **Privacy invariant:** no endpoint accepts or returns page contents, screenshots, cookies, credentials, or full browsing history. See [PRIVACY_SAFETY.md](./PRIVACY_SAFETY.md).

---

## Shared types (target)

These extend the existing `lib/types.ts`. Additive; do not break current UI imports until migration.

```ts
type BrowserTab = {
  id?: number;
  title: string;
  url: string;
  active: boolean;
  favIconUrl?: string;
};

type BurnoutStatus = "green" | "yellow" | "red";
type StatusLabel = "Stable" | "Strained" | "At Risk";
type MoodCheckIn = "calm" | "stressed" | "overwhelmed" | "numb" | "skip";

type Device = {
  id: string;             // device-generated UUID
  platform: "chrome" | "web" | "ios" | "macos";
  label?: string;         // "Chrome laptop", "iPhone"
  createdAt: string;
  lastSeenAt: string;
  syncEnabled: boolean;
};

type RiskBreakdown = {
  tabOverload: number;        // 0-100 each
  contextSwitching: number;
  distractionPull: number;
  goalFragmentation: number;
  timePressure: number;
  recoverySignal: number;     // higher = more recovery (reduces overall risk)
};

type TabGroup = {
  name:
    | "Current Task" | "School / Work" | "Research" | "Build / Coding"
    | "Submission / Deadline" | "Communication" | "Distractions" | "Unknown / Later";
  explanation: string;
  action: "keep" | "save" | "close" | "ignore";
  tabs: BrowserTab[];
};

type ResetPlan = {
  immediateAction: string;
  threeMinuteReset: string;
  twentyMinuteFocusBlock: string;
  closeOrSave: string[];
  ignoreForNow: string[];
};

type Reflection = {
  scanId: string;
  text: string;          // sensitive free text; local/opt-in storage
  createdAt: string;
};

type Streak = { type: "checkin" | "reset"; current: number; longest: number; lastDay: string };
type Achievement = { id: string; name: string; unlockedAt: string | null };
type NudgePreferences = { enabled: boolean; quietHours?: { start: string; end: string } };
type PrivacySettings = {
  storeRawTabs: boolean;     // default false
  retentionDays: number;     // default e.g. 30
  syncEnabled: boolean;      // default false
  shareDefaultsIncludeRaw: boolean; // default false
};

type Scan = {
  id: string;
  deviceId?: string;
  userId?: string;
  createdAt: string;
  status: BurnoutStatus;
  score: number;
  statusLabel: StatusLabel;
  mainPattern: string;
  tabCount: number;
  domainCount: number;
  riskBreakdown: RiskBreakdown;
  // detail (may be aggregate-only depending on privacy settings):
  resetPlan?: ResetPlan;
  tabGroups?: TabGroup[];
  reflection?: Reflection;
};
```

### Main request / response

```ts
type AnalyzeBurnoutRequest = {
  tabs: BrowserTab[];
  goal?: string;
  moodCheckIn?: MoodCheckIn;
  timeRemaining?: string;
  deviceId?: string;
};

type AnalyzeBurnoutResponse = {
  scanId: string;
  title: string;
  goal?: string;
  moodCheckIn?: string;
  timeRemaining?: string;
  createdAt: string;
  status: BurnoutStatus;
  score: number;                 // 0-100
  statusLabel: StatusLabel;
  mainPattern: string;
  oneSentenceExplanation: string;
  riskBreakdown: RiskBreakdown;
  patternExplanation: string;
  resetPlan: ResetPlan;
  tabGroups: TabGroup[];
  checkEngineTimeline: { label: string; description: string }[];
  shareSummary: string;
  aiReasoning: string[];         // empty when rules-only
};
```

---

## Routes

### `POST /api/devices/register`

- **Purpose:** register/refresh a device so scans can be scoped and (later) linked to a user.
- **Request:** `{ deviceId?: string; platform: "chrome"|"web"|"ios"|"macos"; label?: string }` — if `deviceId` omitted, server generates one.
- **Response:** `{ device: Device }`
- **Auth/device:** none required in MVP; when Auth lands, attaches device to the authenticated user.
- **Privacy:** stores only platform + optional label + timestamps. No fingerprinting, no IP storage.
- **MVP:** upsert by `deviceId`; return device. **Future:** link to `userId`, enforce `syncEnabled`.

### `POST /api/scans`

- **Purpose:** ingest a snapshot, score it, optionally reword with AI, persist, and return the full analysis.
- **Request:** `AnalyzeBurnoutRequest`. Optional `Idempotency-Key` header.
- **Response:** `AnalyzeBurnoutResponse`.
- **Auth/device:** `deviceId` (body or `X-Custod-Device`). Anonymous allowed in MVP.
- **Privacy:** server sanitizes tabs (drops anything resembling page content); raw tabs/URLs persisted **only** if `privacySettings.storeRawTabs` — else only aggregate fields + evidence counts are stored. AI (if enabled) receives only safe fields.
- **MVP:** deterministic scoring; persist scan + risk_scores + reset_plan; store raw payload only when opted in.
- **Future:** idempotent dedupe, AI wording, encrypted raw payload with `expires_at`, rate limiting.

### `GET /api/scans/[id]`

- **Purpose:** fetch one scan's detail.
- **Request:** path `id`. Optional `?format=md` for Markdown export of that scan.
- **Response:** `{ scan: Scan }` or `text/markdown`.
- **Auth/device:** owner/device-scoped. Non-owned → `404`.
- **Privacy:** returns raw tabs only if they were stored (opt-in) and the requester owns them.
- **MVP:** read by id, ownership check. **Future:** RLS-enforced via Supabase Auth.

### `GET /api/scans`

- **Purpose:** history list for the dashboard/trend.
- **Request:** query `?limit=` (default 30), `?cursor=` for pagination.
- **Response:** `{ scans: Scan[] }` (aggregate fields; no raw tabs).
- **Auth/device:** device/user-scoped.
- **Privacy:** aggregate-only; never returns raw URLs/titles in the list.
- **MVP:** newest-first, limited. **Future:** cursor pagination, server-side filtering by status/date.

### `POST /api/scans/[id]/reflection`

- **Purpose:** attach an optional reflection to a scan.
- **Request:** `{ text: string }` (length-capped, e.g. 500).
- **Response:** `{ reflection: Reflection }`.
- **Auth/device:** owner-scoped.
- **Privacy:** reflection is **sensitive free text** — stored local/opt-in only; never sent to third parties; never logged.
- **MVP:** store text on the scan. **Future:** encrypt at rest; respect retention.

### `POST /api/scans/[id]/reset-complete`

- **Purpose:** record that the user completed the reset (drives reset streak + achievements).
- **Request:** `{ completedSteps?: string[] }` (optional detail).
- **Response:** `{ ok: true; progress: { resetStreak: Streak; unlocked: Achievement[] } }`.
- **Auth/device:** owner-scoped.
- **Privacy:** stores a completion event, no sensitive content.
- **MVP:** write `scan_event` (type `reset_complete`), recompute reset streak. **Future:** richer per-step tracking.

### `GET /api/trends`

- **Purpose:** trend summary for the dashboard (status buckets + score over time).
- **Request:** query `?range=7d|30d|90d`.
- **Response:** `{ points: { date: string; status: BurnoutStatus; score: number }[]; summary: { greenDays: number; yellowDays: number; redDays: number; topPattern: string } }`.
- **Auth/device:** device/user-scoped.
- **Privacy:** aggregate only.
- **MVP:** derive from stored scans. **Future:** server-side bucketing, "what changed since last check."

### `GET /api/me/progress`

- **Purpose:** gamified progress (streaks + achievements).
- **Request:** none.
- **Response:** `{ streaks: Streak[]; achievements: Achievement[]; weeklyConsistency: number }`.
- **Auth/device:** device/user-scoped.
- **Privacy:** derived from event metadata only; no sensitive content.
- **MVP:** compute from `scan_events`. **Future:** cache, weekly rollups.

### `PATCH /api/me/privacy`

- **Purpose:** update privacy settings.
- **Request:** `Partial<PrivacySettings>`.
- **Response:** `{ privacy: PrivacySettings }`.
- **Auth/device:** device/user-scoped.
- **Privacy:** toggling `storeRawTabs` off should purge existing raw payloads; lowering `retentionDays` triggers cleanup.
- **MVP:** persist settings, apply on next scan. **Future:** immediate purge job on downgrade.

### `POST /api/share`

- **Purpose:** create an expiring, revocable public share link for a scan.
- **Request:** `{ scanId: string; includeRawTabs?: boolean; expiresInHours?: number }`.
- **Response:** `{ slug: string; url: string; expiresAt: string }`.
- **Auth/device:** owner-scoped.
- **Privacy:** `includeRawTabs` defaults to **false**. If true, response/UI must warn that titles & URLs may be private. Shares expire and are revocable.
- **MVP:** create slug → scan mapping with `expiresAt`. **Future:** `DELETE /api/share/[slug]` revoke, view caps.

### `GET /api/share/[slug]`

- **Purpose:** read a shared scan (read-only, no auth).
- **Request:** path `slug`.
- **Response:** `{ scan: Scan }` — aggregate + analysis; raw tabs included **only** if the share was created with `includeRawTabs`.
- **Auth/device:** none (public), but respects expiry/revocation → `404` when expired/revoked.
- **Privacy:** never expose owner identity, device, or other scans. Respect `include_raw_tabs`.
- **MVP:** resolve slug → scan, enforce expiry. **Future:** revocation, rate limits.

### `GET /api/export`

- **Purpose:** full user/device data export (trust + portability).
- **Request:** optional `?format=json|md` (default json).
- **Response:** downloadable file with all scans + settings the requester owns.
- **Auth/device:** device/user-scoped.
- **Privacy:** includes only the requester's own data; raw payloads included only where stored.
- **MVP:** export owned scans + settings. **Future:** signed async export for large histories.

### `DELETE /api/me/data`

- **Purpose:** delete all data for the device/user (right to be forgotten).
- **Request:** `{ confirm: true }`.
- **Response:** `{ deleted: { scans: number; reflections: number; shares: number } }`.
- **Auth/device:** device/user-scoped.
- **Privacy:** hard-deletes scans, events, reflections, shares, private payloads. Revokes share links.
- **MVP:** cascade delete owned rows. **Future:** tombstone + confirmation email when accounts exist.

---

## Legacy aliases (during migration)

Keep these working until clients move to `/api/scans*`, then remove:

| Legacy | Maps to |
| --- | --- |
| `POST /api/analyze` | `POST /api/scans` |
| `GET /api/checks` | `GET /api/scans` |
| `GET /api/checks/[id]` | `GET /api/scans/[id]` |
| `POST /api/checks/[id]/share` | `POST /api/share` |
| `GET /api/share/[slug]` | unchanged |
