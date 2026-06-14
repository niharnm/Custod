import Foundation

// Pushes macOS burnout checks to the Custod backend so they show up under your
// account on the web dashboard. Mirrors the browser extension's `runScan`: POST
// the current tabs to `/api/scans`, identified by a Bearer token when signed in
// (data lands on your account) or the anonymous device header when signed out
// (those rows are claimed onto the account the moment you sign in).
//
// Only tab titles and URLs leave the Mac — never page contents, and never the
// per-app activity Custod reads locally. Pushes are best-effort and fire-and-
// forget so monitoring never blocks on the network.
@MainActor
final class CustodSync {
    private let auth: AuthStore

    init(auth: AuthStore) {
        self.auth = auth
    }

    /// Sync one check. The web `/api/scans` endpoint scores from tab titles/URLs,
    /// so an app-usage-only tick (browser closed → no tabs) stays local; there's
    /// nothing for the server to score. Checks with tabs flow to the account.
    func push(_ record: BurnoutCheckRecord) async {
        let tabs = record.rawTabs
        guard !tabs.isEmpty else { return }

        // Account-first: sync only when signed in. No token → keep the reading
        // local rather than storing it anonymously.
        guard let authHeaders = await auth.authorizationHeader() else { return }

        var request = URLRequest(url: CustodConfig.webAppURL.appendingPathComponent("api/scans"))
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        for (field, value) in authHeaders {
            request.setValue(value, forHTTPHeaderField: field)
        }

        let payload: [String: Any] = [
            "tabs": tabs.map { ["title": $0.title, "url": $0.url, "active": $0.active] }
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        _ = try? await URLSession.shared.data(for: request)
    }
}
