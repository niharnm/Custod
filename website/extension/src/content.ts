const WEB_SOURCE = "custod-web";
const EXTENSION_SOURCE = "custod-extension";
const REQUEST_CURRENT_TABS = "CUSTOD_REQUEST_CURRENT_TABS";
const CURRENT_TABS_RESPONSE = "CUSTOD_CURRENT_TABS_RESPONSE";
const COLLECT_CURRENT_TABS = "CUSTOD_COLLECT_CURRENT_TABS";

type TabsBridgeRequest = {
  source?: string;
  type?: string;
  requestId?: string;
};

window.addEventListener("message", (event: MessageEvent<TabsBridgeRequest>) => {
  if (event.source !== window) return;
  const request = event.data;
  if (
    request?.source !== WEB_SOURCE ||
    request.type !== REQUEST_CURRENT_TABS ||
    !request.requestId
  ) {
    return;
  }

  chrome.runtime.sendMessage(
    { type: COLLECT_CURRENT_TABS, requestId: request.requestId },
    (response) => {
      const lastError = chrome.runtime.lastError;
      window.postMessage(
        {
          source: EXTENSION_SOURCE,
          type: CURRENT_TABS_RESPONSE,
          requestId: request.requestId,
          ok: !lastError && Boolean(response?.ok),
          tabs: response?.tabs ?? [],
          error:
            lastError?.message ||
            response?.error ||
            "Custod could not read the current browser window."
        },
        window.location.origin
      );
    }
  );
});
