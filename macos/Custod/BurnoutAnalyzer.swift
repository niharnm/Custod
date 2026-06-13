import Foundation

// Direct port of lib/analyzer.ts — pure, deterministic, no network.

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

    private static func level(_ score: Int) -> RiskLevel {
        if score >= 18 { return .high }
        if score >= 9 { return .medium }
        return .low
    }

    private static func cap(_ score: Double, _ maxValue: Int) -> Int {
        min(maxValue, max(0, Int(score.rounded())))
    }

    private static func riskSignals(_ tabs: [BrowserTab], _ groups: [EvidenceGroup], _ mood: MoodCheckIn?) -> [RiskSignal] {
        let totalTabs = tabs.count
        let domainCount = Set(tabs.map(\.domain).filter { !$0.isEmpty }).count
        func tabsFor(_ name: String) -> [BrowserTab] { groups.first { $0.name == name }?.tabs ?? [] }
        let distractionTabs = tabsFor("Distraction loop")
        let researchTabs = tabsFor("Research spiral")
        let deadlineTabs = tabsFor("Deadline and class surfaces")
        let communicationTabs = tabsFor("Communication pressure")
        let activeGroups = groups.filter { !$0.tabs.isEmpty }.count

        var signals: [RiskSignal] = []

        let overload = cap(Double(totalTabs - 6) * 1.6, 24)
        signals.append(.init(
            id: "tab-overload", label: "Tab overload", level: level(overload), score: overload,
            explanation: totalTabs > 12
                ? "The browser is carrying more open loops than a student can comfortably hold in working memory."
                : "The open-tab count is still manageable.",
            evidence: ["\(totalTabs) submitted tab\(totalTabs == 1 ? "" : "s")"]))

        let switching = cap(Double(domainCount) * 1.2 + Double(activeGroups) * 2.2, 22)
        signals.append(.init(
            id: "context-switching", label: "Context switching", level: level(switching), score: switching,
            explanation: "More domains and more tab categories means the student is switching mental modes more often.",
            evidence: ["\(domainCount) domains", "\(activeGroups) evidence groups"]))

        let distraction = cap(Double(distractionTabs.count) * 4 + (deadlineTabs.isEmpty ? 0 : 5), 22)
        signals.append(.init(
            id: "distraction-loop", label: "Distraction loop", level: level(distraction), score: distraction,
            explanation: "Distraction tabs mixed with school or deadline tabs are an early sign of avoidance under pressure.",
            evidence: ["\(distractionTabs.count) distraction tab\(distractionTabs.count == 1 ? "" : "s")"]))

        let fragmentation = cap(Double(researchTabs.count) * 2.2 + Double(communicationTabs.count) * 2 + Double(activeGroups), 20)
        signals.append(.init(
            id: "goal-fragmentation", label: "Goal fragmentation", level: level(fragmentation), score: fragmentation,
            explanation: "Research, messaging, and admin surfaces compete for attention when they stay open together.",
            evidence: [
                "\(researchTabs.count) research tab\(researchTabs.count == 1 ? "" : "s")",
                "\(communicationTabs.count) communication tab\(communicationTabs.count == 1 ? "" : "s")"
            ]))

        let pressureRaw =
            (mood?.timePressure == .high ? 16.0 : mood?.timePressure == .some ? 8.0 : 0.0) +
            (mood.map { Double($0.stress) * 2 } ?? 0) +
            (mood.map { Double(max(0, 5 - $0.energy)) * 2 } ?? 0) +
            min(10.0, Double(deadlineTabs.count) * 3)
        signals.append(.init(
            id: "time-pressure", label: "Time and energy pressure", level: level(cap(pressureRaw, 24)), score: cap(pressureRaw, 24),
            explanation: "A high-pressure self check-in combined with deadline surfaces raises the burnout signal.",
            evidence: [
                mood != nil ? "time pressure: \(mood!.timePressure.rawValue)" : "no time-pressure check-in",
                "\(deadlineTabs.count) deadline or class tab\(deadlineTabs.count == 1 ? "" : "s")"
            ]))

        return signals
    }

    private static func status(from score: Int) -> BurnoutStatus {
        if score >= 68 { return .red }
        if score >= 38 { return .yellow }
        return .green
    }

    private static func mainPattern(_ signals: [RiskSignal]) -> String {
        guard let top = signals.max(by: { $0.score < $1.score }), top.score >= 8 else {
            return "Stable browsing pattern"
        }
        return top.label
    }

    private static func explainPattern(_ pattern: String, _ score: Int) -> String {
        if score >= 68 {
            return "\(pattern) is strong enough that Custod recommends an immediate reset before continuing. This is not a diagnosis; it is a browser-pattern warning light."
        }
        if score >= 38 {
            return "\(pattern) is building. A short reset now is likely cheaper than pushing through until focus collapses."
        }
        return "No severe burnout pattern is visible from the submitted tabs. Keep the session bounded and re-check if pressure rises."
    }

    private static func resetPlan(_ status: BurnoutStatus, _ signals: [RiskSignal]) -> [ResetStep] {
        let top = signals.max(by: { $0.score < $1.score })
        let first: String
        switch top?.id {
        case "distraction-loop": first = "Close or park entertainment tabs before doing anything else."
        case "tab-overload": first = "Save the current tab list, then reduce the browser to one school surface and one work surface."
        case "time-pressure": first = "Name the next 10 minutes out loud: recover, choose, then continue."
        default: first = "Pick the single surface that matches the current school obligation."
        }

        switch status {
        case .red:
            return [
                .init(title: "Stop adding inputs", detail: "Do not open another tab for five minutes. The goal is to reduce load, not search harder.", minutes: 5),
                .init(title: "Downshift the browser", detail: first, minutes: 4),
                .init(title: "Body reset", detail: "Stand up, breathe slowly, drink water, and look away from the screen.", minutes: 3),
                .init(title: "Choose one lane", detail: "Return with one school surface, one work surface, and one communication surface at most.", minutes: 8)
            ]
        case .yellow:
            return [
                .init(title: "Make the browser smaller", detail: first, minutes: 3),
                .init(title: "Write the next move", detail: "Use one sentence: 'For the next 20 minutes, I am only doing ...'", minutes: 2),
                .init(title: "Set a check-back", detail: "Re-check Custod after one focused block or when the tab count jumps again.", minutes: 1)
            ]
        case .green:
            return [
                .init(title: "Keep the session bounded", detail: "Work from the current core tab group and avoid opening exploratory tabs.", minutes: 2),
                .init(title: "Check again later", detail: "Run Custod again if your tab count or stress level climbs.", minutes: 1)
            ]
        }
    }

    static func analyze(tabs: [BrowserTab], mood: MoodCheckIn?) -> BurnoutAnalysis {
        let evidenceGroups = groupTabs(tabs)
        let riskBreakdown = riskSignals(tabs, evidenceGroups, mood)
        let score = min(100, riskBreakdown.reduce(0) { $0 + $1.score })
        let status = status(from: score)
        let pattern = mainPattern(riskBreakdown)

        let reflection: String
        switch status {
        case .red: reflection = "What are you afraid will happen if you stop for five minutes?"
        case .yellow: reflection = "Which open loop is making the browser feel heavier than it is?"
        case .green: reflection = "What would keep this session from becoming overloaded?"
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
            privacySummary: "Custod analyzed only submitted tab titles, URLs, active state, and optional check-in values. It did not read page contents."
        )
    }
}
