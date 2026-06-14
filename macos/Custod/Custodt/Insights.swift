import Foundation

// Lightweight derived insights over the check history — used for the streak
// card and other dashboard summaries. Pure functions, no state.

enum Insights {
    /// Consecutive calendar days up to today that had at least one check and
    /// never went red. Resets the moment a red day appears or a day is missed.
    static func healthyStreak(_ checks: [BurnoutCheckRecord]) -> Int {
        guard !checks.isEmpty else { return 0 }
        let cal = Calendar.current

        var worstByDay: [Date: BurnoutStatus] = [:]
        for c in checks {
            let day = cal.startOfDay(for: c.createdAt)
            worstByDay[day] = worse(worstByDay[day], c.analysis.status)
        }

        var streak = 0
        var day = cal.startOfDay(for: Date())
        while let status = worstByDay[day] {
            if status == .red { break }
            streak += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: day) else { break }
            day = prev
        }
        return streak
    }

    /// Number of distinct days Custod has a record for.
    static func daysTracked(_ checks: [BurnoutCheckRecord]) -> Int {
        let cal = Calendar.current
        return Set(checks.map { cal.startOfDay(for: $0.createdAt) }).count
    }

    private static func worse(_ a: BurnoutStatus?, _ b: BurnoutStatus) -> BurnoutStatus {
        guard let a else { return b }
        return rank(a) >= rank(b) ? a : b
    }

    private static func rank(_ s: BurnoutStatus) -> Int {
        switch s {
        case .green:  return 0
        case .yellow: return 1
        case .red:    return 2
        }
    }
}
