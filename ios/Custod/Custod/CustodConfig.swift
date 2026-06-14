import Foundation

// Shared configuration for Custod's account layer on iOS. Mirrors the macOS app
// (`macos/.../CustodConfig.swift`), the web app (`lib/supabase`), and the
// extension so iOS authenticates against the SAME Supabase project — signing in
// here resolves to the same account (and email) as every other Custod client.
//
// The Supabase URL and anon ("publishable") key are PUBLIC values, safe to ship
// in a client binary. The service-role / secret key is never here.
enum CustodConfig {
    static var supabaseURL: URL {
        envURL("CUSTOD_SUPABASE_URL") ?? URL(string: "https://vdzugcxkqzfauaywiria.supabase.co")!
    }

    static var supabaseAnonKey: String {
        envString("CUSTOD_SUPABASE_ANON_KEY") ?? "sb_publishable_TNHK5xvMnBTUtyZICiFRQA_-W6qxTC5"
    }

    /// Custom URL scheme used as the OAuth callback for the system web-auth sheet.
    /// Supabase must allow `custod://auth-callback` in its redirect-URL list for
    /// "Continue with Google" to complete.
    static let callbackScheme = "custod"
    static let callbackURL = "custod://auth-callback"

    private static func envString(_ key: String) -> String? {
        let value = ProcessInfo.processInfo.environment[key]?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return (value?.isEmpty == false) ? value : nil
    }

    private static func envURL(_ key: String) -> URL? {
        guard let raw = envString(key) else { return nil }
        return URL(string: raw)
    }
}
