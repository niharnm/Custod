/** Canonical contact address for privacy, support, and data requests. */
export const CONTACT_EMAIL = "nihar.manchikalapudi@gmail.com";

/** Canonical download + product links for Custod. */
export const LINKS = {
  // Chrome Web Store listing (placeholder until published). Falls back to the
  // in-app /download page with manual load instructions.
  chromeExtension: "/download#chrome",
  // macOS app download (coming soon → /download page).
  macApp: "/download#mac",
  download: "/download",
  login: "/login",
  dashboard: "/dashboard",
  github: "https://github.com/niharnm/Custod",
  // Legal + support pages.
  privacy: "/privacy",
  terms: "/terms",
  support: "/support",
  contact: `mailto:${CONTACT_EMAIL}`,
} as const;
