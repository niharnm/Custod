import Foundation
import IOKit

// Measures real usage signals that contribute to digital burnout but aren't
// visible from tabs alone: how long you've actually been at the computer today,
// how long the current unbroken stretch is, and what time it is. All sampled
// locally from the system HID idle clock — no input contents, just idle seconds.

struct UsageStats: Codable, Hashable {
    var activeMinutesToday: Int = 0   // active screen time accumulated today
    var continuousMinutes: Int = 0    // current unbroken stretch (resets after a real idle gap)
    var hour: Int = 0                 // current hour of day, for late-night detection
    var onBreak: Bool = false         // currently idle past the break threshold
}

@MainActor
final class UsageTracker {
    /// Idle longer than this counts as a real break and resets the streak.
    private let breakThreshold: Double = 240   // 4 minutes
    /// Cap a single sample gap so sleep/wake doesn't count as "active".
    private let maxGap: Double = 120

    private var dayKey = ""
    private var activeSeconds: Double = 0
    private var continuousSeconds: Double = 0
    private var lastSampleAt: Date?

    /// Today's active total is persisted so the fallback (when macOS Screen Time
    /// isn't readable) reflects the *whole day*, not just time since this launch.
    /// Without this, quitting and reopening Custod would reset screen time to 0
    /// and slowly climb again — the "it only counts how long it's been open" bug.
    private let store = UserDefaults.standard
    private static let activeKeyPrefix = "usage.activeSeconds."

    func sample(now: Date = Date()) -> UsageStats {
        let cal = Calendar.current
        let key = Self.dayKey(now, cal)
        if key != dayKey {            // new day (or first sample) → load persisted total
            dayKey = key
            activeSeconds = store.double(forKey: Self.activeKeyPrefix + key)
            continuousSeconds = 0
            lastSampleAt = nil
        }

        let idle = Self.systemIdleSeconds()
        let elapsed = lastSampleAt.map { min(now.timeIntervalSince($0), maxGap) } ?? 0
        lastSampleAt = now

        let active = idle < breakThreshold
        if active {
            activeSeconds += elapsed
            continuousSeconds += elapsed
            store.set(activeSeconds, forKey: Self.activeKeyPrefix + key)
        } else {
            continuousSeconds = 0
        }

        return UsageStats(
            activeMinutesToday: Int(activeSeconds / 60),
            continuousMinutes: Int(continuousSeconds / 60),
            hour: cal.component(.hour, from: now),
            onBreak: !active
        )
    }

    private static func dayKey(_ date: Date, _ cal: Calendar) -> String {
        let c = cal.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
    }

    /// Seconds since the last HID input event (mouse/keyboard), system-wide.
    static func systemIdleSeconds() -> Double {
        var iterator: io_iterator_t = 0
        guard IOServiceGetMatchingServices(kIOMainPortDefault,
                                           IOServiceMatching("IOHIDSystem"),
                                           &iterator) == KERN_SUCCESS else { return 0 }
        defer { IOObjectRelease(iterator) }

        let entry = IOIteratorNext(iterator)
        guard entry != 0 else { return 0 }
        defer { IOObjectRelease(entry) }

        var properties: Unmanaged<CFMutableDictionary>?
        guard IORegistryEntryCreateCFProperties(entry, &properties, kCFAllocatorDefault, 0) == KERN_SUCCESS,
              let dict = properties?.takeRetainedValue() as? [String: Any],
              let idle = (dict["HIDIdleTime"] as? NSNumber)?.uint64Value else { return 0 }

        return Double(idle) / 1_000_000_000.0   // nanoseconds → seconds
    }
}
