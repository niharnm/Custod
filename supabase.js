// supabase.js — shared Supabase helpers using raw fetch (no npm, no bundler).

export const SUPABASE_URL = "https://vdzugcxkqzfauaywiria.supabase.co";
export const SUPABASE_KEY = "sb_publishable_TNHK5xvMnBTUtyZICiFRQA_-W6qxTC5";

const AUTH_STORAGE_KEY = "authSession";
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export const ENDPOINTS = {
  sessions: SUPABASE_URL + "/rest/v1/browsing_sessions",
  visits: SUPABASE_URL + "/rest/v1/site_visits",
  readings: SUPABASE_URL + "/rest/v1/browser_readings",
  score: SUPABASE_URL + "/functions/v1/score"
};

function apiHeaders(token) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + (token || SUPABASE_KEY)
  };
}

function authHeaders(token) {
  return apiHeaders(token);
}

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function sessionFromAuthResponse(data) {
  if (!data || !data.access_token) return null;
  const payload = decodeJwtPayload(data.access_token);
  const expiresAt =
    typeof data.expires_at === "number"
      ? data.expires_at * 1000
      : Date.now() + (data.expires_in || 3600) * 1000;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    user: data.user || (payload ? { id: payload.sub, email: payload.email } : null)
  };
}

export async function saveAuthSession(session) {
  await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session });
}

export async function getAuthSession() {
  const stored = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  return stored[AUTH_STORAGE_KEY] || null;
}

export async function clearAuthSession() {
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

async function authFetch(path, options = {}) {
  const res = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...apiHeaders(),
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (_) {
      body = { message: text };
    }
  }
  if (!res.ok) {
    const message =
      (body && (body.msg || body.message || body.error_description || body.error)) ||
      "Auth request failed";
    return { ok: false, error: message, status: res.status };
  }
  return { ok: true, data: body };
}

export async function signUp(email, password) {
  const result = await authFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  if (!result.ok) return result;
  const session = sessionFromAuthResponse(result.data);
  if (!session) {
    if (result.data && result.data.user) {
      return { ok: true, session: null, needsConfirmation: true };
    }
    return { ok: false, error: "Sign up succeeded but no session was returned." };
  }
  await saveAuthSession(session);
  return { ok: true, session };
}

export async function signIn(email, password) {
  const result = await authFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  if (!result.ok) return result;
  const session = sessionFromAuthResponse(result.data);
  if (!session) return { ok: false, error: "Sign in succeeded but no session was returned." };
  await saveAuthSession(session);
  return { ok: true, session };
}

export async function refreshAccessToken(refreshToken) {
  const result = await authFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!result.ok) return result;
  const session = sessionFromAuthResponse(result.data);
  if (!session) return { ok: false, error: "Token refresh failed." };
  const prev = await getAuthSession();
  if (prev && prev.refresh_token && !session.refresh_token) {
    session.refresh_token = prev.refresh_token;
  }
  if (prev && prev.user && !session.user) {
    session.user = prev.user;
  }
  await saveAuthSession(session);
  return { ok: true, session };
}

export async function signOut() {
  const session = await getAuthSession();
  if (session && session.access_token) {
    try {
      await fetch(SUPABASE_URL + "/auth/v1/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders(session.access_token)
        },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
    } catch (_) {
      /* best-effort */
    }
  }
  await clearAuthSession();
  return { ok: true };
}

export async function getValidAccessToken() {
  const session = await getAuthSession();
  if (!session || !session.access_token) return null;
  if (session.expires_at && Date.now() >= session.expires_at - REFRESH_BUFFER_MS) {
    if (!session.refresh_token) {
      await clearAuthSession();
      return null;
    }
    const refreshed = await refreshAccessToken(session.refresh_token);
    if (!refreshed.ok) {
      await clearAuthSession();
      return null;
    }
    return refreshed.session.access_token;
  }
  return session.access_token;
}

export async function getAuthUserId() {
  const session = await getAuthSession();
  if (session && session.user && session.user.id) return session.user.id;
  const token = await getValidAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload && payload.sub ? payload.sub : null;
}

// POST a payload to a Supabase endpoint (REST table or Edge Function).
// Pass accessToken for authenticated inserts under RLS.
export async function postToSupabase(endpoint, payload, accessToken, prefer = "return=minimal") {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: prefer,
        ...authHeaders(accessToken)
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn("[BurnoutCheck] postToSupabase non-OK:", res.status, endpoint);
      return null;
    }
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_) {
      return {};
    }
  } catch (err) {
    console.warn("[BurnoutCheck] postToSupabase failed:", err && err.message);
    return null;
  }
}

// PATCH a row via Supabase REST.
export async function patchToSupabase(endpoint, filterQuery, payload, accessToken) {
  try {
    const url = endpoint + "?" + filterQuery;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        ...authHeaders(accessToken)
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn("[BurnoutCheck] patchToSupabase non-OK:", res.status, url);
      return null;
    }
    return {};
  } catch (err) {
    console.warn("[BurnoutCheck] patchToSupabase failed:", err && err.message);
    return null;
  }
}

// GET from a Supabase REST endpoint. Returns parsed JSON (array) or null on error.
export async function getFromSupabase(endpoint, accessToken) {
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: authHeaders(accessToken)
    });
    if (!res.ok) {
      console.warn("[BurnoutCheck] getFromSupabase non-OK:", res.status, endpoint);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[BurnoutCheck] getFromSupabase failed:", err && err.message);
    return null;
  }
}
