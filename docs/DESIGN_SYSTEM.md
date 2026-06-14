# Custod — Design System

One brand across the website, Chrome extension, macOS app, and iOS app. The
goal isn't pixel-identical surfaces — it's that they read as **the same product
family**: calm, serious, premium. Think Linear / Raycast / Vercel polish, not
wellness clip-art.

## Brand

- **Name:** Custod (from *custodian* — a guardian that watches quietly and only
  speaks up when something is wrong).
- **Tagline:** "Your silent guardian." · Product framing: **a check engine light
  for burnout** — an early, ambient signal before you crash.
- **What it is:** a privacy-first early-signal tool for digital strain and
  burnout patterns.
- **What it is not:** therapy, a diagnosis, a mental-health chatbot, or crisis
  support. Never imply any of these.

## Voice & tone

- **Calm, not clinical. Serious, not scary.** Short, plain sentences.
- **Use:** "burnout patterns," "digital strain," "check engine light," "reset,"
  "focus recovery," "early signal," "stable / strained / at risk."
- **Avoid:** "diagnosis," "disorder," "mentally ill," "you're broken,"
  shame-based or alarmist phrasing, fake urgency, emoji-heavy hype.
- Address the user directly and kindly. Suggest, don't command. Offer a reset,
  not a verdict on their character.

## Color tokens

Source of truth for web: `src/app/globals.css` (CSS custom properties, consumed
through Tailwind v4 `--color-*` tokens and `custod-*` utilities). Native apps
mirror these as named colors / asset catalog entries.

### Status colors (the core of the brand — same meaning everywhere)

| Status | Label | Meaning | Web token (`globals.css`) | Hex | Extension (dark popup) |
|---|---|---|---|---|---|
| 🟢 Green | **Stable** | Patterns look healthy | `--color-custod-status-green` | `#22C55E` | `#1D9E75` |
| 🟡 Yellow | **Strained** | Early signal — ease off | `--color-custod-status-yellow` | `#EAB308` | `#BA7517` |
| 🔴 Red | **At Risk** | Sustained strain — reset now | `--color-custod-status-red` | `#EF4444` | `#E24B4A` |

The canonical labels are **Stable / Strained / At Risk**. Surfaces may use
in-context phrasings (the extension shows "Focused / Scattered / Burnout risk
rising"), but never invent clinical labels.

### Brand & surface tokens

| Token | Hex / value | Use |
|---|---|---|
| `--color-custod-primary` | `#0F766E` (teal) | Primary accent, buttons, links |
| `--color-custod-secondary` | `#E8F0EC` | Soft section backgrounds (light) |
| `--color-custod-muted` | `#6B7280` | Secondary / muted text |
| `--color-custod-heading-start → -end` | `#0F172A → #475569` | Heading gradient |

### Light / dark surface tokens (shadcn-style, oklch)

`globals.css` ships both. The **marketing site** is intentionally light/premium
(`bg-white`); **app surfaces** (dashboard, extension popup, native apps) lean
**dark by default**.

| Role | Light | Dark |
|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |

> **Rule:** no ad-hoc hex values in components. Use a token. If you need a new
> one, add it to `globals.css` (and the native color sets), don't hardcode.

## Typography

- **Headings:** EB Garamond (`--font-eb-garamond`, the `font-heading` utility) —
  warm, editorial, calm.
- **Body / UI:** Geist Sans + Inter (`--font-geist-sans`, `--font-inter`).
- **Mono:** Geist Mono (code, key paths, IDs).
- Native: SF Pro (system) is the equivalent — large rounded titles for status,
  regular for body.

## Spacing, radius, shadow

- **Spacing scale:** Tailwind default (4 / 8 / 12 / 16 / 24 / 32…). Mobile-first.
- **Radius:** generous and soft — cards `rounded-3xl` (24px), inputs/buttons
  `rounded-xl` (12px), pills `rounded-full`.
- **Shadow:** subtle elevation only — `shadow-md` for interactive cards,
  `shadow-xl` for primary surfaces. No harsh drop shadows.

## Components

- **Buttons** — Primary: `custod-primary-button` (teal fill, white text,
  `rounded-xl`). Secondary: bordered/ghost on transparent. Icon-only for compact
  toolbars (extension header). One primary action per view.
- **Cards** — white (light) / `--card` (dark), `rounded-3xl`, `border`, soft
  shadow, comfortable padding (`p-6`/`p-9`). Status cards carry a left status
  dot/ring in the matching status color.
- **Status lamp / ring** — the signature element: a green/yellow/red ring with a
  score in the center (`src/components/custod/StatusLamp.tsx`, extension `#ring`).

## Privacy note style

Small, quiet, always present where data is captured. Muted text, neutral
background, no alarm color. Canonical copy lives in
[`PRIVACY_SAFETY.md`](PRIVACY_SAFETY.md). Example (extension popup):

> "Visits are logged as URL + title in hourly sessions. Custod never reads page
> contents, keystrokes, or messages."

## Safety disclaimer style

One calm line, footer or settings/about — never a scary modal:

> "Custod is not a diagnosis, therapy, or crisis-support tool."

## States

- **Empty** — explain the next action plainly ("Run your first check to see your
  status"), never a dead end. No fake/sample data to fill space.
- **Loading** — skeletons or a quiet "Analyzing your patterns…"; the status ring
  shows `–` until real data arrives.
- **Error** — plain, non-alarming, recoverable ("Custod couldn't analyze this
  right now. Try again."). Surface the retry; don't blame the user.
