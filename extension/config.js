// config.js — single source of truth for Custod extension endpoints.
//
// This is a plain (unbundled) MV3 extension, so there is no Vite/webpack build
// step and therefore no `import.meta.env` / `VITE_WEB_APP_URL`. The equivalent
// here is this file: edit WEB_APP_URL for local development, then reload the
// unpacked extension at chrome://extensions.
//
// Supabase config (URL + publishable key) lives in supabase.js and is the SAME
// project the web app, macOS, and iOS apps authenticate against, so signing in
// here resolves to the same Custod account everywhere.

/** Base URL of the Custod web app / dashboard. */
export const WEB_APP_URL = "https://custod.vercel.app";

/** Convenience: the dashboard route the popup's "Dashboard ↗" button opens. */
export const DASHBOARD_URL = WEB_APP_URL + "/dashboard";
