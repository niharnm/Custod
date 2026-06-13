import Foundation
import AppKit

// Tracks how long you spend in *every* application today, not just the browser.
// This is what makes the macOS app broader than the Chrome extension: the
// extension only ever sees tabs, while Custod on the Mac also sees that you've
// been in Slack for two hours or Xcode since 9am.
//
// It works by sampling the system's frontmost application on each tick and
// attributing the elapsed time to it — but only while you're actually active
// (HID idle below the break threshold), so time spent away from the keyboard
// doesn't get charged to whatever app happened to be in front. No window
// contents or keystrokes are read; just "which app is frontmost, for how long".

struct AppUsage: Codable, Hashable, Identifiable {
    var id: String { bundleID }
    var name: String
    var bundleID: String
    var minutes: Int
}

struct AppUsageSnapshot: Codable, Hashable {
    var apps: [AppUsage] = []        // sorted descending by minutes
    var totalMinutes: Int = 0
    var frontApp: String = ""
    var distinctApps: Int { apps.count }
}

@MainActor
final class AppUsageTracker {
    /// Idle longer than this means you've stepped away — stop charging time.
    private let breakThreshold: Double = 240   // 4 minutes
    /// Cap a single gap so sleep/wake doesn't dump hours onto one app.
    private let maxGap: Double = 120

    private var dayKey = ""
    private var seconds: [String: Double] = [:]   // bundleID -> active seconds today
    private var names: [String: String] = [:]     // bundleID -> display name
    private var lastSampleAt: Date?

    func sample(now: Date = Date()) -> AppUsageSnapshot {
        let cal = Calendar.current
        let key = Self.dayKey(now, cal)
        if key != dayKey {            // new day → reset
            dayKey = key
            seconds = [:]
            names = [:]
            lastSampleAt = nil
        }

        let elapsed = lastSampleAt.map { min(now.timeIntervalSince($0), maxGap) } ?? 0
        lastSampleAt = now

        let front = NSWorkspace.shared.frontmostApplication
        let frontName = front?.localizedName ?? ""

        // Only attribute time while the user is actually active at the machine.
        if UsageTracker.systemIdleSeconds() < breakThreshold,
           let app = front, let bid = app.bundleIdentifier {
            seconds[bid, default: 0] += elapsed
            names[bid] = app.localizedName ?? bid
        }

        let apps = seconds.map { bid, secs in
            AppUsage(name: names[bid] ?? bid, bundleID: bid, minutes: Int(secs / 60))
        }
        .filter { $0.minutes > 0 }
        .sorted { $0.minutes > $1.minutes }

        let total = Int(seconds.values.reduce(0, +) / 60)
        return AppUsageSnapshot(apps: apps, totalMinutes: total, frontApp: frontName)
    }

    private static func dayKey(_ date: Date, _ cal: Calendar) -> String {
        let c = cal.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
    }
}
