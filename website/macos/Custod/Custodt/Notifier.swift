import Foundation
import UserNotifications

// Thin wrapper around local notifications used by the autopilot engine to alert
// the user when burnout climbs. All local + on-device; nothing is sent anywhere.

enum Notifier {
    static func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    static func fire(status: BurnoutStatus, pattern: String) {
        let content = UNMutableNotificationContent()
        switch status {
        case .red:
            content.title = "Burnout risk is high"
        case .yellow:
            content.title = "Burnout is climbing"
        case .green:
            content.title = "Custod check-in"
        }
        content.body = "\(pattern) — take a short reset."
        content.sound = .default
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
