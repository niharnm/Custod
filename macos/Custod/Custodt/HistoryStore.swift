import Foundation
import Combine

// Local persistence — the macOS analogue of lib/storage.ts / Supabase.
// Stores history as JSON in Application Support (privacy-first, never leaves the Mac).

@MainActor
final class HistoryStore: ObservableObject {
    @Published private(set) var checks: [BurnoutCheckRecord] = []

    private let fileURL: URL
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        return e
    }()
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    init() {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Custod", isDirectory: true)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        fileURL = base.appendingPathComponent("checks.json")
        load()
    }

    func add(_ record: BurnoutCheckRecord) {
        checks.insert(record, at: 0)
        save()
    }

    func delete(_ record: BurnoutCheckRecord) {
        checks.removeAll { $0.id == record.id }
        save()
    }

    private func load() {
        guard let data = try? Data(contentsOf: fileURL),
              let decoded = try? decoder.decode([BurnoutCheckRecord].self, from: data) else { return }
        checks = decoded.sorted { $0.createdAt > $1.createdAt }
    }

    private func save() {
        guard let data = try? encoder.encode(checks) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }
}
