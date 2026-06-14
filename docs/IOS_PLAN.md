# Custod for iOS — Plan & Status

SwiftUI iPhone/iPad app at `ios/Custod/`. It is **account-first** (login gate on
launch) and authenticates against the **same Supabase project** as the website,
macOS app, and extension, so the iPhone resolves to the same account everywhere.

See [`../ios/README.md`](../ios/README.md) for run/build instructions.

## Status

| Area | State |
|---|---|
| Login gate + auth (email/password, Google, Keychain session) | ✅ Built (`AuthStore`, `SignInView`, `Keychain`) |
| Shared account / config (`CustodConfig.swift`) | ✅ Same Supabase project; `webAppURL` + `contactEmail` added |
| Home / signed-in status | ✅ Account card + "Screen Time on the way" + Privacy & safety card |
| Privacy/Terms/Support links + contact email | ✅ In the home Privacy & safety card |
| Screen Time capture | ⏳ Needs Apple's Family Controls entitlement (below) |
| New check-in / scan → `/api/scans` | ⏳ Not yet wired |
| History list (`GET /api/scans`) | ⏳ Not yet |
| Dedicated Settings screen | ⏳ Folded into home for now |

## Screens (target)

1. **Login gate** — first run; nothing shown until signed in. ✅
2. **Home / status** — green/yellow/red status ring + latest signal. (Account
   card today; status ring once a data source exists.)
3. **New check-in / scan** — optional mood + goal + time; posts to `/api/scans`.
4. **History** — list from `GET /api/scans`, tap into a scan detail.
5. **Settings / privacy** — privacy copy, safety disclaimer, contact email,
   links to web Privacy/Terms/Support, sign out. (Currently on the home screen.)

## Shared API use

Same contract as everyone else — see [`API_CONTRACTS.md`](API_CONTRACTS.md):

- `POST /api/devices/register` with `platform: "ios"` on first run.
- `POST /api/scans` for check-ins; `GET /api/scans` for history.
- Send `Authorization: Bearer <token>` **and** `X-Custod-Device: <uuid>`.

iOS has no browser tabs, so a check-in posts `tabs: []` plus `moodCheckIn`,
`goal`, `timeRemaining`; once Screen Time is available, app-usage signals feed
in. The macOS `CustodSync.swift` is the reference implementation to mirror.

## Shared design tokens

Follow [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): brand teal
`Color.brand = rgb(0.11, 0.62, 0.46)` (defined in `SignInView.swift`), SF
Pro rounded, status green/yellow/red = Stable/Strained/At Risk, soft 16pt cards.

## Privacy requirements

- Show the canonical short privacy copy and safety disclaimer (now in the home
  Privacy & safety card).
- Never collect page contents, keystrokes, screenshots, or messages.
- Contact `nihar.manchikalapudi@gmail.com` visible (it is, in-app).

## What must be implemented later

1. **Family Controls entitlement** (`com.apple.developer.family-controls`) —
   request from Apple for bundle id `app.custod.ios`; then `FamilyControls` +
   `DeviceActivity` + a `DeviceActivityReport` extension to read usage.
2. **Device register + scan posting** against `/api/scans` (mirror macOS).
3. **History + status ring** UI once a data source is live.
4. Optional: a dedicated Settings tab split out from the home screen.
