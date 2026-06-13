import { describe, expect, it } from "vitest";
import { analyzeWithRules } from "@/lib/scoring";
import type { AnalyzeBurnoutRequest, BrowserTab } from "@/lib/types";

/**
 * GOLDEN / CHARACTERIZATION tests for the deterministic scoring engine
 * (`analyzeWithRules`). These lock in the engine's *current* behaviour and its
 * guardrails. The exact numbers below were produced by running the engine
 * itself, so the tests are characterization tests, not aspirational specs. If
 * the engine's weights/thresholds change intentionally, update these numbers.
 *
 * Engine reference (lib/scoring/index.ts):
 *   - status thresholds: score < 35 => "green", 35..69 => "yellow", >= 70 => "red"
 *   - score is always clamped to an integer in [0, 100]
 *   - guardrail: a >= 70 weighted score with < 2 strong (>= 60) signals is
 *     pushed back down to 69 (unless mood risk >= 40 AND tabCount > 25)
 */

const tab = (title: string, url: string, active = false): BrowserTab => ({
  title,
  url,
  active,
});

// Generic, non-classifiable tabs (no keyword hits, distinct domains).
const genericTabs = (n: number): BrowserTab[] =>
  Array.from({ length: n }, (_, i) => tab(`Page ${i}`, `https://example${i}.com/path`));

describe("analyzeWithRules — golden behaviour", () => {
  it("empty/few calm tabs with no goal => green and low score", () => {
    const result = analyzeWithRules({
      tabs: [
        tab("Inbox", "https://gmail.com", true),
        tab("Calendar", "https://calendar.google.com"),
        tab("Notion home", "https://notion.so"),
      ],
      moodCheckIn: "calm",
    });

    expect(result.status).toBe("green");
    expect(result.score).toBe(11);
    expect(result.score).toBeLessThan(35);
    expect(result.riskBreakdown.tabOverload).toBe(5);
    expect(result.riskBreakdown.distractionPull).toBe(0);
    expect(result.riskBreakdown.timePressure).toBe(0);
    expect(result.mainPattern).toBe("Stable browsing pattern");
  });

  it("zero tabs => fully bounded green with all-zero overload", () => {
    const result = analyzeWithRules({ tabs: [] });

    expect(result.status).toBe("green");
    expect(result.score).toBe(0);
    expect(result.riskBreakdown.tabOverload).toBe(0);
    expect(result.tabGroups).toEqual([]);
  });

  it("heavy tab overload (36 tabs) => tabOverload maxed and not green", () => {
    const result = analyzeWithRules({
      tabs: genericTabs(36),
      moodCheckIn: "calm",
    });

    expect(result.riskBreakdown.tabOverload).toBe(92);
    expect(result.status).not.toBe("green");
    expect(result.status).toBe("yellow");
    expect(result.score).toBe(48);
  });

  it("distraction tabs (youtube/tiktok/instagram) => distractionPull elevated", () => {
    // NOTE: the goal text is folded into every tab's classification text. A goal
    // containing deadline words would re-categorize these tabs as "deadline" and
    // suppress distractionPull (see the characterization test below). A
    // non-deadline goal lets the distraction tabs classify as distractions.
    const result = analyzeWithRules({
      tabs: [
        tab("YouTube", "https://youtube.com/watch", true),
        tab("TikTok", "https://tiktok.com/foryou"),
        tab("Instagram", "https://instagram.com/feed"),
        tab("Class notes", "https://canvas.com/notes"),
      ],
      goal: "study for exam",
      moodCheckIn: "stressed",
    });

    // 3 distraction tabs * 18 = 54
    expect(result.riskBreakdown.distractionPull).toBe(54);
    expect(result.riskBreakdown.distractionPull).toBeGreaterThan(40);
  });

  it("a deadline goal no longer suppresses distractionPull (tabs classified from their own content)", () => {
    // Regression guard for a fixed bug: previously the goal string was folded
    // into each tab's classification text, so DEADLINE_WORDS in the goal
    // re-tagged youtube/tiktok/instagram as "deadline" and zeroed out the
    // distraction signal. Tabs are now classified from their own title/url only.
    const result = analyzeWithRules({
      tabs: [
        tab("YouTube", "https://youtube.com/watch", true),
        tab("TikTok", "https://tiktok.com/foryou"),
        tab("Instagram", "https://instagram.com/feed"),
        tab("Doc", "https://docs.google.com/d"),
        tab("Notes app", "https://notion.so/n"),
      ],
      goal: "finish the report tonight",
      moodCheckIn: "stressed",
    });

    // 3 distraction tabs are now correctly counted: 3*18 + deadline pull = 64.
    expect(result.riskBreakdown.distractionPull).toBe(64);
    // Time pressure comes from the goal (30) + stressed mood (25) = 55. It is no
    // longer inflated by doc tabs being mis-tagged as deadline tabs.
    expect(result.riskBreakdown.timePressure).toBe(55);
  });

  it("time pressure: deadline goal + 30m remaining + overwhelmed mood => timePressure maxed", () => {
    const result = analyzeWithRules({
      tabs: [
        tab("Essay draft", "https://docs.google.com/essay", true),
        tab("Sources", "https://scholar.google.com"),
      ],
      goal: "submit deadline tonight",
      timeRemaining: "30m",
      moodCheckIn: "overwhelmed",
    });

    // 30 (goalPressure) + 30 (<120m) + 18 (<45m) + deadlineCount*10 + moodRisk(45)
    // all clamps to 100.
    expect(result.riskBreakdown.timePressure).toBe(100);
    expect(result.score).toBe(29);
  });

  it("recovery: few tabs on one task + a breathing tab => recoverySignal > 0 and not red", () => {
    const result = analyzeWithRules({
      tabs: [
        tab("Essay draft", "https://docs.google.com/essay", true),
        tab("Essay outline", "https://docs.google.com/outline"),
        tab("Calm breathing", "https://calm.com/breathing"),
      ],
      goal: "write essay",
      moodCheckIn: "calm",
    });

    expect(result.riskBreakdown.recoverySignal).toBeGreaterThan(0);
    expect(result.riskBreakdown.recoverySignal).toBe(33);
    expect(result.status).not.toBe("red");
    expect(result.status).toBe("green");
  });
});

describe("analyzeWithRules — guardrails", () => {
  it("high tab count ALONE (calm, no other strong signal) must not exceed yellow", () => {
    // 30 tabs all on a single domain: tabOverload is high but no other signal
    // is strong, mood is calm. The over-warning guardrail keeps this out of red.
    const result = analyzeWithRules({
      tabs: Array.from({ length: 30 }, (_, i) =>
        tab(`Doc ${i}`, `https://docs.google.com/d/${i}`)
      ),
      moodCheckIn: "calm",
    });

    expect(result.riskBreakdown.tabOverload).toBe(80);
    expect(result.status).not.toBe("red");
    expect(result.score).toBeLessThanOrEqual(69);
    // In practice the dominant single category drags this all the way to green.
    expect(result.score).toBe(13);
  });

  it("score is always clamped to an integer in [0, 100] across varied inputs", () => {
    const cases: AnalyzeBurnoutRequest[] = [
      { tabs: [] },
      { tabs: genericTabs(36), moodCheckIn: "overwhelmed", goal: "deadline tonight", timeRemaining: "10m" },
      { tabs: genericTabs(200), moodCheckIn: "numb" },
      {
        tabs: [
          tab("YouTube", "https://youtube.com", true),
          tab("Reddit", "https://reddit.com"),
        ],
        goal: "submit final project due tonight",
        timeRemaining: "5m",
        moodCheckIn: "overwhelmed",
      },
    ];

    for (const input of cases) {
      const { score, riskBreakdown } = analyzeWithRules(input);
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      for (const value of Object.values(riskBreakdown)) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("status thresholds line up with the score boundaries", () => {
    // <35 green, 35..69 yellow, >=70 red. Verify the mapping holds for the
    // statuses the engine actually emits.
    const green = analyzeWithRules({ tabs: genericTabs(3), moodCheckIn: "calm" });
    expect(green.score).toBeLessThan(35);
    expect(green.status).toBe("green");

    const yellow = analyzeWithRules({ tabs: genericTabs(36), moodCheckIn: "calm" });
    expect(yellow.score).toBeGreaterThanOrEqual(35);
    expect(yellow.score).toBeLessThanOrEqual(69);
    expect(yellow.status).toBe("yellow");
  });
});

describe("analyzeWithRules — determinism", () => {
  const sample: AnalyzeBurnoutRequest = {
    tabs: [
      tab("Essay draft", "https://docs.google.com/essay", true),
      tab("YouTube", "https://youtube.com/watch"),
      tab("Sources", "https://scholar.google.com"),
      ...genericTabs(10),
    ],
    goal: "submit final project tonight",
    timeRemaining: "45m",
    moodCheckIn: "stressed",
  };

  it("identical input yields identical status, score and riskBreakdown", () => {
    const a = analyzeWithRules(sample);
    const b = analyzeWithRules(sample);

    expect(a.status).toBe(b.status);
    expect(a.score).toBe(b.score);
    expect(a.riskBreakdown).toEqual(b.riskBreakdown);
    expect(a.mainPattern).toBe(b.mainPattern);
  });

  it("only non-deterministic fields differ between runs (scanId, createdAt)", () => {
    const a = analyzeWithRules(sample);
    const b = analyzeWithRules(sample);

    // The deterministic core is identical...
    expect(a.tabGroups).toEqual(b.tabGroups);
    expect(a.resetPlan).toEqual(b.resetPlan);
    // ...while the id is freshly generated each call.
    expect(a.scanId).not.toBe(b.scanId);
  });
});
