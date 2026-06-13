# PRODUCT.md — Custod

> Canonical product definition. If marketing copy, UI text, or AI output contradicts this file, this file wins.
> Research backing lives in [`custod-research-and-product-strategy.md`](./custod-research-and-product-strategy.md).

## One-sentence pitch

Custod is a privacy-first "check engine light" for your browser that detects early student burnout and digital-strain patterns from safe signals — and gives you a short reset before focus collapses.

## What Custod is

- A **pattern detector**. It reads safe browser signals (tab titles, URLs, active state) plus optional mood/time check-ins and surfaces a **green / yellow / red** status.
- An **explainer**. Every status comes with evidence groups and a plain-language reason ("research is turning into avoidance"), never a black-box score.
- A **reset planner**. Each result includes a short, concrete reset tied to the top pattern — close these, keep these, ignore these for now.
- A **private history**. A trend of past scans so the user (and only the user) can see strain building earlier next time.
- An **ecosystem**: Chrome extension (signal collector) + hosted web dashboard (analysis) + shared backend, with iOS and macOS staged for later.

## What Custod is NOT

- **Not** a medical, clinical, diagnostic, or therapy product. No diagnosis of burnout, depression, anxiety, ADHD, or any condition.
- **Not** an AI mental-health chatbot or therapist.
- **Not** surveillance, parental monitoring, or school monitoring.
- **Not** a tab manager, session manager, or calendar/task auto-scheduler.
- **Not** a productivity-score / shame engine. No childish gamification, no streak guilt.
- **Not** a page-content reader. It never ingests page bodies, screenshots, OCR, cookies, credentials, messages, grades, or full browsing history.

The user-facing framing is a practical behavior loop, not "AI wellness." AI (when present) is underneath; the surface value is a useful daily check-in and reset flow.

## Transition: TabZero → Custod

| | TabZero (old) | Custod (now) |
| --- | --- | --- |
| Purpose | Organize messy tabs into productivity plans | Detect early burnout / digital-strain patterns |
| Output | Tab groups + a plan to "get organized" | Status light + evidence + reset, with optional tab grouping as *one* reset action |
| Frame | Productivity tool | Privacy-first "check engine light" |
| Risk it avoided | — | Becoming another blocker / planner / mood diary |

The browser-pattern foundation (safe tab signals, categorization, evidence grouping) **carries over**. The *purpose* changed from "organize" to "notice strain and reset." Tab grouping survives only as a reset affordance ("park these 7, keep these 3"), not as the headline feature.

## Target user

A high-school or college student, self-directed builder, or ADHD/focus user who:

- often works from a chaotic browser (many tabs, many contexts),
- notices stress and overload **too late** (after a crash),
- distrusts wellness apps that collect too much,
- wants a fast, low-maintenance signal — one click, one screen, one reset.

## Core product loop

```
collect safe signals → score the pattern → explain the evidence → reset → re-check
```

1. **Collect** — extension captures current-window tabs (titles, URLs, active flag), or the user pastes them on the web. Optional mood check-in + time remaining.
2. **Score** — deterministic rules engine produces a 0–100 score, a status (green/yellow/red), and a per-category risk breakdown.
3. **Explain** — evidence groups + main pattern + one-sentence reason. AI (optional) only rewords/sharpens; it never invents the score.
4. **Reset** — a short plan tied to the top pattern: immediate action, 3-minute reset, 20-minute focus block, close/save list, ignore-for-now list.
5. **Re-check** — user runs again later; the trend shows whether the reset helped.

## Retention loop

> "Custod remembers my usual overload pattern and catches it earlier next time."

Retention is driven by **mature, non-childish** mechanics (see [ARCHITECTURE.md](./ARCHITECTURE.md) gamification + [PRIVACY_SAFETY.md](./PRIVACY_SAFETY.md) tone rules):

- Check-in streak and **reset-completion** streak (completing resets, not just opening the app).
- Weekly consistency + stability trend ("3 stable days").
- Gentle, earned achievements (First Check-In, Reset Completed, Pattern Spotted, Focus Recovered, Three Stable Days, Weekly Reflection).
- **No punishment for missed days. No shame language. No guilt mascots.**

## Ecosystem vision

- **Chrome extension** — primary signal collector. One-click current-window scan, optional check-in, category correction. Local-first scoring where possible.
- **Web dashboard (now)** — analysis detail, history/trend, exports, shares, privacy/account controls.
- **Shared backend** — device + scan ingestion, deterministic scoring, optional AI wrapper, history/trends, gamified progress, privacy settings, share/export/delete.
- **iOS (later)** — self-check, trend review, reset timer, optional Screen Time / DeviceActivity integration with explicit boundaries.
- **macOS (later)** — menu-bar local pressure sensor (app/domain switching), local baseline, optional focus-mode handoff.
- **Cross-device sync (later)** — sync **aggregate** scan metadata by default; raw evidence only with explicit opt-in + retention controls.
- **Privacy-first analytics** — server-side aggregate counters only (scan_created, status_bucket, platform, error_code). No third-party analytics, no titles/URLs/reflection.

## MVP scope (now)

- One-click browser pressure check (extension current-window scan **or** web paste).
- Status light (green/yellow/red) + 0–100 score + status label (Stable/Strained/At Risk).
- Deterministic risk breakdown across the six categories (see ARCHITECTURE.md scoring engine).
- Evidence groups (tab clusters) with plain-language explanations.
- Reset plan tied to the top pattern.
- Per-scan privacy summary ("what was analyzed, what was not").
- Recent scans + score trend.
- Markdown export, expiring share link (with sensitivity warning).
- Delete-scan and clear-history controls (must ship **before** accounts launch).
- Device registration (device-generated ID; anonymous OK in MVP).
- Supabase persistence with RLS; deterministic in-memory fallback only for local/dev without Supabase.

## Explicitly cut from MVP

- AI therapist / chat / wellness coach of any kind.
- Diagnostic or clinical claims/language.
- Full browsing-history ingestion, screenshots, OCR, keystrokes, cookies, page contents.
- Calendar / LMS / task auto-scheduling.
- Real iOS and macOS apps (design prototypes only; no fake placeholder implementations).
- Third-party analytics / telemetry / session replay / fingerprinting.
- Childish gamification (pets, trees, streak guilt, shaming productivity scores).
- Direct enforcement / blocking (Custod *warns before* a block; handoff to blockers is a later, optional integration).
- Demo routes, fake sample data, fake generated scans, fake workspace previews.
