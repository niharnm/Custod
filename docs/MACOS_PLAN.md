# Custod for macOS — Plan & Status

SwiftUI menu-bar + window app at `macos/Custod/`. It is the most complete native
client: it monitors on-device signals, scores burnout locally, and syncs checks
to the shared backend. Account is shared with the website, extension, and iOS.

## Status

| Area | State |
|---|---|
| Account / auth (email, Google, Keychain) | ✅ `AuthStore`, `SignInView`, `Keychain` |
| Shared config (`CustodConfig.swift`) | ✅ `webAppURL`, Supabase, `contactEmail` |
| Dashboard / status UI | ✅ `DashboardView` (status, signals, reasoning) |
| History | ✅ `HistoryView` + `HistoryStore` (JSON in Application Support) |
| Settings (intervention, sensitivity, AI, supervised, **About & privacy**) | ✅ `SettingsView` |
| Onboarding + permissions | ✅ `OnboardingView`, `Permissions` |
| Local burnout scoring | ✅ `BurnoutAnalyzer` / `BurnoutMonitor` |
| Backend sync → `/api/scans` | ✅ `CustodSync.swift` (Bearer + device headers) |
| Screen Time / app usage | ✅ `ScreenTimeReader` / `AppUsageTracker` (needs Full Disk Access for `knowledgeC.db`) |
| AI reasoning (Groq) | ✅ `GroqReasoner` with anti-diagnosis guardrails |
| Privacy/Terms/Support links + contact email | ✅ Added to Settings → About & privacy |

The macOS app already follows the shared API contract — `CustodSync.swift` posts
tabs/usage to `POST /api/scans` with `Authorization: Bearer` + `X-Custod-Device`.

## Role

- **Menu-bar + desktop app.** Passive background monitoring with a window for the
  dashboard, history, and settings; optional automatic "reset" interventions
  when burnout climbs (configurable, with a supervised/PIN mode).

## Scan / check-in flow

1. `BurnoutMonitor` samples signals (open tabs via `TabImporter`/`TabParsing`,
   screen time, app usage, breaks) on a cadence.
2. `BurnoutAnalyzer` scores locally → status + reset plan (transparent, on-device).
3. If signed in, `CustodSync` posts the check to `/api/scans` so it appears on
   the web dashboard alongside other devices.
4. Optional `GroqReasoner` adds plain-language *why* — guarded against
   diagnosis/therapy/panic language.

## Shared API use

See [`API_CONTRACTS.md`](API_CONTRACTS.md). Implemented: device register
(`platform: "macos"`), `POST /api/scans`. Both identity headers are sent.

## Shared design tokens

Per [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): brand teal `Color.brand`, SF Pro
rounded, soft cards (`Card`), status green/yellow/red. Dark-leaning, calm.

## Privacy requirements (met)

- Privacy summary on every analysis (`Models.privacySummary`,
  `BurnoutAnalyzer`), AI sends only titles/URLs/timing, history stays on the Mac.
- Canonical short privacy copy + safety disclaimer + contact email now in
  Settings → About & privacy.
- Never collects page contents/keystrokes/screenshots/messages.

## What must be implemented later

1. **Groq key handling** — key lives in local UserDefaults/env, never in git;
   `AIConfig.bundledDefaultKey` stays `""`. Rotate the previously-exposed key.
2. **Full Disk Access** required for real `knowledgeC.db` screen-time reads;
   app must relaunch after granting.
3. Verify device-register call fires on sign-in (FK-safe profile upsert is
   handled server-side, commit `21efbd1`).
4. Build locally to confirm the new About & privacy card compiles (see below).

## Build check

```bash
cd macos/Custod
xcodebuild -project Custodt.xcodeproj -scheme Custodt \
  -destination 'platform=macOS' build CODE_SIGNING_ALLOWED=NO
```

Requires Xcode; cannot be built in the CI/agent sandbox here.
