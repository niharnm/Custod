import Foundation

// Configuration for Custod's optional AI reasoning layer (Groq).
//
// SECURITY NOTE: a key embedded in a shipped client binary can be extracted by
// anyone with the app. That is acceptable for a personal / local build, but if
// you ever distribute Custod you should NOT ship a real key here — instead leave
// `bundledDefaultKey` empty and either (a) have each user paste their own key in
// Settings, or (b) route the call through your web backend so the key stays
// server-side (the browser extension already works that way via /api/scans).
//
// Resolution order for the key at runtime (see SettingsStore.groqAPIKey):
//   1. A key the user pasted into Settings (UserDefaults).
//   2. The GROQ_API_KEY environment variable (handy for dev runs from Xcode).
//   3. `bundledDefaultKey` below.
enum AIConfig {
    /// Default Groq key baked into this build. Empty string = no bundled key.
    ///
    /// Intentionally EMPTY so no secret lives in source control. Provide a key at
    /// runtime instead — paste it in Settings (stored in local UserDefaults) or
    /// set the GROQ_API_KEY environment variable. See SettingsStore.resolvedGroqKey.
    static let bundledDefaultKey = ""

    /// Groq model used for the reasoning pass. Fast, JSON-mode capable.
    static let model = "llama-3.3-70b-versatile"

    static let endpoint = URL(string: "https://api.groq.com/openai/v1/chat/completions")!

    /// Key from the environment, if present (used as a fallback before the
    /// bundled default so a dev run can override without touching code).
    static var environmentKey: String? {
        let value = ProcessInfo.processInfo.environment["GROQ_API_KEY"]?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return (value?.isEmpty == false) ? value : nil
    }
}
