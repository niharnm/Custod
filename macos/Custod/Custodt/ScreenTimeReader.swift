import Foundation
import SQLite3
import AppKit

// Reads macOS's *own* Screen Time data instead of only counting time since Custod
// launched. macOS records per-app usage in its "knowledge store" at
//   ~/Library/Application Support/Knowledge/knowledgeC.db
// in the "/app/usage" stream — the same data Screen Time is built on. Each row has
// a start/end date (Core Data reference epoch, 2001-01-01) and the app's bundle id.
// Summing today's durations gives real screen time for the whole day, across
// reboots and from before Custod was even installed.
//
// This file lives behind Full Disk Access (a TCC-protected location). Until the
// user grants it, opening the database fails and today() returns nil, and the app
// falls back to its own live counter.

struct ScreenTimeSnapshot {
    var totalMinutes: Int
    var apps: [AppUsage]      // sorted descending by minutes
}

enum ScreenTimeReader {
    /// Core Data / CFAbsoluteTime reference date (2001-01-01) in Unix epoch seconds.
    private static let appleEpoch = 978_307_200.0

    static var dbPath: String {
        (NSHomeDirectory() as NSString)
            .appendingPathComponent("Library/Application Support/Knowledge/knowledgeC.db")
    }

    /// True if we can actually open the knowledge store — i.e. Full Disk Access
    /// has been granted to Custod.
    static func isAuthorized() -> Bool {
        var db: OpaquePointer?
        defer { sqlite3_close(db) }
        guard sqlite3_open_v2(dbPath, &db, SQLITE_OPEN_READONLY, nil) == SQLITE_OK else { return false }
        var stmt: OpaquePointer?
        defer { sqlite3_finalize(stmt) }
        return sqlite3_prepare_v2(db, "SELECT 1 FROM ZOBJECT LIMIT 1", -1, &stmt, nil) == SQLITE_OK
    }

    /// Real per-app screen time for today, straight from macOS's data.
    /// Returns nil if Full Disk Access hasn't been granted yet.
    static func today(now: Date = Date()) -> ScreenTimeSnapshot? {
        var db: OpaquePointer?
        guard sqlite3_open_v2(dbPath, &db, SQLITE_OPEN_READONLY, nil) == SQLITE_OK else {
            sqlite3_close(db)
            return nil
        }
        defer { sqlite3_close(db) }

        let startOfDay = Calendar.current.startOfDay(for: now).timeIntervalSince1970
        let threshold = startOfDay - appleEpoch   // into ZSTARTDATE's reference space

        let sql = """
        SELECT ZVALUESTRING, SUM(ZENDDATE - ZSTARTDATE)
        FROM ZOBJECT
        WHERE ZSTREAMNAME = '/app/usage' AND ZSTARTDATE >= ?
        GROUP BY ZVALUESTRING
        ORDER BY 2 DESC
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            sqlite3_finalize(stmt)
            return nil
        }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_double(stmt, 1, threshold)

        var apps: [AppUsage] = []
        var totalSeconds = 0.0
        while sqlite3_step(stmt) == SQLITE_ROW {
            guard let cBundle = sqlite3_column_text(stmt, 0) else { continue }
            let bundle = String(cString: cBundle)
            let seconds = sqlite3_column_double(stmt, 1)
            guard seconds > 0 else { continue }
            totalSeconds += seconds
            let minutes = Int(seconds / 60)
            if minutes > 0 {
                apps.append(AppUsage(name: displayName(for: bundle), bundleID: bundle, minutes: minutes))
            }
        }
        return ScreenTimeSnapshot(totalMinutes: Int(totalSeconds / 60), apps: apps)
    }

    // MARK: Bundle id → friendly name

    private static var nameCache: [String: String] = [:]

    private static func displayName(for bundleID: String) -> String {
        if let cached = nameCache[bundleID] { return cached }
        let name: String
        if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleID) {
            name = FileManager.default.displayName(atPath: url.path)
                .replacingOccurrences(of: ".app", with: "")
        } else {
            name = bundleID.split(separator: ".").last.map { String($0).capitalized } ?? bundleID
        }
        nameCache[bundleID] = name
        return name
    }
}
