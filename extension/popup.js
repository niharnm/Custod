// popup.js — auth gate + Custod dashboard.

import { getAuthSession } from "./supabase.js";
import { DASHBOARD_URL } from "./config.js";

const COLORS = {
  green: "#1D9E75",
  yellow: "#BA7517",
  red: "#E24B4A"
};

const STATUS_TEXT = {
  green: "Focused",
  yellow: "Scattered",
  red: "Burnout risk rising"
};

let authMode = "sign_in";

document.addEventListener("DOMContentLoaded", async () => {
  bindAuthUi();
  const session = await getAuthSession();
  if (session && session.access_token) {
    showApp(session.user && session.user.email);
  } else {
    showAuth();
  }
});

function bindAuthUi() {
  const form = document.getElementById("authForm");
  const toggle = document.getElementById("authToggle");
  const logoutBtn = document.getElementById("logoutBtn");
  const googleBtn = document.getElementById("googleSignIn");

  form.addEventListener("submit", onAuthSubmit);
  toggle.addEventListener("click", () => {
    authMode = authMode === "sign_in" ? "sign_up" : "sign_in";
    updateAuthModeUi();
    clearAuthError();
  });
  logoutBtn.addEventListener("click", onLogout);
  googleBtn.addEventListener("click", onGoogleSignIn);

  const skip = document.getElementById("authSkip");
  if (skip) skip.addEventListener("click", () => showApp(null));
  const nudge = document.getElementById("nudgeSignIn");
  if (nudge) nudge.addEventListener("click", showAuth);

  const dashboard = document.getElementById("openDashboard");
  if (dashboard) {
    dashboard.addEventListener("click", () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }

  // The Custod desk device (Arduino) connects ONLY through this extension, via
  // the Web Serial API. Web Serial needs a persistent page + user gesture, which
  // a popup can't provide (it closes on blur), so we open the portal in a tab.
  const device = document.getElementById("openDevice");
  if (device) {
    device.addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("arduino.html") });
    });
  }
}

function onGoogleSignIn() {
  clearAuthError();
  const btn = document.getElementById("googleSignIn");
  btn.disabled = true;
  chrome.runtime.sendMessage({ type: "sign_in_google" }, (result) => {
    btn.disabled = false;
    if (chrome.runtime.lastError || !result) {
      showAuthError("Could not reach the extension background.");
      return;
    }
    if (!result.ok) {
      showAuthError(result.error || "Google sign-in failed.");
      return;
    }
    showApp(result.email);
  });
}

function updateAuthModeUi() {
  const title = document.getElementById("authTitle");
  const submit = document.getElementById("authSubmit");
  const toggle = document.getElementById("authToggle");
  const password = document.getElementById("authPassword");

  if (authMode === "sign_up") {
    title.textContent = "Create account";
    submit.textContent = "Sign up";
    toggle.textContent = "Already have an account? Sign in";
    password.autocomplete = "new-password";
  } else {
    title.textContent = "Sign in";
    submit.textContent = "Sign in";
    toggle.textContent = "Need an account? Create one";
    password.autocomplete = "current-password";
  }
}

function showAuthError(message) {
  const el = document.getElementById("authError");
  el.textContent = message || "";
  el.classList.toggle("hidden", !message);
}

function clearAuthError() {
  showAuthError("");
}

function showAuth() {
  document.getElementById("authView").classList.remove("hidden");
  document.getElementById("appView").classList.add("hidden");
  updateAuthModeUi();
}

function showApp(email) {
  document.getElementById("authView").classList.add("hidden");
  document.getElementById("appView").classList.remove("hidden");
  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = email || "";

  // Signed out (local-only) shows a sign-in nudge and hides the log-out button;
  // signed in shows the email + log out and hides the nudge.
  const signedIn = !!email;
  const nudge = document.getElementById("signinNudge");
  if (nudge) nudge.classList.toggle("hidden", signedIn);
  const logout = document.getElementById("logoutBtn");
  if (logout) logout.classList.toggle("hidden", !signedIn);

  loadDashboard();
}

async function onAuthSubmit(e) {
  e.preventDefault();
  clearAuthError();

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const submit = document.getElementById("authSubmit");
  submit.disabled = true;

  const type = authMode === "sign_up" ? "sign_up" : "sign_in";
  chrome.runtime.sendMessage({ type, email, password }, (result) => {
    submit.disabled = false;
    if (chrome.runtime.lastError || !result) {
      showAuthError("Could not reach the extension background.");
      return;
    }
    if (!result.ok) {
      showAuthError(result.error || "Authentication failed.");
      return;
    }
    showApp(result.email);
  });
}

function onLogout() {
  chrome.runtime.sendMessage({ type: "sign_out" }, () => {
    showAuth();
    document.getElementById("authForm").reset();
  });
}

function loadDashboard() {
  chrome.runtime.sendMessage({ type: "get_state" }, (state) => {
    if (chrome.runtime.lastError || !state) {
      renderScore(0, "green");
      renderTriggers([], "green");
      renderIntervention("");
      renderActions("green", []);
      renderSparkline([], "green");
      loadStats();
      return;
    }
    const status = state.lastStatus || "green";
    renderScore(state.lastScore ?? 0, status);
    renderTriggers(state.lastTriggers || [], status);
    renderIntervention(state.lastIntervention || "");
    renderActions(status, state.lastTriggers || []);
    renderSparkline(state.scoreHistory || [], status);
    loadStats(state);
  });
}

function colorFor(status) {
  return COLORS[status] || COLORS.green;
}

function renderScore(score, status) {
  const color = colorFor(status);

  const dot = document.getElementById("statusDot");
  if (dot) dot.style.background = color;

  const num = document.getElementById("scoreNum");
  if (num) {
    num.textContent = String(score);
    num.style.color = color;
  }

  const label = document.getElementById("statusLabel");
  if (label) label.textContent = STATUS_TEXT[status] || "—";

  const canvas = document.getElementById("ring");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 60;
  const lineWidth = 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#ededed";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const start = -Math.PI / 2;
  const end = (score / 100) * 2 * Math.PI - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

function renderTriggers(triggers, status) {
  const container = document.getElementById("triggers");
  if (!container) return;
  container.innerHTML = "";
  const color = colorFor(status);
  triggers.forEach((t) => {
    const span = document.createElement("span");
    span.className = "trigger-pill";
    span.textContent = t;
    span.style.background = color + "18";
    span.style.color = color;
    container.appendChild(span);
  });
}

function renderIntervention(text) {
  const box = document.getElementById("intervention");
  if (!box) return;
  box.textContent = text || "";
  box.style.display = text ? "block" : "none";
}

function renderActions(status, triggers) {
  const container = document.getElementById("actions");
  if (!container) return;
  container.innerHTML = "";

  const lowerTriggers = (triggers || []).map((t) => t.toLowerCase());

  if (status === "yellow" || status === "red") {
    addButton(container, "Take a 3-min reset", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("reset.html") });
      window.close();
    });
  }

  if (lowerTriggers.some((t) => t.includes("tab"))) {
    addButton(container, "Close distraction tabs", () => {
      closeDistractionTabs();
    });
  }

  if (lowerTriggers.some((t) => t.includes("switching") || t.includes("spiral"))) {
    addButton(container, "Focus for 20 minutes", () => {
      chrome.alarms.create("focusEnd", { delayInMinutes: 20 });
      window.close();
    });
  }

  if (lowerTriggers.some((t) => t.includes("late"))) {
    addButton(container, "Set a stop time (30 min)", () => {
      chrome.alarms.create("stopTime", { delayInMinutes: 30 });
      window.close();
    });
  }
}

function addButton(container, label, onClick) {
  const btn = document.createElement("button");
  btn.className = "action-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  container.appendChild(btn);
}

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

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return "";
  }
}

function closeDistractionTabs() {
  chrome.tabs.query({}, (tabs) => {
    const ids = [];
    tabs.forEach((t) => {
      const host = hostnameOf(t.url || t.pendingUrl || "");
      if (host && DISTRACTION_DOMAINS.some((d) => host === d || host.endsWith("." + d))) {
        ids.push(t.id);
      }
    });
    if (ids.length) chrome.tabs.remove(ids);
    window.close();
  });
}

function renderSparkline(history, status) {
  const canvas = document.getElementById("sparkline");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!history || history.length < 2) {
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = "#dcdcdc";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }

  const pad = 3;
  const n = history.length;
  const color = colorFor(status);

  ctx.beginPath();
  history.forEach((entry, i) => {
    const x = (i / (n - 1)) * (w - pad * 2) + pad;
    const score = Math.max(0, Math.min(100, entry.score || 0));
    const y = h - pad - (score / 100) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function loadStats(state) {
  chrome.tabs.query({}, (tabs) => {
    const el = document.getElementById("statTabs");
    if (el) el.textContent = String(tabs.length);
  });
  const switches = document.getElementById("statSwitches");
  const session = document.getElementById("statSession");
  if (switches) {
    const rate = state && typeof state.switchRatePerMin === "number" ? state.switchRatePerMin : 0;
    switches.textContent = String(rate);
  }
  if (session) {
    // Real active-browsing time today, not how long the browser's been open.
    // Fall back to the legacy session figure if an older background is loaded.
    const mins =
      state && typeof state.activeMinutesToday === "number"
        ? state.activeMinutesToday
        : state && typeof state.sessionMinutes === "number"
        ? state.sessionMinutes
        : 0;
    session.textContent = formatMinutes(mins);
  }
}

function formatMinutes(mins) {
  if (!mins || mins < 1) return "0m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
