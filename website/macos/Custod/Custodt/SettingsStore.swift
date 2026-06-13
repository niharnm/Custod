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
    @Published private(set) var pinHash: String?       { didSet { d.set(pinHash, forKey: Key.pin) } }

    /// Whether the supervisor has unlocked controls for this session (not persisted).
    @Published var sessionUnlocked = false

    private let d = UserDefaults.standard
    private enum Key {
        static let mode = "custod.interventionMode"
        static let sensitivity = "custod.sensitivity"
        static let notifications = "custod.notifications"
        static let supervised = "custod.supervised"
        static let pin = "custod.pinHash"
    }

    init() {
        let d = UserDefaults.standard
        interventionMode = InterventionMode(rawValue: d.string(forKey: Key.mode) ?? "") ?? .notify
        sensitivity = Sensitivity(rawValue: d.string(forKey: Key.sensitivity) ?? "") ?? .balanced
        notificationsEnabled = d.object(forKey: Key.notifications) as? Bool ?? true
        supervisedMode = d.bool(forKey: Key.supervised)
        pinHash = d.string(forKey: Key.pin)
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
