# Custod — Chrome extension

A privacy-first, MV3 Chrome/Edge/Brave/Arc extension that passively reads
**tab behavior patterns** (titles, URLs/domains, switch frequency, active time)
— never page contents — and surfaces a real-time burnout status: green, yellow,
or red.

It is part of the Custod ecosystem and signs into the **same Supabase account**
as the web dashboard, macOS app, and iOS app, so your focus data follows you
across devices (the "sign in once" / Grammarly model — see
[`docs/ECOSYSTEM_SYNC.md`](../docs/ECOSYSTEM_SYNC.md)).

## What it collects (and never collects)

- ✅ Tab **titles** and **URLs/domains**, tab-switch frequency, active time,
  logged as hourly sessions.
- ❌ Never full page contents, keystrokes, screenshots, or private messages.

The privacy note is shown directly in the popup.

## Load it (unpacked)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this `extension/` folder.
3. Pin "Custod" and click the icon.

There is no build step — this is plain, unbundled JavaScript (MV3). Edit a file
and hit **Reload** on the extension card.

## Configuration

- **Web app / dashboard URL** — [`config.js`](config.js) → `WEB_APP_URL`
  (defaults to `https://custod.vercel.app`; point at `http://localhost:3000`
  for local dev). The "Dashboard ↗" button opens `WEB_APP_URL/dashboard`.
- **Supabase project** — [`supabase.js`](supabase.js) → `SUPABASE_URL` /
  `SUPABASE_KEY` (the public publishable key; safe to ship). This is the SAME
  project every other Custod client uses.

## Files

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest, permissions, icons |
| `popup.html/.css/.js` | The popup: auth gate + score ring + stats + privacy note |
| `background.js` | Service worker: passive logging, scoring, Google sign-in |
| `content.js` | Reads tab title/URL changes (no page content) |
| `bridge.js` | Web ↔ extension sign-in bridge on the Custod web origins |
| `supabase.js` | Supabase auth + REST client (shared account) |
| `welcome.html/.js` | First-run sign-in onboarding |
| `reset.html` | Focus-reset overlay page |
| `arduino.html/.css/.js` | Desk-device (Arduino) connection portal — Web Serial |
| `config.js` | Web app URL config |

## Desk device (Arduino)

The Custod desk sensor pairs **only through this extension**, over USB via the
Web Serial API. The popup's **Connect desk device** button opens `arduino.html`
in a tab (a popup can't hold a serial port open), which reads the device's live
readings and mirrors your burnout status to its RGB lamp. The macOS and iOS apps
never connect to it. Firmware + protocol: [`../arduino/README.md`](../arduino/README.md).

## Known gap (see docs/API_CONTRACTS.md)

This extension currently writes **directly to Supabase** REST tables
(`browsing_sessions`, `site_visits`, `browser_readings`) and scores via a
Supabase Edge Function, rather than going through the web app's
`POST /api/scans` contract that the macOS/iOS/web clients share. Both resolve to
the same account, but the data shapes differ. Migrating the extension onto
`/api/scans` is tracked as follow-up work in
[`docs/AGENT_HANDOFF.md`](../docs/AGENT_HANDOFF.md).

## Contact

Privacy / support / data requests: **nihar.manchikalapudi@gmail.com**
