# Custod research and product strategy

Date: 2026-06-13

Custod should not become another blocker, mood diary, or productivity dashboard. The defensible product is a privacy-first browser pressure sensor: it notices when a student's digital workspace starts showing overload patterns, explains the pattern in plain language, and gives a short reset that reduces the next 20 minutes of friction.

## Research stance

This document uses public user discussions, store/review pages, support docs, privacy docs, and adjacent academic work. Reddit and review evidence is directional, not statistically representative. The most repeated signals are still useful: people hate losing tab context, hate blockers that are easy to bypass or too punitive, distrust mental-health-style apps that collect too much, and abandon tools that require heavy upkeep.

Primary source set:

- Reddit ADHD tab-hoarding discussions: [ADHD tabs open](https://www.reddit.com/r/ADHD/comments/1bury3i/you_have_how_many_tabs_open/), [tab hoarders](https://www.reddit.com/r/ADHD/comments/s0rt4c/any_tab_hoarders/), [digital clutter](https://www.reddit.com/r/ADHD/comments/12k9wzr/digital_clutter/)
- Reddit burnout/student stress discussions: [student burnout](https://www.reddit.com/r/college/comments/18bmsre/academic_burnout_is_real/), [finals stress](https://www.reddit.com/r/GetStudying/comments/13ewhdn/how_do_you_deal_with_academic_burnout/)
- Reddit/Productivity app discussions: [RescueTime alternatives](https://www.reddit.com/r/productivity/comments/117x53t/rescuetime_alternatives/), [Rize](https://www.reddit.com/r/productivity/comments/17bq4y9/rizeio_alternatives/), [Motion](https://www.reddit.com/r/productivity/comments/18li75y/is_motion_worth_it/), [Sunsama](https://www.reddit.com/r/productivity/comments/13dn19c/sunsama_is_it_worth_it/)
- Browser tools: [OneTab Chrome Web Store](https://chromewebstore.google.com/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall), [Session Buddy Chrome Web Store](https://chromewebstore.google.com/detail/session-buddy/edacconmaakjimmfgnblocblbcdcpbko), [Workona Chrome Web Store](https://chromewebstore.google.com/detail/workona-tab-manager/ailcmbgekjpnablpdkmaaccecekgdhlh), [Toby Chrome Web Store](https://chromewebstore.google.com/detail/toby-tab-management-tool/hddnkoipeenegfoeaoibdmnaalmgkpip), [Arc help on Spaces](https://resources.arc.net/hc/en-us/articles/19228855311127-Spaces)
- Digital wellbeing/focus tools: [Apple Screen Time](https://support.apple.com/en-us/108806), [Apple privacy and Screen Time](https://www.apple.com/legal/privacy/data/en/screen-time/), [Opal](https://www.opal.so/), [one sec](https://one-sec.app/), [Freedom](https://freedom.to/), [RescueTime](https://www.rescuetime.com/), [Rize](https://rize.io/)
- Mood/mental-health adjacent: [Finch privacy](https://finchcare.com/privacy-policy), [Daylio privacy](https://daylio.net/privacy-policy), [Bearable privacy](https://bearable.app/privacy-policy/), [Headspace privacy](https://www.headspace.com/privacy-policy), [Mozilla mental health app privacy report](https://foundation.mozilla.org/en/privacynotincluded/articles/top-mental-health-and-prayer-apps-fail-spectacularly-at-privacy-security/)
- Research backdrop: [digital phenotyping privacy risks](https://pmc.ncbi.nlm.nih.gov/articles/PMC11381371/), [student stress and passive sensing review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8685117/), [student burnout prevalence review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8834764/)

## 1. Competitor table

| Product | Category | What it does | Strengths | Weaknesses / complaints | Privacy concerns | Opportunity for Custod |
| --- | --- | --- | --- | --- | --- | --- |
| Apple Screen Time | OS wellbeing | App/category limits, usage reports, downtime | Built in, cross-device, low setup | Users often say limits are easy to bypass and reports do not explain why behavior is happening | Sensitive app usage data, mitigated by Apple account/device controls | Explain patterns, not just minutes. Provide "why now" and reset plan. |
| Opal | App blocker | Blocks distracting apps/sites in sessions | Strong intervention, polished mobile UX | Blocking can feel punitive; paid tiers frustrate casual users | Needs blocking permissions and usage visibility | Custod should warn before blocking becomes necessary. |
| one sec | Friction app | Adds intentional delay before opening distracting apps | Lightweight and behaviorally smart | Can become annoying or be disabled when stress is high | Needs app/site interception permissions | Use friction sparingly: one "pause before spiral" moment, not constant nagging. |
| Freedom | Cross-device blocker | Scheduled blocking across devices | Reliable for planned deep work | Setup and syncing can be clunky; users complain when blocks misfire | Cross-device block lists expose sensitive intent | Custod can recommend a focus window without owning enforcement in MVP. |
| RescueTime | Time tracking | Tracks app/site time, productivity categories | Mature reports and automation | Users complain about category accuracy, pricing, and feeling monitored | Broad activity monitoring can feel invasive | Collect less. Analyze only current-window tab snapshot unless user opts in. |
| Rize | Desktop focus tracker | Tracks focus, meetings, breaks, app/site usage | Better real-time focus coaching than legacy trackers | Desktop-only feel; price; still a tracker | Deep computer activity visibility | Custod can be student/browser-first and privacy-readable. |
| Reclaim | Calendar automation | Schedules tasks/habits around calendar | Strong for busy professionals | Feels heavy for students; calendar automation can create distrust | Calendar contents are sensitive | Do not start with calendar ingestion. Use optional deadline tags later. |
| Motion | AI scheduler | Auto-plans tasks/calendar | Powerful for task-heavy users | Common complaint: expensive, too rigid, overkill | Requires calendar/task data | Avoid "AI planner" positioning. Custod is a warning light, not a boss. |
| Sunsama | Daily planning | Guided daily/weekly planning | Calm, intentional workflow | Expensive; planning can become another chore | Task/calendar integrations | Custod should reduce planning burden, not add a daily ritual requirement. |
| Forest | Focus timer | Grow trees by staying focused | Simple, repeat-use mechanic | Gamification can feel childish or insufficient for real overload | Low to medium | Use calm status history, not cute reward loops. |
| Finch | Self-care pet | Mood check-ins, habits, self-care prompts | High emotional attachment, gentle tone | Not for users who dislike gamified wellness | Stores sensitive wellness data; policies matter | Custod should be less therapeutic and less identity-based. |
| Headspace / Calm | Meditation | Content library for mindfulness/sleep | Trusted brands, broad content | Not contextual to school/browser overload; subscriptions | Mental health and usage data | Custod can hand off to recovery, but should not be a content library. |
| Daylio / Bearable | Mood tracking | Track mood, symptoms, habits | Useful longitudinal self-knowledge | Manual logging fatigue; correlations can become obsessive | Sensitive health/mood histories | Keep check-ins optional and tiny. No clinical inference. |
| OneTab | Tab manager | Converts open tabs into saved list | Solves tab overload fast | Users fear losing sessions; old complaints about lost tabs/import-export trust | URLs reveal private activity | Custod can use "park tabs" as reset, but with clear export/local storage. |
| Session Buddy | Session manager | Save/restore browser sessions | Trusted by tab hoarders | Data-loss anxiety; restore/search complexity | Browser session URLs | Custod should not pretend to replace session managers; integrate/export later. |
| Toby | Tab/workspace manager | Visual collections and workspaces | Good for intentional organization | Account requirement and workspace upkeep can frustrate users | Cloud account plus URLs | Custod should require almost no manual curation. |
| Workona | Workspace/tab manager | Project workspaces, tab sync | Strong for work contexts | Too much structure for quick student use | Cloud workspace/tab data | Custod can detect fragmentation without forcing workspace taxonomy. |
| Arc Spaces | Browser workflow | Separates projects/profiles/spaces | Native-feeling workspace model | Browser switching cost; not a warning system | Browser-level visibility | Custod can be browser-agnostic and status-focused. |

## 2. User pain points ranked by intensity

| Rank | Pain point | Who has it | Evidence | Why current tools fail | Custod answer |
| --- | --- | --- | --- | --- | --- |
| 1 | "I have too many tabs because each one is an unfinished thought." | ADHD/focus users, students, builders | Reddit ADHD tab-hoarding threads repeatedly describe dozens to hundreds of tabs and fear of losing context. | Tab managers save tabs but do not explain overload or priority. | Detect tab overload + goal fragmentation, then offer "park these 7 tabs, keep these 3" reset. |
| 2 | "I do not notice burnout until I crash." | Stressed students, finals weeks, ambitious builders | Student burnout Reddit threads and burnout literature describe late recognition and exhaustion after sustained pressure. | Mood apps require manual insight; time trackers show data after the fact. | Green/yellow/red status from current behavior, with "what changed since last check." |
| 3 | "I procrastinate by researching, planning, or asking tools instead of finishing." | Students, programmers, ADHD users | Productivity and ADHD discussions frequently mention research spirals and planning loops. | Blockers treat all non-work as distraction and miss productive-looking avoidance. | Classify research spiral/help-seeking/planning loops separately from entertainment. |
| 4 | "Blockers work until I need to bypass them." | Doomscrolling/focus users | Screen Time, Opal, Freedom, one sec discussions show tension between helpful friction and annoyance. | Overblocking creates rebellion or workarounds. | Custod warns and suggests a reset before enforcement. Later, optional handoff to blockers. |
| 5 | "I do not trust wellness apps with private data." | Privacy-conscious students, parents, school users | Mozilla's mental-health app privacy work and app privacy policies show broad sensitive data collection in the category. | Mental-health apps often ask for mood, journaling, health data, identifiers, tracking. | Local-first by default; no page contents; raw URL retention off by default or encrypted/local. |
| 6 | "Productivity apps become another productivity project." | Students and busy users | Sunsama/Motion/Reclaim discussions often praise power but complain about cost/setup/maintenance. | They require task hygiene, calendar hygiene, and routine compliance. | One-click scan, one screen, one reset. No full planner in MVP. |
| 7 | "I want cross-device awareness, but not surveillance." | Students with phone + laptop | Screen Time and cross-device blockers prove demand, but privacy concerns rise with sync. | Sync often means centralizing sensitive activity. | Sync aggregate signals and user-approved check records, not raw full activity. |

## 3. Feature recommendations

### Must-have MVP

- One-click browser check from Chrome extension: current-window tabs only, titles/domains/active flag, no page text.
- Status light: green/yellow/red with score, primary pattern, and evidence bullets.
- Pattern taxonomy: tab overload, context switching, research spiral, distraction loop, deadline pressure, help-seeking loop, planning loop.
- 3-step reset plan tied to top pattern, not generic wellness advice.
- Local privacy summary on every check: what was analyzed and what was not.
- Recent checks trend: status, top pattern, tab count, time, optional self-check values.
- Delete check and clear history controls.
- Export/share with warning that titles and URLs may be private.

### Strong V1

- "Park tabs" output: suggested keep/park/close groups with downloadable local session file.
- On-device baseline: compare current check to user's usual tab count/domain count locally.
- Optional deadline pressure input: simple "deadline today / this week / none", no calendar import.
- Optional focus handoff: open Opal/Freedom/one sec instructions or browser focus profile, not direct control.
- Private account sync: Supabase auth plus encrypted or minimized check sync.
- Device labels: Chrome laptop, Mac, iPhone, web manual check.
- Weekly pattern review with no moralizing: "3 yellow checks after 10pm; research spiral was top pattern."

### Later

- macOS menu bar agent with app/category signals, active-window domain, and local-only scoring.
- iOS app using Screen Time/DeviceActivity APIs where permitted, with very explicit data boundaries.
- Calendar integration for deadlines only after MVP trust is earned.
- Browser session manager integration/export.
- School LMS integrations only if user explicitly connects them, and never as a first build.

### Avoid

- AI therapist chat.
- Diagnostic claims: depression, anxiety disorder, ADHD diagnosis, clinical burnout diagnosis.
- Full browsing history ingestion.
- Screenshots, OCR, keystrokes, page contents, cookies, private messages, grades.
- Gamified pets, streak guilt, productivity scores that shame users.
- Fake "AI insights" that just restate high tab counts.
- Heavy task manager/calendar auto-scheduler.

## 4. Make it original

Custod differs from Screen Time because it explains pattern pressure, not just minutes. It differs from Opal/Freedom because it is a warning system before a block. It differs from RescueTime/Rize because it collects less and is centered on student overload, not employer-style productivity. It differs from Finch/Daylio because it is not a mood diary. It differs from OneTab/Toby/Workona because it understands why the browser is messy, not only how to save tabs.

Unique hook: "A check engine light for your browser before your brain hits redline."

Repeated-use reason: students run it when they feel stuck, before starting work, during finals, or when the browser feels chaotic. The useful loop is: scan -> see pattern -> reset -> compare next check.

Install moment: "It looked at only my current tabs and told me I was not lazy; I was juggling deadlines, research, help tabs, and distractions at once. Then it told me exactly what to close first."

What makes it more than AI wellness: deterministic, inspectable signals; evidence groups; clear privacy boundaries; reset actions that change the browser state.

## 5. Not AI slop checklist

Avoid language:

- "Optimize your mind", "unlock your potential", "AI therapist", "diagnose burnout", "mental health score", "productivity personality", "dopamine detox", "crush your goals".

Use language:

- "Your browser is carrying too many open loops."
- "This looks like research turning into avoidance."
- "Deadline pressure is mixing with distraction tabs."
- "Try a 6-minute reset before continuing."

Avoid UI patterns:

- Generic purple gradients, blob backgrounds, animated wellness mascots, fake chat bubbles, giant marketing hero, cluttered analytics dashboards, clinical-looking medical charts.

Ground the AI/useful analysis:

- Show the evidence that produced the status.
- Let users correct categories.
- Separate deterministic signals from generated wording.
- Use concise reset steps with time estimates.
- Never imply certainty from weak signals.

## 6. Revised product direction

One-sentence pitch: Custod is a privacy-first browser warning light that detects student overload patterns from safe local signals and gives a short reset before focus collapses.

Ideal user: a high-school or college student, self-directed builder, or ADHD/focus user who often works from a chaotic browser and notices stress too late.

Top workflows:

1. Run a Chrome check during a messy work session.
2. Follow a short reset plan and park/close tabs.
3. Review trends before finals or heavy work weeks.

Core product loop: collect safe signals -> score pattern -> explain evidence -> reset -> re-check.

Retention loop: "Custod remembers my usual overload pattern and catches it earlier next time."

Privacy promise: Custod does not read page contents, screenshots, cookies, messages, grades, keystrokes, or full browsing history. Raw URLs stay local unless the user explicitly saves/syncs a check.

Custod is: a pressure sensor, browser-pattern explainer, reset planner, and privacy-first history.

Custod is not: therapy, diagnosis, surveillance, parental monitoring, school monitoring, a full tab manager, or a generic AI coach.

## 7. Backend and data architecture recommendations

The current code has a Next.js app, Chrome extension, Supabase client in `lib/storage.ts`, and API routes for analyze/history/share. That is a reasonable base, but `NEXT_PUBLIC_SUPABASE_ANON_KEY` is currently used directly server-side and the README still references a local JSON fallback that the current storage implementation no longer uses. Before real users, fix the storage/auth story.

Store in backend:

- `users`: id, email hash/provider id, created_at, privacy_mode, retention_days.
- `devices`: id, user_id, platform, label, created_at, last_seen_at, sync_enabled.
- `checks`: id, user_id nullable for anonymous, device_id, created_at, status, score, top_pattern, tab_count, domain_count, started_at nullable, ended_at nullable.
- `signals`: check_id, signal_type, level, score, evidence_counts jsonb.
- `evidence_groups`: check_id, group_name, count, sample_domains jsonb, sample_titles optional/encrypted.
- `check_private_payloads`: check_id, encrypted_payload, encryption_version, expires_at.
- `shares`: slug, check_id, created_at, expires_at, revoked_at, include_raw_tabs boolean.
- `category_overrides`: user_id, domain_pattern, category, created_at.

Keep local-only by default:

- Full tab titles, full URLs, raw reflection text, per-tab favicon URLs, full session restore lists, exact active browsing timelines.

Never collect:

- Page contents, screenshots/OCR, cookies, credentials, private messages, grades, documents, keystrokes, continuous full browsing history, school account data without explicit OAuth scope review.

Sync strategy:

- MVP: anonymous/local checks for web demo; optional account later.
- V1: sync only aggregate check records by default. Offer opt-in encrypted raw evidence sync with retention controls.
- Use device-generated IDs and idempotency keys for extension submissions.
- Add delete/export endpoints before accounts launch.

Analytics strategy:

- No third-party analytics in MVP.
- If needed, use server-side aggregate counters only: check_created, status_bucket, platform, error_code. No titles, URLs, reflection, user-agent fingerprinting, or session replay.

Local-first vs cloud-first:

- Recommend local-first scoring for extension/macOS/iOS, cloud-optional history. This matches the privacy promise and reduces backend risk.

Provider tradeoffs:

- Supabase: best fit for auth, Postgres, row-level security, quick Vercel integration. Use service role only server-side, RLS for user data, migrations for schema.
- Firebase: fast auth/sync, but document modeling and privacy optics are weaker for structured evidence/audits.
- Cloudflare: strong edge/privacy story and Workers/D1/R2, but more custom auth/data plumbing.
- Vercel: good hosting/API route fit, not durable data by itself.

API route plan:

- `POST /api/checks/analyze`: accepts sanitized snapshot, returns analysis, optional persistence.
- `GET /api/checks`: authenticated list of aggregate checks.
- `GET /api/checks/:id`: owner-only detail.
- `DELETE /api/checks/:id`: delete check.
- `POST /api/checks/:id/share`: create expiring share.
- `DELETE /api/shares/:slug`: revoke share.
- `POST /api/category-overrides`: user correction for domain category.
- `GET /api/export`: user data export.

Security risks:

- URLs can leak health, school, legal, financial, or identity details.
- Shared links can expose private tab titles.
- Public anon Supabase inserts can be abused if not protected.
- Browser extension permissions can scare users if too broad.
- Reflections are sensitive free text.

Technical-depth bar:

- Add schema migrations, RLS policies, Zod request validation, rate limiting, data retention jobs, deletion/export, idempotent submissions, typed database rows, and tests around sanitizer/scoring/storage.

## 8. UI/UX design direction

Main dashboard:

- Current status light, top pattern, score trend, "why this status" evidence, reset plan, recent checks.
- Avoid dense productivity analytics on the first screen.
- Include delete/export/share controls where users expect them.

Chrome popup:

- Tab count, one-line privacy promise, optional 3-field check-in, primary "Run check", no dashboard clutter.
- After V1, show immediate yellow/red summary in popup before opening web.

iOS app:

- Today status, optional self-check, recent pattern timeline, quiet reset timer.
- Do not promise full browser detection on iOS unless API permissions are confirmed.

macOS app:

- Menu bar status, quick scan, local baseline, optional focus mode handoff.

Visual metaphor:

- Use a restrained instrument-panel warning light, not a medical alarm and not a cute mascot. The best image is "dashboard indicator + inspection report."

Color:

- Green: muted teal/green for stable.
- Yellow: amber/ochre for building pressure.
- Red: muted coral/rust for urgent reset.
- Always pair color with text/icons for accessibility.

Motion:

- Subtle status transition, score ring fill, reduced-motion support. No floating blobs or dopamine animations.

Premium feel:

- Tight spacing, strong typography, no fake glassmorphism, no generic gradient hero, concise labels, fast loading.

## 9. Cross-platform ecosystem plan

Chrome extension role:

- Primary signal collector and fastest MVP. Current-window scan, category correction, optional park-tabs action.

iOS role:

- Self-check, trend review, reset timer, optional Screen Time integration later.

macOS role:

- Local menu bar pressure sensor with app/domain switching signals. Later than Chrome unless hackathon scoring demands native breadth.

Web dashboard role:

- Analysis detail, history, exports, shares, account/privacy controls.

Syncs:

- Aggregate check metadata, status, scores, top pattern, evidence counts, user category overrides.

Stays local:

- Raw tab titles/URLs unless explicit save/sync, raw session files, reflections by default.

Minimum ecosystem MVP:

- Chrome extension + hosted web dashboard + optional Supabase persistence. iOS/macOS should be design prototypes or later unless there is time to do them well.

## 10. Concrete feature specs

| Feature | User problem | Flow | UI placement | Required data | Backend | Difficulty | Privacy risk | Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Browser pressure check | User feels stuck but cannot see why | Click extension -> scan -> open result | Chrome popup + check page | Current-window tab title/url/active | Analyze route, optional check row | Low | Medium because URLs | Now |
| Evidence groups | User distrusts black-box score | View categories and examples | Check dashboard | Sanitized tab groups | Stored analysis json | Low | Medium | Now |
| Reset plan | User needs next action | Read 3 steps -> close/park -> recheck | Check dashboard | Top signal | None beyond analysis | Low | Low | Now |
| Park tabs suggestion | User needs relief without losing context | Suggested keep/park/close -> export/session | Result page + extension | Tab groups | Optional local export only | Medium | Medium | V1 |
| Local baseline | User wants "is this unusual for me?" | Compare current check to local history | Dashboard | Aggregate local checks | Optional aggregate sync | Medium | Low | V1 |
| Category correction | User sees wrong category | Edit domain category -> future scans improve | Evidence group row | Domain pattern/category | category_overrides | Medium | Low/medium | V1 |
| Delete/export controls | User needs trust | Delete check/export data | Dashboard/settings | Check ids | DELETE/export routes | Low/medium | Reduces risk | Now before accounts |
| Weekly pattern review | User wants trends | Open weekly summary | Dashboard/iOS | Aggregate checks | List checks | Medium | Low if aggregate | V1 |
| macOS menu status | User works outside browser | Menu bar shows local status | macOS app | App/domain switches | Optional aggregate sync | High | Medium/high | Later |
| iOS Screen Time integration | User wants phone contribution | Permission -> summary -> reset | iOS app | DeviceActivity categories | Optional aggregate sync | High | High | Later |
| Calendar deadline context | User wants deadline pressure detected | Connect calendar/LMS -> deadlines only | Settings/check | Event title/time | OAuth storage | High | High | Later |

## 11. Rubric-winning strategy

- Innovation: position as a privacy-preserving pattern detector between tab managers, blockers, and mood apps.
- Impact: focus on students who miss early burnout signals and need lightweight intervention.
- Technical complexity: local-first extension scan, deterministic scoring, Supabase schema/RLS, share/export/delete, cross-platform architecture plan.
- UI/UX: one-screen status, evidence, reset, trend. No generic dashboard bloat.
- Theme fit: "check engine light" is concrete and demoable.
- Practicality: Chrome + web MVP is shippable; iOS/macOS are staged, not fake.
- Demo ability: show messy browser -> run scan -> yellow/red pattern -> reset plan -> park tabs -> recheck improves.

## 12. Execution plan: Claude Code and Codex

Order:

1. Claude Code: refine product architecture, information architecture, design system, and dashboard/popup UX spec.
2. Codex: fix current storage/env mismatch, add validation/tests, and tighten extension API wiring.
3. Claude Code: implement polished dashboard and popup UI against existing data contract.
4. Codex: add delete/export/share safety, Supabase schema/RLS, build/lint/typecheck, Vercel deployment fixes.
5. Claude Code: final UX pass and demo script.
6. Codex: packaging, extension build, deployment verification, bug fixes.

Claude Code should own:

- Product architecture, UI system, dashboard design, cross-platform design decisions, backend model planning, complex multi-file app structure, deep UX polish.

Claude Code should not touch:

- Deployment credentials, production database secrets, branch/PR operations, package manager churn unless required.

Codex should own:

- Focused implementation tasks, Chrome extension wiring, API integration fixes, build errors, deployment/Vercel setup, CLI work, tests, packaging, troubleshooting.

Codex should not touch:

- Broad redesigns, speculative feature expansion, fake iOS/macOS implementations, AI chat/wellness features, git commit/push/PR unless explicitly requested.

Prevent duplicated work:

- Keep a single `docs/implementation-plan.md` task board.
- Freeze shared contracts in `lib/types.ts` before UI/backend split.
- Use small PR-sized diffs even without PRs.
- One agent owns a file at a time.
- Codex verifies after Claude UI changes; Claude reviews UX after Codex backend changes.

## Ready-to-use prompts

Claude Code prompt:

```text
You are working in /Users/nihar/Desktop/Custod. Read docs/custod-research-and-product-strategy.md, README.md, lib/types.ts, lib/analyzer.ts, components/BurnoutDashboard.tsx, extension/src/popup/Popup.tsx, and app/globals.css before editing. Improve the product architecture and UX without changing the core privacy promise. Focus on a production-ready Chrome extension + web dashboard MVP: one-click browser pressure check, evidence-backed status, reset plan, recent trend, privacy controls. Do not add AI therapist/chat features, fake data, telemetry, external APIs, iOS/macOS placeholder code, or unrelated redesigns. Keep diffs focused and run npm run typecheck, npm run lint, and npm run build if available.
```

Codex prompt:

```text
You are working in /Users/nihar/Desktop/Custod. Follow AGENTS.md instructions. Read docs/custod-research-and-product-strategy.md and inspect relevant files before editing. Own focused implementation and verification: fix storage/env mismatches, add schema/validation/tests where appropriate, wire Chrome extension API behavior, add delete/export/share safety, and make builds pass. Do not redesign the UI broadly, add telemetry, collect page contents, implement fake iOS/macOS apps, commit, push, or create PRs unless explicitly asked. Before final response, run npm run typecheck, npm run lint, npm run build, and extension build if touched.
```
