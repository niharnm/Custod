import SwiftUI

// Replaces the template's CustodtApp.swift.
// Custod stores its own JSON history (HistoryStore), keeps user preferences
// (SettingsStore), and runs an always-on BurnoutMonitor that re-reads tabs on an
// interval and intervenes on its own when the user opts in. An always-visible
// menu-bar item mirrors the current status, Defender-style.

@main
struct CustodApp: App {
    @StateObject private var history = HistoryStore()
    @StateObject private var settings = SettingsStore()
    @StateObject private var monitor = BurnoutMonitor()

    var body: some Scene {
        WindowGroup(id: "main") {
            ContentView()
                .environmentObject(history)
                .environmentObject(settings)
                .environmentObject(monitor)
                .frame(minWidth: 900, idealWidth: 1040, minHeight: 640, idealHeight: 800)
                .task {
                    monitor.attach(history: history, settings: settings)
                    monitor.start()
                    if settings.notificationsEnabled { Notifier.requestAuthorization() }
                }
        }
        .windowResizability(.contentSize)

        MenuBarExtra {
            MenuBarPanel()
                .environmentObject(monitor)
                .environmentObject(settings)
        } label: {
            Image(systemName: monitor.menuBarSymbol)
        }
        .menuBarExtraStyle(.window)
    }
}

private struct MenuBarPanel: View {
    @EnvironmentObject private var monitor: BurnoutMonitor
    @EnvironmentObject private var settings: SettingsStore
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                ScoreDot(score: monitor.analysis?.score ?? 0,
                         color: monitor.analysis.map { statusColor($0.status) } ?? CustodTheme.muted)
                VStack(alignment: .leading, spacing: 1) {
                    Text(monitor.analysis?.mainPattern ?? "Monitoring your focus")
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                        .foregroundStyle(CustodTheme.brown)
                    Text(monitor.isActive ? "Real-time monitoring on" : "Monitoring paused")
                        .font(.system(.caption, design: .rounded)).foregroundStyle(CustodTheme.muted)
                }
            }

            if let t = monitor.lastChecked {
                Text("Last check \(t.formatted(date: .omitted, time: .shortened)) · \(monitor.tabs.count) tabs")
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(CustodTheme.muted)
            }

            Divider().overlay(CustodTheme.taupe.opacity(0.5))

            Button {
                openWindow(id: "main")
                NSApp.activate(ignoringOtherApps: true)
            } label: {
                Label("Open Custod", systemImage: "rectangle.inset.filled")
            }

            Button {
                if !settings.isLocked { monitor.toggle() }
            } label: {
                Label(monitor.isActive ? "Pause monitoring" : "Resume monitoring",
                      systemImage: monitor.isActive ? "pause.circle" : "play.circle")
            }
            .disabled(settings.isLocked)

            Button { monitor.refreshNow() } label: {
                Label("Check now", systemImage: "arrow.clockwise")
            }

            Divider().overlay(CustodTheme.taupe.opacity(0.5))

            Button { NSApplication.shared.terminate(nil) } label: {
                Label("Quit Custod", systemImage: "power")
            }
        }
        .padding(14)
        .frame(width: 280)
        .background(CustodTheme.cream)
    }
}

private struct ScoreDot: View {
    let score: Int
    let color: Color
    var body: some View {
        ZStack {
            Circle().fill(color.opacity(0.2)).frame(width: 40, height: 40)
                .shadow(color: color.opacity(0.35), radius: 6)
            Text("\(score)").font(.system(.subheadline, design: .rounded).weight(.bold)).foregroundStyle(color)
        }
    }
}
