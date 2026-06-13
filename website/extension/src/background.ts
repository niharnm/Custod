import { collectTabs } from "./lib/collectTabs";

const COLLECT_CURRENT_TABS = "CUSTOD_COLLECT_CURRENT_TABS";

type Message = {
  type?: string;
  requestId?: string;
};

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message?.type !== COLLECT_CURRENT_TABS) return false;

  collectTabs()
    .then((tabs) => sendResponse({ ok: true, requestId: message.requestId, tabs }))
    .catch((caught) =>
      sendResponse({
        ok: false,
        requestId: message.requestId,
        error: caught instanceof Error ? caught.message : "Unable to read current-window tabs."
      })
    );

  return true;
});
