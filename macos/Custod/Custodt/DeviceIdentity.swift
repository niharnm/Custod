import Foundation

// Stable anonymous device id for this Mac. Used as the `X-Custod-Device` header
// when signed out, so pre-login checks are still grouped — and can be *claimed*
// onto your account the moment you sign in (mirrors the web/extension claim flow
// via POST /api/me/claim). Persisted in UserDefaults; it carries no PII.
enum DeviceIdentity {
    private static let key = "custod.deviceId"

    static var current: String {
        let defaults = UserDefaults.standard
        if let existing = defaults.string(forKey: key), !existing.isEmpty {
            return existing
        }
        let fresh = "mac-" + UUID().uuidString.lowercased()
        defaults.set(fresh, forKey: key)
        return fresh
    }
}
