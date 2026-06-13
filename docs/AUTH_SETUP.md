# Custod Auth & Sync — setup and testing

Custod now has **real accounts** (Supabase Auth) shared across the web dashboard, the Chrome
extension, and — next — the macOS app. Sign in once on the website and your burnout history syncs
everywhere. Anonymous (no-login) use still works as a fallback; signing in claims your prior
anonymous history into the account.

How identity is resolved on every API request (`lib/owner.ts`):

1. `Authorization: Bearer <token>` → verified against Supabase Auth → **user account** (extension/macOS).
2. Supabase **session cookie** → signed-in **web** user.
3. `X-Custod-Device` header → anonymous **device** fallback.

---

## 1. Environment variables (`.env.local`)

Already present (public, safe in the browser):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Add the **service-role key** so the server can persist to Postgres (without it the app runs in an
in-memory store that resets on restart — fine for a quick auth smoke test, not for real sync):

```
SUPABASE_SECRET_KEY=sb_secret_...        # or SUPABASE_SERVICE_ROLE_KEY=...
```

Find it in Supabase → Project Settings → API → `service_role` secret. **Never commit this key.**
`.env.local` is already gitignored.

## 2. Apply the database schema

In Supabase → SQL Editor, run [`supabase/schema.sql`](../supabase/schema.sql). It creates the
`scans`, `scan_events`, `devices`, `privacy_settings`, `share_links`, … tables — each already has a
nullable `user_id` and RLS policies keyed on `auth.uid()`. The server writes with the service-role
key and scopes by `user_id` (or `device_id` when anonymous).

## 3. Email + password sign-in

Works out of the box — no extra configuration. For the fastest local testing, you can disable email
confirmation: Supabase → Authentication → Providers → Email → turn **"Confirm email"** off. (With it
on, sign-up shows a "check your email" step before you can sign in.)

## 4. Google OAuth (optional)

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web application.
2. Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`.
3. Copy the Client ID + Secret into Supabase → Authentication → Providers → **Google** → enable + paste.
4. Supabase → Authentication → URL Configuration → add `http://localhost:3000/auth/callback` (and your
   production `https://custod.app/auth/callback`) to the allowed redirect URLs.

The web "Continue with Google" button uses `redirectTo = <origin>/auth/callback`, which exchanges the
code for a session ([`app/auth/callback/route.ts`](../app/auth/callback/route.ts)).

---

## 5. Build & load the Chrome extension

```bash
cd extension
npm install
npm run build          # outputs extension/dist/
```

Load it into Chrome:

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Select `Custod/extension/dist`.
5. Pin the Custod icon to the toolbar.

The extension defaults to the local web app (`http://localhost:3000`) and the same Supabase project as
the website, so a session minted on the site is valid for the extension. To point elsewhere, copy
`extension/.env.example` to `extension/.env` and rebuild.

> After editing extension code, re-run `npm run build` and click the **reload** ↻ icon on the Custod
> card in `chrome://extensions`.

---

## 6. End-to-end test

1. `npm run dev` (web) → http://localhost:3000.
2. **Web:** click **Sign in** → create an email/password account → you land back signed in (header shows
   your email). Run a scan → it appears in *Recent checks*.
3. **Extension:** open the Custod popup → **Sign in** → a tab opens `/extension/connect` → it shows
   "Extension connected". Reopen the popup — it now reads **"Synced as <you>"**.
4. **Sync proof:** in the popup click **Scan now**, then **Open dashboard** — the scan you just ran from
   the extension shows up in the web dashboard under the same account.
5. **Anonymous fallback:** sign out everywhere; *Scan now* still works (device-scoped). Sign back in —
   your prior anonymous scans get claimed into the account (`POST /api/me/claim`).

---

## 7. macOS app

The macOS app now signs in against the **same Supabase project** and syncs over the **same Bearer-token
API** — no server changes were needed (`resolveOwner` already accepts bearer tokens). Implementation:

- [`CustodConfig.swift`](../macos/Custod/Custodt/CustodConfig.swift) — same Supabase URL + anon key as the
  web/extension (override with `CUSTOD_WEB_URL` / `CUSTOD_SUPABASE_URL` / `CUSTOD_SUPABASE_ANON_KEY` env vars).
- [`AuthStore.swift`](../macos/Custod/Custodt/AuthStore.swift) — Supabase Auth over plain REST: email/password
  (`/auth/v1/token`), sign-up (`/auth/v1/signup`), token refresh, and **Continue with Google** via
  `ASWebAuthenticationSession`. The session is stored in the **Keychain** ([`Keychain.swift`](../macos/Custod/Custodt/Keychain.swift)).
- [`CustodSync.swift`](../macos/Custod/Custodt/CustodSync.swift) — on every status change, POSTs the current
  tabs to `/api/scans` with `Authorization: Bearer <token>` (or the anonymous `X-Custod-Device` header when
  signed out). So a check triggered on the Mac shows up on the web dashboard under the same account.
- Pre-login checks are **claimed** onto the account on sign-in (`POST /api/me/claim`), same as web/extension.

Sign in from the macOS app under **Settings → Account** (or the sidebar footer).

### Google sign-in on macOS — one extra Supabase step

The macOS "Continue with Google" button sends the OAuth callback to the custom scheme `custod://auth-callback`
(intercepted by the system web-auth sheet — no Info.plist URL-type registration needed). For Supabase to
allow that redirect, add it under **Authentication → URL Configuration → Redirect URLs**:

```
custod://auth-callback
```

(alongside the web callbacks from §4). Without it, Google sign-in on the Mac fails with a redirect error.

---

## 8. One email = one account (cross-provider linking)

Data is scoped server-side by Supabase **`user_id`**, and the goal is that **email** is the single key —
signing in via Google or email/password with the *same address* should land on the *same* account so all
your data (web, extension, macOS) lines up.

Supabase governs this with **Authentication → account linking → "Allow linking identities with the same
email"**. Turn it on (and keep **email confirmation on**, so only verified emails link). Then
`foo@gmail.com` via Google and `foo@gmail.com` via password resolve to one `user_id`. With it off, the two
become separate accounts with separate data. After changing it, verify by signing into two surfaces with the
same email and confirming a single row in **Authentication → Users**.
