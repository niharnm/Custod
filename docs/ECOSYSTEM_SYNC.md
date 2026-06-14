# Custod ecosystem sync — one account, every surface

Custod works like Grammarly: sign in once and your data follows you across the **Chrome extension**,
**macOS app**, **iOS app**, and the **web dashboard**. The dashboard can show **all devices combined** or
**one device at a time**. This doc is the contract every surface implements so that works.

## The model

- **Account = the source of truth.** Every scan is owned by a `user_id` (Supabase Auth). Sign in on any
  surface and you read/write the same account.
- **Each surface is a "device."** A device has a stable per-install id (a UUID), a `platform`
  (`chrome` | `macos` | `ios` | `web`), and a friendly `label` ("Chrome extension", "Mac app"…). Every scan
  also records the `device_id` it came from, so the dashboard can attribute and filter by device.
- **Anonymous still works.** With no sign-in, data is scoped to the device's UUID. On sign-in, the web
  calls `POST /api/me/claim` to re-parent that device's prior scans onto the account.

How the server decides "who" (`lib/owner.ts` → `resolveOwner`):
1. `Authorization: Bearer <supabase access_token>` → the **user** (extension / macOS / iOS).
2. Supabase session **cookie** → the signed-in **web** user.
3. `X-Custod-Device: <uuid>` → anonymous **device** fallback.

When signed in, `Bearer` resolves the `user_id` **and** `X-Custod-Device` is still read as the `device_id`,
so a signed-in scan is stored against both.

## What every native/extension surface must do

1. **Authenticate against the same Supabase project** (`NEXT_PUBLIC_SUPABASE_URL` /
   anon-publishable key) — email/password or Google. Persist the session (Keychain on Apple, secure storage
   on the extension) and refresh it.
2. **Generate a stable device UUID once per install**, persist it (Keychain / `chrome.storage.local`).
3. **Register on first run** (and refresh occasionally):
   ```
   POST /api/devices/register
   Authorization: Bearer <token>
   { "deviceId": "<uuid>", "platform": "macos", "label": "Mac app" }
   ```
4. **Send both identity headers on every API call:**
   ```
   Authorization: Bearer <token>      # → user_id
   X-Custod-Device: <uuid>            # → device_id (keep sending it even when signed in)
   ```
   > The Chrome extension currently *drops* the device header when signed in (`extension/src/lib/api.ts`).
   > To get per-device attribution it must send **both** the Bearer token and `X-Custod-Device`.

## API surface (all under the deployed site, e.g. https://custod.vercel.app)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/scans` | Submit a scan (tabs → analysis). Stored against user_id + device_id. |
| GET | `/api/scans?limit=N` | List the account's scans — **all devices combined**. |
| GET | `/api/scans?device=<uuid>` | Same, **filtered to one device** (signed-in only). |
| GET | `/api/scans/[id]` | One scan: reset plan, signals, tab groups. |
| GET | `/api/devices` | List the devices connected to the account (powers the picker). |
| POST | `/api/devices/register` | Register / refresh a device (platform, label). |
| GET | `/api/trends` | Score-over-time, status mix, common patterns. |
| GET | `/api/me/progress` | Streaks + achievements. |
| GET/PATCH | `/api/me/privacy` | Privacy settings (sync, store-raw-tabs, retention…). |
| GET | `/api/export?format=json` | Export everything. |
| DELETE | `/api/me/data` | Delete all account data. |

## Dashboard behavior (`src/app/dashboard/page.tsx`)

- Registers the current browser as a `web` device on load.
- Fetches `/api/devices` and renders an **"All devices" ↔ per-device picker**.
- "All devices" = combined (`/api/scans`); selecting a device reloads with `?device=<id>`.
- In combined view each check shows a small **device badge** (platform icon + label).

## Status

- ✅ Web dashboard: combined + per-device, live at custod.vercel.app.
- ✅ Backend: per-device scoping, device registry, FK-safe inserts (profiles/devices auto-upserted).
- ⏳ **Chrome extension:** must send `X-Custod-Device` alongside `Bearer`, and register on sign-in.
- ⏳ **macOS app:** add Supabase sign-in + Keychain token, device register, send both headers on sync.
- ⏳ **iOS app:** not built yet — same contract when it is.
