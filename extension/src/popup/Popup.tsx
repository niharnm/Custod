import { useEffect, useState } from "react";
import { analyzeBurnout, checkUrl, runScan, scanUrl, type ScanResult } from "../lib/api";
import { collectTabs } from "../lib/collectTabs";
import {
  clearParkedTabs,
  getParkedTabs,
  isDistractionTab,
  parkDistractionTabs,
  reopenParkedTab,
  type ParkedTab
} from "../lib/parkedTabs";
import { WEB_APP_URL } from "../lib/config";

const STATUS_COPY: Record<ScanResult["status"], string> = {
  green: "Steady",
  yellow: "Worth a pause",
  red: "Time for a reset"
};

export function Popup() {
  const [tabCount, setTabCount] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [energy, setEnergy] = useState("3");
  const [stress, setStress] = useState("3");
  const [timePressure, setTimePressure] = useState<"none" | "some" | "high">("some");
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [parking, setParking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [parked, setParked] = useState<ParkedTab[]>([]);

  useEffect(() => {
    collectTabs()
      .then((tabs) => {
        setTabCount(tabs.length);
        setDistractionCount(tabs.filter((tab) => !tab.active && isDistractionTab(tab)).length);
      })
      .catch(() => setError("Unable to read current-window tabs."));
    getParkedTabs().then(setParked).catch(() => undefined);
  }, []);

  async function scanNow() {
    setError("");
    setResult(null);
    setScanning(true);
    try {
      const tabs = await collectTabs();
      setTabCount(tabs.length);
      if (tabs.length === 0) throw new Error("Open at least one http or https tab first.");
      const scan = await runScan(tabs);
      setResult(scan);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Custod could not run this scan.");
    } finally {
      setScanning(false);
    }
  }

  async function runCheck() {
    setError("");
    setLoading(true);
    try {
      const tabs = await collectTabs();
      setTabCount(tabs.length);
      if (tabs.length === 0) throw new Error("Open at least one http or https tab first.");
      await chrome.storage.local.set({
        "custod:lastTabs": tabs,
        "custod:lastCheckIn": { energy, stress, timePressure, reflection }
      });
      const id = await analyzeBurnout({
        tabs,
        mood: {
          energy: Number(energy),
          stress: Number(stress),
          timePressure,
          reflection
        }
      });
      await chrome.tabs.create({ url: checkUrl(id) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Custod could not run this check.");
    } finally {
      setLoading(false);
    }
  }

  async function parkTabs() {
    setError("");
    setParking(true);
    try {
      const tabs = await collectTabs();
      const updated = await parkDistractionTabs(tabs);
      setParked(updated);
      const remaining = await collectTabs();
      setTabCount(remaining.length);
      setDistractionCount(remaining.filter((tab) => !tab.active && isDistractionTab(tab)).length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Custod could not park these tabs.");
    } finally {
      setParking(false);
    }
  }

  async function reopen(url: string) {
    await reopenParkedTab(url);
  }

  async function clearParked() {
    await clearParkedTabs();
    setParked([]);
  }

  async function openFullAnalysis() {
    if (!result) return;
    await chrome.tabs.create({ url: scanUrl(result.scanId) });
  }

  async function openDashboard() {
    await chrome.tabs.create({ url: WEB_APP_URL });
  }

  const busy = loading || scanning || parking;

  return (
    <main className="popup">
      <header>
        <div className="brand">
          <img src="/logo.png" alt="Custod logo" className="logo" width={32} height={32} />
          <div>
            <h1>Custod</h1>
            <p>Browser burnout warning light</p>
          </div>
        </div>
        <div className="count">{tabCount}</div>
      </header>

      <button className="primary" onClick={scanNow} disabled={busy}>
        {scanning ? "Scanning..." : "Scan now"}
      </button>

      {result ? (
        <section className="result" aria-live="polite">
          <div className="result-head">
            <span className={`light light-${result.status}`} aria-hidden="true" />
            <div>
              <p className="result-status">{STATUS_COPY[result.status]}</p>
              <p className="result-score">Score {result.score}</p>
            </div>
          </div>
          {result.mainPattern ? <p className="result-pattern">{result.mainPattern}</p> : null}
          {result.oneSentenceExplanation ? (
            <p className="result-explain">{result.oneSentenceExplanation}</p>
          ) : null}
          <button className="link" onClick={openFullAnalysis}>
            Open full analysis
          </button>
        </section>
      ) : null}

      <section className="park">
        <button className="secondary" onClick={parkTabs} disabled={busy || distractionCount === 0}>
          {parking
            ? "Parking..."
            : distractionCount > 0
              ? `Park distraction tabs (${distractionCount})`
              : "No distraction tabs to park"}
        </button>
        <p className="hint">Saves each tab before closing it, so nothing is lost.</p>

        {parked.length > 0 ? (
          <div className="parked">
            <div className="parked-head">
              <span>Parked tabs ({parked.length})</span>
              <button className="link" onClick={clearParked}>
                Clear
              </button>
            </div>
            <ul>
              {parked.map((tab, index) => (
                <li key={`${tab.url}-${index}`}>
                  <span className="parked-title" title={tab.url}>
                    {tab.title || tab.url}
                  </span>
                  <button className="link" onClick={() => reopen(tab.url)}>
                    Reopen
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <details className="checkin">
        <summary>Add a mood check-in</summary>

        <label>
          <span>Energy</span>
          <select value={energy} onChange={(event) => setEnergy(event.target.value)} disabled={busy}>
            <option value="1">1 - drained</option>
            <option value="2">2</option>
            <option value="3">3 - neutral</option>
            <option value="4">4</option>
            <option value="5">5 - steady</option>
          </select>
        </label>

        <label>
          <span>Stress</span>
          <select value={stress} onChange={(event) => setStress(event.target.value)} disabled={busy}>
            <option value="1">1 - low</option>
            <option value="2">2</option>
            <option value="3">3 - moderate</option>
            <option value="4">4</option>
            <option value="5">5 - high</option>
          </select>
        </label>

        <label>
          <span>Time pressure</span>
          <select value={timePressure} onChange={(event) => setTimePressure(event.target.value as "none" | "some" | "high")} disabled={busy}>
            <option value="none">None</option>
            <option value="some">Some</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          <span>Optional reflection</span>
          <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} disabled={busy} />
        </label>

        <button className="secondary" onClick={runCheck} disabled={busy}>
          {loading ? "Checking..." : "Run burnout check"}
        </button>
      </details>

      {error ? <p className="error">{error}</p> : null}

      <button className="secondary" onClick={openDashboard} disabled={busy}>
        Open dashboard
      </button>
      <p className="privacy">Titles and URLs only. No page contents.</p>
    </main>
  );
}
