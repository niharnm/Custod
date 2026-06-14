import SwiftUI

// Signed-in home. The account + sync layer is real (shared Supabase account with
// the Mac app, website, and extension). Screen-time tracking on iOS needs
// Apple's Family Controls / DeviceActivity entitlement, which is requested
// separately — see ios/README.md. Until that's wired, this surfaces the account
// and explains what's next so the ecosystem login works end-to-end today.
struct ContentView: View {
    @EnvironmentObject private var auth: AuthStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    card {
                        VStack(alignment: .leading, spacing: 6) {
                            Label("Signed in", systemImage: "checkmark.seal.fill")
                                .font(.system(.headline, design: .rounded))
                                .foregroundStyle(Color.brand)
                            Text(auth.account?.email ?? "Your Custod account")
                                .font(.system(.title3, design: .rounded).weight(.semibold))
                            Text("This is the same account as Custod on your Mac, the web, and your browser extension. Your focus data follows you.")
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    card {
                        VStack(alignment: .leading, spacing: 6) {
                            Label("Screen Time", systemImage: "hourglass")
                                .font(.system(.headline, design: .rounded))
                            Text("On the way")
                                .font(.system(.title3, design: .rounded).weight(.semibold))
                            Text("iOS screen-time tracking uses Apple's Screen Time API (Family Controls). It requires a special entitlement from Apple before it can read your usage. Once granted, your iPhone time joins the same dashboard.")
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    card {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("Privacy & safety", systemImage: "lock.shield")
                                .font(.system(.headline, design: .rounded))
                            Text("Custod only analyzes safe signals like tab titles, URLs/domains, optional check-ins, and scan history. It never reads full page contents, keystrokes, screenshots, or private messages.")
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            Text("Custod is not a diagnosis, therapy, or crisis-support tool. It shows digital strain patterns and reset suggestions.")
                                .font(.system(.footnote, design: .rounded))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            HStack(spacing: 16) {
                                Link("Privacy", destination: CustodConfig.webAppURL.appendingPathComponent("privacy"))
                                Link("Terms", destination: CustodConfig.webAppURL.appendingPathComponent("terms"))
                                Link("Support", destination: CustodConfig.webAppURL.appendingPathComponent("support"))
                            }
                            .font(.system(.subheadline, design: .rounded).weight(.medium))
                            .tint(Color.brand)
                            .padding(.top, 2)
                            if let mailto = URL(string: "mailto:\(CustodConfig.contactEmail)") {
                                Link("Contact: \(CustodConfig.contactEmail)", destination: mailto)
                                    .font(.system(.footnote, design: .rounded))
                                    .tint(Color.brand)
                            }
                        }
                    }

                    Button(role: .destructive) {
                        auth.signOut()
                    } label: {
                        Text("Sign out")
                            .font(.system(.body, design: .rounded).weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.bordered)
                    .padding(.top, 4)
                }
                .padding(20)
                .frame(maxWidth: 560)
                .frame(maxWidth: .infinity)
            }
            .navigationTitle("Custod")
        }
    }

    private func card<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        content()
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.secondarySystemBackground)))
    }
}
