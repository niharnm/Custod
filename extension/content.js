// content.js — frustration signal detector.
// PRIVACY: This never logs keystrokes or content. It only counts rapid
// Backspace presses inside text fields and reports a burst count.
(function () {
  "use strict";

  const WINDOW_MS = 3000; // 3-second window
  const BURST_THRESHOLD = 5; // >= 5 backspaces in window => frustration
  let backspaceTimes = [];

  function isTextField(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      // Treat typical text-ish inputs as fields; ignore checkboxes/buttons/etc.
      return ["text", "search", "email", "url", "password", "tel", ""].includes(type);
    }
    if (el.isContentEditable) return true;
    return false;
  }

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Backspace") return;
      if (!isTextField(e.target)) return;

      const now = Date.now();
      backspaceTimes.push(now);
      // Trim to the last WINDOW_MS.
      backspaceTimes = backspaceTimes.filter((t) => now - t <= WINDOW_MS);

      if (backspaceTimes.length >= BURST_THRESHOLD) {
        try {
          chrome.runtime.sendMessage({ type: "frustration_event" });
        } catch (_) {
          /* extension context may be invalidated on reload */
        }
        backspaceTimes = []; // reset after reporting
      }
    },
    true
  );
})();
