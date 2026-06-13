# Custod extension

A Manifest V3 Chrome extension that reads the current window's open tabs
(titles and URLs only) to surface early burnout patterns. It never reads page
contents, cookies, or browsing history.

## Popup features

- **Scan now** — reads the current window's http/https tabs and POSTs them
  directly to the web app (`POST /api/scans`, JSON body `{ tabs }`). Requests
  carry an anonymous device id in the `X-Custod-Device` header; the id is a
  UUID generated once and persisted in `chrome.storage.local` under
  `custod-device-id`. On success the popup shows a calm green/yellow/red status
  light, the score, the main pattern, and a one-sentence explanation, plus an
  **Open full analysis** link to `${WEB_APP_URL}/scan/${scanId}`.
- **Park distraction tabs** — preserve-before-close. It first saves the title
  and URL of each tab it is about to close into `chrome.storage.local` (key
  `custod-parked-tabs`), then closes them. Only tabs whose domain is in the
  distraction list (youtube.com, tiktok.com, instagram.com, reddit.com, x.com,
  twitter.com, netflix.com, twitch.tv) are eligible, and the active tab is
  never closed. A **Parked tabs** list lets you **Reopen** any saved tab or
  **Clear** the list — nothing is ever lost.
- **Mood check-in / Run burnout check** — the existing optional flow
  (`POST /api/analyze`), tucked into a collapsible section.
- **Import-from-web bridge** — the content script still answers the web app's
  `CUSTOD_REQUEST_CURRENT_TABS` postMessage handshake unchanged.

## Privacy

Only tab `title`, `url`, and `active` flag leave the browser. No page contents,
cookies, or history. Permissions are kept minimal: `tabs` and `storage`.
`host_permissions` are scoped to the web app origins, with the production
domain (`https://custod.app/*`) as the documented default alongside
`http://localhost:3000/*` for local development.

## Build

```bash
npm install
VITE_WEB_APP_URL=http://localhost:3000 npm run build
```

The web app base URL comes from `VITE_WEB_APP_URL` (default
`http://localhost:3000`). Omit it to build against the production default. The
built, loadable extension is written to `dist/` (load it via
`chrome://extensions` → "Load unpacked").
