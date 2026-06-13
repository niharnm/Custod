# Custod for macOS

A native SwiftUI app that turns the Custod burnout analyzer into an **always-on
desktop guardian**. It reads your open browser tabs natively (no extension),
scores burnout risk locally on a timer, and — when you let it — steps in on its
own with a guided reset. Everything stays on the Mac; page contents are never
read.

The Xcode project lives in [`Custod/`](Custod). Open `Custod/Custodt.xcodeproj`,
select the **My Mac** destination, and press **⌘R**.

## What it does

- **Real-time monitoring.** A background engine (`BurnoutMonitor`) re-reads the
  default browser's tabs every 20s, runs the analyzer, and publishes a live
  status — conceptually like Microsoft Defender's real-time protection. A
  history snapshot is logged only when the status actually changes.
- **Autopilot interventions.** In `Settings`, choose how much Custod may act on
  its own:
  - **Off** — watches silently.
  - **Notify me** — sends a local notification when burnout climbs.
  - **Autopilot** — also takes over the window with a timed reset break and the
    top reset-plan steps.
  Sensitivity (**Gentle / Balanced / Strict**) tunes the trigger score, break
  length, and cooldown so it never nags.
- **Supervised mode (parental / self-commitment).** A SHA-256 PIN locks the
  settings *and* the monitoring switch, so a moment of weakness can't quietly
  turn Custod off. Addresses the common failure of parental tools that are
  trivially disabled. *(Note: this is in-app tamper resistance; a future launch
  agent would be needed to survive a force-quit at the OS level.)*
- **Menu-bar presence.** An always-visible status glyph + popover (score, last
  check, pause/resume, check now) via `MenuBarExtra`.
- **Healthy-day streak**, Grammarly-style dashboard, and Markdown export.

## How the score works

The burnout score (0–100) is **transparent**: it is the sum of per-factor point
contributions, and the dashboard shows each factor's "+N pts" so the user can
see exactly what is driving it. Factor maximums sum to 100.

| Factor | Max | Measures |
| ------ | --- | -------- |
| Tab overload | 16 | open tabs vs. working-memory limit |
| Context switching | 12 | distinct sites + task types (attention residue) |
| Distraction loop | 14 | entertainment/social tabs mixed with deadlines |
| Goal fragmentation | 10 | research + comms + admin competing at once |
| Time & energy pressure | 14 | self check-in (stress, energy, deadlines) |
| Screen time today | 12 | active minutes on the Mac today |
| No recent break | 14 | length of the current unbroken stretch |
| Late-night use | 8 | time of day (melatonin / next-day fatigue) |

The last three are real usage signals from `UsageTracker`, sampled from the
system HID idle clock — not from tabs. Research basis: context switching and
decision friction now outrank raw workload as exhaustion indicators; prolonged
screen time, working without breaks, and late-night use are repeatedly cited
drivers of digital burnout.

## Source map

| File | Responsibility |
| ---- | -------------- |
| `CustodApp.swift` | App entry, environment wiring, menu-bar scene |
| `ContentView.swift` | Dashboard, history, settings, autopilot break overlay |
| `BurnoutMonitor.swift` | Real-time polling + intervention engine |
| `SettingsStore.swift` | Persisted prefs, sensitivity, supervised PIN |
| `Notifier.swift` | Local notifications |
| `Insights.swift` | Derived insights (healthy-day streak) |
| `BurnoutAnalyzer.swift` | 1:1 port of `lib/analyzer.ts` |
| `Models.swift` | Port of `lib/types.ts` |
| `TabImporter.swift` | Native tab read via Apple Events + default-browser detection |
| `TabParsing.swift` | Manual paste fallback parser |
| `HistoryStore.swift` | Local JSON history in Application Support |
| `Markdown.swift` | Markdown export |

## Required project settings

Tab import talks to the browser via Apple Events, which macOS gates:

1. **Info.plist** → `NSAppleEventsUsageDescription` with a user-facing reason.
   The project sets this via the `INFOPLIST_KEY_NSAppleEventsUsageDescription`
   build setting.
2. **App Sandbox** — for a local build, sandbox is disabled so Apple Events to
   the browser work after the user approves the one-time prompt. For a Mac App
   Store build, ship paste-only or a companion extension instead (temporary
   apple-events exceptions aren't allowed on the store).
3. First import triggers *"Custod wants to control <Browser>"* — the user clicks
   **OK** once (then it appears under System Settings → Privacy & Security →
   Automation).

## Privacy

Only tab titles, URLs, and active-tab state are analyzed. No page contents,
screenshots, cookies, passwords, or keystrokes. History is on-device JSON and is
never uploaded. Custod is a pattern detector, not a medical diagnosis.
