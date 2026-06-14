import Foundation
import Combine

// Real-time burnout monitoring — Custod's "always-on" engine, conceptually like
// Microsoft Defender's real-time protection. It polls the default browser's open
// tabs on an interval, runs the analyzer locally, publishes a live status, and —
// when the user has opted into it — decides on its own to intervene (notify or
// run an autopilot reset break).
//
// A history snapshot is logged only when the burnout status actually changes, so
// the timeline stays meaningful instead of being spammed every tick.

@MainActor
final class BurnoutMonitor: ObservableObject {
    @Published private(set) var analysis: BurnoutAnalysis?
    @Published private(set) var tabs: [BrowserTab] = []
    @Published private(set) var sourceBrowser = ""
    @Published private(set) var lastChecked: Date?
    @Published private(set) var note = ""
    @Published private(set) var isActive = false
    @Published private(set) var usage: UsageStats?
    @Published private(set) var appUsage: AppUsageSnapshot?
    /// True once macOS's own Screen Time data is readable (Full Disk Access granted).
    /// While false, screen-time figures are Custod's live since-launch estimate.
    @Published private(set) var usesSystemScreenTime = false

    // Autopilot break state, observed by the UI to present a reset overlay.
    @Published private(set) var breakActive = false
    @Published private(set) var breakEndsAt: Date?

    /// Quick mood check-in feeds the live analysis. Changing it re-scores
    /// immediately against the tabs we already have (no extra browser read).
    @Published var mood = MoodCheckIn() {
        didSet { reanalyzeLocally() }
    }

    let intervalSeconds: Double = 20

    private let usageTracker = UsageTracker()
    private let appTracker = AppUsageTracker()
    private var lastUsage: UsageStats?
    private var loopTask: Task<Void, Never>?
    private weak var history: HistoryStore?
    private var settings: SettingsStore?
    private var sync: CustodSync?
    private var lastLoggedStatus: BurnoutStatus?
    private var lastInterventionAt: Date?

    // AI reasoning (Groq) state. We only call out when the picture meaningfully
    // changes — keyed by a signature — so we don't hit the API every 20s tick.
    private var reasoningTask: Task<Void, Never>?
    private var lastReasonedSignature: String?
    private var lastReasoning: (summary: String, reasons: [String])?

    func attach(history: HistoryStore, settings: SettingsStore, auth: AuthStore) {
        self.history = history
        self.settings = settings
        self.sync = CustodSync(auth: auth)
    }

    func start() {
        guard loopTask == nil else { return }
        isActive = true
        loopTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.tick()
                let secs = self?.intervalSeconds ?? 20
                try? await Task.sleep(nanoseconds: UInt64(secs * 1_000_000_000))
            }
        }
    }

    func stop() {
        isActive = false
        loopTask?.cancel()
        loopTask = nil
        reasoningTask?.cancel()
        reasoningTask = nil
    }

    func toggle() { isActive ? stop() : start() }

    /// Force an immediate re-read, e.g. from a "Check now" button.
    func refreshNow() { Task { await tick() } }

    func endBreak() {
        breakActive = false
        breakEndsAt = nil
    }

    /// Status-driven menu-bar glyph so the always-on indicator reflects risk.
    var menuBarSymbol: String {
        switch analysis?.status {
        case .red:    return "exclamationmark.shield.fill"
        case .yellow: return "shield.lefthalf.filled"
        case .green:  return "checkmark.shield.fill"
        case nil:     return "shield"
        }
    }

    // MARK: Internals

    private func reanalyzeLocally() {
        guard lastUsage != nil || !tabs.isEmpty || appUsage != nil else { return }
        var a = BurnoutAnalyzer.analyze(tabs: tabs, mood: mood, usage: lastUsage, appUsage: appUsage)
        attachReasoning(to: &a)
        analysis = a
        lastChecked = Date()
        maybeReason(a)
    }

    private func tick() async {
        // Sample real usage every tick, even if the browser is closed, so screen
        // time and break tracking stay accurate.
        var u = usageTracker.sample()
        let live = appTracker.sample()

        // Prefer macOS's real Screen Time data (whole day, all apps) when Full Disk
        // Access is granted; otherwise fall back to Custod's live since-launch count.
        if let system = ScreenTimeReader.today() {
            usesSystemScreenTime = true
            // System data is whole-day and should dominate, but never show less
            // than what we've directly observed active this session.
            u.activeMinutesToday = max(system.totalMinutes, u.activeMinutesToday)
            appUsage = AppUsageSnapshot(apps: system.apps,
                                        totalMinutes: max(system.totalMinutes, live.totalMinutes),
                                        frontApp: live.frontApp)
        } else {
            usesSystemScreenTime = false
            appUsage = live
        }

        usage = u
        lastUsage = u

        // Read browser tabs when we can, but they're just one input now: analysis
        // runs every tick from app + usage signals so Custod keeps scoring your
        // workload even with the browser closed.
        var imported: [BrowserTab] = []
        if let browser = TabImporter.defaultBrowser() {
            sourceBrowser = browser.rawValue
            if TabImporter.isRunning(browser) {
                do {
                    imported = try TabImporter.importTabs(from: browser)
                    note = imported.isEmpty ? "No open tabs in \(browser.rawValue) — scoring your app activity." : ""
                } catch {
                    note = error.localizedDescription
                }
            } else {
                note = "\(browser.rawValue) is closed — scoring your app activity."
            }
        } else {
            note = "\(TabImporter.defaultBrowserName()) isn't supported for tabs yet — scoring your app activity."
        }
        tabs = imported

        var a = BurnoutAnalyzer.analyze(tabs: imported, mood: mood, usage: u, appUsage: appUsage)
        attachReasoning(to: &a)
        analysis = a
        lastChecked = Date()

        if a.status != lastLoggedStatus {
            lastLoggedStatus = a.status
            let record = BurnoutCheckRecord(rawTabs: imported, mood: mood, analysis: a)
            history?.add(record)
            // Mirror the check to the account so it shows up everywhere you're
            // signed in. Best-effort and non-blocking; no-ops when there are no
            // tabs to score.
            Task { [sync] in await sync?.push(record) }
        }

        maybeIntervene(a)
        maybeReason(a)
    }

    // MARK: AI reasoning (optional, opt-in)

    /// What makes one analysis "the same" for caching purposes. Small score
    /// jitter (±5) shouldn't trigger a fresh API call; a status, pattern, or
    /// tab-count change should.
    private func signature(_ a: BurnoutAnalysis) -> String {
        "\(a.status.rawValue)|\(a.mainPattern)|\(a.score / 5)|\(tabs.count)"
    }

    /// Carry the most recent AI reasoning onto a freshly computed analysis when
    /// it still describes the same situation, so the UI doesn't flicker between
    /// ticks while the (debounced) next call is pending.
    private func attachReasoning(to a: inout BurnoutAnalysis) {
        guard let r = lastReasoning, lastReasonedSignature == signature(a) else { return }
        a.aiSummary = r.summary
        a.aiReasoning = r.reasons
    }

    /// Fire a Groq reasoning pass if AI is enabled and the situation changed.
    private func maybeReason(_ a: BurnoutAnalysis) {
        guard let s = settings, s.aiReasoningActive else {
            // Reset so re-enabling AI reasons immediately on the next tick.
            lastReasonedSignature = nil
            return
        }
        let sig = signature(a)
        guard sig != lastReasonedSignature else { return }
        lastReasonedSignature = sig // claim now: at most one call per signature

        let key = s.resolvedGroqKey
        let tabsSnapshot = tabs
        let moodSnapshot = mood
        let usageSnapshot = lastUsage
        let appSnapshot = appUsage
        reasoningTask?.cancel()
        reasoningTask = Task { [weak self] in
            guard let result = try? await GroqReasoner.reason(
                analysis: a, tabs: tabsSnapshot, mood: moodSnapshot,
                usage: usageSnapshot, appUsage: appSnapshot, apiKey: key
            ) else { return } // silent fallback: deterministic wording stays
            await self?.applyReasoning(result, signature: sig)
        }
    }

    private func applyReasoning(_ result: GroqReasoner.Result, signature sig: String) {
        lastReasoning = (result.summary, result.reasons)
        // Only update the visible analysis if it still matches what we reasoned about.
        if var current = analysis, signature(current) == sig {
            current.aiSummary = result.summary
            current.aiReasoning = result.reasons
            analysis = current
        }
    }

    /// The "AI decides and acts on its own" path. Honors the user's chosen mode,
    /// sensitivity threshold, and a cooldown so it never nags.
    private func maybeIntervene(_ a: BurnoutAnalysis) {
        guard let s = settings, s.interventionMode != .off, !breakActive else { return }

        let triggered = a.status == .red
            || a.score >= s.sensitivity.triggerScore
            || (a.status == .yellow && s.sensitivity.triggerOnYellow)
        guard triggered else { return }

        if let last = lastInterventionAt,
           Date().timeIntervalSince(last) < Double(s.sensitivity.cooldownMinutes * 60) {
            return
        }
        lastInterventionAt = Date()

        if s.notificationsEnabled {
            Notifier.fire(status: a.status, pattern: a.mainPattern)
        }

        if s.interventionMode == .autopilot {
            breakEndsAt = Date().addingTimeInterval(Double(s.sensitivity.breakMinutes * 60))
            breakActive = true
        }
    }
}
