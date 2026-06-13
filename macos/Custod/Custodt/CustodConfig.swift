import Foundation

// Shared configuration for Custod's account + sync layer. Mirrors the web app's
// `lib/supabase` config and the extension's `extension/src/lib/config.ts` so the
// macOS app authenticates against the *same* Supabase project and posts to the
// *same* backend. That shared identity is what ties your macOS data to the same
// email account you sign into on the web (with Google or email/password).
//
// The Supabase URL and anon ("publishable") key are PUBLIC values — safe to ship
// in a client binary. The service-role / secret key is never here; only the web
// server holds it.
enum CustodConfig {
    /// Base URL of the Custod web app / API. Override at runtime with the
    /// CUSTOD_WEB_URL env var (handy for pointing a dev build at a deployed app).
    static var webAppURL: URL {
        envURL("CUSTOD_WEB_URL") ?? URL(string: "http://localhost:3000")!
    }

    /// Supabase project URL — the SAME project the website and extension use, so
    /// a Google account on the web resolves to the same user here.
    static var supabaseURL: URL {
        envURL("CUSTOD_SUPABASE_URL") ?? URL(string: "https://vdzugcxkqzfauaywiria.supabase.co")!
    }

    /// Public anon / publishable key. Safe to embed in a client.
    static var supabaseAnonKey: String {
        envString("CUSTOD_SUPABASE_ANON_KEY") ?? "sb_publishable_TNHK5xvMnBTUtyZICiFRQA_-W6qxTC5"
    }

    /// Custom URL scheme used as the OAuth callback for the system web-auth sheet.
    /// `ASWebAuthenticationSession` intercepts this redirect internally, so the
    /// scheme does NOT need to be registered in Info.plist. Supabase must allow
    /// `custod://auth-callback` in its redirect-URL list for "Continue with
    /// Google" to complete — see docs/AUTH_SETUP.md.
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
