// content.js — intentionally a no-op.
//
// PRIVACY: Custod does NOT read keystrokes, page contents, form values, or any
// on-page text. An earlier build counted rapid Backspace presses as a
// "frustration" signal; that was removed because listening to keyboard input —
// even just counting one key, and even on password fields — is incompatible
// with Custod's privacy promise and is never worth the weak signal it gave.
//
// Custod's burnout signals come only from safe, aggregate browser metadata
// (tab counts, tab switch rate, active-browsing time, distraction-domain
// ratio) collected in background.js. No content script needs to run on the
// page, so this file deliberately does nothing. It is kept (rather than
// deleted) only to avoid breaking any cached manifest reference during an
// in-place reload.
