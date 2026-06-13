import Foundation

// Port of lib/types.ts

struct BrowserTab: Codable, Identifiable, Hashable {
    var id = UUID()
    var title: String
    var url: String
    var active: Bool = false

    var text: String { "\(title) \(url)".lowercased() }

    /// Mirrors cleanDomain() from lib/utils.ts
    var domain: String {
        guard !url.isEmpty else { return "" }
        if let comps = URLComponents(string: url), let host = comps.host {
            return host.hasPrefix("www.") ? String(host.dropFirst(4)) : host
        }
        var stripped = url
        for prefix in ["https://", "http://", "www."] where stripped.hasPrefix(prefix) {
            stripped = String(stripped.dropFirst(prefix.count))
        }
        return stripped.split(separator: "/").first.map(String.init) ?? stripped
    }
}

enum BurnoutStatus: String, Codable {
    case green, yellow, red

    var label: String { rawValue.capitalized }
}

enum RiskLevel: String, Codable {
    case low, medium, high
}

enum TimePressure: String, Codable, CaseIterable {
    case none, some, high
    var label: String { rawValue.capitalized }
}

struct MoodCheckIn: Codable, Hashable {
    var energy: Int = 3       // 1...5
    var stress: Int = 3       // 1...5
    var timePressure: TimePressure = .some
    var reflection: String = ""
}

struct EvidenceGroup: Codable, Identifiable, Hashable {
    var id = UUID()
    var name: String
    var explanation: String
    var tabs: [BrowserTab]
}

struct RiskSignal: Codable, Identifiable, Hashable {
    var id: String
    var label: String
    var level: RiskLevel
    var score: Int
    var explanation: String
    var evidence: [String]
}

struct ResetStep: Codable, Identifiable, Hashable {
    var id = UUID()
    var title: String
    var detail: String
    var minutes: Int
}

struct BurnoutAnalysis: Codable, Hashable {
    var status: BurnoutStatus
    var score: Int
    var mainPattern: String
    var patternExplanation: String
    var riskBreakdown: [RiskSignal]
    var resetPlan: [ResetStep]
    var evidenceGroups: [EvidenceGroup]
    var reflectionPrompt: String
    var privacySummary: String
}

struct BurnoutCheckRecord: Codable, Identifiable, Hashable {
    var id = UUID()
    var createdAt: Date = .init()
    var rawTabs: [BrowserTab]
    var mood: MoodCheckIn?
    var analysis: BurnoutAnalysis
}
