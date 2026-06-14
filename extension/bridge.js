// bridge.js — web → extension sign-in bridge.
// Runs only on the Custod web app (see manifest content_scripts match). When the
// site's /extension/connect page hands us the signed-in Supabase session via
// window.postMessage, we relay it to the background, which validates the refresh
// token against Supabase before adopting it — so a page can't forge a session.
// Then we post an ACK so the web page can show "Extension connected".
(function () {
  "use strict";

  const EXTENSION_SOURCE = "custod-extension";
  const WEB_SOURCE = "custod-web";
  const AUTH_SESSION = "CUSTOD_AUTH_SESSION";
  const AUTH_SESSION_ACK = "CUSTOD_AUTH_SESSION_ACK";
  const RUN_CHECK = "CUSTOD_RUN_CHECK";
  const RUN_CHECK_RESULT = "CUSTOD_RUN_CHECK_RESULT";

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== WEB_SOURCE) return;

    if (data.type === AUTH_SESSION) {
      if (!data.access_token || !data.refresh_token) return;
      chrome.runtime.sendMessage(
        {
          type: "external_session",
          access_token: data.access_token,
          refresh_token: data.refresh_token
        },
        (res) => {
          const ok = !chrome.runtime.lastError && res && res.ok;
          window.postMessage(
            { source: EXTENSION_SOURCE, type: AUTH_SESSION_ACK, ok: !!ok },
            event.origin
          );
        }
      );
      return;
    }

    if (data.type === RUN_CHECK) {
      chrome.runtime.sendMessage(
        {
          type: "external_run_check",
          refresh_token: data.refresh_token
        },
        (res) => {
          const ok = !chrome.runtime.lastError && res && res.ok;
          window.postMessage(
            {
              source: EXTENSION_SOURCE,
              type: RUN_CHECK_RESULT,
              requestId: data.requestId,
              ok: !!ok,
              error: ok ? null : (res && res.error) || "extension_unavailable",
              scan: ok ? res.scan : null
            },
            event.origin
          );
        }
      );
    }
  });
})();
