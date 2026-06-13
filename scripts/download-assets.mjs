#!/usr/bin/env node
/**
 * Download assets from cluely.com for the clone.
 * Usage: node scripts/download-assets.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://cluely.com";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

const ASSETS = [
  "/wordmark-light.svg",
  "/wordmark.svg",
  "/logo.svg",
  "/images/pages/home/background.png",
  "/images/pages/home/background@2x.png",
  "/images/pages/home/launchpad-icon.png",
  "/images/pages/home/safari-icon.png",
  "/images/pages/home/settings-icon.png",
  "/images/pages/home/zoom-icon.png",
  "/images/pages/home/cluely-icon.png",
  "/images/pages/home/trash-icon.png",
  "/_next/static/media/wallpaper@2x.b7df867c.png",
  "/_next/static/media/command-btn.05a11379.png",
  "/_next/static/media/command-active.83241958.png",
  "/_next/static/media/return-btn.f7f71a9d.png",
  "/_next/static/media/return-active.30ff0cd8.png",
  "/_next/static/media/apple.9854bb2c.svg",
  "/_next/static/media/windows.47b8106d.svg",
  "/_next/static/media/shimmer.aeaeb2f7.png",
  "/_next/static/media/mobile-notes.5dc13f8d.png",
  "/_next/static/media/tablet-notes.5560bad7.png",
  "/_next/static/media/desktop-notes-2.8614c68b.png",
  "/_next/static/media/invisible-tool.452f4abe.png",
  "/_next/static/media/cluely.7e226633.svg",
  "/_next/static/media/eye.79b67e64.svg",
  "/_next/static/media/gina-huels.b14409cf.png",
  "/_next/static/media/todd-cremin.9cbbdf9c.png",
  "/_next/static/media/holly-gleason.528905fb.png",
  "/_next/static/media/tomas-hansen.5f58da3e.png",
  "/_next/static/media/bg-blue.825b2efd.jpg",
  "/_next/static/media/bg-pink.1696fade.jpg",
  "/_next/static/media/bg-purple-dark.58e0b5e1.jpg",
  "/_next/static/media/bg-purple.449cf71b.jpg",
  "/_next/static/media/file-browser-card.8990f1d2.png",
  "/_next/static/media/messaging-card.f1bfaf57.png",
  "/_next/static/media/video-conference-card.26ec85da.png",
  "/_next/static/media/video-player-card.9b7a7f86.png",
  "/_next/static/media/zoom.398e9568.png",
  "/_next/static/media/slack.0e754017.png",
  "/_next/static/media/webex.6e65e4a4.png",
  "/_next/static/media/teams.845b90a5.png",
  "/_next/static/media/meet.7640c976.png",
  "/_next/static/media/transcript-tab.1c48d5b2.png",
  "/favicon/light/favicon.png",
  "/favicon/light/favicon-180x180.png",
  "/videos/home/hero-v2/pro-res-hevc-safari.mp4",
  "/videos/home/hero-v2/pro-res-vp9-chrome.webm",
];

async function download(path) {
  const url = `${BASE}${path}`;
  const dest = join(PUBLIC, "images/cluely", path.replace(/^\//, ""));
  await mkdir(dirname(dest), { recursive: true });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`✓ ${path}`);
    return true;
  } catch (err) {
    console.error(`✗ ${path}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("Downloading cluely.com assets...\n");
  let ok = 0;
  let fail = 0;

  const batchSize = 4;
  for (let i = 0; i < ASSETS.length; i += batchSize) {
    const batch = ASSETS.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(download));
    ok += results.filter(Boolean).length;
    fail += results.filter((r) => !r).length;
  }

  console.log(`\nDone: ${ok} succeeded, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
