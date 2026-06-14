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

// Full-window sign-in gate shown before the dashboard. Unlike SignInSheet there
// is no dismiss — Custod is account-first, so you sign in (or create an account)
// before any monitoring begins. Same Supabase project as the website and the
// Chrome extension, so one account follows you across all three.
struct SignInGateView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var email = ""
    @State private var password = ""
    @State private var mode: SignInSheet.Mode = .signIn

    private let danger = Color(red: 0.93, green: 0.31, blue: 0.27)

    var body: some View {
        ZStack {
            Color(nsColor: .windowBackgroundColor).ignoresSafeArea()
            VStack(spacing: 22) {
                VStack(spacing: 10) {
                    Image(systemName: "shield.lefthalf.filled")
                        .font(.system(size: 40, weight: .bold)).foregroundStyle(Color.brand)
                    Text("Welcome to Custod")
                        .font(.system(.largeTitle, design: .rounded).weight(.bold))
                    Text("Sign in to begin. Your burnout history syncs to your account across the Mac app, the website, and the Chrome extension — so Custod keeps learning from you and gets sharper over time.")
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: 380)
                }

                VStack(spacing: 14) {
                    Button { auth.signInWithGoogle() } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "globe")
                            Text("Continue with Google")
                                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            Spacer()
                        }
                        .padding(.vertical, 11).padding(.horizontal, 12)
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
                            .onSubmit(submit)
                    }

                    if let error = auth.lastError {
                        Text(error)
                            .font(.system(.caption, design: .rounded)).foregroundStyle(danger)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Button(action: submit) {
                        HStack {
                            Spacer()
                            if auth.isWorking {
                                ProgressView().controlSize(.small)
                            } else {
                                Text(mode.cta).font(.system(.subheadline, design: .rounded).weight(.semibold))
                            }
                            Spacer()
                        }
                        .padding(.vertical, 9)
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
                }
                .padding(24)
                .frame(width: 380)
                .background(RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color(nsColor: .controlBackgroundColor)))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1))
                .shadow(color: .black.opacity(0.05), radius: 14, y: 4)

                Text("On-device monitoring. Only tab titles and URLs ever sync — never page contents.")
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 380)
            }
            .padding(40)
        }
    }

    private func submit() {
        guard !email.isEmpty, !password.isEmpty, !auth.isWorking else { return }
        Task {
            if mode == .signIn {
                await auth.signIn(email: email, password: password)
            } else {
                await auth.signUp(email: email, password: password)
            }
        }
    }

    private var divider: some View {
        Rectangle().fill(Color.primary.opacity(0.1)).frame(height: 1)
    }
}

private extension Color {
    static let brand = Color(red: 0.07, green: 0.73, blue: 0.60)
}
