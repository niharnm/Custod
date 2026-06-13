import { useEffect, useState } from "react";
import { StatusLamp } from "../components/StatusLamp";
import { createScan, scanUrl, type MoodCheckInValue } from "../lib/api";
import { collectTabs } from "../lib/collectTabs";
import { WEB_APP_URL } from "../lib/config";

const MOODS: { value: MoodCheckInValue; label: string }[] = [
  { value: "calm", label: "Calm" },
  { value: "stressed", label: "Stressed" },
  { value: "overwhelmed", label: "Overwhelmed" },
  { value: "numb", label: "Numb" },
  { value: "skip", label: "Skip" },
];

export function Popup() {
  const [tabCount, setTabCount] = useState(0);
  const [mood, setMood] = useState<MoodCheckInValue>("skip");
  const [goal, setGoal] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
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
      const id = await createScan({
        tabs,
        moodCheckIn: mood,
        goal: goal.trim() || undefined,
        timeRemaining: timeRemaining.trim() || undefined,
      });
      await chrome.tabs.create({ url: scanUrl(id) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Custod could not run this check.");
    } finally {
      setLoading(false);
    }
  }

  async function openDashboard() {
    await chrome.tabs.create({ url: `${WEB_APP_URL}/check` });
  }

  return (
    <main className="popup">
      <header className="popup-header">
        <div className="brand-row">
          <StatusLamp status="green" size="sm" />
          <div>
            <h1>Custod</h1>
            <p>Browser burnout warning light</p>
            <span className="accent-bar" />
          </div>
        </div>
        <div className="tab-badge">{tabCount}</div>
      </header>

      <div className="card">
        <span className="field-label">How are you feeling? (optional)</span>
        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`pill${mood === m.value ? " active" : ""}`}
              onClick={() => setMood(m.value)}
              disabled={loading}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <label className="card">
        <span className="field-label">What are you working on? (optional)</span>
        <input
          className="input"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          disabled={loading}
          placeholder="e.g. finish history essay"
        />
      </label>

      <label className="card">
        <span className="field-label">Time left (optional)</span>
        <input
          className="input"
          value={timeRemaining}
          onChange={(event) => setTimeRemaining(event.target.value)}
          disabled={loading}
          placeholder="e.g. 2h, 30m"
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <div className="btn-row">
        <button className="btn-primary" onClick={runCheck} disabled={loading}>
          {loading ? "Checking..." : "Run burnout check"}
        </button>
        <button className="btn-secondary" onClick={openDashboard} disabled={loading}>
          Open dashboard
        </button>
      </div>

      <p className="privacy">Titles and URLs only. No page contents.</p>
    </main>
  );
}
