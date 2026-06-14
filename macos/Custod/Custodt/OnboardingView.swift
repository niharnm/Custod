import SwiftUI

// First-launch "pre-permission" panel. macOS permission prompts (Automation,
// Accessibility, Notifications) are alarming when they appear cold, so Custod
// explains *why* it needs each one first. Only when the user taps "Grant access"
// do the real system prompts fire. Shown once, gated on SettingsStore.hasOnboarded.

private extension Color {
    static let brand = Color(red: 0.07, green: 0.73, blue: 0.60)
}

struct OnboardingView: View {
    @EnvironmentObject private var settings: SettingsStore
    @Environment(\.dismiss) private var dismiss

    private struct Item: Identifiable {
        let id = UUID()
        let icon: String
        let title: String
        let detail: String
    }

    private let items: [Item] = [
        Item(icon: "macwindow.on.rectangle",
             title: "Read your open browser tabs",
             detail: "Custod scores burnout signals from what you're working on — like 12 tabs of late-night research. macOS will ask permission to control your browser."),
        Item(icon: "square.grid.2x2.fill",
             title: "See which app is in front",
             detail: "So Custod can track usage across your whole Mac, not just the browser. Needs Accessibility access."),
        Item(icon: "bell.badge.fill",
             title: "Nudge you when burnout climbs",
             detail: "Gentle alerts and optional reset breaks when you've been pushing too hard. Uses Notifications."),
        Item(icon: "bolt.horizontal.circle.fill",
             title: "Keep watching in the background",
             detail: "Custod stays active in the background and reopens at login so it never misses a long stretch of work. Turn it off anytime in Login Items."),
    ]

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 12) {
                ZStack {
                    Circle().fill(Color.brand.opacity(0.14)).frame(width: 68, height: 68)
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundStyle(Color.brand)
                }
                Text("Welcome to Custod")
                    .font(.system(.title, design: .rounded).weight(.bold))
                Text("Custod watches for digital burnout and steps in before you crash. To do that it needs a few permissions — here's exactly what each one is for.")
                    .font(.system(.subheadline, design: .rounded))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: 420)
            }
            .padding(.top, 36)
            .padding(.horizontal, 32)

            VStack(spacing: 14) {
                ForEach(items) { item in
                    HStack(alignment: .top, spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(Color.brand.opacity(0.12))
                                .frame(width: 40, height: 40)
                            Image(systemName: item.icon)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(Color.brand)
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(item.title)
                                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                            Text(item.detail)
                                .font(.system(.caption, design: .rounded))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer(minLength: 0)
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            .frame(maxWidth: 460)

            // Full Disk Access is different: macOS won't pop a prompt for it, so we
            // explain it and send the user straight to the right Settings pane.
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(Color.brand.opacity(0.12))
                        .frame(width: 40, height: 40)
                    Image(systemName: "hourglass")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Color.brand)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Use your Mac's real Screen Time")
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    Text("To show your actual screen time — the whole day, every app, even from before Custod — turn on Full Disk Access. macOS doesn't prompt for this, so you flip it on manually.")
                        .font(.system(.caption, design: .rounded))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    Button {
                        Permissions.openSettings(.fullDiskAccess)
                    } label: {
                        Text("Open Full Disk Access settings")
                            .font(.system(.caption, design: .rounded).weight(.semibold))
                    }
                    .buttonStyle(.link)
                    .tint(.brand)
                    .padding(.top, 2)
                }
                Spacer(minLength: 0)
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.brand.opacity(0.06)))
            .padding(.horizontal, 24)
            .padding(.top, 14)
            .frame(maxWidth: 460)

            HStack(spacing: 8) {
                Image(systemName: "lock.fill").font(.system(size: 11))
                Text("Everything stays on your Mac. Nothing is ever uploaded.")
                    .font(.system(.caption, design: .rounded))
            }
            .foregroundStyle(.secondary)
            .padding(.top, 18)
            .padding(.bottom, 18)

            VStack(spacing: 8) {
                Button {
                    Permissions.requestAllOnLaunch()
                    settings.hasOnboarded = true
                    dismiss()
                } label: {
                    Text("Grant access")
                        .font(.system(.body, design: .rounded).weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                }
                .buttonStyle(.borderedProminent)
                .tint(.brand)

                Button {
                    settings.hasOnboarded = true
                    dismiss()
                } label: {
                    Text("Maybe later")
                        .font(.system(.subheadline, design: .rounded))
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
            }
            .frame(maxWidth: 460)
            .padding(.horizontal, 32)
            .padding(.bottom, 28)
        }
        .frame(width: 560)
        .background(.regularMaterial)
    }
}
