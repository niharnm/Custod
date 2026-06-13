# PRIVACY_SAFETY.md — Custod

> Non-negotiable. Privacy and safety rules override product, design, and engineering convenience.
> If a feature requires breaking a rule here, the feature changes — not the rule.

## Allowed data

Custod may collect, only from what the user submits or the extension reads from the **current window**:

- Tab **titles**
- Tab **URLs**
- Active-tab **state** (boolean)
- Optional **favicon URL**
- Optional **goal** (short free text)
- Optional **mood check-in** (`calm | stressed | overwhelmed | numb | skip`)
- Optional **time remaining** (short string)
- Optional **reflection** (short free text, sensitive — see below)
- Derived aggregates: status, score, risk breakdown, tab/domain counts, evidence **counts**, timestamps, device platform/label

## Forbidden data (never collect, never accept, never log)

- Page **contents / body text / DOM**
- **Screenshots / OCR / images** of pages
- **Cookies, tokens, credentials, passwords**
- **Private messages**, emails, DMs, chat contents
- **Grades, documents, financial or health records**
- **Keystrokes**
- **Continuous or full browsing history** (only the submitted snapshot)
- **IP-based fingerprinting**, third-party trackers, session replay
- School / LMS / calendar account data without explicit, reviewed OAuth scopes (post-MVP only)

## Exact privacy promise (user-facing wording)

> "Custod only looks at the tab titles and URLs you submit, plus anything you optionally tell it. It never reads page contents, screenshots, cookies, messages, grades, keystrokes, or your full browsing history. Raw tabs and reflections stay on your device unless you explicitly choose to save or sync them."

This promise must appear (or link) on every scan result and in the extension popup. The per-scan `privacySummary` restates what was and was not analyzed.

## Mental-health safety language rules

Custod is **not** a medical, clinical, diagnostic, or therapy product. In all copy, AI output, and UI:

**Never use:**
- Diagnostic terms: "burnout disorder," "depression," "anxiety," "ADHD," "clinical," "diagnose," "symptom," "treatment," "therapy."
- Certainty about internal state: "you are burned out," "you have…," "this means you're depressed."
- Scary / alarm language: "danger," "crisis," "emergency," "breakdown" (as a claim about the person).
- Wellness-slop: "optimize your mind," "unlock your potential," "dopamine detox," "mental health score," "AI therapist."
- Shame / guilt: "you failed," "you wasted," "you're unproductive," "you should have."

**Use instead (pattern-framed, shame-free):**
- "Your browser is carrying too many open loops."
- "This looks like research turning into avoidance."
- "Deadline pressure is mixing with distraction tabs."
- "Try a short reset before continuing."

Frame everything as a **browser-pattern observation**, not a statement about the person's mind or health.

## What not to log

- No tab titles, URLs, goals, or reflections in application logs, error logs, or analytics.
- No request bodies in logs. Log only: route, status code, error code, latency, scan id (opaque), device platform.
- AI calls: never log prompt contents or model output containing user data.
- No user-agent fingerprinting or IP retention.

## Share-link privacy rules

- Shares are **opt-in**, **expiring**, and **revocable**.
- `includeRawTabs` defaults to **false** — a shared scan shows status + analysis, not raw titles/URLs, unless the user explicitly opts in.
- When a user enables raw tabs in a share, show a clear warning: "Titles and URLs can reveal private activity. Anyone with this link can see them until it expires."
- Shared views never expose owner identity, device, other scans, or reflections.
- Expired/revoked slugs return `404`.

## Data deletion / export expectations

- **Export** (`GET /api/export`): the user can download all of their own data (scans, settings, and stored raw payloads where applicable) in JSON or Markdown. Ship before accounts.
- **Delete-all** (`DELETE /api/me/data`): hard-deletes the user/device's scans, events, reflections, shares, and private payloads; revokes share links. Ship before accounts.
- **Per-scan delete** and **clear history** must be available from the dashboard.
- **Retention:** `retentionDays` drives scheduled cleanup of expired private payloads and shares. Turning off `storeRawTabs` purges existing raw payloads.

## Safe AI prompt constraints

When an AI provider is used (`lib/ai`), the system prompt must enforce:

- **Input is limited** to tab titles, URLs, goal, optional mood check-in, and time remaining. Nothing else is ever sent.
- The model **must return strict JSON** for wording only; it cannot alter `score`, `status`, or `riskBreakdown`.
- The model **must not**: diagnose, claim certainty about the user's mental state, use clinical/medical/therapy framing, or use scary/shaming language.
- The model **must**: stay in browser-pattern framing, hedge appropriately ("this looks like…"), and keep reset suggestions concrete and short.
- On any invalid/unsafe output → discard and **fall back to deterministic rules text**. Output is validated and one repair attempt is allowed before fallback.

## Crisis / safety disclaimer wording

Custod is not a crisis tool and must not behave like one, but it should not pretend distress is impossible. Use neutral, non-alarming language and avoid triggering scary UI. Standard footer disclaimer:

> "Custod notices browser patterns; it is not medical advice, diagnosis, or a substitute for talking to someone you trust. If you're going through a hard time, reaching out to a friend, family member, or a counselor can help."

- Do **not** auto-trigger crisis pop-ups, hotline modals, or alarms from scores. A red status means "consider a reset," not "you are in crisis."
- Keep the disclaimer calm, optional to expand, and never the headline of the experience.
