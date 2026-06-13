import SwiftUI

// Canonical Custod palette — keep in sync with website/src/lib/design-tokens.ts

enum CustodTheme {
    static let brown       = Color(red: 0.20, green: 0.17, blue: 0.15)   // #332c27
    static let brownLight  = Color(red: 0.36, green: 0.31, blue: 0.28)   // #5c4f47
    static let rose        = Color(red: 0.91, green: 0.69, blue: 0.69)   // #e8b0af
    static let cream       = Color(red: 0.98, green: 0.96, blue: 0.95)   // #f9f6f1
    static let taupe       = Color(red: 0.85, green: 0.74, blue: 0.65)   // #d8bca7
    static let amber       = Color(red: 0.92, green: 0.71, blue: 0.44)   // #eab56f
    static let amberLight  = Color(red: 0.95, green: 0.80, blue: 0.60)   // #f3cb98
    static let secondary   = Color(red: 0.95, green: 0.92, blue: 0.89)   // #f3ebe3
    static let muted       = Color(red: 0.54, green: 0.48, blue: 0.45)   // #8a7b72
    static let surface     = Color.white
    static let statusGreen  = Color(red: 0.42, green: 0.62, blue: 0.45)  // #6b9e72
    static let statusYellow = Color(red: 0.92, green: 0.71, blue: 0.44)  // #eab56f
    static let statusRed    = Color(red: 0.83, green: 0.52, blue: 0.51)  // #d48483
    static let warn         = statusYellow
}

extension Color {
    static let brand = CustodTheme.amber
    static let warn  = CustodTheme.warn
}

func statusColor(_ s: BurnoutStatus) -> Color {
    switch s {
    case .green:  return CustodTheme.statusGreen
    case .yellow: return CustodTheme.statusYellow
    case .red:    return CustodTheme.statusRed
    }
}

func riskColor(_ level: RiskLevel) -> Color {
    switch level {
    case .low:    return CustodTheme.statusGreen
    case .medium: return CustodTheme.statusYellow
    case .high:   return CustodTheme.statusRed
    }
}
