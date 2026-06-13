# Custod

Custod is a privacy-first, cross-platform check engine light for burnout. It combines browser, computer, phone, and desk signals into one green, yellow, or red status so students and young professionals can notice risky patterns before they crash.

Custod is not therapy, a medical device, or a mental health chatbot. It is an informational signal layer.

## What It Uses

- Browser metadata: tab counts, tab titles, URLs, switching rate, session length, and derived focus signals.
- Computer signals: active app patterns, late-night usage, session length, and local blink-rate measurements.
- Phone signals: HealthKit and motion signals when the user grants permission.
- Desk signals: posture and environment data from the hardware companion.

Custod does not read page contents, messages, emails, passwords, keystrokes, screenshots, or stored video.

## Web App

The deployed web app is a Next.js app under `src/`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run check
```

## Routes

- `/` - public marketing site
- `/privacy` - privacy policy
- `/terms` - terms of service
- `/login` - Supabase email/password login
- `/dashboard` - gated dashboard shell
- `/download` - extension and app download entry point

## Repo Layout

```text
src/          Next.js website and shared web components
extension/    Chrome extension source
macos/        macOS app source
supabase/     Supabase schema and database setup
docs/         Product, architecture, API, and privacy notes
```

## Deployment

Production is deployed from `master` to Vercel. Push only verified changes.

Before pushing:

```bash
npm run check
```

## License

MIT
