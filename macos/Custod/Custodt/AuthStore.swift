import Foundation
import Combine
import AppKit
import AuthenticationServices

// Custod accounts on macOS — the macOS analogue of `lib/supabase` (web) and
// `extension/src/lib/supabase.ts` (extension). Signing in here authenticates
// against the SAME Supabase project, so your Mac resolves to the same user (and
// therefore the same email) as the website and the browser extension. Once
// signed in, CustodSync sends `Authorization: Bearer <token>` on every push, and
// the server's resolveOwner() scopes the data to your account.
//
// Talks to Supabase Auth (GoTrue) over plain REST — no third-party SDK:
//   • email/password  → POST /auth/v1/token?grant_type=password
//   • sign-up         → POST /auth/v1/signup
//   • Google          → ASWebAuthenticationSession on /auth/v1/authorize?provider=google
//   • refresh         → POST /auth/v1/token?grant_type=refresh_token
//
// The session (access + refresh tokens) is stored in the Keychain so it survives
// relaunches; tokens are refreshed transparently when they near expiry.
@MainActor
final class AuthStore: NSObject, ObservableObject {

    struct Account: Equatable {
        let id: String
        let email: String?
    }

    @Published private(set) var account: Account?
    @Published private(set) var isWorking = false
    /// User-facing message from the last failed action; cleared on the next try.
    @Published var lastError: String?

    var isSignedIn: Bool { account != nil }

    private var session: StoredSession?
    private var webAuthSession: ASWebAuthenticationSession?
    private static let keychainAccount = "supabase-session"

    override init() {
        super.init()
        loadSession()
    }

    // MARK: Public actions

    func signIn(email: String, password: String) async {
        await run {
            let token = try await self.requestToken(
                grant: "password",
                body: ["email": email, "password": password]
            )
            guard token.access_token != nil else {
                throw AuthError.message("Could not sign in. Check your email and password.")
            }
            self.persist(self.makeSession(from: token))
            await self.claimDeviceHistory()
        }
    }

    func signUp(email: String, password: String) async {
        await run {
            let token = try await self.requestToken(
                grant: nil, // /auth/v1/signup, not the token endpoint
                path: "auth/v1/signup",
                body: ["email": email, "password": password]
            )
            // With "Confirm email" ON, sign-up returns a user but no session — the
            // user must click the emailed link before they can sign in.
            guard token.access_token != nil else {
                throw AuthError.message("Account created. Check your email to confirm, then sign in.")
            }
            self.persist(self.makeSession(from: token))
            await self.claimDeviceHistory()
        }
    }

    /// "Continue with Google" — opens the system web-auth sheet on Supabase's
    /// OAuth endpoint. ASWebAuthenticationSession catches the `custod://` redirect
    /// internally (no Info.plist URL scheme needed).
    func signInWithGoogle() {
        lastError = nil
        var comps = URLComponents(
            url: CustodConfig.supabaseURL.appendingPathComponent("auth/v1/authorize"),
            resolvingAgainstBaseURL: false
        )!
        comps.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: CustodConfig.callbackURL),
        ]
        guard let authURL = comps.url else { return }

        let webAuth = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: CustodConfig.callbackScheme
        ) { [weak self] callback, error in
            guard let self else { return }
            Task { @MainActor in
                if let callback {
                    await self.handleOAuthCallback(callback)
                } else if let error {
                    // A user-cancelled sheet is not an error worth surfacing.
                    let cancelled = (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin
                    if !cancelled { self.lastError = "Google sign-in was interrupted. Try again." }
                }
            }
        }
        webAuth.presentationContextProvider = self
        webAuth.prefersEphemeralWebBrowserSession = false
        webAuthSession = webAuth
        webAuth.start()
    }

    func signOut() {
        // Best-effort token revocation; local sign-out happens regardless.
        if let token = session?.accessToken {
            Task { try? await self.post(path: "auth/v1/logout", bearer: token, body: [:]) }
        }
        session = nil
        account = nil
        Keychain.delete(account: Self.keychainAccount)
    }

    /// Identity headers for an API call: a fresh Bearer token when signed in,
    /// else the anonymous device header (those rows get claimed on sign-in).
    func identityHeaders() async -> [String: String] {
        if let token = await validAccessToken() {
            return ["Authorization": "Bearer \(token)"]
        }
        return ["X-Custod-Device": DeviceIdentity.current]
    }

    // MARK: Session lifecycle

    private func loadSession() {
        guard let data = Keychain.get(account: Self.keychainAccount),
              let stored = try? JSONDecoder().decode(StoredSession.self, from: data) else { return }
        session = stored
        account = Account(id: stored.userId, email: stored.email)
    }

    private func persist(_ stored: StoredSession) {
        session = stored
        account = Account(id: stored.userId, email: stored.email)
        if let data = try? JSONEncoder().encode(stored) {
            Keychain.set(data, account: Self.keychainAccount)
        }
    }

    /// A non-expired access token, refreshing first if it's within a minute of
    /// expiry. Returns nil when signed out.
    private func validAccessToken() async -> String? {
        guard let current = session else { return nil }
        if current.expiresAt.timeIntervalSinceNow > 60 { return current.accessToken }
        do {
            let token = try await requestToken(
                grant: "refresh_token",
                body: ["refresh_token": current.refreshToken]
            )
            guard token.access_token != nil else { return current.accessToken }
            let refreshed = makeSession(from: token, fallback: current)
            persist(refreshed)
            return refreshed.accessToken
        } catch {
            // Best effort: hand back the (possibly stale) token; a 401 just drops
            // the caller to the anonymous device path.
            return current.accessToken
        }
    }

    private func handleOAuthCallback(_ url: URL) async {
        // GoTrue returns tokens in the URL fragment:
        //   custod://auth-callback#access_token=…&refresh_token=…&expires_in=…
        let comps = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let params = parseFormEncoded(comps?.fragment ?? "")
            .merging(parseFormEncoded(comps?.query ?? "")) { first, _ in first }

        guard let access = params["access_token"], let refresh = params["refresh_token"] else {
            lastError = params["error_description"]?.replacingOccurrences(of: "+", with: " ")
                ?? "Google sign-in did not return a session."
            return
        }
        let expiresIn = Int(params["expires_in"] ?? "") ?? 3600
        await run {
            let user = try? await self.fetchUser(accessToken: access)
            let stored = StoredSession(
                accessToken: access,
                refreshToken: refresh,
                expiresAt: Date().addingTimeInterval(TimeInterval(expiresIn)),
                userId: user?.id ?? "",
                email: user?.email
            )
            self.persist(stored)
            await self.claimDeviceHistory()
        }
    }

    /// Re-parent this Mac's pre-login (device-scoped) checks onto the account.
    private func claimDeviceHistory() async {
        guard let token = session?.accessToken else { return }
        try? await post(
            base: CustodConfig.webAppURL,
            path: "api/me/claim",
            bearer: token,
            body: ["deviceId": DeviceIdentity.current],
            sendApiKey: false
        )
    }

    // MARK: Supabase REST plumbing

    private struct TokenResponse: Decodable {
        let access_token: String?
        let refresh_token: String?
        let expires_in: Int?
        let expires_at: Int?
        let user: UserPayload?
        struct UserPayload: Decodable { let id: String; let email: String? }
    }

    private struct UserResponse: Decodable { let id: String; let email: String? }

    private struct StoredSession: Codable {
        var accessToken: String
        var refreshToken: String
        var expiresAt: Date
        var userId: String
        var email: String?
    }

    private func makeSession(from token: TokenResponse, fallback: StoredSession? = nil) -> StoredSession {
        let expiresAt: Date = token.expires_at.map { Date(timeIntervalSince1970: TimeInterval($0)) }
            ?? Date().addingTimeInterval(TimeInterval(token.expires_in ?? 3600))
        return StoredSession(
            accessToken: token.access_token ?? fallback?.accessToken ?? "",
            refreshToken: token.refresh_token ?? fallback?.refreshToken ?? "",
            expiresAt: expiresAt,
            userId: token.user?.id ?? fallback?.userId ?? "",
            email: token.user?.email ?? fallback?.email
        )
    }

    /// POST to the Supabase Auth token/sign-up endpoints and decode the session.
    private func requestToken(
        grant: String?,
        path: String = "auth/v1/token",
        body: [String: String]
    ) async throws -> TokenResponse {
        var comps = URLComponents(
            url: CustodConfig.supabaseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        )!
        if let grant { comps.queryItems = [URLQueryItem(name: "grant_type", value: grant)] }

        var request = URLRequest(url: comps.url!)
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(CustodConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AuthError.message("No response from the server.") }
        if !(200..<300).contains(http.statusCode) {
            throw AuthError.message(Self.errorMessage(from: data, status: http.statusCode))
        }
        return try JSONDecoder().decode(TokenResponse.self, from: data)
    }

    private func fetchUser(accessToken: String) async throws -> UserResponse {
        var request = URLRequest(url: CustodConfig.supabaseURL.appendingPathComponent("auth/v1/user"))
        request.timeoutInterval = 15
        request.setValue(CustodConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(UserResponse.self, from: data)
    }

    /// Generic authed POST (used for logout + the web app's claim endpoint).
    private func post(
        base: URL = CustodConfig.supabaseURL,
        path: String,
        bearer: String,
        body: [String: String],
        sendApiKey: Bool = true
    ) async throws {
        var request = URLRequest(url: base.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization")
        if sendApiKey { request.setValue(CustodConfig.supabaseAnonKey, forHTTPHeaderField: "apikey") }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        _ = try await URLSession.shared.data(for: request)
    }

    // MARK: Helpers

    private func run(_ work: @escaping () async throws -> Void) async {
        isWorking = true
        lastError = nil
        do {
            try await work()
        } catch let AuthError.message(message) {
            lastError = message
        } catch {
            lastError = error.localizedDescription
        }
        isWorking = false
    }

    private static func errorMessage(from data: Data, status: Int) -> String {
        struct GoTrueError: Decodable {
            let error_description: String?
            let msg: String?
            let error: String?
            let message: String?
        }
        if let parsed = try? JSONDecoder().decode(GoTrueError.self, from: data) {
            let text = parsed.error_description ?? parsed.msg ?? parsed.message ?? parsed.error
            if let text, !text.isEmpty { return text }
        }
        return "Something went wrong (\(status)). Please try again."
    }

    private func parseFormEncoded(_ raw: String) -> [String: String] {
        var result: [String: String] = [:]
        for pair in raw.split(separator: "&") {
            let parts = pair.split(separator: "=", maxSplits: 1).map(String.init)
            guard let key = parts.first else { continue }
            let value = parts.count > 1 ? parts[1] : ""
            result[key.removingPercentEncoding ?? key] = value.removingPercentEncoding ?? value
        }
        return result
    }
}

enum AuthError: Error {
    case message(String)
}

// The system web-auth sheet needs a window to anchor to.
extension AuthStore: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        NSApplication.shared.keyWindow
            ?? NSApplication.shared.windows.first
            ?? ASPresentationAnchor()
    }
}
