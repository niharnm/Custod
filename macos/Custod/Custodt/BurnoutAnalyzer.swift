import Foundation

// Burnout scoring. Ported from lib/analyzer.ts and extended for macOS with real
// usage signals (screen time, unbroken session length, time of day).
//
// The score is fully transparent: it is the SUM of each factor's point
// contribution. Factor maximums are tuned to sum to 100, so the breakdown the
// user sees always adds up to the score. Pure and deterministic, no network.
//
// Factor budget (max points):
//   Tab overload 12 · Context switching 8 · Distraction loop 12 ·
//   Goal fragmentation 8 · Time & energy pressure 12   (tabs + mood = 52)
//   Screen time 12 · No recent break 12 · Late-night use 6   (usage = 30)
//   App juggling 10 · Active workload 8   (whole-Mac app usage = 18)
//
// The macOS app deliberately scores more than just open tabs: it also measures
// how hard you're actually working across *every* application — how many apps
// you're juggling and how much active app time you've put in today — so a person
// grinding in one focused app still registers, not only someone with 30 tabs open.

enum BurnoutAnalyzer {

    private static let distractionDomains = [
        "youtube.com", "tiktok.com", "instagram.com", "reddit.com", "x.com",
        "twitter.com", "netflix.com", "twitch.tv", "spotify.com"
    ]
    private static let schoolTerms = [
        "canvas", "blackboard", "schoology", "classroom", "assignment", "homework",
        "exam", "quiz", "gradescope", "turnitin", "deadline", "submit"
    ]
    private static let researchTerms = [
        "google.com/search", "wikipedia", "scholar.google", "paper", "article",
        "research", "arxiv", "docs", "documentation", "tutorial", "how to"
    ]
    private static let helpTerms = [
        "chatgpt", "claude", "perplexity", "stackoverflow", "stack overflow", "github", "copilot"
    ]
    private static let communicationTerms = [
        "gmail", "mail.google", "outlook", "discord", "slack", "teams.microsoft", "messages"
    ]

    private static func contains(_ text: String, _ needles: [String]) -> Bool {
        needles.contains { text.contains($0) }
    }

    private static func categorize(_ tab: BrowserTab) -> String {
        let text = tab.text
        let domain = tab.domain
        if contains(text, schoolTerms) { return "Deadline and class surfaces" }
        if contains(text, helpTerms) { return "Help seeking" }
        if contains(text, researchTerms) { return "Research spiral" }
        if contains(text, communicationTerms) { return "Communication pressure" }
        if distractionDomains.contains(where: { domain.contains($0) }) { return "Distraction loop" }
        if contains(text, ["calendar", "notion", "todo", "trello", "drive.google"]) { return "Planning and admin" }
        if contains(text, ["music", "meditation", "breathing", "walk", "sleep"]) { return "Recovery cues" }
        return "Other context"
    }

    private static func groupExplanation(_ name: String, _ count: Int) -> String {
        let explanations: [String: String] = [
            "Deadline and class surfaces": "Class portals, submissions, deadlines, or grading pages signal direct academic pressure.",
            "Help seeking": "Repeated help or coding-assistant surfaces can mean the student is blocked, not just productive.",
            "Research spiral": "Search, docs, tutorials, and articles can become avoidance when too many stay open.",
            "Communication pressure": "Inbox and chat surfaces add interruption load while the student is trying to finish.",
            "Distraction loop": "Entertainment or social tabs can indicate a drift loop, especially when mixed with deadline tabs.",
            "Planning and admin": "Planning tools can help, but too much planning can fragment attention.",
            "Recovery cues": "Recovery tabs are useful signals that the student may already be trying to self-regulate.",
            "Other context": "Unclassified tabs still contribute to total load and context switching."
        ]
        let base = explanations[name] ?? "Related browser context."
        return "\(base) \(count) tab\(count == 1 ? "" : "s") found."
    }

    private static func groupTabs(_ tabs: [BrowserTab]) -> [EvidenceGroup] {
        var order: [String] = []
        var buckets: [String: [BrowserTab]] = [:]
        for tab in tabs {
            let key = categorize(tab)
            if buckets[key] == nil { order.append(key) }
            buckets[key, default: []].append(tab)
        }
        return order.map { name in
            EvidenceGroup(name: name, explanation: groupExplanation(name, buckets[name]!.count), tabs: buckets[name]!)
        }
    }

    /// Severity relative to the factor's own maximum, so small-weight factors
    /// can still read as "high" when they're maxed out.
    private static func level(_ score: Int, _ maxValue: Int) -> RiskLevel {
        let frac = maxValue > 0 ? Double(score) / Double(maxValue) : 0
        if frac >= 0.6 { return .high }
        if frac >= 0.3 { return .medium }
        return .low
    }

    private static func cap(_ score: Double, _ maxValue: Int) -> Int {
        min(maxValue, max(0, Int(score.rounded())))
    }

    private static func durationText(_ minutes: Int) -> String {
        if minutes <= 0 { return "0m" }
        if minutes < 60 { return "\(minutes)m" }
        return "\(minutes / 60)h \(minutes % 60)m"
    }

    private static func lateNightPoints(_ hour: Int, _ maxValue: Int) -> Int {
        switch hour {
        case 2, 3, 4:  return maxValue
        case 0, 1:     return Int(Double(maxValue) * 0.85)
        case 23, 5:    return Int(Double(maxValue) * 0.6)
        case 22:       return Int(Double(maxValue) * 0.35)
        default:       return 0
        }
    }

    private static func riskSignals(_ tabs: [BrowserTab], _ groups: [EvidenceGroup],
                                    _ mood: MoodCheckIn?, _ usage: UsageStats?,
                                    _ appUsage: AppUsageSnapshot?) -> [RiskSignal] {
        let totalTabs = tabs.count
        let domainCount = Set(tabs.map(\.domain).filter { !$0.isEmpty }).count
        func tabsFor(_ name: String) -> [BrowserTab] { groups.first { $0.name == name }?.tabs ?? [] }
        let distractionTabs = tabsFor("Distraction loop")
        let researchTabs = tabsFor("Research spiral")
        let deadlineTabs = tabsFor("Deadline and class surfaces")
        let communicationTabs = tabsFor("Communication pressure")
        let activeGroups = groups.filter { !$0.tabs.isEmpty }.count

        var signals: [RiskSignal] = []

        // --- Tab + mood factors (max 66) ---

        let overloadMax = 12
        let overload = cap(Double(totalTabs - 6) * 1.4, overloadMax)
        signals.append(.init(
            id: "tab-overload", label: "Tab overload", level: level(overload, overloadMax), score: overload,
            explanation: totalTabs > 12
                ? "More open tabs than working memory can hold. Each one is an unfinished loop competing for attention, so the count itself drives the score up."
                : "Your open-tab count is still manageable, so it adds little.",
            evidence: ["\(totalTabs) open tab\(totalTabs == 1 ? "" : "s")"]))

        let switchMax = 8
        let switching = cap(Double(domainCount) * 0.6 + Double(activeGroups) * 1.2, switchMax)
        signals.append(.init(
            id: "context-switching", label: "Context switching", level: level(switching, switchMax), score: switching,
            explanation: "More distinct sites and task types means more mental gear-changes. Switching leaves 'attention residue' that erodes focus — the wider the spread, the more this adds.",
            evidence: ["\(domainCount) domain\(domainCount == 1 ? "" : "s")", "\(activeGroups) task type\(activeGroups == 1 ? "" : "s")"]))

        let distractionMax = 12
        let distraction = cap(Double(distractionTabs.count) * 3.0 + (deadlineTabs.isEmpty ? 0 : 4), distractionMax)
        signals.append(.init(
            id: "distraction-loop", label: "Distraction loop", level: level(distraction, distractionMax), score: distraction,
            explanation: "Entertainment or social tabs open alongside deadline tabs are an early avoidance signal. The mix adds more than either alone.",
            evidence: ["\(distractionTabs.count) distraction tab\(distractionTabs.count == 1 ? "" : "s")"]))

        let fragMax = 8
        let fragmentation = cap(Double(researchTabs.count) * 1.3 + Double(communicationTabs.count) * 1.1 + Double(activeGroups) * 0.6, fragMax)
        signals.append(.init(
            id: "goal-fragmentation", label: "Goal fragmentation", level: level(fragmentation, fragMax), score: fragmentation,
            explanation: "Research, messaging, and admin surfaces left open together pull your goal in several directions at once, fragmenting progress.",
            evidence: [
                "\(researchTabs.count) research tab\(researchTabs.count == 1 ? "" : "s")",
                "\(communicationTabs.count) comms tab\(communicationTabs.count == 1 ? "" : "s")"
            ]))

        let pressureMax = 12
        let pressureRaw =
            (mood?.timePressure == .high ? 9.0 : mood?.timePressure == .some ? 4.0 : 0.0) +
            (mood.map { Double($0.stress) * 1.2 } ?? 0) +
            (mood.map { Double(max(0, 5 - $0.energy)) * 1.2 } ?? 0) +
            min(4.0, Double(deadlineTabs.count) * 2)
        let pressure = cap(pressureRaw, pressureMax)
        signals.append(.init(
            id: "time-pressure", label: "Time and energy pressure", level: level(pressure, pressureMax), score: pressure,
            explanation: "Your own check-in matters: high stress, low energy, and tight deadlines raise the signal regardless of how the tabs look.",
            evidence: [
                mood != nil ? "stress \(mood!.stress)/5, energy \(mood!.energy)/5" : "no check-in yet",
                "time pressure: \(mood?.timePressure.rawValue ?? "unknown")"
            ]))

        // --- Real usage factors (max 34) ---

        if let u = usage {
            let screenMax = 12
            let screen = cap(Double(u.activeMinutesToday - 120) / 15.0, screenMax)
            signals.append(.init(
                id: "screen-time", label: "Screen time today", level: level(screen, screenMax), score: screen,
                explanation: "Prolonged screen exposure tires the eyes and attention system. Past about two active hours, fatigue climbs steadily, so this contributes more the longer you go.",
                evidence: ["\(durationText(u.activeMinutesToday)) active on this Mac today"]))

            let breakMax = 12
            let noBreak = cap(Double(u.continuousMinutes - 45) / 6.0, breakMax)
            signals.append(.init(
                id: "continuous-focus", label: "No recent break", level: level(noBreak, breakMax), score: noBreak,
                explanation: "Working with no real pause keeps stress hormones elevated — your brain never resets. After ~45 minutes the cost of pushing on rises quickly.",
                evidence: [u.onBreak ? "currently on a break" : "\(durationText(u.continuousMinutes)) since your last break"]))

            let nightMax = 6
            let night = lateNightPoints(u.hour, nightMax)
            signals.append(.init(
                id: "late-night", label: "Late-night use", level: level(night, nightMax), score: night,
                explanation: "Screen time late at night suppresses melatonin and worsens next-day fatigue, which compounds burnout over days.",
                evidence: [String(format: "active around %02d:00", u.hour)]))
        }

        // --- Whole-Mac application factors (max 18) ---
        // The point of the desktop app: score actual work across every app, not
        // just how many tabs are open.

        if let app = appUsage, app.totalMinutes > 0 || !app.apps.isEmpty {
            let distinct = app.distinctApps
            let total = app.totalMinutes
            let topApps = app.apps.prefix(3).map(\.name)

            let jugglingMax = 10
            // Beyond ~4 apps in a day, every extra app is another context to hold.
            let juggling = cap(Double(distinct - 4) * 1.4, jugglingMax)
            signals.append(.init(
                id: "app-juggling", label: "App juggling", level: level(juggling, jugglingMax), score: juggling,
                explanation: "Switching between many apps — not just tabs — fragments attention across your whole Mac. Each app is a separate context your brain has to reload, and the cost climbs with the count.",
                evidence: [
                    "\(distinct) app\(distinct == 1 ? "" : "s") used today",
                    topApps.isEmpty ? "no app activity yet" : "most used: \(topApps.joined(separator: ", "))"
                ]))

            let workloadMax = 8
            // Active work climbs past ~4h of real app time; this captures grinding
            // hard in even a single app, which open-tab counts completely miss.
            let workload = cap(Double(total - 240) / 22.0, workloadMax)
            signals.append(.init(
                id: "active-workload", label: "Active workload", level: level(workload, workloadMax), score: workload,
                explanation: "This is how much you've actually been working through today across all apps, not how many things you have open. A long, dense day of real app use raises burnout risk on its own.",
                evidence: ["\(durationText(total)) of active app use today"]))
        }

        return signals
    }

    private static func status(from score: Int) -> BurnoutStatus {
        if score >= 68 { return .red }
        if score >= 38 { return .yellow }
        return .green
    }

    private static func mainPattern(_ signals: [RiskSignal]) -> String {
        guard let top = signals.max(by: { $0.score < $1.score }), top.score >= 6 else {
            return "Stable browsing pattern"
        }
        return top.label
    }

    private static func explainPattern(_ pattern: String, _ score: Int) -> String {
        if score >= 68 {
            return "\(pattern) is the biggest driver, and your total is high enough that Custod recommends an immediate reset. This is a pattern warning light, not a diagnosis."
        }
        if score >= 38 {
            return "\(pattern) is building. A short reset now is usually cheaper than pushing through until focus collapses."
        }
        return "No severe pattern is visible right now. Keep the session bounded and Custod will flag it if pressure rises."
    }

    private static func resetPlan(_ status: BurnoutStatus, _ signals: [RiskSignal]) -> [ResetStep] {
        let top = signals.max(by: { $0.score < $1.score })
        let first: String
        switch top?.id {
        case "distraction-loop": first = "Close or park entertainment tabs before doing anything else."
        case "tab-overload":     first = "Save the current tab list, then cut down to one school surface and one work surface."
        case "time-pressure":    first = "Name the next 10 minutes out loud: recover, choose, then continue."
        case "screen-time":      first = "Step fully away from the screen — look at something 20 feet away for 20 seconds."
        case "continuous-focus": first = "Stand up and leave the desk. This stretch has run long without a real break."
        case "late-night":       first = "Set a hard stop. Late screen time is borrowing from tomorrow's focus."
        case "app-juggling":     first = "Quit the apps you're not using this hour — get down to the one or two the task actually needs."
        case "active-workload":  first = "You've already put in a heavy block today. Step fully away before the next push, not after it."
        default:                 first = "Pick the single surface that matches what you actually owe right now."
        }

        switch status {
        case .red:
            return [
                .init(title: "Stop adding inputs", detail: "Don't open another tab for five minutes. The goal is to reduce load, not search harder.", minutes: 5),
                .init(title: "Downshift", detail: first, minutes: 4),
                .init(title: "Body reset", detail: "Stand up, breathe slowly, drink water, and look away from the screen.", minutes: 3),
                .init(title: "Choose one lane", detail: "Return with one school surface, one work surface, and one communication surface at most.", minutes: 8)
            ]
        case .yellow:
            return [
                .init(title: "Make it smaller", detail: first, minutes: 3),
                .init(title: "Write the next move", detail: "One sentence: 'For the next 20 minutes, I am only doing …'", minutes: 2),
                .init(title: "Set a check-back", detail: "Custod will keep watching and flag you if it climbs again.", minutes: 1)
            ]
        case .green:
            return [
                .init(title: "Keep it bounded", detail: "Work from your current core tabs and avoid opening exploratory ones.", minutes: 2),
                .init(title: "Take breaks on time", detail: "A short pause every 45–60 minutes keeps this in the green.", minutes: 1)
            ]
        }
    }

    /// Legacy entry point (tabs + mood only). Used where usage isn't available.
    static func analyze(tabs: [BrowserTab], mood: MoodCheckIn?) -> BurnoutAnalysis {
        analyze(tabs: tabs, mood: mood, usage: nil, appUsage: nil)
    }

    static func analyze(tabs: [BrowserTab], mood: MoodCheckIn?, usage: UsageStats?,
                        appUsage: AppUsageSnapshot? = nil) -> BurnoutAnalysis {
        let evidenceGroups = groupTabs(tabs)
        let riskBreakdown = riskSignals(tabs, evidenceGroups, mood, usage, appUsage)
        let score = min(100, riskBreakdown.reduce(0) { $0 + $1.score })
        let status = status(from: score)
        let pattern = mainPattern(riskBreakdown)

        let reflection: String
        switch status {
        case .red:    reflection = "What are you afraid will happen if you stop for five minutes?"
        case .yellow: reflection = "Which open loop is making this feel heavier than it is?"
        case .green:  reflection = "What would keep this session from becoming overloaded?"
        }

        return BurnoutAnalysis(
            status: status,
            score: score,
            mainPattern: pattern,
            patternExplanation: explainPattern(pattern, score),
            riskBreakdown: riskBreakdown,
            resetPlan: resetPlan(status, riskBreakdown),
            evidenceGroups: evidenceGroups,
            reflectionPrompt: reflection,
            privacySummary: "Custod analyzed only tab titles, URLs, active state, optional check-in values, and on-device usage timing (screen time and which apps were active, by name). It never read page contents or anything inside your apps."
        )
    }
}
