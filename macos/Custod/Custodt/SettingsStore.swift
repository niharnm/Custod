import Foundation
import Combine
import CryptoKit

// User preferences for how Custod behaves: how aggressively it intervenes, and
// whether a supervisor (e.g. a parent, or your own committed self) has locked
// those choices behind a PIN. Persisted in UserDefaults; the PIN is stored only
// as a SHA-256 hash, never in plaintext.

enum InterventionMode: String, CaseIterable, Identifiable, Codable {
    case off, notify, autopilot
    var id: String { rawValue }

    var label: String {
        switch self {
        case .off:       return "Off"
        case .notify:    return "Notify me"
        case .autopilot: return "Autopilot"
        }
    }

    var blurb: String {
        switch self {
        case .off:       return "Custod watches silently. No interruptions."
        case .notify:    return "Custod alerts you when burnout starts climbing."
        case .autopilot: return "Custod steps in on its own with a guided reset."
        }
    }

    var icon: String {
        switch self {
        case .off:       return "moon.zzz.fill"
        case .notify:    return "bell.badge.fill"
        case .autopilot: return "sparkles"
        }
    }
}

enum Sensitivity: String, CaseIterable, Identifiable, Codable {
    case gentle, balanced, strict
    var id: String { rawValue }
    var label: String { rawValue.capitalized }

    /// Burnout score at or above which Custod intervenes.
    var triggerScore: Int {
        switch self {
        case .gentle:   return 80
        case .balanced: return 65
        case .strict:   return 50
        }
    }

    /// Strict mode also intervenes on a sustained yellow.
    var triggerOnYellow: Bool { self == .strict }

    /// Minutes Custod waits before intervening again.
    var cooldownMinutes: Int {
        switch self {
        case .gentle:   return 30
        case .balanced: return 20
        case .strict:   return 10
        }
    }

    /// Length of an autopilot reset break.
    var breakMinutes: Int {
        switch self {
        case .gentle:   return 3
        case .balanced: return 5
        case .strict:   return 8
        }
    }
}

@MainActor
final class SettingsStore: ObservableObject {
    @Published var interventionMode: InterventionMode { didSet { d.set(interventionMode.rawValue, forKey: Key.mode) } }
    @Published var sensitivity: Sensitivity            { didSet { d.set(sensitivity.rawValue, forKey: Key.sensitivity) } }
    @Published var notificationsEnabled: Bool          { didSet { d.set(notificationsEnabled, forKey: Key.notifications) } }
    @Published var supervisedMode: Bool                { didSet { d.set(supervisedMode, forKey: Key.supervised); if !supervisedMode { sessionUnlocked = false } } }
    @Published var hasOnboarded: Bool                  { didSet { d.set(hasOnboarded, forKey: Key.onboarded) } }

    /// Opt-in: when on, Custod adds an AI reasoning pass (Groq) that explains
    /// *why* a session reads as strained, weighing multiple factors. Sends tab
    /// titles/URLs and timing to Groq's cloud — off by default so the app stays
    /// fully local unless the user chooses otherwise.
    @Published var aiReasoningEnabled: Bool            { didSet { d.set(aiReasoningEnabled, forKey: Key.aiEnabled) } }

    /// User-supplied Groq key. Empty means fall back to the env var; with neither, AI is off.
    @Published var groqAPIKeyOverride: String          { didSet { d.set(groqAPIKeyOverride, forKey: Key.groqKey) } }

    @Published private(set) var pinHash: String?       { didSet { d.set(pinHash, forKey: Key.pin) } }

    /// Whether the supervisor has unlocked controls for this session (not persisted).
    @Published var sessionUnlocked = false

    private let d = UserDefaults.standard
    private enum Key {
        static let mode = "custod.interventionMode"
        static let sensitivity = "custod.sensitivity"
        static let notifications = "custod.notifications"
        static let supervised = "custod.supervised"
        static let onboarded = "custod.onboarded"
        static let pin = "custod.pinHash"
        static let aiEnabled = "custod.aiReasoningEnabled"
        static let groqKey = "custod.groqAPIKey"
    }

    init() {
        let d = UserDefaults.standard
        interventionMode = InterventionMode(rawValue: d.string(forKey: Key.mode) ?? "") ?? .notify
        sensitivity = Sensitivity(rawValue: d.string(forKey: Key.sensitivity) ?? "") ?? .balanced
        notificationsEnabled = d.object(forKey: Key.notifications) as? Bool ?? false
        supervisedMode = d.bool(forKey: Key.supervised)
        hasOnboarded = d.bool(forKey: Key.onboarded)
        // Default OFF (opt-in); aiReasoningActive also gates on a key actually being
        // present, so nothing is sent until the user provides one (Settings or
        // GROQ_API_KEY). Users can turn it off to keep the app fully local.
        aiReasoningEnabled = d.object(forKey: Key.aiEnabled) as? Bool ?? false
        groqAPIKeyOverride = d.string(forKey: Key.groqKey) ?? ""
        pinHash = d.string(forKey: Key.pin)
    }

    /// The Groq key to actually use: user override → env var.
    /// Empty string means "no key available".
    var resolvedGroqKey: String {
        let override = groqAPIKeyOverride.trimmingCharacters(in: .whitespacesAndNewlines)
        if !override.isEmpty { return override }
        if let env = AIConfig.environmentKey { return env }
        return ""
    }

    /// AI reasoning is usable only when the toggle is on and a key exists.
    var aiReasoningActive: Bool {
        aiReasoningEnabled && !resolvedGroqKey.isEmpty
    }

    var hasPIN: Bool { pinHash != nil }

    /// Controls are locked when supervised mode is on, a PIN exists, and this
    /// session hasn't been unlocked.
    var isLocked: Bool { supervisedMode && hasPIN && !sessionUnlocked }

    func setPIN(_ pin: String) { pinHash = Self.hash(pin) }
    func clearPIN() { pinHash = nil; sessionUnlocked = true }
    func verify(_ pin: String) -> Bool { hasPIN && Self.hash(pin) == pinHash }

    /// Returns true on success.
    @discardableResult
    func unlock(with pin: String) -> Bool {
        guard verify(pin) else { return false }
        sessionUnlocked = true
        return true
    }

    func lock() { sessionUnlocked = false }

    private static func hash(_ s: String) -> String {
        SHA256.hash(data: Data(s.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}
