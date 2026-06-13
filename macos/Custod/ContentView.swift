import SwiftUI
import AppKit

// Replaces the template's ContentView.swift. A split view: capture form on the
// left, the latest analysis result on the right, history in the sidebar.

struct ContentView: View {
    @EnvironmentObject private var history: HistoryStore

    @State private var rawTabs = ""
    @State private var mood = MoodCheckIn()
    @State private var selectedBrowser: Browser = .safari
    @State private var statusMessage = ""
    @State private var errorMessage = ""
    @State private var result: BurnoutCheckRecord?

    private var parsedTabs: [BrowserTab] { TabParsing.parse(rawTabs) }

    var body: some View {
        NavigationSplitView {
            sidebar
        } detail: {
            HSplitView {
                captureForm.frame(minWidth: 320)
                resultPane.frame(minWidth: 360)
            }
        }
        .navigationTitle("Custod")
    }

    // MARK: Sidebar (history)

    private var sidebar: some View {
        List {
            Section("History") {
                ForEach(history.checks) { record in
                    Button {
                        result = record
                    } label: {
                        HStack {
                            StatusDot(status: record.analysis.status)
                            VStack(alignment: .leading) {
                                Text(record.analysis.mainPattern).font(.callout)
                                Text(record.createdAt.formatted(date: .abbreviated, time: .shortened))
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(record.analysis.score)").font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button("Delete", role: .destructive) { history.delete(record) }
                    }
                }
            }
        }
        .frame(minWidth: 220)
    }

    // MARK: Capture form (port of BrowserCaptureForm.tsx)

    private var captureForm: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Run a burnout check").font(.title3.bold())
                Text("Import live tabs or paste them. No page content is ever read.")
                    .font(.caption).foregroundStyle(.secondary)

                HStack {
                    Picker("Browser", selection: $selectedBrowser) {
                        ForEach(Browser.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .labelsHidden()
                    Button("Import tabs", systemImage: "arrow.down.doc") { importTabs() }
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Browser tabs").font(.caption.bold())
                    TextEditor(text: $rawTabs)
                        .font(.system(.caption, design: .monospaced))
                        .frame(height: 150)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(.quaternary))
                    Text(parsedTabs.isEmpty ? "No tabs yet" : "\(parsedTabs.count) tab\(parsedTabs.count == 1 ? "" : "s") detected")
                        .font(.caption2).foregroundStyle(parsedTabs.isEmpty ? .secondary : .tint)
                }

                slider("Energy", value: $mood.energy, labels: ["Drained", "", "Neutral", "", "Steady"])
                slider("Stress", value: $mood.stress, labels: ["Low", "", "Moderate", "", "High"])

                VStack(alignment: .leading, spacing: 6) {
                    Text("Time pressure").font(.caption.bold())
                    Picker("", selection: $mood.timePressure) {
                        ForEach(TimePressure.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented).labelsHidden()
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Reflection (optional)").font(.caption.bold())
                    TextEditor(text: $mood.reflection)
                        .frame(height: 56)
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(.quaternary))
                }

                if !statusMessage.isEmpty {
                    Label(statusMessage, systemImage: "info.circle").font(.caption).foregroundStyle(.green)
                }
                if !errorMessage.isEmpty {
                    Label(errorMessage, systemImage: "exclamationmark.triangle").font(.caption).foregroundStyle(.red)
                }

                HStack {
                    Text("Not a diagnosis. Pattern detection only.")
                        .font(.caption2).foregroundStyle(.secondary)
                    Spacer()
                    Button("Run check", systemImage: "scanner") { runCheck() }
                        .buttonStyle(.borderedProminent)
                        .disabled(parsedTabs.isEmpty)
                }
            }
            .padding(20)
        }
    }

    private func slider(_ title: String, value: Binding<Int>, labels: [String]) -> some View {
        let label = labels[max(0, min(labels.count - 1, value.wrappedValue - 1))]
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title).font(.caption.bold())
                Spacer()
                Text("\(value.wrappedValue)/5 — \(label)").font(.caption2).foregroundStyle(.tint)
            }
            Slider(value: Binding(get: { Double(value.wrappedValue) },
                                  set: { value.wrappedValue = Int($0) }), in: 1...5, step: 1)
        }
    }

    // MARK: Result pane (port of BurnoutDashboard / check page)

    @ViewBuilder
    private var resultPane: some View {
        if let record = result {
            ResultView(record: record)
        } else {
            VStack(spacing: 8) {
                Image(systemName: "waveform.path.ecg").font(.largeTitle).foregroundStyle(.secondary)
                Text("Run a check to see your burnout signal.").foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: Actions

    private func importTabs() {
        errorMessage = ""; statusMessage = ""
        do {
            let tabs = try TabImporter.importTabs(from: selectedBrowser)
            if tabs.isEmpty {
                statusMessage = "No http/https tabs found in \(selectedBrowser.rawValue)."
            } else {
                rawTabs = TabParsing.format(tabs)
                statusMessage = "Imported \(tabs.count) tab\(tabs.count == 1 ? "" : "s")."
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func runCheck() {
        errorMessage = ""; statusMessage = ""
        let tabs = parsedTabs
        guard !tabs.isEmpty else { errorMessage = "Add at least one tab title or URL."; return }
        let analysis = BurnoutAnalyzer.analyze(tabs: tabs, mood: mood)
        let record = BurnoutCheckRecord(rawTabs: tabs, mood: mood, analysis: analysis)
        history.add(record)
        result = record
    }
}

// MARK: - Result view

struct ResultView: View {
    let record: BurnoutCheckRecord
    private var a: BurnoutAnalysis { record.analysis }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 12) {
                    StatusDot(status: a.status, size: 18)
                    VStack(alignment: .leading) {
                        Text(a.mainPattern).font(.title3.bold())
                        Text("\(a.status.label) · \(a.score)/100").foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button("Copy Markdown", systemImage: "doc.on.clipboard") {
                        let md = Markdown.checkToMarkdown(record)
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(md, forType: .string)
                    }
                }

                Text(a.patternExplanation).font(.callout).foregroundStyle(.secondary)

                section("Risk breakdown") {
                    ForEach(a.riskBreakdown) { risk in
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Text(risk.label).font(.callout.bold())
                                Spacer()
                                Text("\(risk.level.rawValue) · \(risk.score)")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Text(risk.explanation).font(.caption).foregroundStyle(.secondary)
                            Text(risk.evidence.joined(separator: " · ")).font(.caption2).foregroundStyle(.tertiary)
                        }
                        .padding(.vertical, 4)
                    }
                }

                section("Reset plan") {
                    ForEach(a.resetPlan) { step in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(step.minutes)m").font(.caption.monospacedDigit().bold())
                                .frame(width: 34, alignment: .trailing).foregroundStyle(.tint)
                            VStack(alignment: .leading) {
                                Text(step.title).font(.callout.bold())
                                Text(step.detail).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }

                section("Evidence groups") {
                    ForEach(a.evidenceGroups) { group in
                        DisclosureGroup {
                            ForEach(group.tabs) { tab in
                                Text("• \(tab.title)").font(.caption).foregroundStyle(.secondary)
                            }
                        } label: {
                            Text("\(group.name) (\(group.tabs.count))").font(.callout.bold())
                        }
                    }
                }

                Text(a.reflectionPrompt).font(.callout).italic().padding(.top, 4)
                Text(a.privacySummary).font(.caption2).foregroundStyle(.tertiary)
            }
            .padding(20)
        }
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            content()
        }
    }
}

struct StatusDot: View {
    let status: BurnoutStatus
    var size: CGFloat = 10
    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
    }
    private var color: Color {
        switch status {
        case .green: return .green
        case .yellow: return .yellow
        case .red: return .red
        }
    }
}

#Preview {
    ContentView().environmentObject(HistoryStore())
}
