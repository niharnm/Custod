import { useEffect, useState } from "react";
import { analyzeBurnout, checkUrl } from "../lib/api";
import { collectTabs } from "../lib/collectTabs";
import { WEB_APP_URL } from "../lib/config";

export function Popup() {
  const [tabCount, setTabCount] = useState(0);
  const [energy, setEnergy] = useState("3");
  const [stress, setStress] = useState("3");
  const [timePressure, setTimePressure] = useState<"none" | "some" | "high">("some");
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    collectTabs()
      .then((tabs) => setTabCount(tabs.length))
      .catch(() => setError("Unable to read current-window tabs."));
  }, []);

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

  async function openDashboard() {
    await chrome.tabs.create({ url: WEB_APP_URL });
  }

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

      <label>
        <span>Energy</span>
        <select value={energy} onChange={(event) => setEnergy(event.target.value)} disabled={loading}>
          <option value="1">1 - drained</option>
          <option value="2">2</option>
          <option value="3">3 - neutral</option>
          <option value="4">4</option>
          <option value="5">5 - steady</option>
        </select>
      </label>

      <label>
        <span>Stress</span>
        <select value={stress} onChange={(event) => setStress(event.target.value)} disabled={loading}>
          <option value="1">1 - low</option>
          <option value="2">2</option>
          <option value="3">3 - moderate</option>
          <option value="4">4</option>
          <option value="5">5 - high</option>
        </select>
      </label>

      <label>
        <span>Time pressure</span>
        <select value={timePressure} onChange={(event) => setTimePressure(event.target.value as "none" | "some" | "high")} disabled={loading}>
          <option value="none">None</option>
          <option value="some">Some</option>
          <option value="high">High</option>
        </select>
      </label>

      <label>
        <span>Optional reflection</span>
        <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} disabled={loading} />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <button className="primary" onClick={runCheck} disabled={loading}>
        {loading ? "Checking..." : "Run burnout check"}
      </button>
      <button className="secondary" onClick={openDashboard} disabled={loading}>
        Open dashboard
      </button>
      <p className="privacy">Titles and URLs only. No page contents.</p>
    </main>
  );
}
