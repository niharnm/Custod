// background.js — BurnoutCheck service worker.
// Collects tab-behavior signals, scores them, logs site visits in hourly
// sessions when authenticated, updates the badge, and answers popup queries.
//
// PRIVACY: Reads tab counts, URLs, titles and timing only. Never page content.

import {
  postToSupabase,
  patchToSupabase,
  signUp,
  signIn,
  signOut,
  getValidAccessToken,
  getAuthUserId,
  getAuthSession,
  getFromSupabase,
  ENDPOINTS
} from "./supabase.js";

const HOUR_MS = 60 * 60 * 1000;
const VISIT_DEDUPE_MS = 30 * 1000;

const DISTRACTION_DOMAINS = [
  "youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "instagram.com",
  "tiktok.com",
  "netflix.com",
  "twitch.tv",
  "facebook.com",
  "discord.com"
];

const STRESS_KEYWORDS = [
  "deadline",
  "extension",
  "late",
  "overdue",
  "urgent",
  "stuck",
  "help",
  "how to",
  "when is",
  "am i",
  "can't",
  "cannot",
  "failing",
  "behind",
  "missed",
  "forgot",
  "procrastinat"
];

let tabSwitchEvents = [];
let lastActiveTabId = null;
let lastSwitchMs = 0;
const lastTitleByTab = {};
const SWITCH_DEBOUNCE_MS = 500;
let sessionStart = Date.now();
let lastDistractionMs = null;
let frustrationCount = 0;

// --- Real active-browsing time (the "screen time" number) -------------------
// The old "session minutes" just measured how long the browser had been open,
// which is wrong — it kept climbing even while you were in another app, idle,
// or away from the keyboard. Instead we accumulate the time you're *actually*
// using the browser: a Chrome window is focused AND you're not system-idle.
// The running total is kept per local day and persisted, so it survives the
// MV3 service worker being torn down and respawned (which happens constantly).
const ACTIVE_IDLE_SECONDS = 60;          // idle longer than this => not active
const ACTIVE_MAX_GAP_MS = 90 * 1000;     // cap a single accounting gap (sleep/SW death)
let activeDayKey = "";
let activeMsToday = 0;
let lastAccountedAt = 0;
let browserFocused = true;

function localDayKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function activeMinutesToday() {
  return Math.max(0, Math.round(activeMsToday / 60000));
}

let currentSessionId = null;
let sessionStartedAt = null;
let lastVisitUrl = null;
let lastVisitAt = 0;

(async function rehydrate() {
  try {
    const stored = await chrome.storage.local.get([
      "sessionStart",
      "lastDistractionMs",
      "frustrationCount",
      "tabSwitchEvents",
      "currentSessionId",
      "sessionStartedAt",
      "activeDayKey",
      "activeMsToday",
      "lastAccountedAt"
    ]);
    if (typeof stored.sessionStart === "number") sessionStart = stored.sessionStart;
    if (typeof stored.lastDistractionMs === "number") lastDistractionMs = stored.lastDistractionMs;
    if (typeof stored.frustrationCount === "number") frustrationCount = stored.frustrationCount;
    if (Array.isArray(stored.tabSwitchEvents)) tabSwitchEvents = stored.tabSwitchEvents;
    if (typeof stored.currentSessionId === "string") currentSessionId = stored.currentSessionId;
    if (typeof stored.sessionStartedAt === "number") sessionStartedAt = stored.sessionStartedAt;
    if (typeof stored.activeDayKey === "string") activeDayKey = stored.activeDayKey;
    if (typeof stored.activeMsToday === "number") activeMsToday = stored.activeMsToday;
    if (typeof stored.lastAccountedAt === "number") lastAccountedAt = stored.lastAccountedAt;
  } catch (e) {
    console.warn("[BurnoutCheck] rehydrate failed:", e && e.message);
  }

  const token = await getValidAccessToken();
  if (token) {
    await ensureHourlySession();
  }

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (activeTab && activeTab.id != null) {
      lastActiveTabId = activeTab.id;
      if (activeTab.title) lastTitleByTab[activeTab.id] = activeTab.title;
    }
  } catch (_) {}

  // Establish current focus and a fresh accounting anchor so the respawned
  // worker doesn't credit (or lose) the time it was asleep.
  browserFocused = await isBrowserFocused();
  lastAccountedAt = Date.now();
  await accountActiveTime();
})();

async function persistVolatile() {
  try {
    await chrome.storage.local.set({
      sessionStart,
      lastDistractionMs,
      frustrationCount,
      tabSwitchEvents,
      currentSessionId,
      sessionStartedAt,
      activeDayKey,
      activeMsToday,
      lastAccountedAt
    });
  } catch (e) {
    /* storage best-effort */
  }
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return "";
  }
}

function isDistraction(url) {
  const host = hostnameOf(url);
  if (!host) return false;
  return DISTRACTION_DOMAINS.some((d) => host === d || host.endsWith("." + d));
}

function matchesStressKeyword(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return STRESS_KEYWORDS.some((kw) => lower.includes(kw));
}

function statusFromScore(score) {
  if (score <= 33) return "green";
  if (score <= 66) return "yellow";
  return "red";
}

function recordSwitch() {
  const now = Date.now();
  if (now - lastSwitchMs < SWITCH_DEBOUNCE_MS) return;
  lastSwitchMs = now;
  tabSwitchEvents.push(now);
  persistVolatile();
}

function computeSwitchRatePerMin(now = Date.now()) {
  const fiveMinAgo = now - 5 * 60 * 1000;
  const switchesLast5 = tabSwitchEvents.filter((ts) => ts >= fiveMinAgo).length;
  return Math.round((switchesLast5 / 5) * 100) / 100;
}

function computeSessionMinutes(now = Date.now()) {
  if (sessionStartedAt) {
    return Math.max(0, Math.round((now - sessionStartedAt) / 60000));
  }
  return Math.max(0, Math.round((now - sessionStart) / 60000));
}

function isTrackableUrl(url) {
  if (!url) return false;
  return !(
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://") ||
    url.startsWith("devtools://")
  );
}

function registerAlarms() {
  chrome.alarms.create("collectAndScore", { periodInMinutes: 5 });
  chrome.alarms.create("pruneState", { periodInMinutes: 1 });
  chrome.alarms.create("sessionCheck", { periodInMinutes: 1 });
  chrome.alarms.create("activityTick", { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
  sessionStart = Date.now();
  lastDistractionMs = null;
  frustrationCount = 0;
  tabSwitchEvents = [];
  persistVolatile();
  registerAlarms();
  collectAndScore();
});

chrome.runtime.onStartup.addListener(async () => {
  sessionStart = Date.now();
  tabSwitchEvents = [];
  persistVolatile();
  registerAlarms();
  collectAndScore();
  const token = await getValidAccessToken();
  if (token) await ensureHourlySession();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (activeInfo.tabId !== lastActiveTabId) {
    recordSwitch();
    lastActiveTabId = activeInfo.tabId;
  }
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.title) lastTitleByTab[activeInfo.tabId] = tab.title;
    if (tab && isDistraction(tab.url || tab.pendingUrl || "")) {
      lastDistractionMs = Date.now();
    }
  } catch (_) {
    /* tab may have closed */
  }
  persistVolatile();
});

// Count title and URL changes on the active tab (SPAs, in-tab navigation).
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab || !tab.active) return;

  if (changeInfo.url && isTrackableUrl(changeInfo.url)) {
    recordSwitch();
    return;
  }

  if (changeInfo.title) {
    const prev = lastTitleByTab[tabId];
    const next = changeInfo.title.trim();
    if (prev && next && prev !== next) {
      recordSwitch();
    }
    if (next) lastTitleByTab[tabId] = next;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete lastTitleByTab[tabId];
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "collectAndScore") {
    collectAndScore();
  } else if (alarm.name === "activityTick") {
    accountActiveTime();
  } else if (alarm.name === "pruneState") {
    pruneState();
  } else if (alarm.name === "sessionCheck") {
    checkHourlySession();
  } else if (alarm.name === "focusEnd") {
    showSimpleNotification("Focus session complete", "Nice work. Your 20-minute focus block is done.");
  } else if (alarm.name === "stopTime") {
    showSimpleNotification("Time to stop", "It's your stop time. Close the laptop — tomorrow you'll thank yourself.");
  }
});

function pruneState() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  tabSwitchEvents = tabSwitchEvents.filter((ts) => ts >= cutoff);
  persistVolatile();
}

// ---------------------------------------------------------------------------
// Active-browsing time accounting (real "screen time")
// ---------------------------------------------------------------------------

// Whether a Chrome window currently holds OS focus. Updated by the focus
// listener, but we also re-check on demand so a torn-down service worker that
// just respawned doesn't trust a stale value.
async function isBrowserFocused() {
  try {
    const win = await chrome.windows.getLastFocused();
    return !!(win && win.focused);
  } catch (_) {
    return false;
  }
}

// Credit the elapsed time to "today" when the user was actually browsing:
// a Chrome window focused AND the system not idle/locked. Called on a 1-minute
// alarm and whenever focus/idle state changes.
async function accountActiveTime() {
  const now = Date.now();
  const key = localDayKey(now);

  if (key !== activeDayKey) {
    // New day (or first run): start a fresh total, don't backfill the gap.
    activeDayKey = key;
    activeMsToday = 0;
    lastAccountedAt = now;
    await persistVolatile();
    return;
  }

  let idleState = "active";
  try {
    idleState = await chrome.idle.queryState(ACTIVE_IDLE_SECONDS);
  } catch (_) {
    /* permission missing or unavailable — assume active */
  }
  const focused = browserFocused && (await isBrowserFocused());
  const active = focused && idleState === "active";

  const elapsed = lastAccountedAt ? Math.min(now - lastAccountedAt, ACTIVE_MAX_GAP_MS) : 0;
  if (active && elapsed > 0) {
    activeMsToday += elapsed;
  }
  lastAccountedAt = now;
  await persistVolatile();
}

chrome.windows.onFocusChanged.addListener((windowId) => {
  // Close the books on the prior interval before changing focus state, so the
  // time up to this moment is credited under the old (correct) condition.
  accountActiveTime().finally(() => {
    browserFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
    lastAccountedAt = Date.now();
    persistVolatile();
  });
});

try {
  chrome.idle.setDetectionInterval(ACTIVE_IDLE_SECONDS);
  chrome.idle.onStateChanged.addListener(() => {
    accountActiveTime();
  });
} catch (_) {
  /* idle API unavailable */
}

// ---------------------------------------------------------------------------
// Hourly browsing sessions (Supabase)
// ---------------------------------------------------------------------------
async function ensureHourlySession() {
  const token = await getValidAccessToken();
  const userId = await getAuthUserId();
  if (!token || !userId) return null;

  const now = Date.now();
  if (currentSessionId && sessionStartedAt && now - sessionStartedAt < HOUR_MS) {
    return currentSessionId;
  }

  if (currentSessionId) {
    await closeHourlySession(currentSessionId, token);
  }

  const row = {
    user_id: userId,
    started_at: new Date(now).toISOString()
  };
  const created = await postToSupabase(
    ENDPOINTS.sessions,
    row,
    token,
    "return=representation"
  );

  if (created && created.id) {
    currentSessionId = created.id;
  } else if (Array.isArray(created) && created[0] && created[0].id) {
    currentSessionId = created[0].id;
  } else {
    const rows = await getFromSupabase(
      ENDPOINTS.sessions +
        "?select=id&ended_at=is.null&order=started_at.desc&limit=1",
      token
    );
    if (rows && rows[0] && rows[0].id) {
      currentSessionId = rows[0].id;
    } else {
      console.warn("[BurnoutCheck] failed to create hourly session");
      return null;
    }
  }

  sessionStartedAt = now;
  await persistVolatile();
  return currentSessionId;
}

async function closeHourlySession(sessionId, token) {
  if (!sessionId || !token) return;
  await patchToSupabase(
    ENDPOINTS.sessions,
    "id=eq." + encodeURIComponent(sessionId),
    { ended_at: new Date().toISOString() },
    token
  );
}

async function checkHourlySession() {
  const token = await getValidAccessToken();
  if (!token) return;
  await ensureHourlySession();
}

async function clearLocalHourlySession() {
  currentSessionId = null;
  sessionStartedAt = null;
  await persistVolatile();
}

async function onAuthSignedIn() {
  await ensureHourlySession();
}

async function onAuthSignedOut() {
  const token = await getValidAccessToken();
  if (currentSessionId && token) {
    await closeHourlySession(currentSessionId, token);
  }
  await clearLocalHourlySession();
  await signOut();
}

function getCurrentSessionId() {
  return currentSessionId;
}

// ---------------------------------------------------------------------------
// Site visit logging
// ---------------------------------------------------------------------------
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const url = details.url || "";
  if (!isTrackableUrl(url)) return;

  const token = await getValidAccessToken();
  if (!token) return;

  const sessionId = await ensureHourlySession();
  if (!sessionId) return;

  const userId = await getAuthUserId();
  if (!userId) return;

  const now = Date.now();
  if (url === lastVisitUrl && now - lastVisitAt < VISIT_DEDUPE_MS) return;
  lastVisitUrl = url;
  lastVisitAt = now;

  let title = "";
  try {
    const tab = await chrome.tabs.get(details.tabId);
    title = tab && tab.title ? tab.title : "";
  } catch (_) {
    /* tab may be gone */
  }

  postToSupabase(
    ENDPOINTS.visits,
    {
      user_id: userId,
      session_id: sessionId,
      url,
      title,
      visited_at: new Date(now).toISOString()
    },
    token
  );
});

// ---------------------------------------------------------------------------
// Core: collect signals, score, store, badge, notify
// ---------------------------------------------------------------------------
async function collectAndScore() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch (e) {
    console.warn("[BurnoutCheck] tabs.query failed:", e && e.message);
  }

  const now = Date.now();
  const tab_count = tabs.length;

  let distraction_count = 0;
  let stress_search_count = 0;
  const urlCounts = {};

  for (const t of tabs) {
    const url = t.url || t.pendingUrl || "";
    const title = t.title || "";
    if (isDistraction(url)) distraction_count++;
    if (matchesStressKeyword(title) || matchesStressKeyword(url)) stress_search_count++;
    if (url) urlCounts[url] = (urlCounts[url] || 0) + 1;
  }

  let duplicate_tabs = 0;
  for (const u in urlCounts) {
    if (urlCounts[u] > 1) duplicate_tabs += urlCounts[u] - 1;
  }

  const distraction_ratio =
    tab_count > 0 ? Math.round((distraction_count / tab_count) * 100) / 100 : 0;

  const switch_rate_per_min = computeSwitchRatePerMin(now);
  const spiral_mode = switch_rate_per_min > 5;

  const session_minutes = Math.max(0, Math.round((now - sessionStart) / 60000));
  const unbroken_work_min =
    lastDistractionMs != null
      ? Math.max(0, Math.round((now - lastDistractionMs) / 60000))
      : session_minutes;

  const hour_of_day = new Date().getHours();
  const late_night = hour_of_day >= 22 || hour_of_day <= 5;
  const frustration_events = frustrationCount;

  const features = {
    tab_count,
    distraction_count,
    distraction_ratio,
    duplicate_tabs,
    stress_search_count,
    switch_rate_per_min,
    spiral_mode,
    session_minutes,
    unbroken_work_min,
    late_night,
    hour_of_day,
    frustration_events,
    ts: now
  };

  const token = await getValidAccessToken();
  const userId = token ? await getAuthUserId() : null;
  const hourlySessionId = token ? getCurrentSessionId() || (await ensureHourlySession()) : null;

  if (token && userId) {
    const readingPayload = {
      ...features,
      user_id: userId,
      session_id: hourlySessionId
    };
    postToSupabase(ENDPOINTS.readings, readingPayload, token);

    let result = await postToSupabase(ENDPOINTS.score, features, token);
    if (!result || typeof result.score !== "number") {
      result = localFallbackScore(features);
    }
    await finishScoring(result, features, now);
  } else {
    const result = localFallbackScore(features);
    await finishScoring(result, features, now);
  }
}

async function finishScoring(result, features, now) {
  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  const status = result.status || statusFromScore(score);
  const triggers = Array.isArray(result.triggers) ? result.triggers : [];
  const intervention = result.intervention || "";

  let scoreHistory = [];
  try {
    const stored = await chrome.storage.local.get("scoreHistory");
    if (Array.isArray(stored.scoreHistory)) scoreHistory = stored.scoreHistory;
  } catch (_) {}
  scoreHistory.push({ score, status, ts: now });
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  scoreHistory = scoreHistory.filter((e) => e.ts >= weekAgo);

  let prevStatus = "green";
  try {
    const stored = await chrome.storage.local.get("prevStatus");
    if (stored.prevStatus) prevStatus = stored.prevStatus;
  } catch (_) {}

  await chrome.storage.local.set({
    lastScore: score,
    lastStatus: status,
    lastTriggers: triggers,
    lastIntervention: intervention,
    lastUpdated: now,
    lastSwitchRatePerMin: features.switch_rate_per_min,
    lastSessionMinutes: computeSessionMinutes(now),
    scoreHistory,
    prevStatus: status
  });

  frustrationCount = 0;
  await persistVolatile();

  updateBadge(score, status);

  if (status === "red" && prevStatus !== "red") {
    showNotification(intervention || "You're spiraling. Pick one tab and breathe.");
  }
}

function localFallbackScore(f) {
  let score = 0;

  if (f.tab_count > 20) score += 20;
  else if (f.tab_count > 10) score += 10;

  if (f.switch_rate_per_min > 5) score += 25;
  else if (f.switch_rate_per_min > 2) score += 12;

  if (f.spiral_mode) score += 15;
  if (f.distraction_ratio > 0.5) score += 15;
  if (f.stress_search_count > 2) score += 10;
  if (f.late_night) score += 10;
  if (f.frustration_events > 2) score += 5;

  score = Math.min(100, score);
  const status = statusFromScore(score);

  const triggers = [];
  if (f.tab_count > 10) triggers.push(f.tab_count + " tabs open");
  if (f.switch_rate_per_min > 2) {
    const secs = f.switch_rate_per_min > 0 ? Math.round(60 / f.switch_rate_per_min) : 0;
    triggers.push("switching every " + secs + "s");
  }
  if (f.spiral_mode) triggers.push("spiral mode");
  if (f.distraction_ratio > 0.5)
    triggers.push(Math.round(f.distraction_ratio * 100) + "% distraction tabs");
  if (f.stress_search_count > 2) triggers.push(f.stress_search_count + " stress searches");
  if (f.duplicate_tabs > 0) triggers.push(f.duplicate_tabs + " duplicate tabs");
  if (f.late_night) triggers.push("late night");
  if (f.frustration_events > 2) triggers.push("rapid backspacing");

  let intervention;
  if (status === "green") {
    intervention = "You're focused. Keep going.";
  } else if (status === "yellow") {
    if (f.spiral_mode || f.switch_rate_per_min > 2) {
      intervention = "You're getting scattered. Park the side quests and finish one thing.";
    } else if (f.tab_count > 10) {
      intervention = "Tabs are piling up. Close what you're done with.";
    } else if (f.late_night) {
      intervention = "It's late. Decide on a real stop time.";
    } else {
      intervention = "A little scattered. Take a breath and refocus.";
    }
  } else {
    if (f.spiral_mode || f.switch_rate_per_min > 5) {
      intervention = "You're not working, you're spiraling. Pick one tab.";
    } else if (f.tab_count > 20) {
      intervention = "Too many tabs. Close the noise — you can't think through this much.";
    } else if (f.late_night) {
      intervention = "It's late and you're redlining. Stop for tonight.";
    } else {
      intervention = "Burnout risk is rising. Step away for three minutes.";
    }
  }

  return { score, status, triggers, intervention };
}

function updateBadge(score, status) {
  let color = "#1D9E75";
  let text = "OK";
  if (status === "yellow") {
    color = "#BA7517";
    text = "!!";
  } else if (status === "red") {
    color = "#E24B4A";
    text = "!!";
  }
  try {
    chrome.action.setBadgeBackgroundColor({ color });
    chrome.action.setBadgeText({ text });
  } catch (_) {}
}

function showNotification(message) {
  try {
    chrome.notifications.create("burnout_red", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "BurnoutCheck",
      message: message || "Burnout risk rising. Take a reset.",
      priority: 2,
      buttons: [{ title: "Take a 3-min reset" }]
    });
  } catch (e) {
    console.warn("[BurnoutCheck] notification failed:", e && e.message);
  }
}

function showSimpleNotification(title, message) {
  try {
    chrome.notifications.create("burnout_info_" + title, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title,
      message: message,
      priority: 1
    });
  } catch (_) {}
}

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (notifId === "burnout_red" && btnIdx === 0) {
    chrome.tabs.create({ url: chrome.runtime.getURL("reset.html") });
  }
});

chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId === "burnout_red") {
    chrome.tabs.create({ url: chrome.runtime.getURL("reset.html") });
  }
});

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === "get_state") {
    const now = Date.now();
    // Refresh active-time before reading so the popup shows an up-to-the-second
    // figure, then bundle it into the response.
    accountActiveTime()
      .catch(() => {})
      .then(() =>
        chrome.storage.local.get([
          "lastScore",
          "lastStatus",
          "lastTriggers",
          "lastIntervention",
          "lastUpdated",
          "scoreHistory",
          "lastSwitchRatePerMin",
          "lastSessionMinutes"
        ])
      )
      .then((data) => {
        sendResponse({
          lastScore: data.lastScore ?? 0,
          lastStatus: data.lastStatus ?? "green",
          lastTriggers: data.lastTriggers ?? [],
          lastIntervention: data.lastIntervention ?? "",
          lastUpdated: data.lastUpdated ?? null,
          scoreHistory: data.scoreHistory ?? [],
          switchRatePerMin: computeSwitchRatePerMin(now),
          sessionMinutes: computeSessionMinutes(now),
          activeMinutesToday: activeMinutesToday(),
          switchesLast5Min: tabSwitchEvents.filter((ts) => ts >= now - 5 * 60 * 1000).length
        });
      });
    return true;
  }

  if (msg.type === "get_auth_state") {
    getAuthSession().then((session) => {
      sendResponse({
        signedIn: !!(session && session.access_token),
        email: session && session.user ? session.user.email : null
      });
    });
    return true;
  }

  if (msg.type === "sign_in") {
    signIn(msg.email, msg.password).then(async (result) => {
      if (result.ok) {
        await onAuthSignedIn();
        sendResponse({
          ok: true,
          email: result.session.user && result.session.user.email
        });
      } else {
        sendResponse({ ok: false, error: result.error });
      }
    });
    return true;
  }

  if (msg.type === "sign_up") {
    signUp(msg.email, msg.password).then(async (result) => {
      if (!result.ok) {
        sendResponse({ ok: false, error: result.error });
        return;
      }
      if (result.session && result.session.access_token) {
        await onAuthSignedIn();
        sendResponse({
          ok: true,
          email: result.session.user && result.session.user.email
        });
        return;
      }
      // No session from signup (email confirm gate) — sign in immediately instead.
      const login = await signIn(msg.email, msg.password);
      if (login.ok) {
        await onAuthSignedIn();
        sendResponse({
          ok: true,
          email: login.session.user && login.session.user.email
        });
        return;
      }
      sendResponse({
        ok: false,
        error: login.error || "Account created but sign-in failed. Try signing in."
      });
    });
    return true;
  }

  if (msg.type === "sign_out") {
    onAuthSignedOut().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "auth_signed_in") {
    onAuthSignedIn().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "frustration_event") {
    frustrationCount++;
    persistVolatile();
    return false;
  }

  if (msg.type === "force_rescore") {
    collectAndScore().then(() => sendResponse({ ok: true }));
    return true;
  }
});
