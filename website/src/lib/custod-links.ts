/** Canonical download + product links for Custod. */
export const LINKS = {
  // Chrome Web Store listing (placeholder until published). Falls back to the
  // in-app /download page with manual load instructions.
  chromeExtension: "/download#chrome",
  check: "/check",
  // macOS app download (coming soon → /download page).
  macApp: "/download#mac",
  download: "/download",
  login: "/login",
  dashboard: "/dashboard",
  github: "https://github.com/niharnm/Custod",
} as const;
