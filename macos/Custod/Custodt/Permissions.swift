import Foundation
import AppKit
import ApplicationServices
import ServiceManagement

// Custod needs the user to grant a few system permissions before it can see what
// it needs to: Automation (to read browser tabs via Apple Events), Accessibility
// (so it can read app/window context system-wide), and Notifications (so the
// autopilot can alert you). macOS only shows these prompts when the app actually
// asks, so we prime all three on first launch instead of failing silently.

enum Permissions {

    /// True if the user has already granted Accessibility access.
    static func accessibilityGranted() -> Bool { AXIsProcessTrusted() }

    /// Prompts for Accessibility access and deep-links to the right settings pane.
    @discardableResult
    static func requestAccessibility() -> Bool {
        let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        return AXIsProcessTrustedWithOptions([key: true] as CFDictionary)
    }

    /// Fires the "Custod wants to control <Browser>" Automation prompt by sending
    /// a harmless Apple Event. The first call returns an error until the user
    /// approves — that's expected; the point is to surface the prompt.
    static func primeAutomation() {
        let targets = [TabImporter.defaultBrowser()?.rawValue, "System Events"].compactMap { $0 }
        for app in targets {
            guard let script = NSAppleScript(source: "tell application \"\(app)\" to count windows") else { continue }
            var err: NSDictionary?
            _ = script.executeAndReturnError(&err)
        }
    }

    // MARK: Background activity (run + relaunch at login)

    /// Whether Custod is registered to run in the background / at login.
    static var backgroundActivityEnabled: Bool {
        SMAppService.mainApp.status == .enabled
    }

    /// Registers Custod as a login item so it can keep monitoring in the
    /// background and relaunch after a reboot. Surfaces the app under
    /// System Settings → General → Login Items → "Allow in the Background".
    @discardableResult
    static func enableBackgroundActivity() -> Bool {
        do {
            try SMAppService.mainApp.register()
            return true
        } catch {
            // Unsigned/local builds can fail here; not fatal — the user can still
            // enable it manually from Login Items.
            return false
        }
    }

    static func openLoginItemsSettings() {
        SMAppService.openSystemSettingsLoginItems()
    }

    private static var didRequest = false

    /// Request everything Custod relies on, on launch. Runs at most once per
    /// process so the AppDelegate and the window's `.task` can't double-prompt.
    static func requestAllOnLaunch() {
        guard !didRequest else { return }
        didRequest = true
        Notifier.requestAuthorization()
        requestAccessibility()
        enableBackgroundActivity()
        // Stagger the automation prompt so it doesn't land on top of the
        // accessibility one — macOS only shows one consent sheet at a time.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { primeAutomation() }
    }

    /// Opens the relevant Privacy & Security pane so the user can flip a switch.
    static func openSettings(_ pane: SettingsPane) {
        if let url = URL(string: pane.urlString) { NSWorkspace.shared.open(url) }
    }

    enum SettingsPane {
        case accessibility, automation, fullDiskAccess
        var urlString: String {
            switch self {
            case .accessibility:
                return "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
            case .automation:
                return "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"
            case .fullDiskAccess:
                return "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"
            }
        }
    }
}
