# BurnoutCheck — Chrome Extension (Manifest V3)

A privacy-first burnout detector. It reads tab-behavior patterns — counts, URLs,
titles, and timing — and scores your stress in real time. **It never reads page
content.**

When signed in, visits are logged as **full URL + title** in **rolling 1-hour
sessions** stored in Supabase.

## Load it

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Sign up or sign in from the popup — tracking and sync start after auth
5. The badge works offline via a local fallback scorer even without Supabase

## Supabase config

Set your project in **`supabase.js`**:

```js
export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";
```

**Email auth:** New accounts are auto-confirmed in this project for testing — no email
verification step. Sign up goes straight into the app.

## Database tables

Applied via Supabase migration:

| Table | Purpose |
|-------|---------|
| `browsing_sessions` | Rolling 1-hour sessions per user (`started_at`, `ended_at`) |
| `site_visits` | Full URL + title per navigation, linked to a session |
| `browser_readings` | Burnout signal snapshots (tab stats, scores) |

All tables use RLS: users can only read/write their own rows.

Optional backend:
- Edge Function: `POST {SUPABASE_URL}/functions/v1/score` (falls back locally if missing)

## Auth flow

1. Popup shows email/password sign-in (or create account)
2. Session tokens stored in `chrome.storage.local`
3. Background worker creates an hourly `browsing_sessions` row on sign-in
4. `webNavigation.onCompleted` logs visits to `site_visits`
5. Every 60 minutes the session closes and a new one starts
6. Log out closes the active session and stops remote writes

## Files

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest, permissions (`webNavigation` for visit logging) |
| `background.js` | Service worker: auth, hourly sessions, visit logging, scoring |
| `supabase.js` | Auth helpers, token refresh, REST fetch helpers |
| `content.js` | Frustration signal (rapid-backspace count only) |
| `popup.html/.css/.js` | Auth gate + score ring, stats, triggers, actions |
| `reset.html` | Standalone 3-minute breathing reset |

## Icons

`icons/icon16.png`, `icon48.png`, `icon128.png` are generated placeholders.
Replace them with real artwork at the same sizes — no manifest changes needed.
