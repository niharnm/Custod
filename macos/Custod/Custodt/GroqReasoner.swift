import Foundation

// Optional AI reasoning layer for the macOS app.
//
// The deterministic BurnoutAnalyzer already produces the score, status, and a
// transparent per-factor breakdown. GroqReasoner adds *judgement* on top: it
// sends the full signal set (tabs, mood, AND the macOS-only signals — screen
// time, continuous focus, late-night use, app juggling, active workload) to
// Groq and asks it to reason about WHY this mix reads the way it does, rather
// than assuming "many tabs = stressed". It never changes the score; it returns
// a short summary + a few evidence-based reasons that the UI surfaces.
//
// Privacy: only tab titles/URLs, the per-factor breakdown, and timing numbers
// are sent — never page contents or anything inside your apps. The call only
// happens when the user has switched AI reasoning on in Settings.

enum GroqReasoner {

    struct Result {
        let summary: String
        let reasons: [String]
    }

    enum ReasonerError: Error {
        case noKey
        case badStatus(Int)
        case emptyResponse
        case decode
    }

    /// Run the reasoning pass. `apiKey` is resolved by the caller (Settings →
    /// env → bundled default). Throws on any failure so the caller can fall back
    /// to the deterministic wording untouched.
    static func reason(
        analysis: BurnoutAnalysis,
        tabs: [BrowserTab],
        mood: MoodCheckIn?,
        usage: UsageStats?,
        appUsage: AppUsageSnapshot?,
        apiKey: String
    ) async throws -> Result {
        let key = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else { throw ReasonerError.noKey }

        let payload = buildPayload(analysis: analysis, tabs: tabs, mood: mood, usage: usage, appUsage: appUsage)

        let body: [String: Any] = [
            "model": AIConfig.model,
            "temperature": 0.3,
            "response_format": ["type": "json_object"],
            "messages": [
                ["role": "system", "content": systemPrompt],
                ["role": "user", "content": payload],
            ],
        ]

        var request = URLRequest(url: AIConfig.endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw ReasonerError.badStatus(http.statusCode)
        }

        // Groq is OpenAI-compatible: choices[0].message.content holds the JSON string.
        guard
            let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let choices = root["choices"] as? [[String: Any]],
            let message = choices.first?["message"] as? [String: Any],
            let content = message["content"] as? String
        else { throw ReasonerError.emptyResponse }

        return try parse(content)
    }

    /// Parse the model's JSON content into a sanitized, safe Result.
    private static func parse(_ content: String) throws -> Result {
        guard
            let contentData = content.data(using: .utf8),
            let parsed = try? JSONSerialization.jsonObject(with: contentData) as? [String: Any]
        else { throw ReasonerError.decode }

        let summary = (parsed["summary"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let rawReasons = (parsed["reasons"] as? [Any] ?? []).compactMap { $0 as? String }
        let trimmed = rawReasons
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { $0.count >= 4 }
        let reasons = Array(trimmed.prefix(5))

        guard !summary.isEmpty || !reasons.isEmpty else { throw ReasonerError.emptyResponse }
        guard isSafe(summary), reasons.allSatisfy(isSafe) else { throw ReasonerError.decode }

        return Result(summary: summary, reasons: Array(reasons))
    }

    /// Block medical/diagnostic/panic framing — Custod is a pattern light, not a
    /// clinician. Mirrors the web layer's isSafeWording guard.
    private static func isSafe(_ text: String) -> Bool {
        let lowered = text.lowercased()
        let banned = [
            "diagnose", "diagnosis", "clinical", "therapy", "therapist",
            "depression", "anxiety", "adhd", "crisis", "emergency",
            "you are burned out", "mental health score",
        ]
        return !banned.contains { lowered.contains($0) }
    }

    private static func buildPayload(
        analysis: BurnoutAnalysis,
        tabs: [BrowserTab],
        mood: MoodCheckIn?,
        usage: UsageStats?,
        appUsage: AppUsageSnapshot?
    ) -> String {
        var lines: [String] = []
        lines.append("DETERMINISTIC RESULT (do not change):")
        lines.append("- status: \(analysis.status.rawValue)")
        lines.append("- score: \(analysis.score)/100")
        lines.append("- main pattern: \(analysis.mainPattern)")
        lines.append("")
        lines.append("FACTOR BREAKDOWN (label: points, level — evidence):")
        for f in analysis.riskBreakdown {
            let ev = f.evidence.joined(separator: "; ")
            lines.append("- \(f.label): \(f.score) pts, \(f.level.rawValue) — \(ev)")
        }
        lines.append("")
        lines.append("OPEN TABS (\(tabs.count)), titles/urls only:")
        for t in tabs.prefix(40) {
            lines.append("- \(t.title) | \(t.domain)")
        }
        lines.append("")
        if let m = mood {
            lines.append("SELF CHECK-IN: stress \(m.stress)/5, energy \(m.energy)/5, time pressure \(m.timePressure.rawValue)")
            if !m.reflection.isEmpty { lines.append("Note from user: \(m.reflection)") }
        } else {
            lines.append("SELF CHECK-IN: none provided")
        }
        if let u = usage {
            lines.append("USAGE: \(u.activeMinutesToday)m active today, \(u.continuousMinutes)m since last break, hour-of-day \(u.hour), onBreak \(u.onBreak)")
        }
        if let a = appUsage {
            let top = a.apps.prefix(3).map { "\($0.name) \($0.minutes)m" }.joined(separator: ", ")
            lines.append("APPS: \(a.distinctApps) apps used, \(a.totalMinutes)m total active app time. Top: \(top.isEmpty ? "n/a" : top)")
        }
        return lines.joined(separator: "\n")
    }

    private static let systemPrompt = """
    You are Custod's reasoning layer on macOS. You receive a deterministic \
    burnout analysis (status, score, per-factor breakdown) plus the raw signals: \
    open tabs, the user's optional check-in, screen time, time since last break, \
    hour of day, and how many apps they're juggling.

    Your job is to think through WHY this specific combination reads the way it \
    does — do NOT assume 'many tabs = stressed'. Weigh the factors against each \
    other: a focused person grinding in one app for 4 hours with no break is a \
    different story from someone with 12 tabs split across distractions and a \
    deadline. Late-night use, a long unbroken stretch, low energy with high time \
    pressure, or a distraction/deadline overlap are the kinds of things that \
    actually drive the status.

    Return STRICT JSON only:
    {
      "summary": "one sentence to the user (as 'you') naming the clearest reason for this status, grounded in the real signals",
      "reasons": ["2-4 short, concrete factor-based reasons, e.g. '3h 20m of unbroken focus with no break logged'"]
    }

    Rules: Do not change or restate the numeric score/status as if you computed \
    it — explain it. If the status is green, your reasoning must reflect that it \
    looks bounded, not strained. Use focus/work-pattern framing, never medical, \
    therapy, diagnostic, panic, certainty, or shame language. Never reference \
    page contents or anything inside the user's apps.
    """
}
