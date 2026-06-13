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
    private var lastUsage: UsageStats?
    private var loopTask: Task<Void, Never>?
    private weak var history: HistoryStore?
    private var settings: SettingsStore?
    private var lastLoggedStatus: BurnoutStatus?
    private var lastInterventionAt: Date?

    func attach(history: HistoryStore, settings: SettingsStore) {
        self.history = history
        self.settings = settings
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
        guard !tabs.isEmpty else { return }
        analysis = BurnoutAnalyzer.analyze(tabs: tabs, mood: mood, usage: lastUsage)
        lastChecked = Date()
    }

    private func tick() async {
        // Sample real usage every tick, even if the browser is closed, so screen
        // time and break tracking stay accurate.
        let u = usageTracker.sample()
        usage = u
        lastUsage = u

        guard let browser = TabImporter.defaultBrowser() else {
            note = "\(TabImporter.defaultBrowserName()) isn't supported for auto-monitoring yet."
            return
        }
        sourceBrowser = browser.rawValue

        guard TabImporter.isRunning(browser) else {
            note = "Open \(browser.rawValue) to start monitoring your focus."
            return
        }

        do {
            let imported = try TabImporter.importTabs(from: browser)
            tabs = imported
            guard !imported.isEmpty else {
                note = "No open tabs in \(browser.rawValue) right now."
                return
            }
            note = ""
            let a = BurnoutAnalyzer.analyze(tabs: imported, mood: mood, usage: u)
            analysis = a
            lastChecked = Date()

            if a.status != lastLoggedStatus {
                lastLoggedStatus = a.status
                history?.add(BurnoutCheckRecord(rawTabs: imported, mood: mood, analysis: a))
            }

            maybeIntervene(a)
        } catch {
            note = error.localizedDescription
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
