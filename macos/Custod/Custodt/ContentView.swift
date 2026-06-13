import SwiftUI
import AppKit
import Combine

// Custod — a Grammarly-style dashboard backed by an always-on burnout monitor
// with an autopilot intervention engine and an optional supervised (PIN-locked)
// mode. Left: sidebar with Defender-style real-time status + nav. Right: live
// dashboard, settings, and history. An autopilot reset break can take over the
// whole window when Custod decides to step in.

// MARK: - Theme

private extension Color {
    static let brand = Color(red: 0.07, green: 0.73, blue: 0.60)   // Grammarly-ish teal-green
    static let warn  = Color(red: 0.98, green: 0.55, blue: 0.10)
}

private func statusColor(_ s: BurnoutStatus) -> Color {
    switch s {
    case .green:  return Color(red: 0.13, green: 0.72, blue: 0.52)
    case .yellow: return Color(red: 0.98, green: 0.70, blue: 0.10)
    case .red:    return Color(red: 0.93, green: 0.31, blue: 0.27)
    }
}

private func riskColor(_ level: RiskLevel) -> Color {
    switch level {
    case .low:    return Color(red: 0.13, green: 0.72, blue: 0.52)
    case .medium: return Color(red: 0.98, green: 0.70, blue: 0.10)
    case .high:   return Color(red: 0.93, green: 0.31, blue: 0.27)
    }
}

// MARK: - Reusable pieces

private struct Card<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        VStack(alignment: .leading, spacing: 14) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(nsColor: .controlBackgroundColor)))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1))
            .shadow(color: .black.opacity(0.04), radius: 10, y: 3)
    }
}

private struct Pill: View {
    let text: String
    let icon: String
    var color: Color = .secondary
    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
            Text(text)
        }
        .font(.system(.caption, design: .rounded).weight(.semibold))
        .foregroundStyle(color)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(Capsule().fill(color.opacity(0.13)))
    }
}

private struct ScoreGauge: View {
    let score: Int
    let status: BurnoutStatus?
    var size: CGFloat = 172
    var body: some View {
        let tint = status.map(statusColor) ?? Color.secondary
        ZStack {
            Circle().stroke(Color.secondary.opacity(0.13), lineWidth: size * 0.085)
            Circle()
                .trim(from: 0, to: max(0.001, CGFloat(Double(score) / 100.0)))
                .stroke(tint, style: StrokeStyle(lineWidth: size * 0.085, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.6), value: score)
            VStack(spacing: 2) {
                Text("\(score)").font(.system(size: size * 0.30, weight: .heavy, design: .rounded))
                if size > 90 {
                    Text(status?.label.uppercased() ?? "—")
                        .font(.system(size: max(9, size * 0.085), weight: .bold, design: .rounded))
                        .foregroundStyle(tint)
                }
            }
        }
        .frame(width: size, height: size)
    }
}

private struct MetricCard: View {
    let label: String
    let value: String
    var color: Color = .primary
    var icon: String = "circle"
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.caption).foregroundStyle(color)
                Text(label).font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
            }
            Text(value)
                .font(.system(.title2, design: .rounded).weight(.bold))
                .foregroundStyle(color).lineLimit(1).minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(Color(nsColor: .controlBackgroundColor)))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
            .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1))
    }
}

// MARK: - Navigation

private enum Panel: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case history = "History"
    case settings = "Settings"
    var id: String { rawValue }
    var icon: String {
        switch self {
        case .dashboard: return "gauge.with.dots.needle.67percent"
        case .history:   return "clock.arrow.circlepath"
        case .settings:  return "gearshape.fill"
        }
    }
}

// MARK: - Root

struct ContentView: View {
    @EnvironmentObject private var monitor: BurnoutMonitor
    @State private var panel: Panel = .dashboard

    var body: some View {
        ZStack {
            NavigationSplitView {
                SidebarView(panel: $panel)
                    .navigationSplitViewColumnWidth(min: 232, ideal: 252, max: 290)
            } detail: {
                Group {
                    switch panel {
                    case .dashboard: DashboardView()
                    case .history:   HistoryView()
                    case .settings:  SettingsView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(nsColor: .windowBackgroundColor))
            }
            .navigationTitle("Custod")

            if monitor.breakActive {
                BreakOverlay().transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: monitor.breakActive)
    }
}

// MARK: - Sidebar

private struct SidebarView: View {
    @EnvironmentObject private var monitor: BurnoutMonitor
    @EnvironmentObject private var settings: SettingsStore
    @Binding var panel: Panel

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 10) {
                Image(systemName: "shield.lefthalf.filled")
                    .font(.system(size: 22, weight: .bold)).foregroundStyle(Color.brand)
                Text("Custod").font(.system(size: 24, weight: .heavy, design: .rounded))
            }
            .padding(.top, 6)

            protectionCard

            VStack(spacing: 4) {
                ForEach(Panel.allCases) { p in
                    Button { panel = p } label: {
                        HStack(spacing: 10) {
                            Image(systemName: p.icon).frame(width: 20)
                            Text(p.rawValue).font(.system(.body, design: .rounded).weight(.medium))
                            Spacer()
                            if p == .settings && settings.isLocked {
                                Image(systemName: "lock.fill").font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.horizontal, 12).padding(.vertical, 9)
                        .background(RoundedRectangle(cornerRadius: 10)
                            .fill(panel == p ? Color.brand.opacity(0.15) : Color.clear))
                        .foregroundStyle(panel == p ? Color.brand : Color.primary)
                    }
                    .buttonStyle(.plain)
                }
            }

            Spacer()

            Text("On-device only. Page contents are never read.")
                .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
        }
        .padding(16)
    }

    private var protectionCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: monitor.isActive ? "checkmark.shield.fill" : "shield.slash.fill")
                    .foregroundStyle(monitor.isActive ? Color.brand : .secondary)
                Text("Real-time monitoring")
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                Spacer()
                Toggle("", isOn: Binding(get: { monitor.isActive },
                                         set: { _ in if !settings.isLocked { monitor.toggle() } }))
                    .labelsHidden().toggleStyle(.switch).tint(Color.brand)
                    .disabled(settings.isLocked)
            }
            Text(monitor.isActive ? "On — watching your tabs" : "Paused")
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
            if settings.isLocked {
                Label("Locked by supervisor", systemImage: "lock.fill")
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
            } else if let t = monitor.lastChecked {
                Text("Last check \(t.formatted(date: .omitted, time: .shortened))")
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(Color(nsColor: .controlBackgroundColor)))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
            .strokeBorder(monitor.isActive ? Color.brand.opacity(0.35) : Color.primary.opacity(0.06), lineWidth: 1))
    }
}

// MARK: - Dashboard

private struct DashboardView: View {
    @EnvironmentObject private var monitor: BurnoutMonitor
    @EnvironmentObject private var history: HistoryStore
    @EnvironmentObject private var settings: SettingsStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                topBar
                heroCard
                statsGrid
                if let a = monitor.analysis {
                    factorsCard(a)
                    resetCard(a)
                    evidenceCard(a)
                } else {
                    waitingCard
                }
                checkInCard
            }
            .padding(24)
            .frame(maxWidth: 880)
            .frame(maxWidth: .infinity)
        }
    }

    private var greeting: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12:  return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<22: return "Good evening"
        default:      return "Working late"
        }
    }

    private var heroSubtitle: String {
        if let a = monitor.analysis { return a.patternExplanation }
        if !monitor.note.isEmpty { return monitor.note }
        return "Custod is watching your open tabs in real time and will surface burnout patterns as they emerge."
    }

    private var topBar: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 3) {
                Text(greeting).font(.system(.largeTitle, design: .rounded).weight(.bold))
                Text(monitor.sourceBrowser.isEmpty
                     ? "Setting up monitoring…"
                     : "Watching \(monitor.tabs.count) tab\(monitor.tabs.count == 1 ? "" : "s") in \(monitor.sourceBrowser)")
                    .font(.system(.subheadline, design: .rounded)).foregroundStyle(.secondary)
            }
            Spacer()
            Button { monitor.refreshNow() } label: {
                Label("Check now", systemImage: "arrow.clockwise")
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
            }
            .buttonStyle(.plain).foregroundStyle(Color.brand)
        }
    }

    private var modePill: some View {
        let mode = settings.interventionMode
        let on = mode != .off
        return HStack(spacing: 6) {
            Image(systemName: mode.icon)
            Text(mode == .autopilot ? "Autopilot on" : (mode == .notify ? "Alerts on" : "Watching only"))
        }
        .font(.system(.caption, design: .rounded).weight(.semibold))
        .foregroundStyle(on ? Color.brand : .secondary)
        .padding(.horizontal, 10).padding(.vertical, 4)
        .background(Capsule().fill((on ? Color.brand : Color.secondary).opacity(0.12)))
    }

    private var heroCard: some View {
        Card {
            HStack(alignment: .center, spacing: 24) {
                ScoreGauge(score: monitor.analysis?.score ?? 0, status: monitor.analysis?.status)
                VStack(alignment: .leading, spacing: 10) {
                    modePill
                    Text(monitor.analysis?.mainPattern ?? "Monitoring your focus")
                        .font(.system(.title2, design: .rounded).weight(.bold))
                    Text(heroSubtitle)
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func hm(_ minutes: Int) -> String {
        if minutes <= 0 { return "0m" }
        if minutes < 60 { return "\(minutes)m" }
        return "\(minutes / 60)h \(minutes % 60)m"
    }

    private var statsGrid: some View {
        let a = monitor.analysis
        let top = a?.riskBreakdown.max(by: { $0.score < $1.score })
        let streak = Insights.healthyStreak(history.checks)
        let u = monitor.usage
        return LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
            MetricCard(label: "Burnout score", value: "\(a?.score ?? 0)",
                       color: a.map { statusColor($0.status) } ?? .secondary, icon: "gauge.with.dots.needle.67percent")
            MetricCard(label: "Tabs watched", value: "\(monitor.tabs.count)",
                       color: .primary, icon: "macwindow.on.rectangle")
            MetricCard(label: "Screen time today", value: hm(u?.activeMinutesToday ?? 0),
                       color: (u?.activeMinutesToday ?? 0) >= 300 ? Color.warn : .primary, icon: "hourglass")
            MetricCard(label: "Since a break", value: (u?.onBreak ?? false) ? "On a break" : hm(u?.continuousMinutes ?? 0),
                       color: (u?.continuousMinutes ?? 0) >= 90 ? Color.warn : .primary, icon: "timer")
            MetricCard(label: "Top factor", value: top?.label ?? "None",
                       color: top.map { riskColor($0.level) } ?? .secondary, icon: "exclamationmark.triangle.fill")
            MetricCard(label: "Healthy streak", value: streak == 1 ? "1 day" : "\(streak) days",
                       color: streak > 0 ? Color.brand : .secondary, icon: "flame.fill")
        }
    }

    private var waitingCard: some View {
        Card {
            HStack(spacing: 12) {
                Image(systemName: "dot.radiowaves.left.and.right")
                    .font(.title2).foregroundStyle(Color.brand)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Waiting for the first reading")
                        .font(.system(.headline, design: .rounded).weight(.semibold))
                    Text("Keep your browser open — Custod scores your focus automatically every \(Int(monitor.intervalSeconds))s.")
                        .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func factorIcon(_ id: String) -> String {
        switch id {
        case "tab-overload":       return "macwindow.on.rectangle"
        case "context-switching":  return "arrow.left.arrow.right"
        case "distraction-loop":   return "play.rectangle.fill"
        case "goal-fragmentation": return "square.split.2x2.fill"
        case "time-pressure":      return "gauge.with.needle.fill"
        case "screen-time":        return "hourglass"
        case "continuous-focus":   return "timer"
        case "late-night":         return "moon.stars.fill"
        default:                   return "circle.fill"
        }
    }

    private func factorsCard(_ a: BurnoutAnalysis) -> some View {
        let maxScore = max(1, a.riskBreakdown.map(\.score).max() ?? 1)
        return Card {
            Text("What's driving your score").font(.system(.headline, design: .rounded).weight(.bold))
            Text("Your burnout score is the sum of these factors — each adds the points shown. The longest bars are pushing it up the most.")
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            ForEach(Array(a.riskBreakdown.enumerated()), id: \.element.id) { idx, f in
                factorRow(f, maxScore: maxScore)
                if idx < a.riskBreakdown.count - 1 { Divider().opacity(0.35) }
            }
            HStack {
                Text("Total burnout score").font(.system(.subheadline, design: .rounded).weight(.bold))
                Spacer()
                Text("\(a.score)/100")
                    .font(.system(.subheadline, design: .rounded).weight(.bold))
                    .foregroundStyle(statusColor(a.status))
            }
            .padding(.top, 2)
        }
    }

    private func factorRow(_ f: RiskSignal, maxScore: Int) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: factorIcon(f.id)).font(.caption)
                    .foregroundStyle(riskColor(f.level)).frame(width: 18)
                Text(f.label).font(.system(.subheadline, design: .rounded).weight(.semibold))
                Spacer()
                Text(f.score > 0 ? "+\(f.score) pts" : "0 pts")
                    .font(.system(.caption, design: .rounded).weight(.bold))
                    .foregroundStyle(f.score > 0 ? riskColor(f.level) : .secondary)
                    .padding(.horizontal, 9).padding(.vertical, 4)
                    .background(Capsule().fill((f.score > 0 ? riskColor(f.level) : Color.secondary).opacity(0.14)))
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.12))
                    Capsule().fill(riskColor(f.level))
                        .frame(width: f.score == 0 ? 0 : max(6, geo.size.width * CGFloat(f.score) / CGFloat(maxScore)))
                }
            }
            .frame(height: 7)
            Text(f.explanation).font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if !f.evidence.isEmpty {
                Text(f.evidence.joined(separator: " · "))
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 5)
    }

    private func resetCard(_ a: BurnoutAnalysis) -> some View {
        Card {
            Text("Your reset plan").font(.system(.headline, design: .rounded).weight(.bold))
            ForEach(a.resetPlan) { step in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(step.minutes)m")
                        .font(.system(.caption, design: .rounded).weight(.bold).monospacedDigit())
                        .foregroundStyle(Color.brand)
                        .frame(width: 42, height: 28)
                        .background(Capsule().fill(Color.brand.opacity(0.14)))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(step.title).font(.system(.subheadline, design: .rounded).weight(.semibold))
                        Text(step.detail).font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.vertical, 3)
            }
        }
    }

    private func evidenceCard(_ a: BurnoutAnalysis) -> some View {
        Card {
            Text("Evidence").font(.system(.headline, design: .rounded).weight(.bold))
            ForEach(a.evidenceGroups) { group in
                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 3) {
                        ForEach(group.tabs) { tab in
                            HStack(spacing: 6) {
                                Image(systemName: "globe").font(.caption2).foregroundStyle(.tertiary)
                                Text(tab.title.isEmpty ? tab.url : tab.title)
                                    .font(.system(.caption, design: .rounded))
                                    .foregroundStyle(.secondary).lineLimit(1)
                            }
                        }
                    }
                    .padding(.top, 4)
                } label: {
                    HStack {
                        Text(group.name).font(.system(.subheadline, design: .rounded).weight(.semibold))
                        Spacer()
                        Text("\(group.tabs.count)")
                            .font(.system(.caption, design: .rounded).weight(.bold)).foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private var checkInCard: some View {
        Card {
            Text("Quick check-in").font(.system(.headline, design: .rounded).weight(.bold))
            Text("Tune your live score with how you actually feel right now.")
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
            moodRow(icon: "bolt.fill", title: "Energy", value: $monitor.mood.energy,
                    low: "Drained", high: "Steady", tint: .brand)
            moodRow(icon: "bolt.heart.fill", title: "Stress", value: $monitor.mood.stress,
                    low: "Calm", high: "Maxed", tint: .warn)
            VStack(alignment: .leading, spacing: 8) {
                Label("Time pressure", systemImage: "clock.fill")
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                Picker("", selection: $monitor.mood.timePressure) {
                    ForEach(TimePressure.allCases, id: \.self) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented).labelsHidden()
            }
        }
    }

    private func moodRow(icon: String, title: String, value: Binding<Int>,
                         low: String, high: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Label(title, systemImage: icon)
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                Spacer()
                Text("\(value.wrappedValue)/5")
                    .font(.system(.caption, design: .rounded).weight(.bold)).foregroundStyle(tint)
            }
            Slider(value: Binding(get: { Double(value.wrappedValue) },
                                  set: { value.wrappedValue = Int($0.rounded()) }),
                   in: 1...5, step: 1)
                .tint(tint)
            HStack { Text(low); Spacer(); Text(high) }
                .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
        }
    }
}

// MARK: - History

private struct HistoryView: View {
    @EnvironmentObject private var history: HistoryStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("History").font(.system(.largeTitle, design: .rounded).weight(.bold))
                if history.checks.isEmpty {
                    Text("No checks yet. Custod logs a snapshot whenever your burnout status changes.")
                        .font(.system(.subheadline, design: .rounded)).foregroundStyle(.secondary)
                }
                ForEach(history.checks) { record in
                    HStack(spacing: 14) {
                        ScoreGauge(score: record.analysis.score, status: record.analysis.status, size: 54)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(record.analysis.mainPattern)
                                .font(.system(.headline, design: .rounded).weight(.semibold))
                            Text(record.createdAt.formatted(date: .abbreviated, time: .shortened))
                                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Pill(text: record.analysis.status.label, icon: "circle.fill",
                             color: statusColor(record.analysis.status))
                    }
                    .padding(14)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(nsColor: .controlBackgroundColor)))
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1))
                    .contextMenu { Button("Delete", role: .destructive) { history.delete(record) } }
                }
            }
            .padding(24)
            .frame(maxWidth: 760)
            .frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Settings

private struct SettingsView: View {
    @EnvironmentObject private var settings: SettingsStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Settings").font(.system(.largeTitle, design: .rounded).weight(.bold))
                if settings.isLocked {
                    LockScreen()
                } else {
                    interventionCard
                    sensitivityCard
                    supervisedCard
                }
            }
            .padding(24)
            .frame(maxWidth: 760)
            .frame(maxWidth: .infinity)
        }
    }

    private var interventionCard: some View {
        Card {
            Text("When burnout climbs").font(.system(.headline, design: .rounded).weight(.bold))
            Text("Decide how much Custod is allowed to step in on its own.")
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
            ForEach(InterventionMode.allCases) { mode in
                optionRow(selected: settings.interventionMode == mode,
                          icon: mode.icon, title: mode.label, subtitle: mode.blurb) {
                    settings.interventionMode = mode
                }
            }
            Toggle(isOn: $settings.notificationsEnabled) {
                Label("Send notifications", systemImage: "bell.fill")
                    .font(.system(.subheadline, design: .rounded).weight(.medium))
            }
            .toggleStyle(.switch).tint(Color.brand)
        }
    }

    private var sensitivityCard: some View {
        Card {
            Text("Sensitivity").font(.system(.headline, design: .rounded).weight(.bold))
            Picker("", selection: $settings.sensitivity) {
                ForEach(Sensitivity.allCases) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented).labelsHidden()
            let s = settings.sensitivity
            Text("Steps in around a score of \(s.triggerScore)+, runs a \(s.breakMinutes)-minute reset, and waits \(s.cooldownMinutes) min before doing it again."
                 + (s.triggerOnYellow ? " Also acts on sustained yellow." : ""))
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var supervisedCard: some View {
        Card {
            HStack {
                Label("Supervised mode", systemImage: "lock.shield.fill")
                    .font(.system(.headline, design: .rounded).weight(.bold))
                Spacer()
                Toggle("", isOn: $settings.supervisedMode).labelsHidden()
                    .toggleStyle(.switch).tint(Color.brand)
            }
            Text("Locks these settings and the monitoring switch behind a PIN — so a moment of weakness can't quietly turn Custod off. Built for parents, or for committing to your own limits.")
                .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            if settings.supervisedMode {
                PINManager()
            }
        }
    }

    private func optionRow(selected: Bool, icon: String, title: String,
                           subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(selected ? Color.brand : .secondary)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title).font(.system(.subheadline, design: .rounded).weight(.semibold))
                    Text(subtitle).font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? Color.brand : Color.secondary.opacity(0.5))
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 12)
                .fill(selected ? Color.brand.opacity(0.08) : Color.clear))
            .overlay(RoundedRectangle(cornerRadius: 12)
                .strokeBorder(selected ? Color.brand.opacity(0.4) : Color.primary.opacity(0.08), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

private struct PINManager: View {
    @EnvironmentObject private var settings: SettingsStore
    @State private var pin = ""
    @State private var confirm = ""
    @State private var message = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if settings.hasPIN {
                HStack(spacing: 10) {
                    Label("PIN is set", systemImage: "checkmark.circle.fill")
                        .font(.system(.subheadline, design: .rounded)).foregroundStyle(Color.brand)
                    Spacer()
                    Button("Lock now") { settings.lock() }
                        .font(.system(.caption, design: .rounded).weight(.semibold))
                    Button("Remove PIN", role: .destructive) { settings.clearPIN(); message = "" }
                        .font(.system(.caption, design: .rounded).weight(.semibold))
                }
            } else {
                Text("Set a 4-digit PIN").font(.system(.subheadline, design: .rounded).weight(.semibold))
                HStack(spacing: 8) {
                    SecureField("PIN", text: $pin).textFieldStyle(.roundedBorder).frame(width: 90)
                    SecureField("Confirm", text: $confirm).textFieldStyle(.roundedBorder).frame(width: 90)
                    Button("Save PIN") { savePIN() }
                        .buttonStyle(.borderedProminent).tint(Color.brand)
                        .disabled(pin.count < 4)
                }
                if !message.isEmpty {
                    Text(message).font(.system(.caption2, design: .rounded)).foregroundStyle(.red)
                }
            }
        }
        .padding(.top, 4)
    }

    private func savePIN() {
        guard pin.count >= 4 else { message = "Use at least 4 digits."; return }
        guard pin == confirm else { message = "PINs don't match."; return }
        settings.setPIN(pin)
        pin = ""; confirm = ""; message = ""
    }
}

private struct LockScreen: View {
    @EnvironmentObject private var settings: SettingsStore
    @State private var pin = ""
    @State private var error = false

    var body: some View {
        Card {
            VStack(alignment: .center, spacing: 14) {
                Image(systemName: "lock.shield.fill").font(.system(size: 40)).foregroundStyle(Color.brand)
                Text("Settings are supervised")
                    .font(.system(.title3, design: .rounded).weight(.bold))
                Text("Enter the PIN to change how Custod intervenes.")
                    .font(.system(.subheadline, design: .rounded)).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                SecureField("PIN", text: $pin)
                    .textFieldStyle(.roundedBorder).frame(width: 140)
                    .onSubmit(attempt)
                Button("Unlock", action: attempt)
                    .buttonStyle(.borderedProminent).tint(Color.brand)
                if error {
                    Text("Incorrect PIN").font(.system(.caption, design: .rounded)).foregroundStyle(.red)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
        }
    }

    private func attempt() {
        if settings.unlock(with: pin) { error = false } else { error = true; pin = "" }
    }
}

// MARK: - Autopilot break overlay

private struct BreakOverlay: View {
    @EnvironmentObject private var monitor: BurnoutMonitor
    @EnvironmentObject private var settings: SettingsStore
    @State private var remaining = 0
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Rectangle().fill(.ultraThinMaterial).ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "wind").font(.system(size: 40)).foregroundStyle(Color.brand)
                Text("Time to reset").font(.system(.largeTitle, design: .rounded).weight(.bold))
                Text(monitor.analysis?.mainPattern ?? "You've been pushing hard for a while.")
                    .font(.system(.subheadline, design: .rounded)).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Text(timeString(remaining))
                    .font(.system(size: 52, weight: .heavy, design: .rounded).monospacedDigit())
                    .foregroundStyle(Color.brand)

                if let plan = monitor.analysis?.resetPlan.prefix(3), !plan.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(Array(plan)) { step in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark.circle").foregroundStyle(Color.brand)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(step.title).font(.system(.subheadline, design: .rounded).weight(.semibold))
                                    Text(step.detail).font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                                }
                                Spacer(minLength: 0)
                            }
                        }
                    }
                    .frame(maxWidth: 360)
                }

                if settings.isLocked {
                    Label("Supervisor set this break. Take the time.", systemImage: "lock.fill")
                        .font(.system(.caption, design: .rounded)).foregroundStyle(.secondary)
                } else {
                    Button("I'm good — end break") { monitor.endBreak() }
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                Text("Custod started this automatically.")
                    .font(.system(.caption2, design: .rounded)).foregroundStyle(.tertiary)
            }
            .padding(40)
            .frame(maxWidth: 460)
            .background(RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(Color(nsColor: .windowBackgroundColor)))
            .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.08), lineWidth: 1))
            .shadow(color: .black.opacity(0.2), radius: 30, y: 10)
        }
        .onAppear { tickRemaining() }
        .onReceive(timer) { _ in tickRemaining() }
    }

    private func tickRemaining() {
        remaining = max(0, Int((monitor.breakEndsAt ?? Date()).timeIntervalSinceNow.rounded()))
        if remaining <= 0 { monitor.endBreak() }
    }

    private func timeString(_ secs: Int) -> String {
        String(format: "%d:%02d", secs / 60, secs % 60)
    }
}

#Preview {
    ContentView()
        .environmentObject(HistoryStore())
        .environmentObject(BurnoutMonitor())
        .environmentObject(SettingsStore())
}
