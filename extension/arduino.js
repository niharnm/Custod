// arduino.js — Custod desk-device connection portal.
//
// The Custod desk sensor (Arduino) connects ONLY through this Chrome extension,
// over the Web Serial API. The macOS and iOS apps never touch it. This page:
//   1. lets the user pick + open the serial port (9600 baud),
//   2. reads the device's JSON sensor lines and shows them live,
//   3. mirrors the extension's current burnout status to the device's RGB lamp
//      by sending `SCORE:<score>:<status>` (and a test `BUZZ`).
//
// Serial protocol (see arduino/Custod-Arduino.ino):
//   device → us : {"type":"reading","therm_temp":..,"distance_cm":..,
//                  "posture_score":..,"light_level":..,"dark_room":..}
//                 and "BURNOUTCHECK_READY" on boot.
//   us → device : "SCORE:<0-100>:<green|yellow|red>", "BUZZ", "LED:r,g,b"

const BAUD = 9600;

let port = null;
let reader = null;
let writer = null;
let keepReading = false;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  if (!("serial" in navigator)) {
    $("unsupported").classList.remove("hidden");
    $("connectBtn").disabled = true;
    return;
  }
  $("connectBtn").addEventListener("click", connect);
  $("disconnectBtn").addEventListener("click", disconnect);
  $("buzzBtn").addEventListener("click", () => sendCommand("BUZZ"));

  // Reflect the extension's latest status immediately, then live.
  refreshStatusFromStorage();
  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.lastScore || changes.lastStatus) refreshStatusFromStorage();
    });
  }
});

async function connect() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: BAUD });
    writer = port.writable.getWriter();
    setConnected(true);
    keepReading = true;
    readLoop();
    // Push current status to the freshly-connected device.
    refreshStatusFromStorage();
  } catch (err) {
    // User cancelled the picker, or the port is busy.
    setState(err && err.name === "NotFoundError"
      ? "No device selected."
      : "Could not open the device. Is another app using the port?");
    setConnected(false);
  }
}

async function disconnect() {
  keepReading = false;
  try { if (reader) await reader.cancel(); } catch (_) {}
  try { if (writer) { writer.releaseLock(); writer = null; } } catch (_) {}
  try { if (port) await port.close(); } catch (_) {}
  port = null;
  reader = null;
  setConnected(false);
  setState("Disconnected.");
}

async function readLoop() {
  const decoder = new TextDecoderStream();
  const readableClosed = port.readable.pipeTo(decoder.writable).catch(() => {});
  reader = decoder.readable.getReader();
  let buffer = "";
  try {
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) handleLine(line);
      }
    }
  } catch (_) {
    // Device unplugged mid-read.
  } finally {
    try { reader.releaseLock(); } catch (_) {}
    await readableClosed;
    if (keepReading) { setConnected(false); setState("Device disconnected."); }
  }
}

function handleLine(line) {
  if (line === "BURNOUTCHECK_READY") {
    setState("Device ready.");
    return;
  }
  if (line[0] !== "{") return;
  let data;
  try { data = JSON.parse(line); } catch (_) { return; }
  if (data.type !== "reading") return;

  if (typeof data.therm_temp === "number" && data.therm_temp > -90) {
    $("mTemp").textContent = data.therm_temp.toFixed(1);
  }
  if (typeof data.posture_score === "number") $("mPosture").textContent = data.posture_score;
  if (typeof data.distance_cm === "number") {
    $("mDist").textContent = data.distance_cm > 0 ? data.distance_cm : "—";
  }
  if (typeof data.light_level === "number") $("mLight").textContent = data.light_level;
  $("darkRoom").classList.toggle("hidden", data.dark_room !== true);
}

async function sendCommand(cmd) {
  if (!writer) return;
  try {
    await writer.write(new TextEncoder().encode(cmd + "\n"));
  } catch (_) {
    setConnected(false);
    setState("Lost the device while sending.");
  }
}

async function refreshStatusFromStorage() {
  let score = null;
  let status = "green";
  try {
    const s = await chrome.storage.local.get(["lastScore", "lastStatus"]);
    if (typeof s.lastScore === "number") score = s.lastScore;
    if (s.lastStatus) status = s.lastStatus;
  } catch (_) {}

  // Update the on-page lamp.
  const lamp = $("statusLamp");
  lamp.className = "lamp " + (status === "red" ? "red" : status === "yellow" ? "yellow" : "green");
  $("statusScore").textContent = score == null ? "—" : score;
  $("statusLabel").textContent = score == null
    ? "Waiting for a check…"
    : status === "red" ? "At risk" : status === "yellow" ? "Strained" : "Stable";

  // Mirror it to the device, if connected.
  if (writer && score != null) sendCommand(`SCORE:${score}:${status}`);
}

function setConnected(on) {
  $("connDot").className = "dot " + (on ? "on" : "off");
  $("connState").textContent = on ? "Connected." : "Not connected.";
  $("connectBtn").classList.toggle("hidden", on);
  $("disconnectBtn").classList.toggle("hidden", !on);
  $("buzzBtn").classList.toggle("hidden", !on);
  if (!on) {
    $("mTemp").textContent = $("mPosture").textContent =
      $("mDist").textContent = $("mLight").textContent = "—";
    $("darkRoom").classList.add("hidden");
  }
}

function setState(msg) {
  $("connState").textContent = msg;
}
