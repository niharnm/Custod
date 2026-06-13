import SwiftUI

// Sign-in / sign-up sheet for Custod accounts. One account ties your burnout
// history to your email across the Mac app, the website, and the Chrome
// extension. Offers "Continue with Google" (system web-auth sheet) and
// email/password, both against the same Supabase project the web app uses.
struct SignInSheet: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var mode: Mode = .signIn

    enum Mode {
        case signIn, signUp
        var title: String { self == .signIn ? "Sign in" : "Create account" }
        var cta: String { self == .signIn ? "Sign in" : "Create account" }
        var toggle: String {
            self == .signIn
                ? "New to Custod? Create an account"
                : "Already have an account? Sign in"
        }
    }

    private let danger = Color(red: 0.93, green: 0.31, blue: 0.27)

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "shield.lefthalf.filled")
                    .font(.system(size: 18, weight: .bold)).foregroundStyle(Color.brand)
                Text(mode.title).font(.system(.title2, design: .rounded).weight(.bold))
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }

            Text("One account syncs your burnout history across the Mac app, the website, and the Chrome extension — all tied to your email.")
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            Button { auth.signInWithGoogle() } label: {
                HStack(spacing: 8) {
                    Image(systemName: "globe")
                    Text("Continue with Google").font(.system(.subheadline, design: .rounded).weight(.semibold))
                    Spacer()
                }
                .padding(.vertical, 10).padding(.horizontal, 12)
                .frame(maxWidth: .infinity)
                .background(RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Color.primary.opacity(0.15), lineWidth: 1))
            }
            .buttonStyle(.plain)

            HStack(spacing: 10) {
                divider
                Text("or").font(.system(.caption2, design: .rounded)).foregroundStyle(.secondary)
                divider
            }

            VStack(spacing: 8) {
                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.username)
                    .disableAutocorrection(true)
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(mode == .signIn ? .password : .newPassword)
            }

            if let error = auth.lastError {
                Text(error)
                    .font(.system(.caption, design: .rounded)).foregroundStyle(danger)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Button {
                Task {
                    if mode == .signIn {
                        await auth.signIn(email: email, password: password)
                    } else {
                        await auth.signUp(email: email, password: password)
                    }
                    if auth.isSignedIn { dismiss() }
                }
            } label: {
                HStack {
                    Spacer()
                    if auth.isWorking {
                        ProgressView().controlSize(.small)
                    } else {
                        Text(mode.cta).font(.system(.subheadline, design: .rounded).weight(.semibold))
                    }
                    Spacer()
                }
                .padding(.vertical, 8)
            }
            .buttonStyle(.borderedProminent).tint(Color.brand)
            .disabled(email.isEmpty || password.isEmpty || auth.isWorking)

            Button(mode.toggle) {
                mode = (mode == .signIn) ? .signUp : .signIn
                auth.lastError = nil
            }
            .buttonStyle(.plain)
            .font(.system(.caption, design: .rounded).weight(.medium))
            .foregroundStyle(Color.brand)
            .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(22)
        .frame(width: 380)
    }

    private var divider: some View {
        Rectangle().fill(Color.primary.opacity(0.1)).frame(height: 1)
    }
}

private extension Color {
    static let brand = Color(red: 0.07, green: 0.73, blue: 0.60)
}
