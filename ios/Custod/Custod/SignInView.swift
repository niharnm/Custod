import SwiftUI

// The login gate. Mirrors the macOS sign-in screen and the extension's auth view:
// Continue with Google, or email/password, against the same Supabase account.
struct SignInView: View {
    @EnvironmentObject private var auth: AuthStore

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""

    enum Mode { case signIn, signUp }

    private var title: String { mode == .signUp ? "Create your account" : "Sign in to Custod" }
    private var cta: String { mode == .signUp ? "Sign up" : "Sign in" }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                VStack(spacing: 6) {
                    Image(systemName: "shield.lefthalf.filled")
                        .font(.system(size: 44, weight: .semibold))
                        .foregroundStyle(Color.brand)
                    Text("Custod")
                        .font(.system(.largeTitle, design: .rounded).weight(.bold))
                    Text("Your focus, in sync across every device.")
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 48)

                Button(action: auth.signInWithGoogle) {
                    HStack {
                        Image(systemName: "g.circle.fill")
                        Text("Continue with Google")
                    }
                    .font(.system(.body, design: .rounded).weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.bordered)

                HStack {
                    Rectangle().fill(.quaternary).frame(height: 1)
                    Text("or").font(.caption).foregroundStyle(.secondary)
                    Rectangle().fill(.quaternary).frame(height: 1)
                }

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textContentType(.emailAddress)
                    SecureField("Password", text: $password)
                        .textContentType(mode == .signUp ? .newPassword : .password)
                }
                .textFieldStyle(.roundedBorder)

                if let err = auth.lastError {
                    Text(err)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    Task {
                        if mode == .signUp {
                            await auth.signUp(email: email, password: password)
                        } else {
                            await auth.signIn(email: email, password: password)
                        }
                    }
                } label: {
                    Group {
                        if auth.isWorking { ProgressView() } else { Text(cta) }
                    }
                    .font(.system(.body, design: .rounded).weight(.bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.brand)
                .disabled(auth.isWorking || email.isEmpty || password.isEmpty)

                Button {
                    mode = mode == .signIn ? .signUp : .signIn
                } label: {
                    Text(mode == .signUp ? "Already have an account? Sign in"
                                         : "Need an account? Create one")
                        .font(.system(.footnote, design: .rounded).weight(.medium))
                }
                .tint(Color.brand)
            }
            .padding(24)
            .frame(maxWidth: 460)
            .frame(maxWidth: .infinity)
        }
        .navigationTitle(title)
        .navigationBarHidden(true)
    }
}

extension Color {
    static let brand = Color(red: 0.11, green: 0.62, blue: 0.46)
}
